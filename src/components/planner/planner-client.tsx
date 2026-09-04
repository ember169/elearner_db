"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusKanbanBoard } from "./kanban-board";
import { SideProjectBrief } from "./side-project-brief";
import { CompetencySpotlight } from "./competency-spotlight";
import { PacingAlerts } from "./pacing-alerts";
import { CardDetail } from "@/components/dashboard/card-detail";
import { MobileBoardView } from "./mobile-board";
import type { PlanItemData, GoalSlim, SideProject, CompetencyEntry } from "./types";
import { assertOk } from "@/lib/utils";

type SideProjectState = {
  title: string;
  goalId: number;
  status: "accepted" | "done" | "aborted";
} | null;

interface PlannerClientProps {
  boardItems: PlanItemData[];
  mentorBriefing: string | null;
  collapsedBriefing: string | null;
  objective: string;
  competencies: CompetencyEntry[];
  goals: GoalSlim[];
  sideProject?: SideProject | null;
  sideProjectState?: SideProjectState;
  hasKey: boolean;
  stale: boolean;
  // Rendered as the Board view of Home, under the Today | Board switcher. Home
  // already owns the page title, the mentor briefing and the competency pulse,
  // so in this mode we drop the h1, the briefing blocks and the competency
  // spotlight to avoid rendering them twice.
  embedded?: boolean;
}

export function PlannerClient({
  boardItems: initialItems,
  mentorBriefing: initialBriefing,
  collapsedBriefing: initialCollapsed,
  objective,
  competencies,
  goals,
  sideProject: initialSideProject,
  sideProjectState: initialSideProjectState,
  hasKey,
  stale,
  embedded = false,
}: PlannerClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<PlanItemData[]>(initialItems);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [briefing, setBriefing] = useState(initialBriefing);
  const [collapsedBriefing, setCollapsedBriefing] = useState(initialCollapsed);
  const [sideProject, setSideProject] = useState(initialSideProject);
  const [spState, setSpState] = useState<SideProjectState>(initialSideProjectState ?? null);
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

  async function handleAcceptSideProject() {
    if (!sideProject) return;
    const res = await fetch("/api/side-project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", project: sideProject }),
    });
    const data = await res.json();
    if (data.state) setSpState(data.state);
    router.refresh();
  }

  async function handleDoneSideProject() {
    await fetch("/api/side-project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "done" }),
    });
    setSpState(null);
    await handleRefreshSideProject();
    router.refresh();
  }

  async function handleAbortSideProject() {
    await fetch("/api/side-project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "abort" }),
    });
    setSpState(null);
    await handleRefreshSideProject();
    router.refresh();
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
          {!embedded && <h1 className="page-title text-cb-text">Board</h1>}
          <p className="mt-1 truncate font-cb-sans text-cb-foot text-cb-muted">
            {objective}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-2">
          <div
            className="flex items-center gap-2 rounded-cb-chip bg-cb-raised px-2.5 py-1.5"
          >
            <span className="font-cb-mono text-cb-foot tabular-nums text-cb-second">
              {totalHours.toFixed(0)}h
            </span>
            <div className="h-[3px] w-[40px] overflow-hidden rounded-[2px] bg-cb-line">
              <div
                className="h-full rounded-[2px] bg-cb-or"
                style={{
                  width: `${Math.min(100, (doneHours / Math.max(totalHours + doneHours, 1)) * 100)}%`,
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

      {/* Mentor briefing + Side project (desktop). When embedded in Home, the
          briefing lives in the Today view, so we render only the side project. */}
      {!embedded && (
        <p className="cb-label-mono mb-2 hidden text-cb-caption text-cb-muted md:block">Briefing</p>
      )}
      <div
        className={
          embedded
            ? "hidden md:block"
            : "hidden md:grid md:grid-cols-2 gap-3"
        }
      >
        {!embedded && (
        <div
          className="rounded-cb-card border border-cb-line bg-cb-card px-4 py-3"
        >
          <div className="flex items-start gap-3">
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "var(--primary)" }}
            >
              <span
                className="text-cb-body font-bold"
                style={{ color: "var(--primary-foreground)" }}
              >
                M
              </span>
            </div>
            <p
              className="text-cb-body leading-relaxed flex-1 min-w-0"
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
                className="text-cb-body text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                {briefingCollapsed ? "More" : "Less"}
              </button>
            )}
          </div>
          {briefingSource === "fallback" && hasKey && (
            <p className="text-cb-foot text-muted-foreground mt-1.5 pl-8 opacity-70">
              Rule-based fallback — LLM unavailable
            </p>
          )}
          {!hasKey && (
            <p className="text-cb-body text-muted-foreground mt-2 pl-8">
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
        )}

        {sideProject ? (
          <SideProjectBrief
            project={sideProject}
            onRefresh={handleRefreshSideProject}
            acceptedState={spState}
            onAccept={handleAcceptSideProject}
            onDone={handleDoneSideProject}
            onAbort={handleAbortSideProject}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-cb-card border border-dashed border-cb-line px-4 py-4"
            style={{ background: "var(--card)" }}
          >
            <p className="text-cb-foot text-muted-foreground">
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
        {!embedded && briefing && (
          <div
            className="rounded-cb-card border border-cb-line bg-cb-card px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "var(--primary)" }}
              >
                <span
                  className="text-cb-body font-bold"
                  style={{ color: "var(--primary-foreground)" }}
                >
                  M
                </span>
              </div>
              <p
                className="text-cb-foot leading-relaxed flex-1 min-w-0"
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
          className="space-y-1 rounded-cb-card px-4 py-2.5"
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
              className="text-cb-foot font-medium"
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
              className="text-cb-foot leading-relaxed pl-5.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Desktop: Kanban Board */}
      <p className="cb-label-mono mb-2 hidden text-cb-caption text-cb-muted md:block">Board</p>
      <div className="hidden md:block">
        <StatusKanbanBoard
          items={items}
          onItemUpdate={handleItemUpdate}
          onReorder={handleReorder}
          onDelete={handleDeleteItem}
          onOpenDetail={setDetailId}
        />
      </div>

      {/* Mobile: Board view */}
      <div className="md:hidden">
        <MobileBoardView
          items={items}
          sideProject={sideProject}
          goals={goals}
          onItemUpdate={handleItemUpdate}
          onOpenDetail={setDetailId}
        />
      </div>

      {/* Desktop: Secondary section. Embedded in Home, the competency spotlight
          is replaced by the Today competency pulse, so only pacing remains. */}
      <div className="hidden md:block space-y-3">
        {embedded ? (
          <PacingAlerts goals={goals} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <CompetencySpotlight competencies={competencies} />
            <PacingAlerts goals={goals} />
          </div>
        )}
      </div>

      {detailId !== null && (
        <CardDetail itemId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
