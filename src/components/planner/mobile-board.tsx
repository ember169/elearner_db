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
  ChevronRight,
} from "lucide-react";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";
import { PacingAlerts } from "./pacing-alerts";
import type { PlanItemData, SideProject, GoalSlim } from "./types";

type MobileTab = "in_progress" | "todo" | "backlog";

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
  goals,
  onItemUpdate,
}: {
  items: PlanItemData[];
  sideProject?: SideProject | null;
  goals: GoalSlim[];
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
}) {
  const [tab, setTab] = useState<MobileTab>("in_progress");

  const inProgressItems = items.filter(
    (i) => i.boardStatus === "in_progress" && i.status !== "deferred"
  );
  const todoItems = items.filter(
    (i) => i.boardStatus === "todo" && i.status !== "deferred"
  );
  const backlogItems = items.filter(
    (i) => (i.boardStatus ?? "backlog") === "backlog" && i.status !== "deferred"
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--muted)" }}>
        {(
          [
            { id: "in_progress" as const, label: "In progress", count: inProgressItems.length },
            { id: "todo" as const, label: "To do", count: todoItems.length },
            { id: "backlog" as const, label: "Backlog", count: backlogItems.length },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-md text-[14px] font-medium transition-colors"
            style={{
              background: tab === t.id ? "var(--background)" : "transparent",
              color: tab === t.id ? "var(--foreground)" : "var(--muted-foreground)",
              boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1 text-[14px] text-muted-foreground">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {tab === "in_progress" && (
          <StatusListView
            items={inProgressItems}
            emptyText="Nothing in progress."
            sideProject={sideProject}
            goals={goals}
            onItemUpdate={onItemUpdate}
            actions={(item) => [
              { label: "Done", action: () => onItemUpdate(item.id, { boardStatus: "done" }) },
              { label: "Stuck", action: () => onItemUpdate(item.id, { status: "stuck" }) },
            ]}
          />
        )}
        {tab === "todo" && (
          <StatusListView
            items={todoItems}
            emptyText="Nothing to do. Move something from the backlog."
            onItemUpdate={onItemUpdate}
            actions={(item) => [
              { label: "Start", action: () => onItemUpdate(item.id, { boardStatus: "in_progress" }) },
            ]}
          />
        )}
        {tab === "backlog" && (
          <BacklogListView items={backlogItems} onItemUpdate={onItemUpdate} />
        )}
      </div>
    </div>
  );
}

function StatusListView({
  items,
  emptyText,
  sideProject,
  goals,
  onItemUpdate,
  actions,
}: {
  items: PlanItemData[];
  emptyText: string;
  sideProject?: SideProject | null;
  goals?: GoalSlim[];
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
  actions: (item: PlanItemData) => { label: string; action: () => void }[];
}) {
  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <p className="text-[15px] text-muted-foreground py-6 text-center">
          {emptyText}
        </p>
      )}

      {LANES.map((lane) => {
        const laneItems = items.filter((i) => (i.category ?? "42") === lane.id);
        if (laneItems.length === 0) return null;
        return (
          <div key={lane.id} className="mb-2">
            <LaneBadge lane={lane} />
            {laneItems.map((item) => (
              <MobileCard
                key={item.id}
                item={item}
                onItemUpdate={onItemUpdate}
                actions={actions(item)}
              />
            ))}
          </div>
        );
      })}

      {sideProject && (
        <div className="mt-4">
          <p className="text-[15px] font-semibold text-muted-foreground uppercase mb-2">
            Weekend: {sideProject.title}
          </p>
          <p className="text-[14px] text-muted-foreground">{sideProject.description}</p>
        </div>
      )}

      {goals && (
        <div className="mt-4">
          <PacingAlerts goals={goals} />
        </div>
      )}
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
        <p className="text-[15px] text-muted-foreground py-6 text-center">
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
      <span className="text-[15px] font-semibold uppercase tracking-wider" style={{ color: lane.color }}>
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
        className="text-[15px] font-bold uppercase px-1 py-[1px] rounded-sm shrink-0"
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
            className={`${compact ? "text-[15px]" : "text-[15px]"} font-medium truncate block hover:underline`}
            style={{ textDecoration: isDone ? "line-through" : undefined }}
          >
            {item.title}
          </a>
        ) : (
          <span
            className={`${compact ? "text-[15px]" : "text-[15px]"} font-medium truncate block`}
            style={{ textDecoration: isDone ? "line-through" : undefined }}
          >
            {item.title}
          </span>
        )}
      </div>

      <span className="text-[14px] text-muted-foreground tabular-nums shrink-0">
        {formatHours(item.estimatedHours)}
      </span>

      {actions && actions.length > 0 && (
        <div className="flex gap-1 shrink-0">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.action}
              className="text-[14px] px-1.5 py-0.5 rounded-sm font-medium transition-colors"
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
