"use client";

import { useRef, useState, useCallback } from "react";
import { Check, ArrowRight, Circle, Pause, AlertTriangle, CornerDownRight, Clock } from "lucide-react";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";
import type { PlanItemData, SideProject } from "./types";

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function getStatusIcon(status: string, sourceWeek?: string | null) {
  if (sourceWeek) return { Icon: CornerDownRight, color: "oklch(0.78 0.14 60)" };
  switch (status) {
    case "done": return { Icon: Check, color: "oklch(0.72 0.14 152)" };
    case "active": return { Icon: ArrowRight, color: "oklch(0.82 0.055 80)" };
    case "blocked": return { Icon: Pause, color: "oklch(0.78 0.14 60)" };
    case "stuck": return { Icon: AlertTriangle, color: "oklch(0.70 0.18 25)" };
    default: return { Icon: Circle, color: "var(--muted-foreground)" };
  }
}

function PlatformBadge({ type }: { type: string }) {
  const color = PLATFORM_COLORS[type] ?? "var(--muted-foreground)";
  const label = PLATFORM_LABELS[type] ?? type.toUpperCase().slice(0, 3);
  return (
    <span
      className="text-[9px] font-bold uppercase px-1 py-[1px] rounded-sm"
      style={{ color, background: `color-mix(in oklch, ${color} 15%, transparent)` }}
    >
      {label}
    </span>
  );
}

function formatHours(h: number | null): string {
  const v = h ?? 2;
  return v < 1 ? `${(v * 60).toFixed(0)}m` : `${v.toFixed(0)}h`;
}

// ── Today View ─────────────────────────────────────────────────────────────

export function TodayView({
  items,
  weekStart,
  todayIdx,
  sideProject,
  pinnedTasks,
  onStatusChange,
  onAddPinned,
  onCompletePinned,
}: {
  items: PlanItemData[];
  weekStart: string;
  todayIdx: number;
  sideProject?: SideProject | null;
  pinnedTasks: { id: number; title: string }[];
  onStatusChange: (id: number, status: string) => void;
  onAddPinned: (title: string) => void;
  onCompletePinned: (id: number) => void;
}) {
  const todayItems = items.filter((i) => i.dayIndex === todayIdx && i.status !== "deferred");
  const tomorrowIdx = todayIdx < 6 ? todayIdx + 1 : null;
  const tomorrowItems = tomorrowIdx !== null
    ? items.filter((i) => i.dayIndex === tomorrowIdx && i.status !== "deferred")
    : [];

  const start = new Date(weekStart + "T00:00:00");
  const todayDate = new Date(start);
  todayDate.setDate(start.getDate() + todayIdx);
  const dayStr = todayDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="space-y-4">
      <p className="text-[12px] font-bold" style={{ color: "oklch(0.82 0.055 80)" }}>
        {dayStr}
      </p>

      {todayItems.length === 0 && (
        <p className="text-[13px] text-muted-foreground py-6 text-center">Nothing scheduled for today.</p>
      )}

      {todayItems.map((item) => (
        <MobileTodayCard key={item.id} item={item} onStatusChange={onStatusChange} />
      ))}

      {/* Tomorrow preview */}
      {tomorrowItems.length > 0 && (
        <div style={{ opacity: 0.6 }} className="mt-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-2">
            Tomorrow · {DAY_NAMES[tomorrowIdx!]} {(() => {
              const d = new Date(start);
              d.setDate(start.getDate() + tomorrowIdx!);
              return d.getDate();
            })()}
          </p>
          {tomorrowItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-2.5 px-3 rounded-sm border border-border mb-1">
              <PlatformBadge type={item.type} />
              <span className="text-[13px] flex-1 min-w-0 truncate">{item.title}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">{formatHours(item.estimatedHours)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Side project teaser */}
      {sideProject && (
        <div
          className="mt-4 px-3 py-2.5 rounded-sm"
          style={{ borderLeft: "3px solid var(--primary)", background: "oklch(0.19 0.006 75 / 0.4)" }}
        >
          <p className="text-[11px] font-semibold">Weekend: {sideProject.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {sideProject.steps?.length ?? 0} steps · ~{sideProject.steps?.reduce((s, st) => s + st.estimatedHours, 0) ?? 0}h · Sat + Sun
          </p>
        </div>
      )}

      {/* Pinned tasks */}
      {pinnedTasks.length > 0 && (
        <div className="mt-3 space-y-1">
          {pinnedTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 px-3 py-2 rounded-sm border border-border">
              <button onClick={() => onCompletePinned(task.id)} className="shrink-0">
                <div className="w-3 h-3 border border-muted-foreground rounded-sm" />
              </button>
              <span className="text-[12px] flex-1">{task.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileTodayCard({
  item,
  onStatusChange,
}: {
  item: PlanItemData;
  onStatusChange: (id: number, status: string) => void;
}) {
  const { Icon, color } = getStatusIcon(item.status, item.sourceWeek);
  const platformColor = PLATFORM_COLORS[item.type] ?? "var(--muted-foreground)";
  const isActive = item.status === "active";
  const isDone = item.status === "done";

  return (
    <div
      className="px-[14px] py-[14px] rounded-sm"
      style={{
        border: `1px solid ${isActive ? "oklch(0.82 0.055 80 / 0.3)" : isDone ? "oklch(0.72 0.14 152 / 0.2)" : "oklch(0.25 0.007 70)"}`,
        background: isActive ? "oklch(0.82 0.055 80 / 0.06)" : isDone ? "oklch(0.72 0.14 152 / 0.04)" : "oklch(0.19 0.006 75 / 0.4)",
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-3 w-3" style={{ color }} />
        <PlatformBadge type={item.type} />
        <span className="text-[14px] font-semibold flex-1 min-w-0 truncate" style={{ textDecoration: isDone ? "line-through" : undefined }}>
          {item.title}
        </span>
      </div>

      {item.description && (
        <p className="text-[12px] text-muted-foreground mb-2">{item.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatHours(item.estimatedHours)}
        </span>
        {!isDone && (
          <div className="flex gap-[6px]">
            <button
              onClick={() => onStatusChange(item.id, "done")}
              className="text-[11px] px-2.5 py-1 rounded-sm font-medium"
              style={{ background: "oklch(0.72 0.14 152)", color: "oklch(0.135 0.004 75)" }}
            >
              Done ✓
            </button>
            <button
              onClick={() => onStatusChange(item.id, "stuck")}
              className="text-[11px] px-2.5 py-1 rounded-sm border text-muted-foreground"
              style={{ borderColor: "oklch(0.25 0.007 70)" }}
            >
              Stuck
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Full Week View ─────────────────────────────────────────────────────────

export function FullWeekView({
  items,
  weekStart,
  todayIdx,
  totalHours,
  budgetTotal,
  onWeekSwipe,
}: {
  items: PlanItemData[];
  weekStart: string;
  todayIdx: number;
  totalHours: number;
  budgetTotal: number;
  onWeekSwipe: (delta: number) => void;
}) {
  const touchStartX = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 80) onWeekSwipe(dx > 0 ? -1 : 1);
  }, [onWeekSwipe]);

  const start = new Date(weekStart + "T00:00:00");
  const visibleItems = items.filter((i) => i.status !== "deferred");
  const doneHours = visibleItems.filter((i) => i.status === "done").reduce((s, i) => s + (i.estimatedHours ?? 2), 0);
  const pct = budgetTotal > 0 ? (doneHours / budgetTotal) * 100 : 0;

  // Group items by day, combine Sat+Sun
  const dayGroups: { label: string; dayIdxes: number[]; }[] = [
    { label: "MON", dayIdxes: [0] },
    { label: "TUE", dayIdxes: [1] },
    { label: "WED", dayIdxes: [2] },
    { label: "THU", dayIdxes: [3] },
    { label: "FRI", dayIdxes: [4] },
    { label: "SAT-SUN", dayIdxes: [5, 6] },
  ];

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Budget bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-sm mb-3"
        style={{ background: "oklch(0.16 0.005 75)" }}
      >
        <span className="text-[11px] font-semibold tabular-nums">{doneHours.toFixed(0)}h / {budgetTotal}h</span>
        <div
          className="flex-1 h-1 rounded-[1px] overflow-hidden"
          style={{ background: "oklch(0.21 0.006 75)" }}
        >
          <div className="h-full" style={{ width: `${Math.min(100, pct)}%`, background: "oklch(0.72 0.14 152)" }} />
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">{pct.toFixed(0)}%</span>
      </div>

      {/* Day list */}
      <div className="flex flex-col gap-[2px]">
        {dayGroups.map((group) => {
          const groupItems = visibleItems.filter((i) => i.dayIndex !== null && group.dayIdxes.includes(i.dayIndex));
          const hours = groupItems.reduce((s, i) => s + (i.estimatedHours ?? 2), 0);
          const firstDay = group.dayIdxes[0];
          const isPast = group.dayIdxes.every((d) => d < todayIdx);
          const isToday = group.dayIdxes.includes(todayIdx);
          const allDone = groupItems.length > 0 && groupItems.every((i) => i.status === "done");

          const dateNum = (() => {
            const d = new Date(start);
            d.setDate(start.getDate() + firstDay);
            return d.getDate();
          })();

          const labelColor = allDone || isPast
            ? "oklch(0.72 0.14 152)"
            : isToday
              ? "oklch(0.82 0.055 80)"
              : "var(--muted-foreground)";

          return (
            <div
              key={group.label}
              className="px-3 py-2.5 rounded-sm"
              style={{
                background: isToday ? "oklch(0.82 0.055 80 / 0.04)" : allDone ? "oklch(0.72 0.14 152 / 0.03)" : undefined,
                border: isToday ? "1px solid oklch(0.82 0.055 80 / 0.15)" : undefined,
              }}
            >
              <p className="text-[11px] font-bold mb-1.5" style={{ color: labelColor }}>
                {group.label} {dateNum}
                {isToday && " · TODAY"}
                {groupItems.length > 0 && ` · ${hours.toFixed(0)}h`}
                {allDone && " ✓"}
              </p>
              <div className="flex flex-col gap-[3px]">
                {groupItems.map((item) => {
                  const { Icon, color } = getStatusIcon(item.status, item.sourceWeek);
                  return (
                    <div key={item.id} className="flex items-center gap-[6px] text-[12px]">
                      <Icon className="h-3 w-3 shrink-0" style={{ color }} />
                      <PlatformBadge type={item.type} />
                      <span className="flex-1 min-w-0 truncate" style={{
                        fontWeight: isToday && item.status === "active" ? 500 : 400,
                        color: item.status === "blocked" ? "oklch(0.78 0.14 60)" : undefined,
                      }}>
                        {item.title}
                      </span>
                      <span className="text-muted-foreground tabular-nums shrink-0">{formatHours(item.estimatedHours)}</span>
                    </div>
                  );
                })}
                {groupItems.length === 0 && (
                  <span className="text-[11px] text-muted-foreground" style={{ opacity: 0.5 }}>— rest</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Backlog View ───────────────────────────────────────────────────────────

export function BacklogView({
  items,
  weekStart,
  onSchedule,
  onStatusChange,
  onDrop,
}: {
  items: PlanItemData[];
  weekStart: string;
  onSchedule: (id: number, dayIndex: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onDrop: (id: number) => void;
}) {
  const backlogItems = items.filter((i) => i.dayIndex === null && i.status !== "deferred");
  const stuckItems = items.filter((i) => i.status === "stuck");
  const rolledOver = backlogItems.filter((i) => i.sourceWeek);
  const unscheduled = backlogItems.filter((i) => !i.sourceWeek && i.status !== "stuck");

  const groups: { label: string; items: PlanItemData[]; }[] = [];
  if (rolledOver.length) groups.push({ label: `ROLLED OVER`, items: rolledOver });
  if (stuckItems.length) groups.push({ label: "STUCK", items: stuckItems });
  if (unscheduled.length) groups.push({ label: "UNSCHEDULED", items: unscheduled });

  if (groups.length === 0) {
    return <p className="text-[13px] text-muted-foreground py-8 text-center">Backlog is empty.</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {group.label}
          </p>
          <div className="space-y-2">
            {group.items.map((item) => (
              <BacklogCard
                key={item.id}
                item={item}
                weekStart={weekStart}
                onSchedule={onSchedule}
                onStatusChange={onStatusChange}
                onDrop={onDrop}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BacklogCard({
  item,
  weekStart,
  onSchedule,
  onStatusChange,
  onDrop,
}: {
  item: PlanItemData;
  weekStart: string;
  onSchedule: (id: number, dayIndex: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onDrop: (id: number) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const { Icon, color } = getStatusIcon(item.status, item.sourceWeek);
  const start = new Date(weekStart + "T00:00:00");

  return (
    <div className="px-3 py-3 rounded-sm border border-border">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-3 w-3 shrink-0" style={{ color }} />
        <PlatformBadge type={item.type} />
        <span className="text-[13px] font-medium flex-1 min-w-0 truncate">{item.title}</span>
      </div>

      {item.why && (
        <p className="text-[11px] text-muted-foreground mb-2 pl-5">{item.why}</p>
      )}

      <div className="flex gap-[6px] pl-5">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-[11px] px-2.5 py-1 rounded-sm font-medium"
          style={{ background: "var(--primary)", color: "oklch(0.135 0.004 75)" }}
        >
          Schedule →
        </button>
        {item.status === "stuck" && (
          <button
            onClick={() => onStatusChange(item.id, "pending")}
            className="text-[11px] px-2.5 py-1 rounded-sm border text-muted-foreground"
            style={{ borderColor: "oklch(0.25 0.007 70)" }}
          >
            Retry
          </button>
        )}
        <button
          onClick={() => onDrop(item.id)}
          className="text-[11px] px-2.5 py-1 rounded-sm border text-muted-foreground"
          style={{ borderColor: "oklch(0.25 0.007 70)" }}
        >
          Drop
        </button>
      </div>

      {showPicker && (
        <div className="flex gap-1 mt-2 pl-5 flex-wrap">
          {DAY_NAMES.map((name, idx) => {
            const d = new Date(start);
            d.setDate(start.getDate() + idx);
            return (
              <button
                key={idx}
                onClick={() => { onSchedule(item.id, idx); setShowPicker(false); }}
                className="text-[10px] px-2 py-1 rounded-sm border border-border hover:bg-white/5 transition-colors"
              >
                {name} {d.getDate()}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── View Toggle ────────────────────────────────────────────────────────────

export function ViewToggle({
  active,
  backlogCount,
  onChange,
}: {
  active: "today" | "week" | "backlog";
  backlogCount: number;
  onChange: (view: "today" | "week" | "backlog") => void;
}) {
  const tabs = [
    { key: "today" as const, label: "Today" },
    { key: "week" as const, label: "Full week" },
    { key: "backlog" as const, label: `Backlog${backlogCount > 0 ? ` (${backlogCount})` : ""}` },
  ];

  return (
    <div className="flex border border-border rounded-sm overflow-hidden">
      {tabs.map((tab, i) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="flex-1 py-1.5 text-[11px] font-medium transition-colors"
          style={{
            background: active === tab.key ? "oklch(0.82 0.055 80 / 0.1)" : "transparent",
            color: active === tab.key ? "oklch(0.82 0.055 80)" : "oklch(0.55 0.01 80)",
            fontWeight: active === tab.key ? 600 : 500,
            borderLeft: i > 0 ? "1px solid oklch(0.25 0.007 70)" : undefined,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
