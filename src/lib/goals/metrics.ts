import { db } from "@/lib/db";
import {
  ftProfile,
  ftProjects,
  thmProfile,
  htbProfile,
  rootmeProfile,
  maldevProfile,
  goals,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export { METRIC_SOURCES, GOAL_PRESETS } from "./shared";
export type { MetricSourceKey } from "./shared";

export function resolveMetricValue(source: string): number | null {
  switch (source) {
    case "ft:projects_validated": {
      const projects = db.select().from(ftProjects).all();
      return projects.filter((p) => p.validated).length;
    }
    case "ft:level": {
      const profile = db.select().from(ftProfile).limit(1).all()[0];
      return profile?.level ?? null;
    }
    case "rootme:challenges_solved": {
      const profile = db.select().from(rootmeProfile).limit(1).all()[0];
      return profile?.challengesSolved ?? null;
    }
    case "rootme:score": {
      const profile = db.select().from(rootmeProfile).limit(1).all()[0];
      return profile?.score ?? null;
    }
    case "maldev:progress": {
      const profile = db.select().from(maldevProfile).limit(1).all()[0];
      return profile?.overallProgress ?? null;
    }
    case "thm:rooms_completed": {
      const profile = db.select().from(thmProfile).limit(1).all()[0];
      return profile?.roomsCompleted ?? null;
    }
    case "htb:owns": {
      const profile = db.select().from(htbProfile).limit(1).all()[0];
      if (!profile) return null;
      return (profile.systemOwns ?? 0) + (profile.userOwns ?? 0);
    }
    case "htb:points": {
      const profile = db.select().from(htbProfile).limit(1).all()[0];
      return profile?.points ?? null;
    }
    default:
      return null;
  }
}

export function syncGoalValues() {
  const activeGoals = db
    .select()
    .from(goals)
    .where(eq(goals.status, "active"))
    .all();
  for (const goal of activeGoals) {
    if (!goal.metricSource) continue;
    const value = resolveMetricValue(goal.metricSource);
    if (value !== null && value !== goal.currentValue) {
      db.update(goals)
        .set({ currentValue: value })
        .where(eq(goals.id, goal.id))
        .run();
    }
  }
}
