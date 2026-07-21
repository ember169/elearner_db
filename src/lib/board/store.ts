import { db } from "@/lib/db";
import { weeklyPlans, planItems, goals } from "@/lib/db/schema";
import { eq, and, ne, inArray } from "drizzle-orm";
import {
  runGuidanceEngine,
  flattenGoals,
  type Recommendation,
} from "@/lib/guidance/engine";
import { FT_COMMON_CORE } from "@/lib/guidance/ft-project-tree";
import { HTB_ACADEMY_MODULES } from "@/lib/mentor/htb-academy-catalog";
import { isRmTitleSolved } from "@/lib/mentor/rootme-challenge-catalog";
import { getMainDeadline } from "@/lib/planning/backward-planner";

const HTB_TIER_HOURS: Record<string, number> = { Fundamental: 6, Easy: 8, Medium: 12, Hard: 16 };
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
  items: { type: string; title: string; priority: string; reason?: string }[]
): { mentorBriefing: string; collapsedBriefing: string } {
  const high = items.filter((f) => f.priority === "high");
  const rest = items.filter((f) => f.priority !== "high");

  const rawFirst = high[0]?.title ?? items[0]?.title ?? "your tasks";
  const first = /^(Finish|Start|Continue)\s/i.test(rawFirst)
    ? rawFirst
    : `Finish ${rawFirst}`;
  const second = (high[1] ?? rest[0])?.title;

  const firstReason = high[0]?.reason ?? items[0]?.reason ?? "";
  const circleMatch = firstReason.match(/Circle (\d+)/);
  const whyFirst = firstReason.toLowerCase().includes("in progress")
    ? "it's already in progress"
    : circleMatch
      ? `it moves you forward in Circle ${circleMatch[1]}`
      : firstReason.includes("needed for") || firstReason.includes("alternative to")
        ? "it keeps your cadence on track"
        : firstReason.includes("goal")
          ? "it keeps your goal on track"
          : "it's highest priority right now";

  const firstType = high[0]?.type ?? items[0]?.type;
  const sidePicks = [...high.slice(1), ...rest]
    .filter((r) => r.type !== firstType)
    .map((r) => r.title.replace(/^(RM|HTB|THM): /, ""))
    .slice(0, 2);

  let briefing = `${first} first — ${whyFirst}.`;
  if (second) briefing += ` Then ${second}.`;
  if (sidePicks.length) briefing += ` Alongside: ${sidePicks.join(", ")}.`;

  let collapsed = first;
  if (second) collapsed += `, then ${second}.`;
  if (sidePicks.length) collapsed += ` + ${sidePicks.join(", ")}.`;

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

export function populateBacklog(
  mentorBriefingOverride?: string,
  collapsedBriefingOverride?: string
): BoardItem[] {
  const sentinelId = getOrCreateSentinelPlan();

  const done42Names = new Set(
    db.select().from(planItems)
      .where(and(eq(planItems.weeklyPlanId, sentinelId), eq(planItems.type, "42"), eq(planItems.boardStatus, "done")))
      .all()
      .map((i) => i.title)
  );
  const boardDoneSlugs = new Set<string>();
  for (const name of done42Names) {
    const p = FT_COMMON_CORE.find((proj) => proj.name === name);
    if (p) boardDoneSlugs.add(p.slug);
  }

  const guidance = runGuidanceEngine(boardDoneSlugs.size > 0 ? boardDoneSlugs : undefined);
  const allRecs = guidance.recommendations;
  const allGoals = flattenGoals(guidance.goals);

  const slugToGoalId = new Map<string, number>();
  const categoryToGoalId = new Map<string, number>();
  const rootmeGoals: { id: number; title: string }[] = [];
  for (const g of allGoals) {
    if (g.ftSlug) slugToGoalId.set(g.ftSlug, g.id);
    if (g.category && !categoryToGoalId.has(g.category)) {
      categoryToGoalId.set(g.category, g.id);
    }
    if (g.category === "rootme") rootmeGoals.push({ id: g.id, title: g.title });
  }

  const existing = db
    .select()
    .from(planItems)
    .where(eq(planItems.weeklyPlanId, sentinelId))
    .all();
  const normalizeTitle = (t: string) =>
    t.replace(/^(Start|Finish|Continue|Work on)\s+/i, "");

  // Strip verb prefixes from existing items
  for (const item of existing) {
    const clean = normalizeTitle(item.title);
    if (clean !== item.title) {
      db.update(planItems).set({ title: clean }).where(eq(planItems.id, item.id)).run();
      item.title = clean;
    }
  }

  // Refresh hours from source catalogs (fixes stale weekly-allocation values)
  for (const item of existing) {
    let correctHours: number | undefined;
    if (item.type === "42") {
      const project = FT_COMMON_CORE.find((p) => p.name === item.title);
      if (project) correctHours = project.estimatedHours;
    } else if (item.type === "htb" && item.title.startsWith("HTB: ")) {
      const mod = HTB_ACADEMY_MODULES.find((m) => m.name === item.title.replace(/^HTB: /, ""));
      if (mod) correctHours = HTB_TIER_HOURS[mod.tier];
    }
    if (correctHours !== undefined && correctHours !== item.estimatedHours) {
      db.update(planItems).set({ estimatedHours: correctHours }).where(eq(planItems.id, item.id)).run();
      item.estimatedHours = correctHours;
    }
  }

  // Fix stale "needed needed" double-word in existing reason text
  for (const item of existing) {
    if (item.why && /needed needed/.test(item.why)) {
      const fixed = item.why.replace(/needed needed/g, "needed");
      db.update(planItems).set({ why: fixed }).where(eq(planItems.id, item.id)).run();
      item.why = fixed;
    }
  }

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

  // Refresh reason/priority on existing backlog items from current recommendations
  const existingByKey = new Map(
    existing.map((i) => [`${normalizeTitle(i.title)}::${i.type}`, i])
  );
  for (const rec of bestByBase.values()) {
    const key = `${normalizeTitle(rec.title)}::${rec.platform}`;
    const item = existingByKey.get(key);
    if (!item || item.boardStatus !== "backlog") continue;
    const updates: Record<string, unknown> = {};
    if (rec.reason && rec.reason !== item.why) updates.why = rec.reason;
    if (rec.priority && rec.priority !== item.priority) updates.priority = rec.priority;
    if (rec.goalId && rec.goalId !== item.goalId) updates.goalId = rec.goalId;
    if (Object.keys(updates).length > 0) {
      db.update(planItems).set(updates).where(eq(planItems.id, item.id)).run();
    }
  }

  const newItems: BoardItem[] = [];

  for (const rec of bestByBase.values()) {
    const key = `${normalizeTitle(rec.title)}::${rec.platform}`;
    if (existingKeys.has(key)) continue;

    const category = categoryFromType(rec.platform);
    let goalId = rec.goalId ?? null;

    if (!goalId) {
      goalId = (rec.ref ? slugToGoalId.get(rec.ref) : undefined) ?? null;
    }

    if (!goalId && rec.platform === "rootme" && rec.ref) {
      const refLower = rec.ref.toLowerCase();
      const ROOTME_REF_KEYWORDS: Record<string, string[]> = {
        "cracking": ["reverse", "cracking", "binary"],
        "app - système": ["reverse", "binary", "system"],
        "web - client": ["web"],
        "web - serveur": ["web"],
        "cryptanalyse": ["crypto"],
        "forensique": ["forensic"],
        "réseau": ["network"],
        "stéganographie": ["stegano"],
      };
      const keywords = ROOTME_REF_KEYWORDS[refLower] ?? [];
      const match = rootmeGoals.find((g) => {
        const t = g.title.toLowerCase();
        return keywords.some((kw) => t.includes(kw));
      });
      goalId = match?.id ?? null;
    }

    if (!goalId && rec.platform !== "rootme") {
      goalId = categoryToGoalId.get(rec.platform) ?? null;
    }

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

  // Prune auto-generated backlog items no longer in current recommendations
  const currentRecKeys = new Set(
    [...bestByBase.values()].map((r) => `${normalizeTitle(r.title)}::${r.platform}`)
  );
  const autoGenerated = db
    .select()
    .from(planItems)
    .where(
      and(
        eq(planItems.weeklyPlanId, sentinelId),
        eq(planItems.boardStatus, "backlog")
      )
    )
    .all()
    .filter((i) => /^(RM: |HTB[: ]|THM: |Root-me: )/.test(i.title));
  for (const item of autoGenerated) {
    const key = `${normalizeTitle(item.title)}::${item.type}`;
    if (!currentRecKeys.has(key)) {
      db.delete(planItems).where(eq(planItems.id, item.id)).run();
    }
  }

  // Purge stale THM backlog items so HTB equivalents can replace them
  db.delete(planItems)
    .where(
      and(
        eq(planItems.weeklyPlanId, sentinelId),
        eq(planItems.type, "thm"),
        eq(planItems.boardStatus, "backlog")
      )
    )
    .run();

  // Purge HTB machine backlog items when user has no box owns (Academy first)
  const htbOwns = (guidance.snapshot.htb.profile?.systemOwns ?? 0) +
    (guidance.snapshot.htb.profile?.userOwns ?? 0);
  if (htbOwns === 0) {
    const htbMachineItems = db
      .select()
      .from(planItems)
      .where(
        and(
          eq(planItems.weeklyPlanId, sentinelId),
          eq(planItems.type, "htb"),
          eq(planItems.boardStatus, "backlog")
        )
      )
      .all()
      .filter((i) => i.title.startsWith("HTB Machine:"));
    for (const item of htbMachineItems) {
      db.delete(planItems).where(eq(planItems.id, item.id)).run();
    }
  }

  // Collapse duplicate 42 items (Start/Continue/Finish variants of the same project)
  const all42 = db
    .select()
    .from(planItems)
    .where(and(eq(planItems.weeklyPlanId, sentinelId), eq(planItems.type, "42")))
    .all();
  const groups42 = new Map<string, typeof all42>();
  for (const item of all42) {
    const base = normalizeTitle(item.title);
    const arr = groups42.get(base) ?? [];
    arr.push(item);
    groups42.set(base, arr);
  }
  for (const [, group] of groups42) {
    if (group.length <= 1) continue;
    const statusRank: Record<string, number> = { done: 3, in_progress: 2, todo: 1, backlog: 0 };
    group.sort((a, b) => (statusRank[b.boardStatus ?? "backlog"] ?? 0) - (statusRank[a.boardStatus ?? "backlog"] ?? 0));
    for (const dup of group.slice(1)) {
      db.delete(planItems).where(eq(planItems.id, dup.id)).run();
    }
  }

  // Auto-complete solved Root-me backlog items
  const solvedTitles = guidance.snapshot.rootme.solvedTitles;
  const allRm = db
    .select()
    .from(planItems)
    .where(
      and(
        eq(planItems.weeklyPlanId, sentinelId),
        eq(planItems.type, "rootme"),
        eq(planItems.boardStatus, "backlog")
      )
    )
    .all();
  for (const item of allRm) {
    const challengeTitle = item.title.replace(/^RM: /, "");
    if (isRmTitleSolved(challengeTitle, solvedTitles)) {
      db.update(planItems)
        .set({ boardStatus: "done", status: "done", completedAt: new Date().toISOString() })
        .where(eq(planItems.id, item.id))
        .run();
    }
  }

  // Collapse duplicate RM items (short title vs full catalog title)
  const allRmItems = db
    .select()
    .from(planItems)
    .where(and(eq(planItems.weeklyPlanId, sentinelId), eq(planItems.type, "rootme")))
    .all();
  const rmNormalize = (title: string) =>
    title
      .replace(/^RM: /, "")
      .replace(/^(ELF x86|ELF x64|PE x86|PE DotNet|ELF C\+\+|ELF MIPS|ELF ARM|PYC|PHP)\s*-\s*/i, "")
      .toLowerCase()
      .trim();
  const rmGroups = new Map<string, typeof allRmItems>();
  for (const item of allRmItems) {
    const key = rmNormalize(item.title);
    const arr = rmGroups.get(key) ?? [];
    arr.push(item);
    rmGroups.set(key, arr);
  }
  for (const [, group] of rmGroups) {
    if (group.length <= 1) continue;
    group.sort((a, b) => b.title.length - a.title.length);
    for (const dup of group.slice(1)) {
      db.delete(planItems).where(eq(planItems.id, dup.id)).run();
    }
  }

  // Re-sort backlog items to match recommendation priority
  const recOrder = new Map(
    allRecs.map((r, i) => [`${normalizeTitle(r.title)}::${r.platform}`, i])
  );
  const backlogItems = db
    .select()
    .from(planItems)
    .where(
      and(
        eq(planItems.weeklyPlanId, sentinelId),
        eq(planItems.boardStatus, "backlog")
      )
    )
    .all();
  backlogItems.sort((a, b) => {
    const aIdx = recOrder.get(`${normalizeTitle(a.title)}::${a.type}`) ?? 999;
    const bIdx = recOrder.get(`${normalizeTitle(b.title)}::${b.type}`) ?? 999;
    return aIdx - bIdx;
  });
  for (let i = 0; i < backlogItems.length; i++) {
    db.update(planItems)
      .set({ sortOrder: i })
      .where(eq(planItems.id, backlogItems[i].id))
      .run();
  }

  // Update briefing — exclude items already done on the board
  const doneKeys = new Set(
    db.select().from(planItems)
      .where(and(eq(planItems.weeklyPlanId, sentinelId), eq(planItems.boardStatus, "done")))
      .all()
      .map((i) => `${normalizeTitle(i.title)}::${i.type}`)
  );
  const briefingRecs = allRecs
    .filter((r) => !doneKeys.has(`${normalizeTitle(r.title)}::${r.platform}`))
    .slice(0, 8);
  const { mentorBriefing, collapsedBriefing } = mentorBriefingOverride
    ? { mentorBriefing: mentorBriefingOverride, collapsedBriefing: collapsedBriefingOverride ?? mentorBriefingOverride }
    : generateBriefing(briefingRecs.map((r) => ({
        type: r.platform,
        title: r.title,
        priority: r.priority,
        reason: r.reason,
      })));
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
    // Strip verb prefixes and refresh stale hours on every load
    const normalizeT = (t: string) => t.replace(/^(Start|Finish|Continue|Work on)\s+/i, "");
    for (const item of existingItems) {
      const clean = normalizeT(item.title);
      const updates: Record<string, unknown> = {};
      if (clean !== item.title) updates.title = clean;
      if (item.type === "42") {
        const project = FT_COMMON_CORE.find((p) => p.name === clean);
        if (project && project.estimatedHours !== item.estimatedHours) {
          updates.estimatedHours = project.estimatedHours;
        }
      } else if (item.type === "htb" && clean.startsWith("HTB: ")) {
        const modName = clean.replace(/^HTB: /, "");
        const mod = HTB_ACADEMY_MODULES.find((m) => m.name === modName);
        if (mod && HTB_TIER_HOURS[mod.tier] !== item.estimatedHours) {
          updates.estimatedHours = HTB_TIER_HOURS[mod.tier];
        }
      }
      if (Object.keys(updates).length > 0) {
        db.update(planItems).set(updates).where(eq(planItems.id, item.id)).run();
      }
    }
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
      const normTitle = item.title.replace(/^(Start|Finish|Continue|Work on)\s+/i, "");
      const key = `${normTitle}::${item.type}`;
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

export function deleteBoardItem(id: number): void {
  db.delete(planItems).where(eq(planItems.id, id)).run();
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
