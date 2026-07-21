import { NextResponse } from "next/server";
import {
  buildMentorContext,
  buildFallbackPlan,
  generateNarrative,
  generateFallbackNarrative,
  PLAN_VERSION,
  type MentorPlan,
} from "@/lib/mentor/engine";
import {
  loadCurrentPlan,
  readMentorConfig,
  savePlan,
} from "@/lib/mentor/store";
import { runRuleEngine } from "@/lib/planning/rule-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(loadCurrentPlan());
}

export async function POST() {
  const config = readMentorConfig();
  const canGenerate = config.provider === "local" ? !!config.baseUrl : !!config.apiKey;
  const ctx = buildMentorContext(config.objective);

  // Phase 1: Rule engine builds the schedule deterministically
  const ruleOutput = runRuleEngine(config.objective);

  // Phase 2: LLM generates narrative + side project (or fallback)
  let briefing: string;
  let collapsedBriefing: string;
  let sideProject: MentorPlan["side_project"] = undefined;
  let briefingSource: "llm" | "fallback" = "fallback";

  if (canGenerate) {
    try {
      const narrative = await generateNarrative(ctx, config, ruleOutput.focus);
      briefing = narrative.briefing;
      collapsedBriefing = narrative.collapsed_briefing;
      sideProject = narrative.side_project;
      briefingSource = "llm";
    } catch (e) {
      console.error("Mentor LLM failed:", e instanceof Error ? e.message : e);
      const fallback = generateFallbackNarrative(ruleOutput.focus, config.objective);
      briefing = fallback.briefing;
      collapsedBriefing = fallback.collapsed_briefing;
      sideProject = fallback.side_project;
    }
  } else {
    const fallback = generateFallbackNarrative(ruleOutput.focus, config.objective);
    briefing = fallback.briefing;
    collapsedBriefing = fallback.collapsed_briefing;
    sideProject = fallback.side_project;
  }

  // Phase 3: Assemble the plan
  const plan: MentorPlan = {
    version: PLAN_VERSION,
    generatedAt: new Date().toISOString(),
    objectiveEcho: config.objective,
    headline: collapsedBriefing,
    focus: ruleOutput.focus,
    competencies: ruleOutput.competencies,
    side_project: sideProject,
    fallback: briefingSource === "fallback",
  };

  savePlan(plan, config.objective);

  return NextResponse.json({
    plan,
    stale: false,
    hasKey: canGenerate,
    briefing,
    collapsedBriefing,
    briefingSource,
    deadlinePressure: ruleOutput.deadlinePressure,
    weeklyBudget: ruleOutput.weeklyBudget,
    warnings: ruleOutput.warnings,
  });
}
