"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn, assertOk } from "@/lib/utils";
import { CardDetail } from "@/components/dashboard/card-detail";
import { PLATFORM_LABELS } from "@/lib/platform-colors";

export type FocusItem = {
  id: number;
  title: string;
  type: string;
  priority: string;
  estimatedHours: number | null;
  boardStatus: string | null;
};

export type CircleSlice = {
  circle: number;
  done: number;
  total: number;
  state: "done" | "current" | "locked";
};

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
            <h2 className="cb-label-mono text-[10px] text-cb-muted">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── Hero: common-core donut, segmented by circle, 42 level in the centre ── */
function CoreDonut({
  circles,
  coreDone,
  coreTotal,
  level,
}: {
  circles: CircleSlice[];
  coreDone: number;
  coreTotal: number;
  level: number | null;
}) {
  const grand = coreTotal || 1;
  const gap = 1.4; // percent of circumference between segments
  // Cumulative arc offset for each circle, computed without mutating a closure
  // variable so it stays a pure render.
  const offsets = circles.reduce<number[]>((acc, c, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + (circles[i - 1].total / grand) * 100);
    return acc;
  }, []);
  const segs = circles.map((c, i) => {
    const segLen = (c.total / grand) * 100;
    const doneLen = Math.min(segLen - gap, (c.done / grand) * 100);
    return {
      circle: c.circle,
      offset: offsets[i],
      trackLen: Math.max(0, segLen - gap),
      doneLen: Math.max(0, doneLen),
      // The current circle's empty track is tinted gold so the ring still shows
      // "you are here" even at 0% done; other empty tracks stay neutral.
      trackColor:
        c.state === "current"
          ? "color-mix(in oklch, var(--cb-or) 34%, var(--cb-raised))"
          : "var(--cb-raised)",
      color:
        c.state === "done"
          ? "var(--cb-success)"
          : c.done > 0
            ? "var(--cb-or)"
            : "var(--cb-line)",
    };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[172px] w-[172px]">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          {/* tracks */}
          {segs.map((s) => (
            <circle
              key={`t${s.circle}`}
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={s.trackColor}
              strokeWidth="11"
              pathLength={100}
              strokeDasharray={`${s.trackLen} ${100 - s.trackLen}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
            />
          ))}
          {/* completed portions */}
          {segs.map((s) =>
            s.doneLen > 0 ? (
              <circle
                key={`d${s.circle}`}
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={s.color}
                strokeWidth="11"
                pathLength={100}
                strokeDasharray={`${s.doneLen} ${100 - s.doneLen}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="round"
              />
            ) : null,
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="cb-label-mono text-[9px] text-cb-muted">42 level</span>
          <span className="font-cb-serif text-[38px] leading-none text-cb-text">
            {level != null ? level.toFixed(2) : "—"}
          </span>
          <span className="mt-1 font-cb-mono text-[11px] tabular-nums text-cb-second">
            {coreDone}/{coreTotal} core
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Per-circle progression bars with status colour ────────────────────── */
function CircleBars({ circles }: { circles: CircleSlice[] }) {
  return (
    <div className="space-y-2.5">
      {circles.map((c) => {
        const pct = c.total > 0 ? (c.done / c.total) * 100 : 0;
        const barColor =
          c.state === "done"
            ? "bg-cb-success"
            : c.state === "current"
              ? "bg-cb-or"
              : "bg-cb-line";
        // Show the current circle as a small gold sliver even at 0% so the
        // active row reads at a glance; done circles fill fully.
        const barWidth =
          c.state === "current" ? Math.max(pct, 8) : c.done > 0 ? pct : 0;
        return (
          <div key={c.circle} className="flex items-center gap-3">
            <span className="w-6 shrink-0 font-cb-mono text-[11px] text-cb-muted">
              C{c.circle}
            </span>
            <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-cb-raised">
              <div
                className={cn("h-full rounded-full", barColor)}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right font-cb-mono text-[11px] tabular-nums text-cb-second">
              {c.done}/{c.total}
            </span>
          </div>
        );
      })}
    </div>
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
        <span className="font-cb-serif text-[24px] leading-none text-cb-text">
          {value}
        </span>
        {sub && (
          <span className="font-cb-mono text-[11px] tabular-nums text-cb-muted">
            {sub}
          </span>
        )}
      </div>
      <p className="mt-1.5 cb-label-mono text-[9px] text-cb-muted">{label}</p>
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
        <span className="cb-label-mono text-[10px] text-cb-muted">{todayLabel()}</span>
      </div>

      {error && (
        <div className="rounded-cb-card border border-cb-line bg-cb-danger-tint px-4 py-3 font-cb-sans text-[14px] text-cb-danger">
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
            <p className="py-3 font-cb-sans text-[13px] text-cb-muted">
              No goals close to the line right now — keep chipping at the board.
            </p>
          ) : (
            <div className="space-y-3">
              {withinReach.map((g) =>
                g.kind === "goal" ? (
                  <div key={g.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate font-cb-sans text-[13px] font-medium text-cb-text">
                        {g.title}
                      </span>
                      <span className="shrink-0 font-cb-mono text-[11px] tabular-nums text-cb-or">
                        {g.pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-cb-raised">
                      <div
                        className="h-full rounded-full bg-cb-or"
                        style={{ width: `${g.pct}%` }}
                      />
                    </div>
                    <p className="mt-1 font-cb-mono text-[10px] text-cb-muted">
                      {g.current}/{g.target}
                    </p>
                  </div>
                ) : (
                  <div
                    key={g.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-cb-sans text-[13px] font-medium text-cb-text">
                        {g.title}
                      </span>
                      <span className="font-cb-mono text-[10px] text-cb-muted">
                        circle {g.circle} · {g.hours}h
                      </span>
                    </div>
                    <span className="cb-label-mono shrink-0 rounded-cb-chip-sm bg-cb-or-tint px-2 py-0.5 text-[9px] text-cb-or">
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
            <p className="mt-3 font-cb-sans text-[12px] text-cb-second">
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
              className="cb-label-mono text-[10px] text-cb-or"
            >
              see board · {boardCount}
            </button>
          }
        >
          {focus.length === 0 ? (
            <div className="rounded-cb-card border border-dashed border-cb-line px-4 py-6 text-center font-cb-sans text-[13px] text-cb-muted">
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
                    <span className="cb-label-mono inline-block rounded-cb-chip-sm bg-cb-card px-2 py-1 text-[10px] text-cb-second">
                      {PLATFORM_LABELS[item.type] ?? item.type}
                    </span>
                    <h3 className="mt-1.5 font-cb-sans text-[14px] font-bold leading-snug text-cb-text">
                      {item.title}
                    </h3>
                    <p className="mt-1 font-cb-mono text-[10px] text-cb-muted">
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
                    className="flex h-9 shrink-0 items-center gap-1 rounded-[12px] bg-cb-card px-3 font-cb-sans text-[13px] font-bold text-cb-text transition-colors hover:bg-cb-raised-hover disabled:opacity-50"
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
                <span className="cb-label-mono rounded-cb-chip-sm bg-cb-warn-tint px-2 py-0.5 text-[10px] text-cb-warn">
                  stale
                </span>
              ) : undefined
            }
          >
            <p className="font-cb-sans text-[14px] leading-[1.6] text-cb-second">
              {shown}
            </p>
            {briefing && collapsedBriefing && briefing !== collapsedBriefing && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-2 font-cb-mono text-[11px] text-cb-or"
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
