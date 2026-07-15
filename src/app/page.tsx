import { db } from "@/lib/db";
import {
  ftProfile,
  thmProfile,
  htbProfile,
  maldevProfile,
  rootmeProfile,
  syncLog,
  tasks,
} from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { PathClient } from "@/components/path/path-client";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const guidance = runGuidanceEngine();

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

  return (
    <PathClient
      guidance={guidance}
      pinnedTasks={pinnedTasks}
      platforms={{
        ft: ft ? { level: ft.level, coalition: ft.coalition } : null,
        thm: thm
          ? { rank: thm.rank, roomsCompleted: thm.roomsCompleted, streak: thm.streak }
          : null,
        htb: htb
          ? { rank: htb.rank, points: htb.points, owns: (htb.systemOwns ?? 0) + (htb.userOwns ?? 0) }
          : null,
        rootme: rootme
          ? { score: rootme.score, position: rootme.position, solved: rootme.challengesSolved }
          : null,
        maldev: maldev
          ? { progress: maldev.overallProgress }
          : null,
      }}
      lastSync={lastSync ? lastSync.startedAt : null}
    />
  );
}
