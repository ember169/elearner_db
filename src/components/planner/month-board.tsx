"use client";

import { useState, useId } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import {
  Check,
  ArrowRight,
  Circle,
  Pause,
  AlertTriangle,
  CornerDownRight,
} from "lucide-react";
import { PLATFORM_COLORS } from "@/lib/platform-colors";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { PlanItemData } from "./types";

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const STATUS_STYLES: Record<string, { icon: typeof Check; color: string; bg: string; border: string }> = {
  done: { icon: Check, color: "var(--status-done)", bg: "color-mix(in oklch, var(--status-done) 4%, transparent)", border: "color-mix(in oklch, var(--status-done) 20%, transparent)" },
  active: { icon: ArrowRight, color: "var(--primary)", bg: "color-mix(in oklch, var(--primary) 6%, transparent)", border: "color-mix(in oklch, var(--primary) 30%, transparent)" },
  pending: { icon: Circle, color: "var(--muted-foreground)", bg: "color-mix(in oklch, var(--muted) 40%, transparent)", border: "var(--border)" },
  blocked: { icon: Pause, color: "var(--status-blocked)", bg: "color-mix(in oklch, var(--status-blocked) 3%, transparent)", border: "color-mix(in oklch, var(--status-blocked) 30%, transparent)" },
  stuck: { icon: AlertTriangle, color: "var(--status-stuck)", bg: "color-mix(in oklch, var(--status-stuck) 3%, transparent)", border: "color-mix(in oklch, var(--status-stuck) 30%, transparent)" },
};

export type MonthWeek = {
  weekStart: string;
  weekNum: number;
  items: PlanItemData[];
};

function dayDate(weekStart: string, dayIdx: number): Date {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + dayIdx);
  return d;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MonthBoard({
  weeks,
  todayStr,
  monthNum,
  onStatusToggle,
  onMenuAction,
  onMoveItem,
}: {
  weeks: MonthWeek[];
  todayStr: string;
  monthNum: number;
  onStatusToggle: (id: number) => void;
  onMenuAction: (id: number, action: string) => void;
  onMoveItem: (id: number, sourceWeek: string, targetWeek: string, targetDay: number) => void;
}) {
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const itemWeekMap: Record<number, string> = {};
  for (const week of weeks) {
    for (const item of week.items) {
      itemWeekMap[item.id] = week.weekStart;
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!event.over) return;
    const itemId = parseInt((event.active.id as string).replace("item-", ""));
    const overId = event.over.id as string;
    const sep = overId.indexOf("|");
    if (sep < 0) return;
    const targetWeek = overId.slice(0, sep);
    const targetDay = parseInt(overId.slice(sep + 1));
    const sourceWeek = itemWeekMap[itemId];
    if (!sourceWeek || isNaN(targetDay)) return;
    onMoveItem(itemId, sourceWeek, targetWeek, targetDay);
  }

  const allItems = weeks.flatMap((w) => w.items);
  const activeItem = activeId ? allItems.find((i) => `item-${i.id}` === activeId) : null;

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <div
        className="grid gap-px rounded-sm overflow-hidden"
        style={{
          gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))",
          background: "var(--border)",
        }}
      >
        {/* Header row */}
        <div className="py-2" style={{ background: "var(--card)" }} />
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center py-2 text-[12px] font-semibold uppercase tracking-wider"
            style={{ background: "var(--card)", color: "var(--muted-foreground)" }}
          >
            {name}
          </div>
        ))}

        {weeks.map((week) => (
          <WeekRow
            key={week.weekStart}
            week={week}
            todayStr={todayStr}
            monthNum={monthNum}
            onStatusToggle={onStatusToggle}
            onMenuAction={onMenuAction}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem && <CompactCard item={activeItem} />}
      </DragOverlay>
    </DndContext>
  );
}

function WeekRow({
  week,
  todayStr,
  monthNum,
  onStatusToggle,
  onMenuAction,
}: {
  week: MonthWeek;
  todayStr: string;
  monthNum: number;
  onStatusToggle: (id: number) => void;
  onMenuAction: (id: number, action: string) => void;
}) {
  const visibleItems = week.items.filter((i) => i.status !== "deferred");
  const weekHours = visibleItems.reduce((s, i) => s + (i.estimatedHours ?? 2), 0);

  return (
    <>
      <div
        className="flex flex-col items-center justify-start py-2 gap-0.5"
        style={{ background: "var(--card)" }}
      >
        <span className="text-[12px] font-bold" style={{ color: "var(--primary)" }}>
          W{week.weekNum}
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {weekHours.toFixed(0)}h
        </span>
      </div>

      {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
        const d = dayDate(week.weekStart, dayIdx);
        const dateStr = toDateStr(d);
        const isToday = dateStr === todayStr;
        const isPast = dateStr < todayStr;
        const inMonth = d.getMonth() === monthNum;
        const dayItems = visibleItems.filter((i) => i.dayIndex === dayIdx);

        return (
          <DayCell
            key={dayIdx}
            cellId={`${week.weekStart}|${dayIdx}`}
            dateNum={d.getDate()}
            isToday={isToday}
            isPast={isPast}
            inMonth={inMonth}
            items={dayItems}
            onStatusToggle={onStatusToggle}
            onMenuAction={onMenuAction}
          />
        );
      })}
    </>
  );
}

function DayCell({
  cellId,
  dateNum,
  isToday,
  isPast,
  inMonth,
  items,
  onStatusToggle,
  onMenuAction,
}: {
  cellId: string;
  dateNum: number;
  isToday: boolean;
  isPast: boolean;
  inMonth: boolean;
  items: PlanItemData[];
  onStatusToggle: (id: number) => void;
  onMenuAction: (id: number, action: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: cellId });
  const hours = items.reduce((s, i) => s + (i.estimatedHours ?? 2), 0);

  return (
    <div
      ref={setNodeRef}
      className="min-h-[88px] p-1.5"
      style={{
        background: isOver
          ? "color-mix(in oklch, var(--primary) 8%, transparent)"
          : isToday
            ? "color-mix(in oklch, var(--primary) 4%, var(--card))"
            : "var(--card)",
        opacity: inMonth ? 1 : 0.3,
      }}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span
          className={`text-[13px] tabular-nums ${isToday ? "font-bold" : ""}`}
          style={{
            color: isToday
              ? "var(--primary)"
              : isPast && inMonth
                ? "var(--muted-foreground)"
                : inMonth
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
          }}
        >
          {dateNum}
        </span>
        {items.length > 0 && (
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {hours.toFixed(0)}h
          </span>
        )}
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <DraggableCard
            key={item.id}
            item={item}
            onStatusToggle={() => onStatusToggle(item.id)}
            onMenuAction={(action) => onMenuAction(item.id, action)}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({
  item,
  onStatusToggle,
  onMenuAction,
}: {
  item: PlanItemData;
  onStatusToggle: () => void;
  onMenuAction: (action: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `item-${item.id}`,
    disabled: item.status === "done",
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...(item.status === "done" ? {} : { ...attributes, ...listeners })}
    >
      <CompactCard item={item} onStatusToggle={onStatusToggle} onMenuAction={onMenuAction} />
    </div>
  );
}

function CompactCard({
  item,
  onStatusToggle,
  onMenuAction,
}: {
  item: PlanItemData;
  onStatusToggle?: () => void;
  onMenuAction?: (action: string) => void;
}) {
  const s = STATUS_STYLES[item.status] ?? STATUS_STYLES.pending;
  const StatusIcon = s.icon;
  const platformColor = PLATFORM_COLORS[item.type] ?? "var(--muted-foreground)";

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-[3px] group"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        cursor: item.status === "done" ? "default" : "grab",
      }}
    >
      {onStatusToggle && (
        <button
          onClick={(e) => { e.stopPropagation(); onStatusToggle(); }}
          className="shrink-0"
        >
          <StatusIcon className="h-3 w-3" style={{ color: s.color }} />
        </button>
      )}
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: platformColor }}
      />
      <a
        href={item.link ?? (item.goalId ? `/goals?goal=${item.goalId}` : "/goals")}
        {...(item.link ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="text-[12px] leading-snug line-clamp-2 hover:underline min-w-0"
        title={item.title}
        style={{
          color: "var(--primary)",
          textDecoration: item.status === "done" ? "line-through" : undefined,
          opacity: item.status === "done" ? 0.7 : 1,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {item.title}
      </a>

      {onMenuAction && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="ml-auto text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
            render={<button />}
            onClick={(e) => e.stopPropagation()}
          >
            ···
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" sideOffset={2}>
            {(["blocked", "stuck", "deferred", "pending"] as const).map((action) => (
              <DropdownMenuItem
                key={action}
                className="text-[11px]"
                onClick={(e) => { e.stopPropagation(); onMenuAction(action); }}
              >
                Mark {action}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
