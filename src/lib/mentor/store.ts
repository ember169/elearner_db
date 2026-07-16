import { db } from "@/lib/db";
import { settings, mentorPlan, syncLog } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  buildMentorContext,
  buildFallbackPlan,
  DEFAULT_OBJECTIVE,
  type MentorPlan,
} from "./engine";

// Shared read/staleness/persist logic used by both the /api/mentor route and
// the home page's server component, so they never drift.

export type MentorConfig = {
  objective: string;
  apiKey: string | null;
  model: string;
};

export function readMentorConfig(): MentorConfig {
  const cfg = db.select().from(settings).where(eq(settings.id, 1)).get();
  return {
    objective: cfg?.objective?.trim() || DEFAULT_OBJECTIVE,
    apiKey: cfg?.llmApiKey ?? null,
    model: cfg?.llmModel ?? "claude-sonnet-5",
  };
}

function newestStored(): { plan: MentorPlan; createdAt: string } | null {
  const row = db
    .select()
    .from(mentorPlan)
    .orderBy(desc(mentorPlan.createdAt))
    .limit(1)
    .all()[0];
  if (!row) return null;
  try {
    return { plan: JSON.parse(row.plan) as MentorPlan, createdAt: row.createdAt };
  } catch {
    return null;
  }
}

function isStale(
  stored: { plan: MentorPlan; createdAt: string },
  objective: string
): boolean {
  if (stored.plan.objectiveEcho !== objective) return true;
  const age = Date.now() - new Date(stored.createdAt).getTime();
  if (age > 24 * 60 * 60 * 1000) return true;
  const lastSync = db
    .select()
    .from(syncLog)
    .where(eq(syncLog.status, "success"))
    .orderBy(desc(syncLog.startedAt))
    .limit(1)
    .all()[0];
  if (lastSync) {
    const syncTime = new Date(
      lastSync.completedAt ?? lastSync.startedAt
    ).getTime();
    if (syncTime > new Date(stored.createdAt).getTime()) return true;
  }
  return false;
}

export type MentorPlanResult = {
  plan: MentorPlan;
  stale: boolean;
  hasKey: boolean;
};

// Cheap, never calls the LLM. Returns the stored plan (+ staleness) or a
// freshly-built rule-based fallback so the UI always has something to render.
export function loadCurrentPlan(): MentorPlanResult {
  const { objective, apiKey } = readMentorConfig();
  const hasKey = !!apiKey;
  const stored = newestStored();
  if (stored) {
    return { plan: stored.plan, stale: isStale(stored, objective), hasKey };
  }
  const ctx = buildMentorContext(objective);
  return { plan: buildFallbackPlan(ctx), stale: hasKey, hasKey };
}

export function savePlan(plan: MentorPlan, objective: string) {
  db.insert(mentorPlan)
    .values({ version: plan.version, objective, plan: JSON.stringify(plan) })
    .run();
}
