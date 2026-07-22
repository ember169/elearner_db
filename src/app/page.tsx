import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { loadCurrentPlan } from "@/lib/mentor/store";
import { runGuidanceEngine, flattenGoals } from "@/lib/guidance/engine";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES } from "@/lib/mentor/competency-map";
import { initializeBoard } from "@/lib/board/store";
import { PlannerClient } from "@/components/planner/planner-client";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const board = initializeBoard();

  const mentorResult = loadCurrentPlan();
  const cfg = db.select().from(settings).limit(1).all()[0] ?? null;
  const objective = cfg?.objective ?? "Red team / malware dev";

  let sideProjectState = null;
  if (cfg?.sideProjectState) {
    try { sideProjectState = JSON.parse(cfg.sideProjectState); } catch {}
  }

  const guidance = runGuidanceEngine();
  const signals = computeCompetencySignals(guidance.snapshot, guidance.ftProgress);

  const competencies = COMPETENCIES.map((c) => ({
    id: c.id,
    label: c.label,
    area: c.area,
    level: signals[c.id]?.autoLevel ?? 0,
    evidence: signals[c.id]?.evidence ?? "",
  }));

  const activeGoals = flattenGoals(guidance.goals)
    .filter((g) => g.status === "active" && g.children.length === 0)
    .map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      goalType: g.goalType,
      currentValue: g.currentValue,
      targetValue: g.targetValue,
      cadenceValue: g.cadenceValue,
      cadenceUnit: g.cadenceUnit,
      parentGoalId: g.parentGoalId,
      pacing: g.pacing,
    }));

  return (
    <PlannerClient
      boardItems={board.items}
      mentorBriefing={board.mentorBriefing}
      collapsedBriefing={board.collapsedBriefing}
      objective={objective}
      competencies={competencies}
      goals={activeGoals}
      sideProject={mentorResult.plan.side_project ?? null}
      sideProjectState={sideProjectState}
      hasKey={mentorResult.hasKey}
      stale={mentorResult.stale}
    />
  );
}
