"use client";

import { useState, useId, useCallback, Fragment } from "react";
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
  Clock,
  Inbox,
  ListTodo,
  Play,
  CheckCircle2,
} from "lucide-react";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { PlanItemData } from "./types";

const COLUMNS = [
  { id: "backlog", label: "Backlog", icon: Inbox },
  { id: "todo", label: "To Do", icon: ListTodo },
  { id: "in_progress", label: "In Progress", icon: Play },
  { id: "done", label: "Done", icon: CheckCircle2 },
] as const;

const LANES = [
  { id: "42", label: "42", color: "var(--platform-42)" },
  { id: "cybersec", label: "Cybersec", color: "var(--platform-htb)" },
  { id: "maldev", label: "Maldev", color: "var(--platform-maldev)" },
] as const;

type ColumnId = (typeof COLUMNS)[number]["id"];

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

function getStatusStyle(status: string): StatusMeta {
  return STATUS_STYLES[status] ?? STATUS_STYLES.pending;
}

function parseCellId(cellId: string): { col: ColumnId; lane: string } | null {
  const idx = cellId.indexOf(":");
  if (idx === -1) return null;
  return { col: cellId.slice(0, idx) as ColumnId, lane: cellId.slice(idx + 1) };
}

export function StatusKanbanBoard({
  items,
  onItemUpdate,
  onReorder,
}: {
  items: PlanItemData[];
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
  onReorder: (id: number, boardStatus: string, category: string, sortOrder: number) => void;
}) {
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const cellItems = useCallback(
    (col: string, lane: string) =>
      items
        .filter((i) => (i.boardStatus ?? "backlog") === col && (i.category ?? "42") === lane)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [items]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const itemId = parseInt((active.id as string).replace("item-", ""));
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const overId = over.id as string;

    let targetCol: ColumnId;
    let targetLane: string;

    if (overId.includes(":")) {
      const parsed = parseCellId(overId);
      if (!parsed) return;
      targetCol = parsed.col;
      targetLane = parsed.lane;
    } else if (overId.startsWith("item-")) {
      const overItemId = parseInt(overId.replace("item-", ""));
      const overItem = items.find((i) => i.id === overItemId);
      if (!overItem) return;
      targetCol = (overItem.boardStatus ?? "backlog") as ColumnId;
      targetLane = overItem.category ?? "42";
    } else {
      return;
    }

    // Enforce: items stay in their category lane
    if (targetLane !== (item.category ?? "42")) {
      targetLane = item.category ?? "42";
    }

    const currentCol = (item.boardStatus ?? "backlog") as ColumnId;

    if (currentCol !== targetCol) {
      onItemUpdate(itemId, { boardStatus: targetCol });
    } else {
      // Reorder within same cell
      const siblings = cellItems(targetCol, targetLane);
      const overItemId = overId.startsWith("item-")
        ? parseInt(overId.replace("item-", ""))
        : null;
      const overIdx = overItemId
        ? siblings.findIndex((s) => s.id === overItemId)
        : siblings.length;
      if (overIdx >= 0) {
        onReorder(itemId, targetCol, targetLane, overIdx);
      }
    }
  }

  const activeItem = activeId
    ? items.find((i) => `item-${i.id}` === activeId)
    : null;

  // Column totals
  const colTotals = COLUMNS.map((col) => {
    const colItems = items.filter((i) => (i.boardStatus ?? "backlog") === col.id);
    return {
      count: colItems.length,
      hours: colItems.reduce((s, i) => s + (i.estimatedHours ?? 2), 0),
    };
  });

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: "72px repeat(4, 1fr)",
          gridTemplateRows: "auto repeat(3, auto)",
          gap: "1px",
          background: "var(--border)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        {/* Top-left corner */}
        <div style={{ background: "var(--background)", padding: "6px" }} />

        {/* Column headers */}
        {COLUMNS.map((col, ci) => {
          const ColIcon = col.icon;
          return (
            <div
              key={col.id}
              className="flex items-center justify-center gap-1.5 py-2 px-2"
              style={{
                background:
                  col.id === "in_progress"
                    ? "color-mix(in oklch, var(--primary) 4%, var(--background))"
                    : "var(--background)",
              }}
            >
              <ColIcon
                className="h-3.5 w-3.5"
                style={{
                  color:
                    col.id === "in_progress"
                      ? "var(--primary)"
                      : col.id === "done"
                        ? "var(--status-done)"
                        : "var(--muted-foreground)",
                }}
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {col.label}
              </span>
              {colTotals[ci].count > 0 && (
                <span className="text-[9px] text-muted-foreground/60 tabular-nums">
                  {colTotals[ci].count} · {colTotals[ci].hours.toFixed(0)}h
                </span>
              )}
            </div>
          );
        })}

        {/* Swim lane rows */}
        {LANES.map((lane) => (
          <Fragment key={lane.id}>
            {/* Lane label */}
            <div
              className="flex items-start justify-center pt-3 px-1"
              style={{ background: "var(--background)" }}
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: lane.color }}
                />
                <span
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    color: lane.color,
                    writingMode: "vertical-lr",
                    textOrientation: "mixed",
                  }}
                >
                  {lane.label}
                </span>
              </div>
            </div>

            {/* Cells */}
            {COLUMNS.map((col) => {
              const cellId = `${col.id}:${lane.id}`;
              const cItems = cellItems(col.id, lane.id);
              return (
                <BoardCell
                  key={cellId}
                  cellId={cellId}
                  items={cItems}
                  isDone={col.id === "done"}
                  onItemUpdate={onItemUpdate}
                />
              );
            })}
          </Fragment>
        ))}
      </div>

      <DragOverlay>
        {activeItem && <BoardCard item={activeItem} overlay />}
      </DragOverlay>
    </DndContext>
  );
}

function BoardCell({
  cellId,
  items,
  isDone,
  onItemUpdate,
}: {
  cellId: string;
  items: PlanItemData[];
  isDone: boolean;
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: cellId });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col gap-[3px] p-1.5 min-h-[80px]"
      style={{
        background: isOver
          ? "color-mix(in oklch, var(--primary) 8%, var(--background))"
          : "var(--background)",
        transition: "background 150ms ease",
      }}
    >
      <SortableContext
        items={items.map((i) => `item-${i.id}`)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <SortableBoardCard
            key={item.id}
            item={item}
            isDone={isDone}
            onItemUpdate={onItemUpdate}
          />
        ))}
      </SortableContext>
    </div>
  );
}

function SortableBoardCard({
  item,
  isDone,
  onItemUpdate,
}: {
  item: PlanItemData;
  isDone: boolean;
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `item-${item.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BoardCard item={item} isDone={isDone} onItemUpdate={onItemUpdate} />
    </div>
  );
}

function BoardCard({
  item,
  overlay,
  isDone,
  onItemUpdate,
}: {
  item: PlanItemData;
  overlay?: boolean;
  isDone?: boolean;
  onItemUpdate?: (id: number, updates: Record<string, unknown>) => void;
}) {
  const statusStyle = getStatusStyle(item.status);
  const StatusIcon = statusStyle.icon;
  const platformColor =
    PLATFORM_COLORS[item.type] ?? "var(--muted-foreground)";
  const platformLabel =
    PLATFORM_LABELS[item.type] ?? item.type.toUpperCase().slice(0, 3);
  const done = item.status === "done" || isDone;

  const moveActions = COLUMNS.filter(
    (c) => c.id !== (item.boardStatus ?? "backlog")
  ).map((c) => ({ id: c.id, label: `Move to ${c.label}` }));

  return (
    <div
      className="px-2 py-1.5 rounded-sm relative group"
      style={{
        border: `1px solid ${statusStyle.borderColor}`,
        background: overlay
          ? "var(--card)"
          : statusStyle.bg,
        cursor: overlay ? "grabbing" : "grab",
        opacity: done && !overlay ? 0.6 : 1,
        boxShadow: overlay ? "0 4px 12px rgba(0,0,0,0.3)" : undefined,
      }}
    >
      {/* Top row */}
      <div className="flex items-center gap-1 mb-0.5">
        <StatusIcon
          className="h-2.5 w-2.5 shrink-0"
          style={{ color: statusStyle.color }}
        />
        <span
          className="text-[8px] font-bold uppercase px-1 rounded-sm"
          style={{
            color: platformColor,
            background: `color-mix(in oklch, ${platformColor} 12%, transparent)`,
          }}
        >
          {platformLabel}
        </span>

        {(item.status === "blocked" || item.status === "stuck") && (
          <span
            className="text-[7px] font-semibold uppercase px-1 rounded-sm ml-auto"
            style={{
              color: statusStyle.color,
              background: `color-mix(in oklch, ${statusStyle.color} 12%, transparent)`,
            }}
          >
            {item.status}
          </span>
        )}

        {!overlay && onItemUpdate && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="ml-auto text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              render={<button />}
              onClick={(e) => e.stopPropagation()}
            >
              ···
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" sideOffset={2}>
              {moveActions.map((a) => (
                <DropdownMenuItem
                  key={a.id}
                  className="text-[11px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemUpdate(item.id, { boardStatus: a.id });
                  }}
                >
                  {a.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                className="text-[11px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onItemUpdate(item.id, { status: "blocked" });
                }}
              >
                Mark blocked
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[11px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onItemUpdate(item.id, { status: "stuck" });
                }}
              >
                Mark stuck
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Title */}
      {item.goalId ? (
        <a
          href={`/goals?goal=${item.goalId}`}
          className="text-[10px] font-medium leading-[1.3] hover:underline block"
          style={{
            color: "var(--foreground)",
            textDecoration: done ? "line-through" : undefined,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {item.title}
        </a>
      ) : item.link ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-medium leading-[1.3] text-primary hover:underline block"
          onClick={(e) => e.stopPropagation()}
          style={{ textDecoration: done ? "line-through" : undefined }}
        >
          {item.title}
        </a>
      ) : (
        <p
          className="text-[10px] font-medium leading-[1.3]"
          style={{ textDecoration: done ? "line-through" : undefined }}
        >
          {item.title}
        </p>
      )}

      {/* Bottom row */}
      <div className="flex items-center gap-1 mt-0.5">
        <Clock className="h-[9px] w-[9px] text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground tabular-nums">
          {(item.estimatedHours ?? 2) < 1
            ? `${((item.estimatedHours ?? 2) * 60).toFixed(0)}min`
            : `${(item.estimatedHours ?? 2).toFixed(0)}h`}
        </span>
        {item.status === "blocked" && item.blockedReason && (
          <span
            className="text-[8px] ml-1 truncate"
            style={{ color: "var(--status-blocked)", maxWidth: "80px" }}
          >
            {item.blockedReason}
          </span>
        )}
      </div>
    </div>
  );
}

// Keep the old export name for backward compat during transition
export { StatusKanbanBoard as KanbanBoard };
