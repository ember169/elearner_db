"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusKanbanBoard } from "./kanban-board";
import { SideProjectBrief } from "./side-project-brief";
import { CompetencySpotlight } from "./competency-spotlight";
import { PacingAlerts } from "./pacing-alerts";
import { MobileBoardView } from "./mobile-board";
import type { PlanItemData, GoalSlim, SideProject, CompetencyEntry } from "./types";
import { assertOk } from "@/lib/utils";

interface PlannerClientProps {
  boardItems: PlanItemData[];
  mentorBriefing: string | null;
  collapsedBriefing: string | null;
  objective: string;
  competencies: CompetencyEntry[];
  goals: GoalSlim[];
  sideProject?: SideProject | null;
  hasKey: boolean;
  stale: boolean;
}

export function PlannerClient({
  boardItems: initialItems,
  mentorBriefing: initialBriefing,
  collapsedBriefing: initialCollapsed,
  objective,
  competencies,
  goals,
  sideProject: initialSideProject,
  hasKey,
  stale,
}: PlannerClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<PlanItemData[]>(initialItems);
  const [briefing, setBriefing] = useState(initialBriefing);
  const [collapsedBriefing, setCollapsedBriefing] = useState(initialCollapsed);
  const [sideProject, setSideProject] = useState(initialSideProject);
  const [regenerating, setRegenerating] = useState(false);
  const [regenStep, setRegenStep] = useState<string | null>(null);
  const [briefingSource, setBriefingSource] = useState<"llm" | "fallback" | null>(null);
  const [deadlineWarnings, setDeadlineWarnings] = useState<string[]>([]);
  const [deadlineUrgency, setDeadlineUrgency] = useState<string>("normal");

  const [briefingCollapsed, setBriefingCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("planner-briefing-collapsed") === "true";
  });

  const totalHours = items
    .filter((i) => (i.boardStatus ?? "backlog") !== "done")
    .reduce((s, i) => s + (i.estimatedHours ?? 2), 0);
  const doneHours = items
    .filter((i) => (i.boardStatus ?? "backlog") === "done")
    .reduce((s, i) => s + (i.estimatedHours ?? 2), 0);

  const handleItemUpdate = useCallback(
    async (id: number, updates: Record<string, unknown>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updates,
                ...(updates.boardStatus === "done"
                  ? { status: "done", completedAt: new Date().toISOString() }
                  : {}),
                ...(updates.boardStatus === "in_progress" && !updates.status
                  ? { status: "active", completedAt: null }
                  : {}),
                ...(updates.boardStatus &&
                updates.boardStatus !== "done" &&
                updates.boardStatus !== "in_progress"
                  ? { status: "pending", completedAt: null }
                  : {}),
                ...(updates.status === "done"
                  ? { boardStatus: "done", completedAt: new Date().toISOString() }
                  : {}),
              }
            : item
        )
      );

      await fetch("/api/board", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
    },
    []
  );

  const handleReorder = useCallback(
    async (
      id: number,
      boardStatus: string,
      category: string,
      sortOrder: number
    ) => {
      await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          id,
          boardStatus,
          category,
          sortOrder,
        }),
      });
      // Refetch to get consistent sort orders
      const res = await fetch("/api/board");
      const data = await res.json();
      setItems(data.items);
    },
    []
  );

  async function handleRefreshSideProject() {
    const res = await fetch("/api/mentor/side-project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludeTitle: sideProject?.title }),
    });
    const data = await res.json();
    if (data.side_project) setSideProject(data.side_project);
  }

  async function handleDeleteItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setRegenStep("Generating mentor plan...");
    setBriefingSource(null);
    try {
      const mentorRes = await fetch("/api/mentor", { method: "POST" });
      const mentorData = await mentorRes.json();
      if (mentorData.error) {
        alert(mentorData.error);
        return;
      }
      if (mentorData.plan?.side_project) {
        setSideProject(mentorData.plan.side_project);
      }
      if (mentorData.warnings) setDeadlineWarnings(mentorData.warnings);
      if (mentorData.deadlinePressure) setDeadlineUrgency(mentorData.deadlinePressure.urgency);
      if (mentorData.briefingSource) setBriefingSource(mentorData.briefingSource);

      setRegenStep("Populating board...");
      await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "populate",
          mentorBriefing: mentorData.briefing,
          collapsedBriefing: mentorData.collapsedBriefing,
        }),
      });

      setRegenStep("Refreshing...");
      const boardRes = await fetch("/api/board");
      const board = await boardRes.json();
      setItems(board.items);
      setBriefing(mentorData.briefing ?? board.mentorBriefing);
      setCollapsedBriefing(mentorData.collapsedBriefing ?? board.collapsedBriefing);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Regeneration failed.");
    } finally {
      setRegenerating(false);
      setRegenStep(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold tracking-tight leading-tight">
            Planner
          </h1>
          <p className="text-[15px] text-muted-foreground mt-0.5 truncate">
            {objective}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-2">
          <div
            className="flex items-center gap-1.5 rounded-sm px-2.5 py-1"
            style={{ background: "var(--muted)" }}
          >
            <span className="text-[15px] font-semibold tabular-nums">
              {totalHours.toFixed(0)}h
            </span>
            <div
              className="w-[40px] h-1 rounded-[1px] overflow-hidden"
              style={{ background: "var(--accent)" }}
            >
              <div
                className="h-full rounded-[1px]"
                style={{
                  width: `${Math.min(100, (doneHours / Math.max(totalHours + doneHours, 1)) * 100)}%`,
                  background: "var(--primary)",
                }}
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="xs"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="ml-1"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${regenerating ? "animate-spin" : ""}`}
            />
            {regenerating ? (regenStep ?? "...") : "Regenerate"}
          </Button>
        </div>
      </div>

      {/* Mentor briefing + Side project (desktop) */}
      <p className="section-label mb-2 hidden md:block">Briefing</p>
      <div className="hidden md:grid md:grid-cols-2 gap-3">
        <div
          className="rounded-sm px-4 py-3"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "var(--primary)" }}
            >
              <span
                className="text-[15px] font-bold"
                style={{ color: "var(--primary-foreground)" }}
              >
                M
              </span>
            </div>
            <p
              className="text-[15px] leading-relaxed flex-1 min-w-0"
              style={{ color: "var(--muted-foreground)" }}
            >
              {briefingCollapsed
                ? collapsedBriefing ?? briefing
                : briefing}
            </p>
            {briefing && (
              <button
                onClick={() => {
                  const next = !briefingCollapsed;
                  setBriefingCollapsed(next);
                  localStorage.setItem(
                    "planner-briefing-collapsed",
                    String(next)
                  );
                }}
                className="text-[15px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                {briefingCollapsed ? "More" : "Less"}
              </button>
            )}
          </div>
          {briefingSource === "fallback" && hasKey && (
            <p className="text-[13px] text-muted-foreground mt-1.5 pl-8 opacity-70">
              Rule-based fallback — LLM unavailable
            </p>
          )}
          {!hasKey && (
            <p className="text-[15px] text-muted-foreground mt-2 pl-8">
              Rule-based plan —{" "}
              <a
                href="/settings"
                className="underline hover:text-foreground transition-colors"
              >
                add an API key
              </a>{" "}
              for full guidance
            </p>
          )}
        </div>

        {sideProject ? (
          <SideProjectBrief project={sideProject} onRefresh={handleRefreshSideProject} />
        ) : (
          <div
            className="rounded-sm border border-border px-4 py-4 flex items-center justify-center"
            style={{ background: "var(--card)" }}
          >
            <p className="text-[14px] text-muted-foreground">
              <a
                href="/settings"
                className="underline hover:text-foreground transition-colors"
              >
                Configure an LLM
              </a>{" "}
              for side-project suggestions
            </p>
          </div>
        )}
      </div>

      {/* Mobile: briefing */}
      <div className="md:hidden">
        {briefing && (
          <div
            className="rounded-sm px-4 py-3"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "var(--primary)" }}
              >
                <span
                  className="text-[15px] font-bold"
                  style={{ color: "var(--primary-foreground)" }}
                >
                  M
                </span>
              </div>
              <p
                className="text-[14px] leading-relaxed flex-1 min-w-0"
                style={{ color: "var(--muted-foreground)" }}
              >
                {collapsedBriefing ?? briefing}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Deadline warnings */}
      {deadlineWarnings.length > 0 && (
        <div
          className="rounded-sm px-4 py-2.5 space-y-1"
          style={{
            background:
              deadlineUrgency === "critical"
                ? "color-mix(in oklch, var(--status-danger) 15%, transparent)"
                : deadlineUrgency === "elevated"
                  ? "color-mix(in oklch, var(--status-warning) 12%, transparent)"
                  : "color-mix(in oklch, var(--muted-foreground) 8%, transparent)",
            border: `1px solid ${
              deadlineUrgency === "critical"
                ? "color-mix(in oklch, var(--status-danger) 40%, transparent)"
                : deadlineUrgency === "elevated"
                  ? "color-mix(in oklch, var(--status-warning) 35%, transparent)"
                  : "color-mix(in oklch, var(--muted-foreground) 20%, transparent)"
            }`,
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="h-3.5 w-3.5 shrink-0"
              style={{
                color:
                  deadlineUrgency === "critical"
                    ? "var(--status-danger)"
                    : deadlineUrgency === "elevated"
                      ? "var(--status-warning)"
                      : "var(--muted-foreground)",
              }}
            />
            <span
              className="text-[14px] font-medium"
              style={{ color: "var(--foreground)" }}
            >
              {deadlineUrgency === "critical"
                ? "Deadline pressure: critical"
                : deadlineUrgency === "elevated"
                  ? "Deadline pressure: elevated"
                  : "Deadline notes"}
            </span>
          </div>
          {deadlineWarnings.map((w, i) => (
            <p
              key={i}
              className="text-[14px] leading-relaxed pl-5.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Desktop: Kanban Board */}
      <p className="section-label mb-2 hidden md:block">Board</p>
      <div className="hidden md:block">
        <StatusKanbanBoard
          items={items}
          onItemUpdate={handleItemUpdate}
          onReorder={handleReorder}
          onDelete={handleDeleteItem}
        />
      </div>

      {/* Mobile: Board view */}
      <div className="md:hidden">
        <MobileBoardView
          items={items}
          sideProject={sideProject}
          goals={goals}
          onItemUpdate={handleItemUpdate}
        />
      </div>

      {/* Desktop: Secondary section */}
      <div className="hidden md:block space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <CompetencySpotlight competencies={competencies} />
          <PacingAlerts goals={goals} />
        </div>
      </div>
    </div>
  );
}
