"use client";

import { useState, useCallback, useId } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  Check,
  ArrowRight,
  Pause,
  AlertTriangle,
  Circle,
  GripVertical,
  MoreHorizontal,
  CalendarClock,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";

type PlanItemData = {
  id: number;
  title: string;
  type: string;
  why: string | null;
  estimatedHours: number | null;
  priority: string;
  dayIndex: number | null;
  status: string;
  ref: string | null;
  link: string | null;
  sortOrder: number | null;
  deferredTo: string | null;
  completedAt: string | null;
};

type WeekPlanData = {
  id: number;
  weekStart: string;
  status: string;
  items: PlanItemData[];
};

type GoalSlim = {
  id: number;
  title: string;
  category: string | null;
  currentValue: number | null;
  targetValue: number | null;
  pacing: {
    onTrack: boolean;
    percentComplete: number;
    requiredPace: string;
    currentPace: string;
  } | null;
};

export type WeekClientProps = {
  plan: WeekPlanData;
  goals: GoalSlim[];
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_CYCLE = ["pending", "active", "done"] as const;
const STATUS_META: Record<string, { icon: typeof Check; color: string; label: string }> = {
  pending: { icon: Circle, color: "var(--muted-foreground)", label: "pending" },
  active: { icon: ArrowRight, color: "var(--primary)", label: "active" },
  done: { icon: Check, color: "var(--status-success)", label: "done" },
  blocked: { icon: Pause, color: "var(--status-warning)", label: "blocked" },
  stuck: { icon: AlertTriangle, color: "var(--status-danger)", label: "stuck" },
  deferred: { icon: CalendarClock, color: "var(--muted-foreground)", label: "deferred" },
};

function getWeekDates(weekStart: string) {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const jan1 = new Date(start.getFullYear(), 0, 1);
  const days = Math.floor((start.getTime() - jan1.getTime()) / 86400000);
  const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);

  return { start, end, weekNum };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getTodayIdx(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

async function patchItem(id: number, updates: Record<string, unknown>) {
  await fetch("/api/week", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  });
}

// ── Droppable day column ──────────────────────────────────────────────────

function DayColumn({
  dayIdx,
  dayDate,
  isToday,
  items,
  onStatusToggle,
  onMenuAction,
}: {
  dayIdx: number;
  dayDate: Date;
  isToday: boolean;
  items: PlanItemData[];
  onStatusToggle: (id: number) => void;
  onMenuAction: (id: number, action: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dayIdx}` });
  const dayHours = items.reduce((s, i) => s + (i.estimatedHours ?? 2), 0);

  return (
    <div ref={setNodeRef} className="min-h-[48px]">
      <div
        className="flex items-start gap-4 py-3 px-2 -mx-2 rounded-sm transition-colors"
        style={{
          background: isOver
            ? "oklch(0.82 0.055 80 / 0.06)"
            : isToday
              ? "oklch(0.82 0.055 80 / 0.03)"
              : undefined,
        }}
      >
        <div className="w-[60px] shrink-0 pt-2">
          <p className={`text-[13px] font-semibold ${isToday ? "text-primary" : ""}`}>
            {DAY_NAMES[dayIdx]}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {isToday && <span className="text-primary ml-1">Today</span>}
          </p>
          {items.length > 0 && (
            <p
              className="text-[10px] mt-1 tabular-nums"
              style={{ color: dayHours > 7 ? "var(--status-warning)" : "var(--muted-foreground)" }}
            >
              {dayHours.toFixed(0)}h
            </p>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          {items.length === 0 ? (
            <div className="py-2 text-[12px] text-muted-foreground" style={{ opacity: 0.5 }}>
              — rest day
            </div>
          ) : (
            <SortableContext
              items={items.map((i) => `item-${i.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onStatusToggle={onStatusToggle}
                  onMenuAction={onMenuAction}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </div>
      {dayIdx < 6 && <div className="border-b border-border ml-[76px]" />}
    </div>
  );
}

// ── Unscheduled zone ──────────────────────────────────────────────────────

function UnscheduledZone({
  items,
  onStatusToggle,
  onMenuAction,
}: {
  items: PlanItemData[];
  onStatusToggle: (id: number) => void;
  onMenuAction: (id: number, action: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "unscheduled" });

  if (items.length === 0) return null;

  return (
    <div
      ref={setNodeRef}
      className="rounded-sm border border-dashed px-4 py-3 transition-colors"
      style={{
        borderColor: isOver ? "var(--primary)" : "var(--border)",
        background: isOver ? "oklch(0.82 0.055 80 / 0.04)" : undefined,
      }}
    >
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Unscheduled
      </p>
      <SortableContext
        items={items.map((i) => `item-${i.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1.5">
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onStatusToggle={onStatusToggle}
              onMenuAction={onMenuAction}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Draggable item ────────────────────────────────────────────────────────

function SortableItem({
  item,
  onStatusToggle,
  onMenuAction,
}: {
  item: PlanItemData;
  onStatusToggle: (id: number) => void;
  onMenuAction: (id: number, action: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `item-${item.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ItemRow
        item={item}
        dragProps={{ ...attributes, ...listeners }}
        onStatusToggle={onStatusToggle}
        onMenuAction={onMenuAction}
      />
    </div>
  );
}

function ItemRow({
  item,
  dragProps,
  onStatusToggle,
  onMenuAction,
}: {
  item: PlanItemData;
  dragProps?: Record<string, unknown>;
  onStatusToggle: (id: number) => void;
  onMenuAction: (id: number, action: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = STATUS_META[item.status] ?? STATUS_META.pending;
  const StatusIcon = meta.icon;
  const platformColor = PLATFORM_COLORS[item.type] ?? "var(--muted-foreground)";
  const platformLabel = PLATFORM_LABELS[item.type] ?? item.type.toUpperCase().slice(0, 3);

  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-sm group relative"
      style={{ background: "oklch(0.17 0.005 75)" }}
    >
      <span className="cursor-grab text-muted-foreground hover:text-foreground" {...dragProps}>
        <GripVertical className="h-3.5 w-3.5" />
      </span>

      <button
        onClick={() => onStatusToggle(item.id)}
        className="shrink-0 transition-colors"
        title={`Status: ${meta.label} (click to cycle)`}
      >
        <StatusIcon className="h-3.5 w-3.5" style={{ color: meta.color }} />
      </button>

      <span
        className="text-[11px] font-bold px-1.5 py-0.5 rounded-sm shrink-0"
        style={{
          color: platformColor,
          background: `color-mix(in oklch, ${platformColor} 12%, transparent)`,
        }}
      >
        {platformLabel}
      </span>

      {item.link ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-medium flex-1 min-w-0 truncate text-primary hover:underline flex items-center gap-1"
        >
          {item.title}
          <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
        </a>
      ) : (
        <span
          className="text-[13px] font-medium flex-1 min-w-0 truncate"
          style={{ textDecoration: item.status === "done" ? "line-through" : undefined, opacity: item.status === "done" ? 0.6 : 1 }}
        >
          {item.title}
        </span>
      )}

      <span className="text-[12px] text-muted-foreground tabular-nums shrink-0 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {(item.estimatedHours ?? 2).toFixed(0)}h
      </span>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div
              className="absolute right-0 top-6 z-50 rounded-sm border border-border py-1 min-w-[140px]"
              style={{ background: "oklch(0.15 0.005 75)" }}
            >
              {["blocked", "stuck", "deferred"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onMenuAction(item.id, s);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-white/5 flex items-center gap-2"
                >
                  {(() => {
                    const m = STATUS_META[s];
                    const I = m.icon;
                    return <I className="h-3 w-3" style={{ color: m.color }} />;
                  })()}
                  Mark {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function WeekClient({ plan, goals }: WeekClientProps) {
  const dndId = useId();
  const [items, setItems] = useState<PlanItemData[]>(plan.items);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rerolling, setRerolling] = useState(false);

  const { start, end, weekNum } = getWeekDates(plan.weekStart);
  const todayIdx = getTodayIdx();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const visibleItems = items.filter((i) => i.status !== "deferred");

  const unscheduled = visibleItems.filter((i) => i.dayIndex === null);
  const dayItems: Record<number, PlanItemData[]> = {};
  for (let d = 0; d < 7; d++) dayItems[d] = [];
  for (const item of visibleItems) {
    if (item.dayIndex !== null && item.dayIndex >= 0 && item.dayIndex <= 6) {
      dayItems[item.dayIndex].push(item);
    }
  }
  for (const arr of Object.values(dayItems)) {
    arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  // Stats
  const statusCounts: Record<string, number> = {};
  let totalHours = 0;
  let doneHours = 0;
  const platformHours: Record<string, number> = {};
  for (const item of visibleItems) {
    const h = item.estimatedHours ?? 2;
    statusCounts[item.status] = (statusCounts[item.status] ?? 0) + 1;
    totalHours += h;
    if (item.status === "done") doneHours += h;
    platformHours[item.type] = (platformHours[item.type] ?? 0) + h;
  }

  const cycleStatus = useCallback(
    (id: number) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const idx = STATUS_CYCLE.indexOf(item.status as (typeof STATUS_CYCLE)[number]);
          const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
          patchItem(id, { status: next });
          return {
            ...item,
            status: next,
            completedAt: next === "done" ? new Date().toISOString() : null,
          };
        })
      );
    },
    []
  );

  const handleMenuAction = useCallback((id: number, action: string) => {
    if (action === "deferred") {
      const oneWeek = new Date();
      oneWeek.setDate(oneWeek.getDate() + 7);
      const deferredTo = oneWeek.toISOString().slice(0, 10);
      patchItem(id, { status: "deferred", deferredTo });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "deferred", deferredTo } : item
        )
      );
    } else {
      patchItem(id, { status: action });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: action } : item
        )
      );
    }
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const itemId = parseInt((active.id as string).replace("item-", ""));
    const overId = over.id as string;

    let newDayIndex: number | null = null;
    if (overId === "unscheduled") {
      newDayIndex = null;
    } else if (overId.startsWith("day-")) {
      newDayIndex = parseInt(overId.replace("day-", ""));
    } else if (overId.startsWith("item-")) {
      const overItemId = parseInt(overId.replace("item-", ""));
      const overItem = items.find((i) => i.id === overItemId);
      newDayIndex = overItem?.dayIndex ?? null;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, dayIndex: newDayIndex } : item
      )
    );
    patchItem(itemId, { dayIndex: newDayIndex });
  }

  async function handleReroll() {
    setRerolling(true);
    const res = await fetch("/api/week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reroll" }),
    });
    const data = await res.json();
    setItems(data.items);
    setRerolling(false);
  }

  if (items.length === 0) {
    return (
      <div className="space-y-5 max-w-[896px]">
        <div>
          <h1 className="page-title">This Week</h1>
          <p className="page-subtitle mt-1">
            {formatDate(start)} – {formatDate(end)} · Week {weekNum}
          </p>
        </div>
        <div className="rounded-sm border border-dashed border-border px-6 py-16 text-center">
          <p className="text-[14px] text-muted-foreground mb-1">
            Nothing planned this week.
          </p>
          <p className="text-[12px] text-muted-foreground">
            Sync your platforms in{" "}
            <a href="/settings" className="text-primary hover:underline">Settings</a>{" "}
            to get weekly recommendations, or generate a plan on the{" "}
            <a href="/" className="text-primary hover:underline">Mentor page</a>.
          </p>
        </div>
      </div>
    );
  }

  const activeItem = activeId ? items.find((i) => `item-${i.id}` === activeId) : null;

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-5 max-w-[896px]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">This Week</h1>
            <p className="page-subtitle mt-1">
              {formatDate(start)} – {formatDate(end)} · Week {weekNum}
            </p>
          </div>
          <button
            onClick={handleReroll}
            disabled={rerolling}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors mt-2 disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${rerolling ? "animate-spin" : ""}`} />
            {rerolling ? "Rerolling…" : "Reroll plan"}
          </button>
        </div>

        {/* Status filter chips */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(statusCounts).map(([s, count]) => {
            if (count === 0) return null;
            const meta = STATUS_META[s] ?? STATUS_META.pending;
            const Icon = meta.icon;
            return (
              <span
                key={s}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[12px] font-medium"
                style={{
                  background: "oklch(0.17 0.005 75)",
                  color: meta.color,
                }}
              >
                <Icon className="h-3 w-3" />
                {count} {meta.label}
              </span>
            );
          })}
        </div>

        {/* Week budget bar */}
        <Card>
          <CardContent className="pt-4 pb-4 px-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold">
                Week budget: ~{totalHours.toFixed(0)}h planned
              </span>
              <span className="text-[12px] text-muted-foreground">
                {doneHours.toFixed(0)}h done · {(totalHours - doneHours).toFixed(0)}h remaining
              </span>
            </div>
            <div className="flex rounded-sm overflow-hidden h-2.5 mb-2" style={{ background: "oklch(0.22 0.005 75)" }}>
              {Object.entries(platformHours).map(([platform, hours]) => (
                <div
                  key={platform}
                  style={{
                    width: totalHours > 0 ? `${(hours / totalHours) * 100}%` : "0%",
                    backgroundColor: PLATFORM_COLORS[platform] ?? "var(--muted-foreground)",
                    opacity: 0.8,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {Object.entries(platformHours).map(([platform, hours]) => (
                <span key={platform} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-[1px]"
                    style={{ backgroundColor: PLATFORM_COLORS[platform] ?? "var(--muted-foreground)" }}
                  />
                  {PLATFORM_LABELS[platform] ?? platform} · {hours.toFixed(0)}h
                </span>
              ))}
              {goals.length > 0 && (
                <span className="text-[11px] text-muted-foreground ml-auto">
                  Goal coverage:{" "}
                  {goals.map((g, i) => {
                    const onTrack = g.pacing?.onTrack ?? true;
                    return (
                      <span key={g.id}>
                        {i > 0 && " · "}
                        <span style={{ color: onTrack ? "var(--status-success)" : "var(--status-warning)" }}>
                          {g.title.length > 20 ? g.title.slice(0, 18) + "…" : g.title}{" "}
                          {onTrack ? "✓" : "⚠"}
                        </span>
                      </span>
                    );
                  })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Unscheduled zone */}
        <UnscheduledZone
          items={unscheduled}
          onStatusToggle={cycleStatus}
          onMenuAction={handleMenuAction}
        />

        {/* Daily breakdown */}
        <div className="space-y-1">
          {DAY_NAMES.map((_, dayIdx) => {
            const dayDate = new Date(start);
            dayDate.setDate(start.getDate() + dayIdx);
            return (
              <DayColumn
                key={dayIdx}
                dayIdx={dayIdx}
                dayDate={dayDate}
                isToday={dayIdx === todayIdx}
                items={dayItems[dayIdx]}
                onStatusToggle={cycleStatus}
                onMenuAction={handleMenuAction}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeItem && (
          <div style={{ width: "600px" }}>
            <ItemRow
              item={activeItem}
              onStatusToggle={() => {}}
              onMenuAction={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
