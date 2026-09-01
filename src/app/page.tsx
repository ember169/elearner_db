import { db } from "@/lib/db";
import { ftProfile, maldevProfile, competencyValidations } from "@/lib/db/schema";
import { initializeBoard } from "@/lib/board/store";
import { loadCurrentPlan } from "@/lib/mentor/store";
import { runGuidanceEngine, flattenGoals } from "@/lib/guidance/engine";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES } from "@/lib/mentor/competency-map";
import { readAppSettings } from "@/lib/settings/read";
import { listResources } from "@/lib/learn/store";
import { HomeClient } from "@/components/home/home-client";

export const dynamic = "force-dynamic";

const FOCUS_STATUSES = new Set(["in_progress", "todo"]);
const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const initialView = view === "board" ? "board" : "today";
  const board = initializeBoard();
  const guidance = runGuidanceEngine();
  const signals = computeCompetencySignals(guidance.snapshot, guidance.ftProgress);
  const { objective, sideProjectState } = readAppSettings();
  const mentor = loadCurrentPlan();

  const ft = db.select().from(ftProfile).limit(1).all()[0] ?? null;
  const maldev = db.select().from(maldevProfile).limit(1).all()[0] ?? null;
  const validations = db.select().from(competencyValidations).all();
  const validatedLevel: Record<string, number> = {};
  for (const v of validations) validatedLevel[v.competencyId] = v.validatedLevel;

  // ── Daily focus: the top of the board, as before ─────────────────────────
  const focus = board.items
    .filter((i) => FOCUS_STATUSES.has(i.boardStatus ?? ""))
    .sort((a, b) => {
      const p = (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
      return p !== 0 ? p : (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .slice(0, 4)
    .map((i) => ({
      id: i.id,
      title: i.title,
      type: i.type,
      priority: i.priority,
      estimatedHours: i.estimatedHours,
      boardStatus: i.boardStatus,
    }));

  // ── Hero: 42 common-core by circle (the Holy Graph donut, on our data) ────
  const cb = guidance.ftProgress.circleBreakdown;
  const circleNums = Object.keys(cb)
    .map(Number)
    .sort((a, b) => a - b);
  // The "current" circle is the first one not fully finished — the engine's
  // currentCircle can point at an already-complete circle, which leaves the ring
  // with no active marker. Anchoring on the first incomplete circle guarantees
  // exactly one gold "current" band and matches "what's next".
  const firstIncomplete = circleNums.find((c) => cb[c].done < cb[c].total);
  const currentCircle = firstIncomplete ?? circleNums[circleNums.length - 1] ?? 0;
  const circles = circleNums.map((c) => ({
    circle: c,
    done: cb[c].done,
    total: cb[c].total,
    state:
      cb[c].total > 0 && cb[c].done >= cb[c].total
        ? ("done" as const)
        : c === currentCircle
          ? ("current" as const)
          : cb[c].done > 0
            ? ("current" as const)
            : ("locked" as const),
  }));
  const coreDone = circles.reduce((n, c) => n + c.done, 0);
  const coreTotal = circles.reduce((n, c) => n + c.total, 0);

  // ── Competency pulse ──────────────────────────────────────────────────────
  const competencies = COMPETENCIES.map((c) => ({
    id: c.id,
    label: c.label,
    area: c.area as string,
    level: validatedLevel[c.id] ?? signals[c.id]?.autoLevel ?? 0,
  }));
  const atL2 = competencies.filter((c) => c.level >= 2).length;

  // ── Stat tiles ────────────────────────────────────────────────────────────
  const allResources = listResources();
  const resDone = allResources.filter((r) => r.status === "completed").length;
  const activeGoals = flattenGoals(guidance.goals).filter((g) => g.status === "active");

  // ── Within reach: what's close, not the whole mountain ────────────────────
  // Near-complete goals (with a % bar) first, then the next projects that are
  // already unlocked and ready to start — so the widget always points at a
  // concrete next move instead of going empty.
  const reachGoals = activeGoals
    .filter(
      (g) =>
        g.targetValue != null &&
        g.currentValue != null &&
        g.currentValue > 0 &&
        g.children.length === 0,
    )
    .map((g) => ({
      kind: "goal" as const,
      id: `g${g.id}`,
      title: g.title,
      current: g.currentValue as number,
      target: g.targetValue as number,
      pct: Math.min(
        100,
        Math.round(((g.currentValue as number) / (g.targetValue as number)) * 100),
      ),
    }))
    .filter((g) => g.pct >= 40 && g.pct < 100)
    .sort((a, b) => b.pct - a.pct);

  // Projects the board already marks done shouldn't resurface as "ready".
  const boardDone42 = new Set(
    board.items
      .filter((i) => i.type === "42" && i.boardStatus === "done")
      .map((i) => i.title),
  );
  const reachProjects = guidance.ftProgress.availableProjects
    .filter((p) => !boardDone42.has(p.name))
    .sort((a, b) => a.circle - b.circle || a.estimatedHours - b.estimatedHours)
    .slice(0, 4)
    .map((p) => ({
      kind: "project" as const,
      id: `p${p.slug}`,
      title: p.name,
      circle: p.circle,
      hours: p.estimatedHours,
    }));

  const withinReach = [...reachGoals, ...reachProjects].slice(0, 5);

  const stats = {
    level: ft?.level ?? null,
    coreDone,
    coreTotal,
    validated: guidance.ftProgress.completedProjects.length,
    currentCircle,
    atL2,
    competencyTotal: competencies.length,
    resDone,
    resTotal: allResources.length,
    maldevPct: maldev?.overallProgress ?? null,
    activeGoals: activeGoals.length,
  };

  return (
    <HomeClient
      initialView={initialView}
      focus={focus}
      briefing={board.mentorBriefing}
      collapsedBriefing={board.collapsedBriefing}
      briefingStale={mentor.stale}
      boardCount={board.items.length}
      circles={circles}
      stats={stats}
      withinReach={withinReach}
      competencies={competencies}
      // Board view data
      boardItems={board.items}
      objective={objective}
      sideProject={mentor.plan.side_project ?? null}
      sideProjectState={sideProjectState}
      hasKey={mentor.hasKey}
      goals={activeGoals
        .filter((g) => g.children.length === 0)
        .map((g) => ({
          id: g.id,
          title: g.title,
          category: g.category,
          goalType: g.goalType,
          currentValue: g.currentValue,
          targetValue: g.targetValue,
          cadenceValue: g.cadenceValue,
          cadenceUnit: g.cadenceUnit,
          parentGoalId: g.parentGoalId,
          pacing: g.pacing,
        }))}
    />
  );
}
