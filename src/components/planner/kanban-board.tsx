"use client";

import { useState, useId } from "react";
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
import {
  Check,
  ArrowRight,
  Pause,
  AlertTriangle,
  Circle,
  CornerDownRight,
  Clock,
} from "lucide-react";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { PlanItemData } from "./types";

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type StatusMeta = { icon: typeof Check; color: string; borderColor: string; bg: string };

const STATUS_STYLES: Record<string, StatusMeta> = {
  done: {
    icon: Check,
    color: "var(--status-done)",
    borderColor: "color-mix(in oklch, var(--status-done) 20%, transparent)",
    bg: "color-mix(in oklch, var(--status-done) 4%, transparent)",
  },
  active: {
    icon: ArrowRight,
    color: "var(--primary)",
    borderColor: "color-mix(in oklch, var(--primary) 30%, transparent)",
    bg: "color-mix(in oklch, var(--primary) 6%, transparent)",
  },
  pending: {
    icon: Circle,
    color: "var(--muted-foreground)",
    borderColor: "var(--border)",
    bg: "color-mix(in oklch, var(--muted) 40%, transparent)",
  },
  blocked: {
    icon: Pause,
    color: "var(--status-blocked)",
    borderColor: "color-mix(in oklch, var(--status-blocked) 30%, transparent)",
    bg: "color-mix(in oklch, var(--status-blocked) 3%, transparent)",
  },
  stuck: {
    icon: AlertTriangle,
    color: "var(--status-stuck)",
    borderColor: "color-mix(in oklch, var(--status-stuck) 30%, transparent)",
    bg: "color-mix(in oklch, var(--status-stuck) 3%, transparent)",
  },
};

function getStatusStyle(status: string, sourceWeek?: string | null): StatusMeta & { dashed?: boolean } {
  if (sourceWeek) {
    return {
      icon: CornerDownRight,
      color: "var(--status-blocked)",
      borderColor: "color-mix(in oklch, var(--status-blocked) 30%, transparent)",
      bg: "color-mix(in oklch, var(--status-blocked) 3%, transparent)",
      dashed: true,
    };
  }
  return STATUS_STYLES[status] ?? STATUS_STYLES.pending;
}

export function KanbanBoard({
  items,
  weekStart,
  todayIdx,
  readOnly,
  onItemsChange,
  onStatusToggle,
  onMenuAction,
}: {
  items: PlanItemData[];
  weekStart: string;
  todayIdx: number;
  readOnly?: boolean;
  onItemsChange: (items: PlanItemData[]) => void;
  onStatusToggle: (id: number) => void;
  onMenuAction: (id: number, action: string) => void;
}) {
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const visibleItems = items.filter((i) => i.status !== "deferred");
  const backlog = visibleItems.filter((i) => i.dayIndex === null);
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

  const start = new Date(weekStart + "T00:00:00");

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
    if (overId === "backlog") {
      newDayIndex = null;
    } else if (overId.startsWith("day-")) {
      newDayIndex = parseInt(overId.replace("day-", ""));
    } else if (overId.startsWith("item-")) {
      const overItemId = parseInt(overId.replace("item-", ""));
      const overItem = items.find((i) => i.id === overItemId);
      newDayIndex = overItem?.dayIndex ?? null;
    }

    const updated = items.map((item) =>
      item.id === itemId ? { ...item, dayIndex: newDayIndex } : item
    );
    onItemsChange(updated);
    fetch("/api/week", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, dayIndex: newDayIndex }),
    });
  }

  const activeItem = activeId ? items.find((i) => `item-${i.id}` === activeId) : null;

  const content = (
    <div
      className="grid gap-[6px] min-h-[420px]"
      style={{ gridTemplateColumns: "140px repeat(7, 1fr)" }}
    >
      {/* Backlog column */}
      <KanbanColumn
        columnId="backlog"
        label="BACKLOG"
        items={backlog}
        isToday={false}
        isPast={false}
        readOnly={readOnly}
        onStatusToggle={onStatusToggle}
        onMenuAction={onMenuAction}
      />

      {/* Day columns */}
      {DAY_NAMES.map((name, dayIdx) => {
        const dayDate = new Date(start);
        dayDate.setDate(start.getDate() + dayIdx);
        const isPast = dayIdx < todayIdx;
        const isToday = dayIdx === todayIdx;
        const dayLabel = `${name} ${dayDate.getDate()}`;
        const star = isToday ? " ★" : "";

        return (
          <KanbanColumn
            key={dayIdx}
            columnId={`day-${dayIdx}`}
            label={`${dayLabel}${star}`}
            items={dayItems[dayIdx]}
            isToday={isToday}
            isPast={isPast}
            readOnly={readOnly}
            onStatusToggle={onStatusToggle}
            onMenuAction={onMenuAction}
          />
        );
      })}
    </div>
  );

  if (readOnly) return content;

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {content}
      <DragOverlay>
        {activeItem && <TaskCard item={activeItem} overlay onStatusToggle={() => {}} onMenuAction={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  columnId,
  label,
  items,
  isToday,
  isPast,
  readOnly,
  onStatusToggle,
  onMenuAction,
}: {
  columnId: string;
  label: string;
  items: PlanItemData[];
  isToday: boolean;
  isPast: boolean;
  readOnly?: boolean;
  onStatusToggle: (id: number) => void;
  onMenuAction: (id: number, action: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const hours = items.reduce((s, i) => s + (i.estimatedHours ?? 2), 0);

  const borderColor = isPast
    ? "color-mix(in oklch, var(--status-done) 50%, transparent)"
    : isToday
      ? "var(--primary)"
      : "var(--border)";

  return (
    <div
      ref={readOnly ? undefined : setNodeRef}
      className="flex flex-col rounded-sm"
      style={{
        background: isOver
          ? "color-mix(in oklch, var(--primary) 6%, transparent)"
          : isToday
            ? "color-mix(in oklch, var(--primary) 3%, transparent)"
            : undefined,
        margin: isToday ? "-4px" : undefined,
        padding: isToday ? "4px" : undefined,
        borderRadius: isToday ? "3px" : undefined,
      }}
    >
      {/* Column header */}
      <div
        className="text-center pb-1.5 mb-1.5"
        style={{
          borderBottom: `${isToday ? "2px" : "1px"} solid ${borderColor}`,
        }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: isToday ? "var(--primary)" : isPast ? "color-mix(in oklch, var(--status-done) 70%, transparent)" : "var(--muted-foreground)" }}
        >
          {label}
        </span>
        {items.length > 0 && (
          <span
            className="block text-[9px] tabular-nums mt-0.5"
            style={{ color: hours > 7 ? "var(--status-warning)" : "var(--muted-foreground)" }}
          >
            {hours.toFixed(0)}h
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col gap-[4px] min-h-[40px]">
        <SortableContext
          items={items.map((i) => `item-${i.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableCard
              key={item.id}
              item={item}
              readOnly={readOnly}
              onStatusToggle={onStatusToggle}
              onMenuAction={onMenuAction}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableCard({
  item,
  readOnly,
  onStatusToggle,
  onMenuAction,
}: {
  item: PlanItemData;
  readOnly?: boolean;
  onStatusToggle: (id: number) => void;
  onMenuAction: (id: number, action: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `item-${item.id}`, disabled: readOnly || item.status === "done" });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...(readOnly || item.status === "done" ? {} : { ...attributes, ...listeners })}>
      <TaskCard item={item} onStatusToggle={onStatusToggle} onMenuAction={onMenuAction} />
    </div>
  );
}

export function TaskCard({
  item,
  overlay,
  onStatusToggle,
  onMenuAction,
}: {
  item: PlanItemData;
  overlay?: boolean;
  onStatusToggle: (id: number) => void;
  onMenuAction: (id: number, action: string) => void;
}) {
  const style = getStatusStyle(item.status, item.sourceWeek);
  const StatusIcon = style.icon;
  const platformColor = PLATFORM_COLORS[item.type] ?? "var(--muted-foreground)";
  const platformLabel = PLATFORM_LABELS[item.type] ?? item.type.toUpperCase().slice(0, 3);
  const isDone = item.status === "done";

  return (
    <div
      className="px-[10px] py-[8px] rounded-sm relative group"
      style={{
        border: `1px ${style.dashed ? "dashed" : "solid"} ${style.borderColor}`,
        background: style.bg,
        cursor: isDone || overlay ? "default" : "grab",
        opacity: isDone ? 0.7 : 1,
      }}
    >
      {/* Top row: status + platform badge */}
      <div className="flex items-center gap-1.5 mb-1">
        <button
          onClick={(e) => { e.stopPropagation(); onStatusToggle(item.id); }}
          className="shrink-0"
          title={`Status: ${item.status}`}
        >
          <StatusIcon className="h-3 w-3" style={{ color: style.color }} />
        </button>
        <span
          className="text-[9px] font-bold uppercase px-1 py-[1px] rounded-sm"
          style={{
            color: platformColor,
            background: `color-mix(in oklch, ${platformColor} 15%, transparent)`,
          }}
        >
          {platformLabel}
        </span>

        {/* Context menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="ml-auto text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            render={<button />}
            onClick={(e) => e.stopPropagation()}
          >
            ···
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" sideOffset={2}>
            {(["blocked", "stuck", "deferred", "pending"] as const).map((s) => (
              <DropdownMenuItem
                key={s}
                className="text-[11px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuAction(item.id, s);
                }}
              >
                Mark {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title */}
      {item.link ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium leading-[1.3] text-primary hover:underline block"
          onClick={(e) => e.stopPropagation()}
          style={{ textDecoration: isDone ? "line-through" : undefined }}
        >
          {item.title}
        </a>
      ) : (
        <p
          className="text-[11px] font-medium leading-[1.3]"
          style={{ textDecoration: isDone ? "line-through" : undefined }}
        >
          {item.title}
        </p>
      )}

      {/* Time + context */}
      <div className="flex items-center gap-1 mt-1">
        <Clock className="h-[10px] w-[10px] text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {(item.estimatedHours ?? 2) < 1
            ? `${((item.estimatedHours ?? 2) * 60).toFixed(0)}min`
            : `${(item.estimatedHours ?? 2).toFixed(0)}h`}
        </span>
        {item.status === "blocked" && item.blockedReason && (
          <span className="text-[9px] ml-1" style={{ color: "var(--status-blocked)" }}>
            {item.blockedReason}
          </span>
        )}
        {item.status === "stuck" && (item.attemptCount ?? 0) > 0 && (
          <span className="text-[9px] ml-1" style={{ color: "var(--status-stuck)" }}>
            {item.attemptCount} attempts
          </span>
        )}
        {item.sourceWeek && (
          <span className="text-[9px] ml-1" style={{ color: "var(--status-blocked)" }}>
            ↪ wk{new Date(item.sourceWeek + "T00:00:00").getDate()}
          </span>
        )}
      </div>

    </div>
  );
}
