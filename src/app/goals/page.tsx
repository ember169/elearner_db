import { db } from "@/lib/db";
import { goalGroups } from "@/lib/db/schema";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES } from "@/lib/mentor/competency-map";
import { loadCurrentPlan } from "@/lib/mentor/store";
import { GoalsClient } from "@/components/goals/goals-client";

export const dynamic = "force-dynamic";

export default function GoalsPage() {
  const guidance = runGuidanceEngine();

  const signals = computeCompetencySignals(
    guidance.snapshot,
    guidance.ftProgress
  );

  const competencies = COMPETENCIES.map((c) => ({
    id: c.id,
    label: c.label,
    area: c.area,
    level: signals[c.id]?.autoLevel ?? 0,
  }));

  const mentorResult = loadCurrentPlan();
  const focusItems = mentorResult.plan.focus.map((f) => ({
    type: f.type,
    title: f.title,
  }));

  const groups = db.select().from(goalGroups).all();

  return (
    <GoalsClient
      goals={guidance.goals}
      groups={groups}
      competencies={competencies}
      focusItems={focusItems}
    />
  );
}
