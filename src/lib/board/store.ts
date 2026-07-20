import { db } from "@/lib/db";
import { weeklyPlans, planItems, goals } from "@/lib/db/schema";
import { eq, and, ne, inArray } from "drizzle-orm";
import {
  runGuidanceEngine,
  flattenGoals,
  type Recommendation,
} from "@/lib/guidance/engine";
import { getMainDeadline } from "@/lib/planning/backward-planner";
import { WEEKLY_HOURS_BUDGET } from "@/lib/planning/rule-engine";

export type BoardItem = typeof planItems.$inferSelect;

export type BoardData = {
  items: BoardItem[];
  mentorBriefing: string | null;
  collapsedBriefing: string | null;
};

const BOARD_SENTINEL = "board";

export const BOARD_STATUSES = ["backlog", "todo", "in_progress", "done"] as const;
export type BoardStatus = (typeof BOARD_STATUSES)[number];

export const BOARD_CATEGORIES = ["42", "cybersec", "maldev"] as const;
export type BoardCategory = (typeof BOARD_CATEGORIES)[number];

function getOrCreateSentinelPlan(): number {
  const existing = db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.weekStart, BOARD_SENTINEL))
    .get();
  if (existing) return existing.id;

  const row = db
    .insert(weeklyPlans)
    .values({ weekStart: BOARD_SENTINEL, status: "active" })
    .returning()
    .get();
  return row.id;
}

function resolveLink(type: string, ref?: string): string | undefined {
  if (!ref) return undefined;
  switch (type) {
    case "thm":
      return `https://tryhackme.com/room/${ref}`;
    case "htb":
      if (/^\d+$/.test(ref)) return `https://academy.hackthebox.com/module/details/${ref}`;
      return `https://app.hackthebox.com/machines/${ref}`;
    case "rootme":
      return `https://www.root-me.org/en/Challenges/${encodeURIComponent(ref)}/`;
    default:
      return undefined;
  }
}

function categoryFromType(type: string): BoardCategory {
  if (["thm", "htb", "rootme"].includes(type)) return "cybersec";
  if (type === "maldev") return "maldev";
  return "42";
}

function generateBriefing(
  items: { type: string; title: string; priority: string }[]
): { mentorBriefing: string; collapsedBriefing: string } {
  const high = items.filter((f) => f.priority === "high");
  const rest = items.filter((f) => f.priority !== "high");
  const platforms = [...new Set(rest.map((f) => f.type))];
  const platformLabels: Record<string, string> = {
    "42": "42",
    thm: "THM",
    htb: "HTB",
    rootme: "RM",
    maldev: "maldev",
    "side-project": "side project",
    skill: "skill-building",
  };

  const rawFirst = high[0]?.title ?? items[0]?.title ?? "your tasks";
  const first = /^(Finish|Start|Continue)\s/i.test(rawFirst)
    ? rawFirst
    : `Finish ${rawFirst}`;
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

export function loadBoard(): BoardData {
  const sentinel = db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.weekStart, BOARD_SENTINEL))
    .get();

  if (!sentinel) {
    return { items: [], mentorBriefing: null, collapsedBriefing: null };
  }

  const items = db
    .select()
    .from(planItems)
    .where(eq(planItems.weeklyPlanId, sentinel.id))
    .all();

  return {
    items,
    mentorBriefing: sentinel.mentorBriefing,
    collapsedBriefing: sentinel.collapsedBriefing,
  };
}

export function populateBacklog(): BoardItem[] {
  const sentinelId = getOrCreateSentinelPlan();
  const guidance = runGuidanceEngine();
  const allRecs = guidance.recommendations;
  const allGoals = flattenGoals(guidance.goals);

  const slugToGoalId = new Map<string, number>();
  const categoryToGoalId = new Map<string, number>();
  for (const g of allGoals) {
    if (g.ftSlug) slugToGoalId.set(g.ftSlug, g.id);
    if (g.category && !categoryToGoalId.has(g.category)) {
      categoryToGoalId.set(g.category, g.id);
    }
  }

  const existing = db
    .select()
    .from(planItems)
    .where(eq(planItems.weeklyPlanId, sentinelId))
    .all();
  const normalizeTitle = (t: string) =>
    t.replace(/^(Start|Finish|Continue)\s+/i, "");
  const existingKeys = new Set(
    existing.map((i) => `${normalizeTitle(i.title)}::${i.type}`)
  );

  const maxSort = existing.reduce(
    (max, i) => Math.max(max, i.sortOrder ?? 0),
    0
  );
  let nextSort = maxSort + 1;

  const priorityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const bestByBase = new Map<string, (typeof allRecs)[number]>();
  for (const rec of allRecs) {
    const base = `${normalizeTitle(rec.title)}::${rec.platform}`;
    const prev = bestByBase.get(base);
    if (!prev || (priorityRank[rec.priority] ?? 0) > (priorityRank[prev.priority] ?? 0)) {
      bestByBase.set(base, rec);
    }
  }

  const newItems: BoardItem[] = [];

  for (const rec of bestByBase.values()) {
    const key = `${normalizeTitle(rec.title)}::${rec.platform}`;
    if (existingKeys.has(key)) continue;

    const category = categoryFromType(rec.platform);
    const goalId =
      (rec.ref ? slugToGoalId.get(rec.ref) : undefined) ??
      categoryToGoalId.get(rec.platform) ??
      null;

    const item = db
      .insert(planItems)
      .values({
        weeklyPlanId: sentinelId,
        title: rec.title,
        type: rec.platform,
        why: rec.reason,
        estimatedHours: rec.estimatedHours ?? 2,
        priority: rec.priority,
        ref: rec.ref,
        link: rec.link ?? resolveLink(rec.platform, rec.ref),
        sortOrder: nextSort++,
        goalId,
        category,
        boardStatus: "backlog",
      })
      .returning()
      .get();
    newItems.push(item);
  }

  // Purge stale THM backlog items so HTB equivalents can replace them
  db.delete(planItems)
    .where(
      and(
        eq(planItems.weeklyPlanId, sentinelId),
        eq(planItems.type, "thm"),
        ne(planItems.boardStatus, "done")
      )
    )
    .run();

  // Update briefing
  const briefingItems = allRecs.slice(0, 8).map((r) => ({
    type: r.platform,
    title: r.title,
    priority: r.priority,
  }));
  const { mentorBriefing, collapsedBriefing } = generateBriefing(briefingItems);
  db.update(weeklyPlans)
    .set({ mentorBriefing, collapsedBriefing })
    .where(eq(weeklyPlans.id, sentinelId))
    .run();

  return newItems;
}

export function updateBoardItem(
  id: number,
  updates: {
    boardStatus?: BoardStatus;
    status?: string;
    sortOrder?: number;
    goalId?: number | null;
    blockedReason?: string | null;
    description?: string | null;
  }
): BoardItem | undefined {
  const data: Record<string, unknown> = {};

  if ("boardStatus" in updates) {
    data.boardStatus = updates.boardStatus;
    if (updates.boardStatus === "done") {
      data.status = "done";
      data.completedAt = new Date().toISOString();
    } else if (updates.boardStatus === "in_progress") {
      if (!updates.status) data.status = "active";
      data.completedAt = null;
    } else {
      data.status = "pending";
      data.completedAt = null;
    }
  }

  if ("status" in updates) {
    data.status = updates.status;
    if (updates.status === "done") {
      data.completedAt = new Date().toISOString();
      data.boardStatus = "done";
    }
    if (updates.status === "blocked") {
      data.blockedSince = new Date().toISOString();
    }
    if (updates.status === "stuck") {
      const current = db
        .select()
        .from(planItems)
        .where(eq(planItems.id, id))
        .get();
      data.attemptCount = (current?.attemptCount ?? 0) + 1;
    }
  }

  if ("sortOrder" in updates) data.sortOrder = updates.sortOrder;
  if ("goalId" in updates) data.goalId = updates.goalId;
  if ("blockedReason" in updates) data.blockedReason = updates.blockedReason;
  if ("description" in updates) data.description = updates.description;

  db.update(planItems).set(data).where(eq(planItems.id, id)).run();
  return db.select().from(planItems).where(eq(planItems.id, id)).get();
}

export function reorderItem(
  id: number,
  boardStatus: BoardStatus,
  category: BoardCategory,
  newSortOrder: number
): void {
  const sentinelId = getOrCreateSentinelPlan();

  const siblings = db
    .select()
    .from(planItems)
    .where(
      and(
        eq(planItems.weeklyPlanId, sentinelId),
        eq(planItems.boardStatus, boardStatus),
        eq(planItems.category, category)
      )
    )
    .all()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const moving = siblings.find((s) => s.id === id);
  if (!moving) return;

  const rest = siblings.filter((s) => s.id !== id);
  rest.splice(newSortOrder, 0, moving);

  for (let i = 0; i < rest.length; i++) {
    db.update(planItems)
      .set({ sortOrder: i, boardStatus, category })
      .where(eq(planItems.id, rest[i].id))
      .run();
  }
}

export function initializeBoard(): BoardData {
  const sentinelId = getOrCreateSentinelPlan();

  const existingItems = db
    .select()
    .from(planItems)
    .where(eq(planItems.weeklyPlanId, sentinelId))
    .all();

  if (existingItems.length > 0) {
    return loadBoard();
  }

  // Migrate non-done items from recent weekly plans into the board
  const recentPlans = db
    .select()
    .from(weeklyPlans)
    .where(ne(weeklyPlans.weekStart, BOARD_SENTINEL))
    .all();

  const allGoals = db.select().from(goals).all();
  const slugToGoalId = new Map<string, number>();
  const categoryToGoalId = new Map<string, number>();
  for (const g of allGoals) {
    if (g.ftSlug) slugToGoalId.set(g.ftSlug, g.id);
    if (g.category && !categoryToGoalId.has(g.category)) {
      categoryToGoalId.set(g.category, g.id);
    }
  }

  const seenTitles = new Set<string>();
  let sortOrder = 0;

  for (const plan of recentPlans) {
    const items = db
      .select()
      .from(planItems)
      .where(eq(planItems.weeklyPlanId, plan.id))
      .all();

    for (const item of items) {
      const key = `${item.title}::${item.type}`;
      if (seenTitles.has(key)) continue;
      seenTitles.add(key);

      const category = item.category ?? categoryFromType(item.type);
      const goalId =
        item.goalId ??
        (item.ref ? slugToGoalId.get(item.ref) : undefined) ??
        categoryToGoalId.get(item.type) ??
        null;

      let boardStatus: BoardStatus;
      if (item.status === "done") boardStatus = "done";
      else if (item.status === "active") boardStatus = "in_progress";
      else boardStatus = "backlog";

      db.insert(planItems)
        .values({
          weeklyPlanId: sentinelId,
          title: item.title,
          type: item.type,
          why: item.why,
          description: item.description,
          estimatedHours: item.estimatedHours,
          priority: item.priority,
          status: item.status,
          ref: item.ref,
          link: item.link,
          sortOrder: sortOrder++,
          goalId,
          category,
          boardStatus,
          completedAt: item.completedAt,
          blockedReason: item.blockedReason,
          blockedSince: item.blockedSince,
          attemptCount: item.attemptCount,
        })
        .run();
    }
  }

  // Populate with fresh recommendations too
  populateBacklog();

  return loadBoard();
}

export function archiveDone(): number {
  const sentinelId = getOrCreateSentinelPlan();

  const doneItems = db
    .select()
    .from(planItems)
    .where(
      and(
        eq(planItems.weeklyPlanId, sentinelId),
        eq(planItems.boardStatus, "done")
      )
    )
    .all();

  for (const item of doneItems) {
    db.delete(planItems).where(eq(planItems.id, item.id)).run();
  }

  return doneItems.length;
}

export function addBoardItem(data: {
  title: string;
  type: string;
  why?: string;
  estimatedHours?: number;
  priority?: string;
  goalId?: number | null;
  category?: BoardCategory;
  boardStatus?: BoardStatus;
}): BoardItem {
  const sentinelId = getOrCreateSentinelPlan();

  const existing = db
    .select()
    .from(planItems)
    .where(eq(planItems.weeklyPlanId, sentinelId))
    .all();
  const maxSort = existing.reduce(
    (max, i) => Math.max(max, i.sortOrder ?? 0),
    0
  );

  return db
    .insert(planItems)
    .values({
      weeklyPlanId: sentinelId,
      title: data.title,
      type: data.type,
      why: data.why ?? null,
      estimatedHours: data.estimatedHours ?? 2,
      priority: data.priority ?? "medium",
      goalId: data.goalId ?? null,
      category: data.category ?? categoryFromType(data.type),
      boardStatus: data.boardStatus ?? "backlog",
      sortOrder: maxSort + 1,
    })
    .returning()
    .get();
}
