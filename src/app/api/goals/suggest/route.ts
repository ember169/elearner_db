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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const scope = body.scope as string ?? "full_epic";

  const config = readMentorConfig();
  if (!config.apiKey) {
    return NextResponse.json(
      { error: "No API key configured. Add one in Settings." },
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
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        tools: [suggestToolSchema()],
        tool_choice: { type: "tool", name: "emit_goal_suggestion" },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `LLM API error ${res.status}: ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const block = Array.isArray(data.content)
      ? data.content.find((b: { type?: string }) => b.type === "tool_use")
      : null;

    if (!block?.input) {
      return NextResponse.json(
        { error: "LLM did not return a suggestion." },
        { status: 502 }
      );
    }

    const suggestion = block.input as GoalSuggestionTree;
    return NextResponse.json({ suggestion });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}
