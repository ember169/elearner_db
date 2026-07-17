import { db } from "@/lib/db";
import {
  ftProfile,
  thmProfile,
  htbProfile,
  maldevProfile,
  rootmeProfile,
  activityFeed,
  syncLog,
} from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES } from "@/lib/mentor/competency-map";
import { ProgressClient } from "@/components/progress/progress-client";

export const dynamic = "force-dynamic";

export default function ProgressPage() {
  const ft = db.select().from(ftProfile).limit(1).all()[0] ?? null;
  const thm = db.select().from(thmProfile).limit(1).all()[0] ?? null;
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

  return (
    <ProgressClient
      ft={ft}
      thm={thm}
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
