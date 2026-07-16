import { db } from "@/lib/db";
import { weeklyPlans, planItems } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { loadCurrentPlan } from "@/lib/mentor/store";

export type PlanItem = typeof planItems.$inferSelect;
export type WeekPlan = typeof weeklyPlans.$inferSelect;
export type WeekPlanWithItems = WeekPlan & { items: PlanItem[] };

export function getWeekStart(date?: Date): string {
  const d = new Date(date ?? new Date());
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
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

export function createWeekPlanFromMentor(weekStart: string): WeekPlanWithItems {
  const { plan: mentorPlan } = loadCurrentPlan();

  const result = db
    .insert(weeklyPlans)
    .values({ weekStart })
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
        estimatedHours: d.estimatedHours,
        priority: d.priority,
        ref: d.ref,
        link: d.link,
        status: "pending",
        sortOrder: items.length,
      })
      .returning()
      .get();
    items.push(item);
  }

  // Seed from mentor plan focus items
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

  // Auto-distribute across days
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
  }
  if ("sortOrder" in updates) data.sortOrder = updates.sortOrder;
  if ("deferredTo" in updates) data.deferredTo = updates.deferredTo;

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
