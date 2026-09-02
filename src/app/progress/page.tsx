import { db } from "@/lib/db";
import {
  ftProfile,
  competencyValidations,
  assessments,
  syncLog,
  manualProjectCompletions,
} from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { runGuidanceEngine, flattenGoals } from "@/lib/guidance/engine";
import { COMPETENCIES } from "@/lib/mentor/competency-map";
import { FT_COMMON_CORE } from "@/lib/guidance/ft-project-tree";
import { ProgressClient } from "@/components/progress/progress-client";
import type { CircleSlice } from "@/components/progress/core-donut";

export const dynamic = "force-dynamic";

export default function ProgressPage() {
  const ft = db.select().from(ftProfile).limit(1).all()[0] ?? null;

  const lastSync =
    db
      .select()
      .from(syncLog)
      .orderBy(desc(syncLog.startedAt))
      .limit(1)
      .all()[0] ?? null;

  // Manual completions act like board-done slugs: they unlock successors
  const manualSlugs = db
    .select()
    .from(manualProjectCompletions)
    .all()
    .map((r) => r.slug);
  const manualSet = new Set(manualSlugs);

  const guidance = runGuidanceEngine(manualSet);
  const { ftProgress } = guidance;

  // Build CircleSlice[] with state
  const circles: CircleSlice[] = Object.entries(ftProgress.circleBreakdown)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([circle, { total, done }]) => {
      const c = Number(circle);
      const state: CircleSlice["state"] =
        done === total && total > 0
          ? "done"
          : c <= ftProgress.currentCircle
            ? "current"
            : "locked";
      return { circle: c, done, total, state };
    });

  const coreDone = ftProgress.completedProjects.length;
  const coreTotal = FT_COMMON_CORE.length;

  // Goals entry
  const leafGoals = flattenGoals(guidance.goals).filter(
    (g) => g.status === "active" && g.children.length === 0,
  );
  const goalsEntry = {
    active: leafGoals.length,
    behind: leafGoals.filter((g) => g.pacing && !g.pacing.onTrack).length,
  };

  // Assess entry
  const validations = db.select().from(competencyValidations).all();
  const openAssessments = db
    .select()
    .from(assessments)
    .all()
    .filter((a) => a.status !== "completed" && a.status !== "grading_failed");
  const assessEntry = {
    validated: validations.length,
    total: COMPETENCIES.length,
    open: openAssessments.length,
  };

  return (
    <ProgressClient
      goalsEntry={goalsEntry}
      assessEntry={assessEntry}
      level={ft?.level ?? null}
      circles={circles}
      coreDone={coreDone}
      coreTotal={coreTotal}
      currentCircle={ftProgress.currentCircle}
      completedProjects={ftProgress.completedProjects}
      inProgressProjects={ftProgress.inProgressProjects}
      availableProjects={ftProgress.availableProjects}
      manualCompletions={manualSlugs}
      lastSync={lastSync?.startedAt ?? null}
    />
  );
}
