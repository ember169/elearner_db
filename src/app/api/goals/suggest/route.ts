import { NextRequest, NextResponse } from "next/server";
import { readMentorConfig } from "@/lib/mentor/store";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES } from "@/lib/mentor/competency-map";

type SuggestedTask = { title: string; ftSlug?: string };
type SuggestedIssue = { title: string; deadline?: string; tasks: SuggestedTask[] };
type GoalSuggestionTree = {
  epic: {
    title: string;
    platform: string;
    metricSource?: string;
    targetValue?: number;
    deadline?: string;
  };
  issues: SuggestedIssue[];
  reasoning: string;
};

function suggestToolSchema() {
  return {
    name: "emit_goal_suggestion",
    description: "Emit a suggested goal tree with an epic, issues, and tasks.",
    input_schema: {
      type: "object" as const,
      properties: {
        epic: {
          type: "object" as const,
          properties: {
            title: { type: "string" as const },
            platform: { type: "string" as const, enum: ["42", "thm", "htb", "rootme", "maldev", "general"] },
            metricSource: { type: "string" as const },
            targetValue: { type: "number" as const },
            deadline: { type: "string" as const },
          },
          required: ["title", "platform"],
        },
        issues: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              title: { type: "string" as const },
              deadline: { type: "string" as const },
              tasks: {
                type: "array" as const,
                items: {
                  type: "object" as const,
                  properties: {
                    title: { type: "string" as const },
                    ftSlug: { type: "string" as const },
                  },
                  required: ["title"],
                },
              },
            },
            required: ["title", "tasks"],
          },
        },
        reasoning: { type: "string" as const },
      },
      required: ["epic", "issues", "reasoning"],
    },
  };
}

async function suggestViaAnthropic(
  prompt: string,
  apiKey: string,
  model: string,
): Promise<GoalSuggestionTree> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(120_000),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      tools: [suggestToolSchema()],
      tool_choice: { type: "tool", name: "emit_goal_suggestion" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  const block = Array.isArray(data.content)
    ? data.content.find((b: { type?: string }) => b.type === "tool_use")
    : null;

  if (!block?.input) throw new Error("LLM did not return a suggestion.");
  return block.input as GoalSuggestionTree;
}

async function suggestViaOpenAI(
  prompt: string,
  model: string,
  baseUrl: string,
  apiKey: string | null,
): Promise<GoalSuggestionTree> {
  const url = `${baseUrl.replace(/\/+$/, "")}/v1/chat/completions`;

  const jsonSchema = `{
  "epic": { "title": "string", "platform": "42|thm|htb|rootme|maldev|general", "metricSource?": "string", "targetValue?": "number", "deadline?": "YYYY-MM-DD" },
  "issues": [{ "title": "string", "deadline?": "YYYY-MM-DD", "tasks": [{ "title": "string", "ftSlug?": "string" }] }],
  "reasoning": "string"
}`;

  const res = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(180_000),
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [
        { role: "system", content: "You are a cybersecurity learning advisor. Always respond with a single valid JSON object, no markdown fences, no extra text." },
        { role: "user", content: `${prompt}\n\nRespond with ONLY a JSON object matching this schema (no markdown, no explanation outside the JSON):\n${jsonSchema}\n\nKeep it focused: 1 epic, 2-3 issues, 2-4 tasks per issue.` },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Local LLM error ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error("Local LLM returned empty response.");

  const cleaned = content.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Local LLM response is not JSON: ${cleaned.slice(0, 300)}`);

  try {
    return JSON.parse(match[0]) as GoalSuggestionTree;
  } catch (e) {
    throw new Error(`Failed to parse LLM JSON: ${(e as Error).message}. Response: ${match[0].slice(0, 300)}`);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const scope = body.scope as string ?? "full_epic";

  const config = readMentorConfig();
  const canGenerate = config.provider === "local" ? !!config.baseUrl : !!config.apiKey;
  if (!canGenerate) {
    return NextResponse.json(
      { error: "No LLM configured. Add an API key or local LLM URL in Settings." },
      { status: 400 }
    );
  }

  const guidance = runGuidanceEngine();
  const signals = computeCompetencySignals(guidance.snapshot, guidance.ftProgress);

  const competencySummary = COMPETENCIES.map((c) => {
    const sig = signals[c.id];
    return `${c.label}: ${sig?.autoLevel ?? 0}/5`;
  }).join(", ");

  const goalsSummary = guidance.goals
    .map((g) => `- ${g.title} (${g.category}, ${g.status})`)
    .join("\n");

  const prompt = `You are a cybersecurity learning advisor for a student at 42 Paris.

Current competency levels: ${competencySummary}

Existing goals:
${goalsSummary}

Platforms: 42 Paris (C/C++ projects), TryHackMe (rooms), HackTheBox (machines), Root-me (challenges), Maldev (custom elearning)

Scope: ${scope === "full_epic" ? "Suggest a complete new learning epic with issues and tasks based on the student's weakest competencies." : scope === "cross_platform" ? "Suggest a cross-platform learning epic spanning multiple platforms." : "Suggest a focused goal tree."}

Create a practical, achievable goal tree. Focus on areas where the student is weakest. Use specific platform content (room names, challenge categories, machine names) when possible. Set realistic deadlines 3-6 months out.`;

  try {
    let suggestion: GoalSuggestionTree;
    if (config.provider === "local" && config.baseUrl) {
      suggestion = await suggestViaOpenAI(prompt, config.model, config.baseUrl, config.apiKey);
    } else {
      suggestion = await suggestViaAnthropic(prompt, config.apiKey!, config.model);
    }
    return NextResponse.json({ suggestion });
  } catch (e) {
    let msg = e instanceof Error ? e.message : "Failed to generate suggestion";
    if (e instanceof Error && e.cause) {
      const cause = e.cause as { code?: string; message?: string };
      msg += ` (${cause.code ?? cause.message ?? String(e.cause)})`;
    }
    console.error("[suggest] LLM error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
