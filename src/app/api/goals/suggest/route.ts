import { NextRequest, NextResponse } from "next/server";
import { readMentorConfig } from "@/lib/mentor/store";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES } from "@/lib/mentor/competency-map";
import { suggestRuleBased } from "@/lib/goals/rule-based-suggest";

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
    signal: AbortSignal.timeout(45_000),
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
    signal: AbortSignal.timeout(90_000),
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
  const mode = (body.mode as string) ?? "auto";

  const guidance = runGuidanceEngine();
  const signals = computeCompetencySignals(guidance.snapshot, guidance.ftProgress);

  const existingGoalTitles = guidance.goals
    .filter((g) => !g.parentGoalId)
    .map((g) => g.title);

  if (mode === "quick") {
    const suggestion = suggestRuleBased(signals, existingGoalTitles);
    return NextResponse.json({ suggestion, mode: "rule-based" });
  }

  const config = readMentorConfig();
  const canGenerate = config.provider === "local" ? !!config.baseUrl : !!config.apiKey;

  if (!canGenerate) {
    const suggestion = suggestRuleBased(signals, existingGoalTitles);
    return NextResponse.json({ suggestion, mode: "rule-based" });
  }

  const allCompetencies = COMPETENCIES
    .map((c) => ({ label: c.label, area: c.area, level: signals[c.id]?.autoLevel ?? 0 }))
    .sort((a, b) => a.level - b.level);
  const gaps = allCompetencies.filter((c) => c.level < 3);
  const strengths = allCompetencies.filter((c) => c.level >= 3);

  const topLevelGoals = guidance.goals
    .filter((g) => !g.parentGoalId)
    .map((g) => {
      const status = g.status === "completed" ? "done" : g.pacing && !g.pacing.onTrack ? "behind" : "active";
      return `- ${g.title} (${g.category}, ${status})`;
    });

  const { snapshot } = guidance;
  const platformStats: string[] = [];
  if (snapshot.htb.profile) platformStats.push(`HackTheBox: ${(snapshot.htb.profile.systemOwns ?? 0) + (snapshot.htb.profile.userOwns ?? 0)} owns`);
  if (snapshot.thm.profile) platformStats.push(`TryHackMe: ${snapshot.thm.roomsCompleted} rooms`);
  if (snapshot.rootme.profile) platformStats.push(`Root-me: ${snapshot.rootme.challengesSolved} challenges`);
  if (snapshot.ft.profile) platformStats.push(`42: level ${snapshot.ft.profile.level}`);

  const prompt = `You are a cybersecurity learning advisor for a student at 42 Paris focused on red team / malware development.

## Competency gaps (prioritize these)
${gaps.map((c) => `- ${c.label} (${c.area}): ${c.level}/5`).join("\n")}

${strengths.length > 0 ? `## Strengths\n${strengths.map((c) => `- ${c.label}: ${c.level}/5`).join("\n")}` : ""}

## Platform progress
${platformStats.join("\n") || "No platform data yet"}

## Existing top-level goals (avoid duplicates)
${topLevelGoals.join("\n") || "none"}

## Instructions
Suggest a new learning goal tree targeting the student's weakest competencies.
- Prefer HackTheBox machines, challenges, and Academy modules as primary resources.
- Only suggest TryHackMe as fallback when HTB lacks content for a topic.
- Root-me is good for specific technical drills (crypto, web, forensics).
- Use real, specific platform content names when possible (machine names, room names, challenge categories).
- Set realistic deadlines 3-6 months out from today.
- Structure: 1 epic, 2-3 issues, 2-4 tasks per issue. Keep it focused and achievable.`;

  try {
    let suggestion: GoalSuggestionTree;
    if (config.provider === "local" && config.baseUrl) {
      suggestion = await suggestViaOpenAI(prompt, config.model, config.baseUrl, config.apiKey);
    } else {
      suggestion = await suggestViaAnthropic(prompt, config.apiKey!, config.model);
    }
    return NextResponse.json({ suggestion, mode: "llm" });
  } catch (e) {
    let msg = e instanceof Error ? e.message : "Failed to generate suggestion";
    if (e instanceof Error && e.cause) {
      const cause = e.cause as { code?: string; message?: string };
      msg += ` (${cause.code ?? cause.message ?? String(e.cause)})`;
    }
    console.error("[suggest] LLM failed, falling back to rule-based:", msg);
    const suggestion = suggestRuleBased(signals, existingGoalTitles);
    return NextResponse.json({ suggestion, mode: "rule-based" });
  }
}
