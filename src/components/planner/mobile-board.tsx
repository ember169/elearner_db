"use client";

import { useState } from "react";
import {
  Check,
  ArrowRight,
  Circle,
  Pause,
  AlertTriangle,
  Clock,
  Inbox,
  ListTodo,
  Play,
  CheckCircle2,
  ChevronRight,
  Square,
} from "lucide-react";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";
import type { PlanItemData, SideProject } from "./types";

type MobileTab = "focus" | "board" | "backlog";

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

function getStatusIcon(status: string) {
  switch (status) {
    case "done":
      return { Icon: Check, color: "var(--status-done)" };
    case "active":
      return { Icon: ArrowRight, color: "var(--primary)" };
    case "blocked":
      return { Icon: Pause, color: "var(--status-blocked)" };
    case "stuck":
      return { Icon: AlertTriangle, color: "var(--status-stuck)" };
    default:
      return { Icon: Circle, color: "var(--muted-foreground)" };
  }
}

function formatHours(h: number | null): string {
  const v = h ?? 2;
  return v < 1 ? `${(v * 60).toFixed(0)}m` : `${v.toFixed(0)}h`;
}

export function MobileBoardView({
  items,
  sideProject,
  pinnedTasks,
  onItemUpdate,
  onAddPinned,
  onCompletePinned,
}: {
  items: PlanItemData[];
  sideProject?: SideProject | null;
  pinnedTasks: { id: number; title: string }[];
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
  onAddPinned: (title: string) => void;
  onCompletePinned: (id: number) => void;
}) {
  const [tab, setTab] = useState<MobileTab>("focus");

  const focusItems = items.filter(
    (i) =>
      (i.boardStatus === "in_progress" || i.boardStatus === "todo") &&
      i.status !== "deferred"
  );
  const backlogItems = items.filter(
    (i) => (i.boardStatus ?? "backlog") === "backlog" && i.status !== "deferred"
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-sm" style={{ background: "var(--muted)" }}>
        {(
          [
            { id: "focus" as const, label: "Focus", count: focusItems.length },
            { id: "board" as const, label: "Board", count: items.length },
            { id: "backlog" as const, label: "Backlog", count: backlogItems.length },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-1.5 rounded-sm text-[12px] font-medium transition-colors"
            style={{
              background: tab === t.id ? "var(--background)" : "transparent",
              color: tab === t.id ? "var(--foreground)" : "var(--muted-foreground)",
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {tab === "focus" && (
          <FocusView
            items={focusItems}
            sideProject={sideProject}
            pinnedTasks={pinnedTasks}
            onItemUpdate={onItemUpdate}
            onAddPinned={onAddPinned}
            onCompletePinned={onCompletePinned}
          />
        )}
        {tab === "board" && (
          <BoardColumnsView items={items} onItemUpdate={onItemUpdate} />
        )}
        {tab === "backlog" && (
          <BacklogListView items={backlogItems} onItemUpdate={onItemUpdate} />
        )}
      </div>
    </div>
  );
}

function FocusView({
  items,
  sideProject,
  pinnedTasks,
  onItemUpdate,
  onAddPinned,
  onCompletePinned,
}: {
  items: PlanItemData[];
  sideProject?: SideProject | null;
  pinnedTasks: { id: number; title: string }[];
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
  onAddPinned: (title: string) => void;
  onCompletePinned: (id: number) => void;
}) {
  const inProgress = items.filter((i) => i.boardStatus === "in_progress");
  const todo = items.filter((i) => i.boardStatus === "todo");

  return (
    <div className="space-y-4">
      {inProgress.length === 0 && todo.length === 0 && (
        <p className="text-[13px] text-muted-foreground py-6 text-center">
          No active items. Move something from the backlog.
        </p>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Play className="h-3 w-3" style={{ color: "var(--primary)" }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
              In Progress
            </span>
          </div>
          {LANES.map((lane) => {
            const laneItems = inProgress.filter((i) => (i.category ?? "42") === lane.id);
            if (laneItems.length === 0) return null;
            return (
              <div key={lane.id} className="mb-2">
                <LaneBadge lane={lane} />
                {laneItems.map((item) => (
                  <MobileCard
                    key={item.id}
                    item={item}
                    onItemUpdate={onItemUpdate}
                    actions={[
                      { label: "Done", action: () => onItemUpdate(item.id, { boardStatus: "done" }) },
                      { label: "Stuck", action: () => onItemUpdate(item.id, { status: "stuck" }) },
                    ]}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* To Do */}
      {todo.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ListTodo className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              To Do
            </span>
          </div>
          {LANES.map((lane) => {
            const laneItems = todo.filter((i) => (i.category ?? "42") === lane.id);
            if (laneItems.length === 0) return null;
            return (
              <div key={lane.id} className="mb-2">
                <LaneBadge lane={lane} />
                {laneItems.map((item) => (
                  <MobileCard
                    key={item.id}
                    item={item}
                    onItemUpdate={onItemUpdate}
                    actions={[
                      { label: "Start", action: () => onItemUpdate(item.id, { boardStatus: "in_progress" }) },
                    ]}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Side project */}
      {sideProject && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-2">
            Weekend: {sideProject.title}
          </p>
          <p className="text-[12px] text-muted-foreground">{sideProject.description}</p>
        </div>
      )}

      {/* Pinned tasks */}
      {pinnedTasks.length > 0 && (
        <div className="mt-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Pinned
          </p>
          {pinnedTasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 py-1"
            >
              <button
                onClick={() => onCompletePinned(t.id)}
                className="text-muted-foreground"
              >
                <Square className="h-3 w-3" />
              </button>
              <span className="text-[12px]">{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BoardColumnsView({
  items,
  onItemUpdate,
}: {
  items: PlanItemData[];
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-3" style={{ minWidth: "800px" }}>
        {COLUMNS.map((col) => {
          const colItems = items
            .filter((i) => (i.boardStatus ?? "backlog") === col.id && i.status !== "deferred")
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          const ColIcon = col.icon;
          const hours = colItems.reduce((s, i) => s + (i.estimatedHours ?? 2), 0);

          return (
            <div key={col.id} className="flex-1 min-w-[180px]">
              <div className="flex items-center gap-1.5 mb-2 pb-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <ColIcon
                  className="h-3 w-3"
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
                <span className="text-[9px] text-muted-foreground/60 tabular-nums ml-auto">
                  {colItems.length} · {hours.toFixed(0)}h
                </span>
              </div>

              <div className="space-y-1">
                {LANES.map((lane) => {
                  const laneItems = colItems.filter((i) => (i.category ?? "42") === lane.id);
                  if (laneItems.length === 0) return null;
                  return (
                    <div key={lane.id}>
                      <LaneBadge lane={lane} />
                      {laneItems.map((item) => (
                        <MobileCard
                          key={item.id}
                          item={item}
                          onItemUpdate={onItemUpdate}
                          compact
                        />
                      ))}
                    </div>
                  );
                })}
                {colItems.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/40 text-center py-4">
                    Empty
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BacklogListView({
  items,
  onItemUpdate,
}: {
  items: PlanItemData[];
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="text-[13px] text-muted-foreground py-6 text-center">
          Backlog is empty. Hit Regenerate to get new items.
        </p>
      )}

      {LANES.map((lane) => {
        const laneItems = items.filter((i) => (i.category ?? "42") === lane.id);
        if (laneItems.length === 0) return null;
        return (
          <div key={lane.id}>
            <LaneBadge lane={lane} />
            {laneItems.map((item) => (
              <MobileCard
                key={item.id}
                item={item}
                onItemUpdate={onItemUpdate}
                actions={[
                  { label: "Plan it", action: () => onItemUpdate(item.id, { boardStatus: "todo" }) },
                  { label: "Drop", action: () => onItemUpdate(item.id, { status: "deferred" }) },
                ]}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function LaneBadge({ lane }: { lane: { label: string; color: string } }) {
  return (
    <div className="flex items-center gap-1.5 mb-1 mt-1">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: lane.color }} />
      <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: lane.color }}>
        {lane.label}
      </span>
    </div>
  );
}

function MobileCard({
  item,
  onItemUpdate,
  actions,
  compact,
}: {
  item: PlanItemData;
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
  actions?: { label: string; action: () => void }[];
  compact?: boolean;
}) {
  const { Icon, color } = getStatusIcon(item.status);
  const platformColor = PLATFORM_COLORS[item.type] ?? "var(--muted-foreground)";
  const platformLabel = PLATFORM_LABELS[item.type] ?? item.type.toUpperCase().slice(0, 3);
  const isDone = item.status === "done";

  return (
    <div
      className={`flex items-center gap-2 ${compact ? "py-1.5 px-2" : "py-2.5 px-3"} rounded-sm border border-border mb-1`}
      style={{
        opacity: isDone ? 0.6 : 1,
        background: "var(--card)",
      }}
    >
      <Icon className="h-3 w-3 shrink-0" style={{ color }} />
      <span
        className="text-[9px] font-bold uppercase px-1 py-[1px] rounded-sm shrink-0"
        style={{
          color: platformColor,
          background: `color-mix(in oklch, ${platformColor} 15%, transparent)`,
        }}
      >
        {platformLabel}
      </span>

      <div className="flex-1 min-w-0">
        {item.goalId ? (
          <a
            href={`/goals?goal=${item.goalId}`}
            className={`${compact ? "text-[11px]" : "text-[13px]"} font-medium truncate block hover:underline`}
            style={{ textDecoration: isDone ? "line-through" : undefined }}
          >
            {item.title}
          </a>
        ) : (
          <span
            className={`${compact ? "text-[11px]" : "text-[13px]"} font-medium truncate block`}
            style={{ textDecoration: isDone ? "line-through" : undefined }}
          >
            {item.title}
          </span>
        )}
      </div>

      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
        {formatHours(item.estimatedHours)}
      </span>

      {actions && actions.length > 0 && (
        <div className="flex gap-1 shrink-0">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.action}
              className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium transition-colors"
              style={{
                color: "var(--primary)",
                background: "color-mix(in oklch, var(--primary) 10%, transparent)",
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
