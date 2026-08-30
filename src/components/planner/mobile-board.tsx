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
  onOpenDetail,
}: {
  items: PlanItemData[];
  sideProject?: SideProject | null;
  goals: GoalSlim[];
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
  onOpenDetail?: (id: number) => void;
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
      {/* Family segmented control: raised track, 5px padding, radius 12; the
          active segment is an accent fill at radius 9 — not a white pill with a
          shadow, which is the light-theme idiom. */}
      <div className="flex gap-1 rounded-[12px] bg-cb-raised p-[5px]">
        {(
          [
            { id: "in_progress" as const, label: "In progress", count: inProgressItems.length },
            { id: "todo" as const, label: "To do", count: todoItems.length },
            { id: "backlog" as const, label: "Backlog", count: backlogItems.length },
          ] as const
        ).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                active
                  ? "flex-1 rounded-[9px] bg-cb-or py-2 font-cb-sans text-[13px] font-bold text-cb-on-or transition-colors"
                  : "flex-1 rounded-[9px] py-2 font-cb-sans text-[13px] font-bold text-cb-muted transition-colors"
              }
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={
                    active
                      ? "ml-1.5 font-cb-mono text-[11px] text-cb-on-or/70"
                      : "ml-1.5 font-cb-mono text-[11px] text-cb-muted"
                  }
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        {tab === "in_progress" && (
          <StatusListView
            items={inProgressItems}
            emptyText="Nothing in progress."
            sideProject={sideProject}
            goals={goals}
            onItemUpdate={onItemUpdate}
            onOpenDetail={onOpenDetail}
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
            onOpenDetail={onOpenDetail}
            actions={(item) => [
              { label: "Start", action: () => onItemUpdate(item.id, { boardStatus: "in_progress" }) },
            ]}
          />
        )}
        {tab === "backlog" && (
          <BacklogListView items={backlogItems} onItemUpdate={onItemUpdate} onOpenDetail={onOpenDetail} />
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
  onOpenDetail,
  actions,
}: {
  items: PlanItemData[];
  emptyText: string;
  sideProject?: SideProject | null;
  goals?: GoalSlim[];
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
  onOpenDetail?: (id: number) => void;
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
                onOpenDetail={onOpenDetail}
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
  onOpenDetail,
}: {
  items: PlanItemData[];
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
  onOpenDetail?: (id: number) => void;
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
                onOpenDetail={onOpenDetail}
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
  onOpenDetail,
  actions,
  compact,
}: {
  item: PlanItemData;
  onItemUpdate: (id: number, updates: Record<string, unknown>) => void;
  onOpenDetail?: (id: number) => void;
  actions?: { label: string; action: () => void }[];
  compact?: boolean;
}) {
  const { Icon, color } = getStatusIcon(item.status);
  const platformColor = PLATFORM_COLORS[item.type] ?? "var(--muted-foreground)";
  const platformLabel = PLATFORM_LABELS[item.type] ?? item.type.toUpperCase().slice(0, 3);
  const isDone = item.status === "done";

  return (
    <div
      className={`mb-1 flex items-center gap-2 ${compact ? "px-2 py-1.5" : "px-3 py-2.5"} rounded-[12px] border border-cb-line bg-cb-card`}
      style={{ opacity: isDone ? 0.6 : 1 }}
    >
      <Icon className="h-3 w-3 shrink-0" style={{ color }} />
      <span
        className="shrink-0 rounded-cb-chip-sm px-2 py-0.5 font-cb-mono text-[10px]"
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
        ) : onOpenDetail ? (
          <button
            type="button"
            onClick={() => onOpenDetail(item.id)}
            className="block w-full truncate text-left text-[15px] font-medium"
            style={{ textDecoration: isDone ? "line-through" : undefined }}
          >
            {item.title}
          </button>
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
              className="rounded-cb-chip-sm bg-cb-or-tint px-2 py-1 font-cb-mono text-[11px] text-cb-or transition-colors"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
