"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn, assertOk } from "@/lib/utils";
import { CardDetail } from "@/components/dashboard/card-detail";
import { PLATFORM_LABELS } from "@/lib/platform-colors";
import { CoreDonut, CircleBars } from "@/components/progress/core-donut";
import type { CircleSlice } from "@/components/progress/core-donut";

export type FocusItem = {
  id: number;
  title: string;
  type: string;
  priority: string;
  estimatedHours: number | null;
  boardStatus: string | null;
};

export type { CircleSlice };

export type CompetencyEntry = { id: string; label: string; area: string; level: number };

export type WithinReach =
  | {
      kind: "goal";
      id: string;
      title: string;
      current: number;
      target: number;
      pct: number;
    }
  | {
      kind: "project";
      id: string;
      title: string;
      circle: number;
      hours: number;
    };

export type HomeStats = {
  level: number | null;
  coreDone: number;
  coreTotal: number;
  validated: number;
  currentCircle: number;
  atL2: number;
  competencyTotal: number;
  resDone: number;
  resTotal: number;
  maldevPct: number | null;
  activeGoals: number;
};

function todayLabel() {
  return new Date()
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .toLowerCase();
}

/* ── Widget shell ──────────────────────────────────────────────────────── */
function Widget({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-cb-card border border-cb-line bg-cb-card p-4",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-3 flex items-baseline justify-between gap-2">
          {title && (
            <h2 className="cb-label-mono text-cb-caption text-cb-muted">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── KPI tiles ─────────────────────────────────────────────────────────── */
function StatTile({
  value,
  sub,
  label,
}: {
  value: string;
  sub?: string;
  label: string;
}) {
  return (
    <div className="rounded-cb-card border border-cb-line bg-cb-raised px-3 py-3">
      <div className="flex items-baseline gap-1">
        <span className="font-cb-serif text-cb-title leading-none text-cb-text">
          {value}
        </span>
        {sub && (
          <span className="font-cb-mono text-cb-foot tabular-nums text-cb-muted">
            {sub}
          </span>
        )}
      </div>
      <p className="mt-1.5 cb-label-mono text-cb-caption text-cb-muted">{label}</p>
    </div>
  );
}

/* ── Competency pulse: single-hue sequential heatmap ───────────────────── */
function CompetencyPulse({ competencies }: { competencies: CompetencyEntry[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {competencies.map((c) => (
        <span
          key={c.id}
          title={`${c.label} — L${c.level}`}
          className={cn(
            "h-6 w-6 rounded-[5px]",
            c.level === 0 ? "bg-cb-raised" : "bg-cb-or",
          )}
          style={c.level === 0 ? undefined : { opacity: 0.22 + c.level * 0.17 }}
        />
      ))}
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────────────────── */
export function TodayDashboard({
  focus: initialFocus,
  briefing,
  collapsedBriefing,
  briefingStale,
  boardCount,
  circles,
  stats,
  withinReach,
  competencies,
  onSeeBoard,
}: {
  focus: FocusItem[];
  briefing: string | null;
  collapsedBriefing: string | null;
  briefingStale: boolean;
  boardCount: number;
  circles: CircleSlice[];
  stats: HomeStats;
  withinReach: WithinReach[];
  competencies: CompetencyEntry[];
  onSeeBoard: () => void;
}) {
  const [focus, setFocus] = useState(initialFocus);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  async function markDone(id: number) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/board", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, boardStatus: "done" }),
      });
      await assertOk(res);
      setFocus((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update that item");
    } finally {
      setBusyId(null);
    }
  }

  const shown = expanded ? briefing : (collapsedBriefing ?? briefing);
  const weakest = [...competencies]
    .filter((c) => c.level < 2)
    .sort((a, b) => a.level - b.level)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span className="cb-label-mono text-cb-caption text-cb-muted">{todayLabel()}</span>
      </div>

      {error && (
        <div className="rounded-cb-card border border-cb-line bg-cb-danger-tint px-4 py-3 font-cb-sans text-cb-foot text-cb-danger">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-6">
        {/* Hero donut */}
        <Widget title="42 common core" className="lg:col-span-2">
          <CoreDonut
            circles={circles}
            coreDone={stats.coreDone}
            coreTotal={stats.coreTotal}
            level={stats.level}
          />
        </Widget>

        {/* Per-circle bars */}
        <Widget title="by circle" className="lg:col-span-2">
          <CircleBars circles={circles} />
        </Widget>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <StatTile
            value={`C${stats.currentCircle}`}
            label="current circle"
          />
          <StatTile
            value={`${stats.atL2}`}
            sub={`/${stats.competencyTotal}`}
            label="competencies ≥ L2"
          />
          <StatTile
            value={`${stats.resDone}`}
            sub={`/${stats.resTotal}`}
            label="resources done"
          />
          <StatTile
            value={stats.maldevPct != null ? `${Math.round(stats.maldevPct)}%` : "—"}
            label="maldev track"
          />
        </div>

        {/* Within reach */}
        <Widget title="within reach" className="lg:col-span-3">
          {withinReach.length === 0 ? (
            <p className="py-3 font-cb-sans text-cb-foot text-cb-muted">
              No goals close to the line right now — keep chipping at the board.
            </p>
          ) : (
            <div className="space-y-3">
              {withinReach.map((g) =>
                g.kind === "goal" ? (
                  <div key={g.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate font-cb-sans text-cb-foot font-medium text-cb-text">
                        {g.title}
                      </span>
                      <span className="shrink-0 font-cb-mono text-cb-foot tabular-nums text-cb-or">
                        {g.pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-cb-raised">
                      <div
                        className="h-full rounded-full bg-cb-or"
                        style={{ width: `${g.pct}%` }}
                      />
                    </div>
                    <p className="mt-1 font-cb-mono text-cb-caption text-cb-muted">
                      {g.current}/{g.target}
                    </p>
                  </div>
                ) : (
                  <div
                    key={g.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-cb-sans text-cb-foot font-medium text-cb-text">
                        {g.title}
                      </span>
                      <span className="font-cb-mono text-cb-caption text-cb-muted">
                        circle {g.circle} · {g.hours}h
                      </span>
                    </div>
                    <span className="cb-label-mono shrink-0 rounded-cb-chip-sm bg-cb-or-tint px-2 py-0.5 text-cb-caption text-cb-or">
                      ready
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </Widget>

        {/* Competency pulse */}
        <Widget
          title="competency pulse"
          className="lg:col-span-3"
        >
          <CompetencyPulse competencies={competencies} />
          {weakest.length > 0 && (
            <p className="mt-3 font-cb-sans text-cb-foot text-cb-second">
              <span className="text-cb-muted">focus next · </span>
              {weakest.map((c) => c.label).join(", ")}
            </p>
          )}
        </Widget>

        {/* Daily focus */}
        <Widget
          title="daily focus"
          className="lg:col-span-3"
          action={
            <button
              type="button"
              onClick={onSeeBoard}
              className="cb-label-mono text-cb-caption text-cb-or"
            >
              see board · {boardCount}
            </button>
          }
        >
          {focus.length === 0 ? (
            <div className="rounded-cb-card border border-dashed border-cb-line px-4 py-6 text-center font-cb-sans text-cb-foot text-cb-muted">
              Nothing in flight. Pull something from the board.
            </div>
          ) : (
            <div className="space-y-2">
              {focus.map((item) => (
                <article
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-cb-card border border-cb-line bg-cb-raised p-3 transition-colors hover:bg-cb-raised-hover"
                >
                  <button
                    type="button"
                    onClick={() => setDetailId(item.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="cb-label-mono inline-block rounded-cb-chip-sm bg-cb-card px-2 py-1 text-cb-caption text-cb-second">
                      {PLATFORM_LABELS[item.type] ?? item.type}
                    </span>
                    <h3 className="mt-1.5 font-cb-sans text-cb-foot font-bold leading-snug text-cb-text">
                      {item.title}
                    </h3>
                    <p className="mt-1 font-cb-mono text-cb-caption text-cb-muted">
                      {[
                        item.boardStatus === "in_progress" ? "in progress" : "todo",
                        item.estimatedHours ? `${item.estimatedHours}h` : null,
                        item.priority,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => void markDone(item.id)}
                    disabled={busyId === item.id}
                    className="flex h-9 shrink-0 items-center gap-1 rounded-cb-card bg-cb-card px-3 font-cb-sans text-cb-foot font-bold text-cb-text transition-colors hover:bg-cb-raised-hover disabled:opacity-50"
                  >
                    {busyId === item.id && <Loader2 className="h-3 w-3 animate-spin" />}
                    Done
                  </button>
                </article>
              ))}
            </div>
          )}
        </Widget>

        {/* Mentor briefing */}
        {shown && (
          <Widget
            title="mentor briefing"
            className="lg:col-span-6"
            action={
              briefingStale ? (
                <span className="cb-label-mono rounded-cb-chip-sm bg-cb-warn-tint px-2 py-0.5 text-cb-caption text-cb-warn">
                  stale
                </span>
              ) : undefined
            }
          >
            <p className="font-cb-sans text-cb-foot leading-[1.6] text-cb-second">
              {shown}
            </p>
            {briefing && collapsedBriefing && briefing !== collapsedBriefing && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-2 font-cb-mono text-cb-foot text-cb-or"
              >
                {expanded ? "collapse" : "read more"}
              </button>
            )}
          </Widget>
        )}
      </div>

      {detailId !== null && (
        <CardDetail itemId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
