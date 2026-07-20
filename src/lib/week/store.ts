import { db } from "@/lib/db";
import { weeklyPlans, planItems } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { loadCurrentPlan } from "@/lib/mentor/store";
import {
  runGuidanceEngine,
  flattenGoals,
  type Recommendation,
} from "@/lib/guidance/engine";
import { getMainDeadline } from "@/lib/planning/backward-planner";
import { WEEKLY_HOURS_BUDGET } from "@/lib/planning/rule-engine";

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

  const rawFirst = high[0]?.title ?? focusItems[0]?.title ?? "your tasks";
  const first = /^(Finish|Start|Continue)\s/i.test(rawFirst) ? rawFirst : `Finish ${rawFirst}`;
  const second = (high[1] ?? rest[0])?.title;
  const fills = platforms
    .filter((p) => p !== high[0]?.type)
    .map((p) => platformLabels[p] ?? p)
    .slice(0, 2);

  let briefing = `${first} first — it feeds into what comes next.`;
  if (second) briefing += ` Then ${second}.`;
  if (fills.length) briefing += ` Fill gaps with ${fills.join(" + ")}.`;

  let collapsed = first;
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

  autoDistribute(items, weekStart);

  return { ...result, items };
}

function autoDistribute(items: PlanItem[], weekStart: string) {
  const now = new Date();
  const start = new Date(weekStart + "T00:00:00");
  const rawIdx = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const firstDay = (rawIdx >= 0 && rawIdx <= 6) ? rawIdx : 0;

  const dayLoad = [0, 0, 0, 0, 0, 0, 0];
  for (const item of items) {
    let bestDay = firstDay;
    let minLoad = Infinity;
    for (let d = firstDay; d < 7; d++) {
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

export function getMonthWeekStarts(date?: Date): string[] {
  const d = date ?? new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dow = firstDay.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const firstMonday = new Date(year, month, 1 + mondayOffset);
  const weekStarts: string[] = [];
  const cursor = new Date(firstMonday);
  while (cursor <= lastDay) {
    weekStarts.push(toLocalISODate(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return weekStarts;
}

export function movePlanItem(
  itemId: number,
  targetWeekStart: string,
  targetDayIndex: number
): PlanItem | undefined {
  const targetPlan = getOrCreateWeekPlan(targetWeekStart);
  db.update(planItems)
    .set({ weeklyPlanId: targetPlan.id, dayIndex: targetDayIndex })
    .where(eq(planItems.id, itemId))
    .run();
  return db.select().from(planItems).where(eq(planItems.id, itemId)).get();
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

function resolveLink(type: string, ref?: string): string | undefined {
  if (!ref) return undefined;
  switch (type) {
    case "thm": return `https://tryhackme.com/room/${ref}`;
    case "htb":
      if (/^\d+$/.test(ref)) return `https://academy.hackthebox.com/module/details/${ref}`;
      return `https://app.hackthebox.com/machines/${ref}`;
    case "rootme": return `https://www.root-me.org/en/Challenges/${encodeURIComponent(ref)}/`;
    default: return undefined;
  }
}

type MonthItem = {
  title: string;
  type: string;
  why: string;
  hours: number;
  priority: string;
  ref?: string;
  link?: string;
};

export function createMonthPlan(weekStarts: string[]): WeekPlanWithItems[] {
  const guidance = runGuidanceEngine();
  const allRecs = guidance.recommendations;
  const { ftProgress } = guidance;
  const goals = flattenGoals(guidance.goals);

  const mainDeadline = getMainDeadline();
  const weeklyBudget = mainDeadline?.weeklyBudget ?? WEEKLY_HOURS_BUDGET;

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...allRecs].sort(
    (a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  );

  const ft42Recs = sorted.filter((r) => r.platform === "42");
  const platformRecs = sorted.filter((r) =>
    ["thm", "htb", "rootme"].includes(r.platform)
  );
  const maldevRecs = sorted.filter((r) => r.platform === "maldev");

  // Supplement 42 projects beyond what recommendations provide
  const refsUsed = new Set(ft42Recs.map((r) => r.ref));
  const extra42: Recommendation[] = ftProgress.availableProjects
    .filter((p) => !refsUsed.has(p.slug))
    .slice(0, 6)
    .map((p) => ({
      priority: "medium" as const,
      platform: "42",
      title: `Start ${p.name}`,
      reason: `Next in Circle ${p.circle}.`,
      estimatedHours: p.estimatedHours,
      ref: p.slug,
    }));

  const all42 = [...ft42Recs, ...extra42];
  const numWeeks = weekStarts.length;

  const weekItems: MonthItem[][] = weekStarts.map(() => []);
  const budgets = weekStarts.map(() => weeklyBudget);

  // Reserve fixed slots per week for non-42 items
  const maldevPerWeek = maldevRecs.length > 0 ? Math.min(maldevRecs[0].estimatedHours ?? 2, 3) : 0;
  const platformPerWeek = 2;

  // 1. 42 projects: sequential queue — finish one before starting the next
  // This is the core budget, so allocate first for cleaner sequencing.
  const ft42Budget = budgets.map((b) => b - maldevPerWeek - platformPerWeek);
  const projectQueue = all42.map((r) => ({
    ...r,
    remaining: r.estimatedHours ?? 10,
    started: false,
  }));

  for (let w = 0; w < numWeeks; w++) {
    let weekBudget42 = Math.max(ft42Budget[w], 0);

    for (const proj of projectQueue) {
      if (proj.remaining <= 0 || weekBudget42 < 2) continue;

      const alloc = Math.min(proj.remaining, weekBudget42);

      let title = proj.title;
      if (proj.started) {
        title = title.replace(/^(Start|Finish)\s/, "Continue ");
        if (!title.startsWith("Continue")) title = `Continue ${title}`;
      }

      weekItems[w].push({
        title,
        type: "42",
        why: proj.reason,
        hours: alloc,
        priority: proj.started ? "medium" : proj.priority,
        ref: proj.ref,
      });
      budgets[w] -= alloc;
      weekBudget42 -= alloc;
      proj.remaining -= alloc;
      proj.started = true;
    }
  }

  // 2. Platform items: distribute unique recs across weeks, then backfill
  for (let w = 0; w < numWeeks; w++) {
    if (w < platformRecs.length) {
      const rec = platformRecs[w];
      const hours = rec.estimatedHours ?? 2;
      if (budgets[w] >= hours) {
        weekItems[w].push({
          title: rec.title,
          type: rec.platform,
          why: rec.reason,
          hours,
          priority: rec.priority,
          ref: rec.ref,
          link: rec.link ?? resolveLink(rec.platform, rec.ref),
        });
        budgets[w] -= hours;
      }
    } else if (platformRecs.length > 0) {
      const platforms = [...new Set(platformRecs.map((r) => r.platform))]
        .map(p => p === "thm" ? "htb" : p);
      const plat = platforms[w % platforms.length];
      const label =
        plat === "htb" ? "Complete an HTB challenge"
        : "Root-me challenges";
      const goalMatch = goals.find((g) => g.category === plat);
      const why = goalMatch?.pacing
        ? `${goalMatch.pacing.requiredPace} for "${goalMatch.title}".`
        : "Regular practice.";
      if (budgets[w] >= 2) {
        weekItems[w].push({
          title: label,
          type: plat,
          why,
          hours: 2,
          priority: "medium",
        });
        budgets[w] -= 2;
      }
    }
  }

  // 3. Maldev: recurring every week
  for (const rec of maldevRecs) {
    const perWeek = Math.min(rec.estimatedHours ?? 2, 3);
    for (let w = 0; w < numWeeks; w++) {
      if (budgets[w] >= perWeek) {
        weekItems[w].push({
          title: rec.title,
          type: rec.platform,
          why: rec.reason,
          hours: perWeek,
          priority: rec.priority,
          ref: rec.ref,
          link: rec.link ?? resolveLink(rec.platform, rec.ref),
        });
        budgets[w] -= perWeek;
      }
    }
  }

  // Generate briefing from week 1's items
  const briefingItems = weekItems[0].map((i) => ({
    type: i.type,
    title: i.title,
    priority: i.priority,
  }));
  const { mentorBriefing, collapsedBriefing } = generateBriefing(briefingItems);

  const results: WeekPlanWithItems[] = [];

  for (let w = 0; w < numWeeks; w++) {
    const ws = weekStarts[w];

    // Delete existing plan for this week
    const existing = db
      .select()
      .from(weeklyPlans)
      .where(eq(weeklyPlans.weekStart, ws))
      .get();
    if (existing) {
      db.delete(planItems)
        .where(eq(planItems.weeklyPlanId, existing.id))
        .run();
      db.delete(weeklyPlans)
        .where(eq(weeklyPlans.id, existing.id))
        .run();
    }

    const plan = db
      .insert(weeklyPlans)
      .values({ weekStart: ws, mentorBriefing, collapsedBriefing })
      .returning()
      .get();

    const items: PlanItem[] = [];
    for (const mi of weekItems[w]) {
      const item = db
        .insert(planItems)
        .values({
          weeklyPlanId: plan.id,
          title: mi.title,
          type: mi.type,
          why: mi.why,
          estimatedHours: mi.hours,
          priority: mi.priority,
          ref: mi.ref,
          link: mi.link,
          sortOrder: items.length,
        })
        .returning()
        .get();
      items.push(item);
    }

    autoDistribute(items, ws);
    results.push({ ...plan, items });
  }

  return results;
}
