import { db } from "@/lib/db";
import {
  ftProfile,
  thmProfile,
  htbProfile,
  maldevProfile,
  rootmeProfile,
  ftSkills,
  activityFeed,
  dailySnapshots,
} from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { ProgressClient } from "@/components/progress/progress-client";

export const dynamic = "force-dynamic";

export default function ProgressPage() {
  const ft = db.select().from(ftProfile).limit(1).all()[0] ?? null;
  const thm = db.select().from(thmProfile).limit(1).all()[0] ?? null;
  const htb = db.select().from(htbProfile).limit(1).all()[0] ?? null;
  const maldev = db.select().from(maldevProfile).limit(1).all()[0] ?? null;
  const rootme = db.select().from(rootmeProfile).limit(1).all()[0] ?? null;
  const skills = db.select().from(ftSkills).all();
  const activity = db
    .select()
    .from(activityFeed)
    .orderBy(desc(activityFeed.timestamp))
    .limit(500)
    .all();
  const snapshots = db.select().from(dailySnapshots).all();

  const guidance = runGuidanceEngine();

  return (
    <ProgressClient
      ft={ft}
      thm={thm}
      htb={htb}
      maldev={maldev}
      rootme={rootme}
      skills={skills}
      activity={activity}
      snapshots={snapshots}
      ftProgress={guidance.ftProgress}
      skillProfile={guidance.skillProfile}
    />
  );
}
