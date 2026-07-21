import { db } from "@/lib/db";
import {
  ftProfile,
  ftProjects,
  thmProfile,
  htbProfile,
  rootmeProfile,
  maldevProfile,
  goals,
  dailySnapshots,
} from "@/lib/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";

export { METRIC_SOURCES, GOAL_PRESETS } from "./shared";
export type { MetricSourceKey, GoalPreset } from "./shared";

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
  const parentIds = new Set(
    activeGoals.filter((g) => g.parentGoalId).map((g) => g.parentGoalId)
  );

  // Auto-complete 42 milestone goals when the project is validated
  const validatedSlugs = new Set(
    db.select().from(ftProjects).all()
      .filter((p) => p.validated)
      .map((p) => {
        const raw = (p.slug ?? p.name).toLowerCase().replace(/[^a-z0-9_]/g, "");
        return raw.replace(/^42cursus/, "");
      })
  );
  for (const goal of activeGoals) {
    if (!goal.ftSlug) continue;
    if (parentIds.has(goal.id)) continue;
    const slug = goal.ftSlug.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (validatedSlugs.has(slug) && goal.currentValue !== 1) {
      db.update(goals)
        .set({ currentValue: 1, status: "completed" })
        .where(eq(goals.id, goal.id))
        .run();
    }
  }

  // Sync circle/parent goal progress from children
  const allGoals = db.select().from(goals).all();
  const completedIds = new Set(allGoals.filter((g) => g.status === "completed").map((g) => g.id));
  for (const goal of allGoals) {
    if (goal.status === "completed") continue;
    const children = allGoals.filter((g) => g.parentGoalId === goal.id);
    if (children.length === 0) continue;
    const doneCount = children.filter((c) => c.status === "completed" || completedIds.has(c.id)).length;
    if (doneCount === children.length) {
      db.update(goals)
        .set({ status: "completed", currentValue: doneCount })
        .where(eq(goals.id, goal.id))
        .run();
      completedIds.add(goal.id);
    } else if (doneCount !== goal.currentValue) {
      db.update(goals)
        .set({ currentValue: doneCount })
        .where(eq(goals.id, goal.id))
        .run();
    }
  }

  // Sync metric-based goals
  const stillActive = db.select().from(goals).where(eq(goals.status, "active")).all();
  const stillParentIds = new Set(
    stillActive.filter((g) => g.parentGoalId).map((g) => g.parentGoalId)
  );
  for (const goal of stillActive) {
    if (stillParentIds.has(goal.id)) continue;
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

const METRIC_TO_PLATFORM: Record<string, string> = {
  "ft:projects_validated": "42",
  "ft:level": "42",
  "rootme:challenges_solved": "rootme",
  "rootme:score": "rootme",
  "maldev:progress": "maldev",
  "thm:rooms_completed": "thm",
  "htb:owns": "htb",
  "htb:points": "htb",
};

const METRIC_TO_SNAPSHOT_KEY: Record<string, string> = {
  "ft:projects_validated": "projectsValidated",
  "ft:level": "level",
  "rootme:challenges_solved": "challengesSolved",
  "rootme:score": "score",
  "maldev:progress": "overallProgress",
  "thm:rooms_completed": "roomsCompleted",
  "htb:owns": "owns",
  "htb:points": "points",
};

export type CadencePacing = {
  achieved: number;
  target: number;
  onTrack: boolean;
  daysLeftInPeriod: number;
  periodLabel: string;
  currentPace: string;
  requiredPace: string;
};

export function computeCadencePacing(
  metricSource: string,
  cadenceValue: number,
  cadenceUnit: "per_week" | "per_month",
  currentValue: number
): CadencePacing {
  const platform = METRIC_TO_PLATFORM[metricSource];
  const snapshotKey = METRIC_TO_SNAPSHOT_KEY[metricSource];
  if (!platform || !snapshotKey) {
    return {
      achieved: 0, target: cadenceValue, onTrack: false,
      daysLeftInPeriod: 0, periodLabel: cadenceUnit === "per_week" ? "this week" : "this month",
      currentPace: "No data", requiredPace: `${cadenceValue}`,
    };
  }

  const now = new Date();
  const daysBack = cadenceUnit === "per_week" ? 7 : 30;
  const pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - daysBack);
  const pastDateStr = pastDate.toISOString().slice(0, 10);

  const snapshot = db
    .select()
    .from(dailySnapshots)
    .where(
      and(
        eq(dailySnapshots.platform, platform),
        lte(dailySnapshots.date, pastDateStr)
      )
    )
    .orderBy(desc(dailySnapshots.date))
    .limit(1)
    .all()[0];

  let pastValue = 0;
  if (snapshot?.data) {
    try {
      const data = JSON.parse(snapshot.data as string);
      pastValue = typeof data[snapshotKey] === "number" ? data[snapshotKey] : 0;
    } catch {
      pastValue = 0;
    }
  }

  const achieved = Math.max(0, currentValue - pastValue);
  const onTrack = achieved >= cadenceValue;

  let daysLeftInPeriod: number;
  let periodLabel: string;
  if (cadenceUnit === "per_week") {
    const dayOfWeek = now.getDay() || 7;
    daysLeftInPeriod = 7 - dayOfWeek;
    periodLabel = "this week";
  } else {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    daysLeftInPeriod = daysInMonth - now.getDate();
    periodLabel = "this month";
  }

  const remaining = Math.max(0, cadenceValue - achieved);
  const currentPace = `${achieved} ${periodLabel}`;
  const requiredPace = remaining > 0
    ? `${remaining} more needed`
    : "Target met";

  return {
    achieved, target: cadenceValue, onTrack, daysLeftInPeriod,
    periodLabel, currentPace, requiredPace,
  };
}
