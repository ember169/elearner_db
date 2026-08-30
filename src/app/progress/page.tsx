import { db } from "@/lib/db";
import {
  ftProfile,
  htbProfile,
  maldevProfile,
  rootmeProfile,
  activityFeed,
  syncLog,
  competencyValidations,
  assessments,
} from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { runGuidanceEngine, flattenGoals } from "@/lib/guidance/engine";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES } from "@/lib/mentor/competency-map";
import { ProgressClient } from "@/components/progress/progress-client";

export const dynamic = "force-dynamic";

export default function ProgressPage() {
  const ft = db.select().from(ftProfile).limit(1).all()[0] ?? null;
  const htb = db.select().from(htbProfile).limit(1).all()[0] ?? null;
  const maldev = db.select().from(maldevProfile).limit(1).all()[0] ?? null;
  const rootme = db.select().from(rootmeProfile).limit(1).all()[0] ?? null;
  const activity = db
    .select()
    .from(activityFeed)
    .orderBy(desc(activityFeed.timestamp))
    .limit(500)
    .all();

  const lastSync =
    db
      .select()
      .from(syncLog)
      .orderBy(desc(syncLog.startedAt))
      .limit(1)
      .all()[0] ?? null;

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
    evidence: signals[c.id]?.evidence ?? "",
  }));

  // Entry-point state for Goals and Assess. Both left the nav; a card that
  // carries its own numbers is worth more than the mute nav item it replaces.
  const leafGoals = flattenGoals(guidance.goals).filter(
    (g) => g.status === "active" && g.children.length === 0,
  );
  const goalsEntry = {
    active: leafGoals.length,
    behind: leafGoals.filter((g) => g.pacing && !g.pacing.onTrack).length,
  };

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
      ft={ft}
      htb={htb}
      maldev={maldev}
      rootme={rootme}
      activity={activity}
      ftProgress={guidance.ftProgress}
      competencies={competencies}
      lastSync={lastSync?.startedAt ?? null}
    />
  );
}
