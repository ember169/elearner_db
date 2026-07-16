import { db } from "@/lib/db";
import { weeklyPlans, planItems } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { loadCurrentPlan } from "@/lib/mentor/store";

export type PlanItem = typeof planItems.$inferSelect;
export type WeekPlan = typeof weeklyPlans.$inferSelect;
export type WeekPlanWithItems = WeekPlan & { items: PlanItem[] };

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getWeekStart(date?: Date): string {
  const d = new Date(date ?? new Date());
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return toLocalISODate(d);
}

export function getAdjacentWeek(weekStart: string, delta: number): string {
  const d = new Date(weekStart + "T12:00:00");
  d.setDate(d.getDate() + delta * 7);
  return toLocalISODate(d);
}

export function getISOWeekNumber(weekStart: string): number {
  const d = new Date(weekStart + "T12:00:00");
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function loadWeekPlan(weekStart: string): WeekPlanWithItems | null {
  const plan = db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.weekStart, weekStart))
    .get();
  if (!plan) return null;
  const items = db
    .select()
    .from(planItems)
    .where(eq(planItems.weeklyPlanId, plan.id))
    .all();
  return { ...plan, items };
}

function generateBriefing(focusItems: { type: string; title: string; priority: string }[]): {
  mentorBriefing: string;
  collapsedBriefing: string;
} {
  const high = focusItems.filter((f) => f.priority === "high");
  const rest = focusItems.filter((f) => f.priority !== "high");
  const platforms = [...new Set(rest.map((f) => f.type))];
  const platformLabels: Record<string, string> = {
    "42": "42", thm: "THM", htb: "HTB", rootme: "RM", maldev: "maldev",
    "side-project": "side project", skill: "skill-building",
  };

  const first = high[0]?.title ?? focusItems[0]?.title ?? "your tasks";
  const second = (high[1] ?? rest[0])?.title;
  const fills = platforms
    .filter((p) => p !== high[0]?.type)
    .map((p) => platformLabels[p] ?? p)
    .slice(0, 2);

  let briefing = `Finish ${first} first — you're close, and it feeds into maldev later.`;
  if (second) briefing += ` Then ${second}.`;
  if (fills.length) briefing += ` Fill gaps with ${fills.join(" + ")}.`;

  let collapsed = `Finish ${first}`;
  if (second) collapsed += `, then ${second}.`;
  if (fills.length) collapsed += ` Fill with ${fills.join(" + ")}.`;

  return { mentorBriefing: briefing, collapsedBriefing: collapsed };
}

export function createWeekPlanFromMentor(weekStart: string): WeekPlanWithItems {
  const { plan: mentorPlan } = loadCurrentPlan();

  const { mentorBriefing, collapsedBriefing } = generateBriefing(mentorPlan.focus);

  const result = db
    .insert(weeklyPlans)
    .values({ weekStart, mentorBriefing, collapsedBriefing })
    .returning()
    .get();

  // Carry forward deferred items from previous weeks
  const deferred = db
    .select()
    .from(planItems)
    .where(
      and(
        eq(planItems.status, "deferred"),
        lte(planItems.deferredTo, weekStart)
      )
    )
    .all();

  const items: PlanItem[] = [];

  for (const d of deferred) {
    const item = db
      .insert(planItems)
      .values({
        weeklyPlanId: result.id,
        title: d.title,
        type: d.type,
        why: d.why,
        description: d.description,
        estimatedHours: d.estimatedHours,
        priority: d.priority,
        ref: d.ref,
        link: d.link,
        status: "pending",
        sortOrder: items.length,
        sourceWeek: d.sourceWeek ?? d.createdAt?.slice(0, 10),
      })
      .returning()
      .get();
    items.push(item);
  }

  for (const focus of mentorPlan.focus) {
    const hours = parseFloat(focus.estimatedTime.replace(/[^0-9.]/g, "")) || 2;
    const item = db
      .insert(planItems)
      .values({
        weeklyPlanId: result.id,
        title: focus.title,
        type: focus.type,
        why: focus.why,
        estimatedHours: hours,
        priority: focus.priority,
        ref: focus.ref,
        link: focus.link,
        sortOrder: items.length,
      })
      .returning()
      .get();
    items.push(item);
  }

  autoDistribute(items);

  return { ...result, items };
}

function autoDistribute(items: PlanItem[]) {
  const dayLoad = [0, 0, 0, 0, 0, 0, 0];
  for (const item of items) {
    let bestDay = 0;
    let minLoad = Infinity;
    for (let d = 0; d < 7; d++) {
      if (dayLoad[d] < minLoad) {
        minLoad = dayLoad[d];
        bestDay = d;
      }
    }
    dayLoad[bestDay] += item.estimatedHours ?? 2;
    db.update(planItems)
      .set({ dayIndex: bestDay })
      .where(eq(planItems.id, item.id))
      .run();
    item.dayIndex = bestDay;
  }
}

export function getOrCreateWeekPlan(weekStart: string): WeekPlanWithItems {
  return loadWeekPlan(weekStart) ?? createWeekPlanFromMentor(weekStart);
}

export function updatePlanItem(
  id: number,
  updates: {
    dayIndex?: number | null;
    status?: string;
    sortOrder?: number;
    deferredTo?: string | null;
    attemptCount?: number;
    blockedReason?: string | null;
    blockedSince?: string | null;
    description?: string | null;
  }
) {
  const data: Record<string, unknown> = {};
  if ("dayIndex" in updates) data.dayIndex = updates.dayIndex;
  if ("status" in updates) {
    data.status = updates.status;
    if (updates.status === "done") {
      data.completedAt = new Date().toISOString();
    } else {
      data.completedAt = null;
    }
    if (updates.status === "blocked") {
      data.blockedSince = new Date().toISOString();
    }
    if (updates.status === "stuck") {
      const current = db.select().from(planItems).where(eq(planItems.id, id)).get();
      data.attemptCount = (current?.attemptCount ?? 0) + 1;
    }
  }
  if ("sortOrder" in updates) data.sortOrder = updates.sortOrder;
  if ("deferredTo" in updates) data.deferredTo = updates.deferredTo;
  if ("attemptCount" in updates) data.attemptCount = updates.attemptCount;
  if ("blockedReason" in updates) data.blockedReason = updates.blockedReason;
  if ("blockedSince" in updates) data.blockedSince = updates.blockedSince;
  if ("description" in updates) data.description = updates.description;

  db.update(planItems).set(data).where(eq(planItems.id, id)).run();
  return db.select().from(planItems).where(eq(planItems.id, id)).get();
}

export function rerollWeekPlan(weekStart: string): WeekPlanWithItems {
  const existing = db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.weekStart, weekStart))
    .get();
  if (existing) {
    db.delete(planItems)
      .where(eq(planItems.weeklyPlanId, existing.id))
      .run();
    db.delete(weeklyPlans)
      .where(eq(weeklyPlans.id, existing.id))
      .run();
  }
  return createWeekPlanFromMentor(weekStart);
}
