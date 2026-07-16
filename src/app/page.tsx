import { db } from "@/lib/db";
import {
  ftProfile,
  thmProfile,
  htbProfile,
  maldevProfile,
  rootmeProfile,
  syncLog,
  tasks,
  dailySnapshots,
} from "@/lib/db/schema";
import { desc, eq, and, lte } from "drizzle-orm";
import { loadCurrentPlan } from "@/lib/mentor/store";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES } from "@/lib/mentor/competency-map";
import { PathClient } from "@/components/path/path-client";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const mentorResult = loadCurrentPlan();

  const pinnedTasks = db
    .select()
    .from(tasks)
    .where(eq(tasks.isCompleted, false))
    .all();

  const ft = db.select().from(ftProfile).limit(1).all()[0] ?? null;
  const thm = db.select().from(thmProfile).limit(1).all()[0] ?? null;
  const htb = db.select().from(htbProfile).limit(1).all()[0] ?? null;
  const maldev = db.select().from(maldevProfile).limit(1).all()[0] ?? null;
  const rootme = db.select().from(rootmeProfile).limit(1).all()[0] ?? null;

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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

  function getOldSnapshot(platform: string): Record<string, unknown> | null {
    const row = db
      .select()
      .from(dailySnapshots)
      .where(and(eq(dailySnapshots.platform, platform), lte(dailySnapshots.date, cutoff)))
      .orderBy(desc(dailySnapshots.date))
      .limit(1)
      .all()[0];
    if (!row) return null;
    try { return JSON.parse(row.data); } catch { return null; }
  }

  const ftOld = getOldSnapshot("42");
  const thmOld = getOldSnapshot("thm");
  const htbOld = getOldSnapshot("htb");
  const rootmeOld = getOldSnapshot("rootme");
  const maldevOld = getOldSnapshot("maldev");

  return (
    <PathClient
      mentor={mentorResult}
      pinnedTasks={pinnedTasks}
      platforms={{
        ft: ft ? { level: ft.level, coalition: ft.coalition, delta: ftOld ? ((ft.level ?? 0) - (Number(ftOld.level) || 0)) : null } : null,
        thm: thm
          ? { rank: thm.rank, roomsCompleted: thm.roomsCompleted, streak: thm.streak, delta: thmOld ? ((thm.roomsCompleted ?? 0) - (Number(thmOld.roomsCompleted) || 0)) : null }
          : null,
        htb: htb
          ? { rank: htb.rank, points: htb.points, owns: (htb.systemOwns ?? 0) + (htb.userOwns ?? 0), delta: htbOld ? (((htb.systemOwns ?? 0) + (htb.userOwns ?? 0)) - ((Number(htbOld.systemOwns) || 0) + (Number(htbOld.userOwns) || 0))) : null }
          : null,
        rootme: rootme
          ? { score: rootme.score, position: rootme.position, solved: rootme.challengesSolved, delta: rootmeOld ? ((rootme.score ?? 0) - (Number(rootmeOld.score) || 0)) : null }
          : null,
        maldev: maldev
          ? { progress: maldev.overallProgress, delta: maldevOld ? ((maldev.overallProgress ?? 0) - (Number(maldevOld.overallProgress) || 0)) : null }
          : null,
      }}
      lastSync={lastSync ? lastSync.startedAt : null}
      competencies={competencies}
    />
  );
}
