"use client";

import { useState, useCallback, useEffect } from "react";
import { RefreshCw, ChevronLeft, ChevronRight, Plus, X, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PulseBar, type PlatformStatus } from "./pulse-bar";
import { KanbanBoard } from "./kanban-board";
import { TodayView, FullWeekView, BacklogView, ViewToggle } from "./mobile-views";
import { SideProjectBrief } from "./side-project-brief";
import { CompetencySpotlight } from "./competency-spotlight";
import type { PlanItemData, WeekPlanData, GoalSlim, SideProject, CompetencyEntry } from "./types";
import { assertOk } from "@/lib/utils";

interface PinnedTask {
  id: number;
  title: string;
  category: string | null;
  isCompleted: boolean | null;
}

interface PlannerClientProps {
  initialPlan: WeekPlanData;
  initialWeek: string;
  objective: string;
  platforms: PlatformStatus;
  lastSync: string | null;
  competencies: CompetencyEntry[];
  goals: GoalSlim[];
  pinnedTasks: PinnedTask[];
  sideProject?: SideProject | null;
  hasKey: boolean;
  stale: boolean;
}

const STATUS_CYCLE = ["pending", "active", "done"] as const;

function getWeekDates(weekStart: string) {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function getISOWeekNumber(weekStart: string): number {
  const d = new Date(weekStart + "T12:00:00");
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getTodayIdx(weekStart: string): number {
  const now = new Date();
  const start = new Date(weekStart + "T00:00:00");
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  if (diff < 0 || diff > 6) return -1;
  return diff;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PlannerClient({
  initialPlan,
  initialWeek,
  objective,
  platforms,
  lastSync,
  competencies,
  goals,
  pinnedTasks: initialPinned,
  sideProject: initialSideProject,
  hasKey,
  stale,
}: PlannerClientProps) {
  const [currentWeek, setCurrentWeek] = useState(initialWeek);
  const [plan, setPlan] = useState(initialPlan);
  const [items, setItems] = useState<PlanItemData[]>(initialPlan.items);
  const [sideProject, setSideProject] = useState(initialSideProject);
  const [syncing, setSyncing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenStep, setRegenStep] = useState<string | null>(null);
  const [briefingCollapsed, setBriefingCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("planner-briefing-collapsed") === "true";
  });
  const [mobileView, setMobileView] = useState<"today" | "week" | "backlog">("today");
  const [pinned, setPinned] = useState(initialPinned);
  const [newTask, setNewTask] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  const { start, end } = getWeekDates(currentWeek);
  const weekNum = getISOWeekNumber(currentWeek);
  const todayIdx = getTodayIdx(currentWeek);
  const isCurrentWeek = currentWeek === initialWeek;
  const readOnly = !isCurrentWeek;

  const visibleItems = items.filter((i) => i.status !== "deferred");
  const totalHours = visibleItems.reduce((s, i) => s + (i.estimatedHours ?? 2), 0);
  const doneHours = visibleItems.filter((i) => i.status === "done").reduce((s, i) => s + (i.estimatedHours ?? 2), 0);
  const backlogCount = visibleItems.filter((i) => i.dayIndex === null).length;

  useEffect(() => {
    localStorage.setItem("planner-briefing-collapsed", String(briefingCollapsed));
  }, [briefingCollapsed]);

  const navigateWeek = useCallback(async (delta: number) => {
    const d = new Date(currentWeek + "T12:00:00");
    d.setDate(d.getDate() + delta * 7);
    const newWeek = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setCurrentWeek(newWeek);
    const res = await fetch(`/api/week?week=${newWeek}`);
    const data = await res.json();
    setPlan(data);
    setItems(data.items);
  }, [currentWeek]);

  const cycleStatus = useCallback((id: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const idx = STATUS_CYCLE.indexOf(item.status as (typeof STATUS_CYCLE)[number]);
        const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        fetch("/api/week", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: next }),
        });
        return { ...item, status: next, completedAt: next === "done" ? new Date().toISOString() : null };
      })
    );
  }, []);

  const handleMenuAction = useCallback((id: number, action: string) => {
    if (action === "deferred") {
      const oneWeek = new Date();
      oneWeek.setDate(oneWeek.getDate() + 7);
      const deferredTo = oneWeek.toISOString().slice(0, 10);
      fetch("/api/week", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "deferred", deferredTo }),
      });
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, status: "deferred", deferredTo } : item));
    } else {
      fetch("/api/week", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: action }),
      });
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, status: action } : item));
    }
  }, []);

  const handleStatusChange = useCallback((id: number, status: string) => {
    fetch("/api/week", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, status, completedAt: status === "done" ? new Date().toISOString() : null } : item
    ));
  }, []);

  const handleSchedule = useCallback((id: number, dayIndex: number) => {
    fetch("/api/week", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, dayIndex, status: "pending" }),
    });
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, dayIndex, status: "pending" } : item
    ));
  }, []);

  const handleDrop = useCallback((id: number) => {
    fetch("/api/week", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "deferred", deferredTo: "9999-12-31" }),
    });
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, status: "deferred", deferredTo: "9999-12-31" } : item
    ));
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      await assertOk(res);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Sync failed.");
      setSyncing(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setRegenStep("Asking mentor LLM...");
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

      setRegenStep("Building week schedule...");
      const res = await fetch("/api/week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reroll", week: currentWeek }),
      });
      const data = await res.json();
      setPlan(data);
      setItems(data.items);
      setRegenStep("Done");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Regeneration failed.");
    } finally {
      setTimeout(() => {
        setRegenerating(false);
        setRegenStep(null);
      }, 800);
    }
  }

  async function addPinnedTask() {
    if (!newTask.trim()) return;
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask.trim(), category: "general" }),
      });
      await assertOk(res);
      const task = await res.json();
      setPinned((prev) => [...prev, task]);
      setNewTask("");
      setShowAddTask(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add task.");
    }
  }

  async function completePinnedTask(id: number) {
    try {
      const res = await fetch("/api/checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isCompleted: true }),
      });
      await assertOk(res);
      setPinned((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to complete task.");
    }
  }

  async function deletePinnedTask(id: number) {
    try {
      const res = await fetch("/api/checklist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await assertOk(res);
      setPinned((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed.");
    }
  }

  const prevWeekNum = getISOWeekNumber((() => { const d = new Date(currentWeek + "T12:00:00"); d.setDate(d.getDate() - 7); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })());
  const nextWeekNum = getISOWeekNumber((() => { const d = new Date(currentWeek + "T12:00:00"); d.setDate(d.getDate() + 7); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })());

  return (
    <div className="max-w-[1060px] space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold tracking-tight leading-tight">Planner</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
            Week {weekNum} · {formatDate(start)}–{formatDate(end)} · {objective}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-2">
          <button onClick={() => navigateWeek(-1)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[11px] text-muted-foreground tabular-nums">Wk {prevWeekNum}</span>
          <span className="text-[12px] font-semibold text-primary tabular-nums">Wk {weekNum}</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">Wk {nextWeekNum}</span>
          <button onClick={() => navigateWeek(1)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ChevronRight className="h-4 w-4" />
          </button>

          <Button variant="outline" size="xs" onClick={handleRegenerate} disabled={regenerating} className="ml-2">
            <RefreshCw className={`h-3 w-3 mr-1 ${regenerating ? "animate-spin" : ""}`} />
            {regenerating ? "..." : "Regenerate"}
          </Button>
        </div>
      </div>

      {regenStep && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-sm border border-primary/30" style={{ background: "oklch(0.82 0.055 80 / 0.04)" }}>
          <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
          <span className="text-[13px] text-primary font-medium">{regenStep}</span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "oklch(0.82 0.055 80 / 0.1)" }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                background: "var(--primary)",
                width: regenStep === "Asking mentor LLM..." ? "30%" : regenStep === "Building week schedule..." ? "75%" : "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Mentor briefing (collapsible) ── */}
      {plan.mentorBriefing && (
        <div
          className="rounded-sm px-4 py-3"
          style={{
            background: "oklch(0.17 0.005 75)",
            border: "1px solid oklch(0.25 0.007 70)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "oklch(0.82 0.055 80)" }}
            >
              <span className="text-[9px] font-bold" style={{ color: "oklch(0.135 0.004 75)" }}>M</span>
            </div>
            <p className="text-[13px] leading-relaxed flex-1 min-w-0" style={{ color: "oklch(0.72 0.01 80)" }}>
              {briefingCollapsed ? plan.collapsedBriefing ?? plan.mentorBriefing : plan.mentorBriefing}
            </p>
            <button
              onClick={() => setBriefingCollapsed(!briefingCollapsed)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {briefingCollapsed ? "Expand ↓" : "Collapse ↑"}
            </button>
          </div>
        </div>
      )}

      {!hasKey && (
        <p className="text-[12px] text-muted-foreground -mt-2">
          Rule-based plan —{" "}
          <a href="/settings" className="underline hover:text-foreground transition-colors">add an API key</a>{" "}
          for full mentor guidance
        </p>
      )}

      {/* ── Pulse + budget ── */}
      <PulseBar
        platforms={platforms}
        syncing={syncing}
        onSync={handleSync}
        budgetUsed={totalHours}
        budgetTotal={35}
      />

      {/* ── Desktop: Kanban Board ── */}
      <div className="hidden md:block">
        <KanbanBoard
          items={items}
          weekStart={currentWeek}
          todayIdx={todayIdx}
          readOnly={readOnly}
          onItemsChange={setItems}
          onStatusToggle={cycleStatus}
          onMenuAction={handleMenuAction}
        />

        {/* Hints bar */}
        <div className="flex items-center gap-4 flex-wrap mt-3 text-[11px]" style={{ color: "oklch(0.45 0.01 80)" }}>
          <span>⇄ Drag cards between days</span>
          <span>Click card → mark done / stuck / blocked</span>
          <span>Drop on Backlog to unschedule</span>
          {goals.length > 0 && (
            <span className="ml-auto">
              Goal coverage:{" "}
              {goals.map((g, i) => {
                const onTrack = g.pacing?.onTrack ?? true;
                return (
                  <span key={g.id}>
                    {i > 0 && " · "}
                    <span style={{ color: onTrack ? "var(--status-success)" : "var(--status-warning)" }}>
                      {g.title.length > 15 ? g.title.slice(0, 13) + "…" : g.title} {onTrack ? "✓" : "⚠"}
                    </span>
                  </span>
                );
              })}
            </span>
          )}
        </div>
      </div>

      {/* ── Mobile: View Toggle + Views ── */}
      <div className="md:hidden">
        <ViewToggle active={mobileView} backlogCount={backlogCount} onChange={setMobileView} />
        <div className="mt-3">
          {mobileView === "today" && (
            <TodayView
              items={items}
              weekStart={currentWeek}
              todayIdx={todayIdx >= 0 ? todayIdx : 0}
              sideProject={sideProject}
              pinnedTasks={pinned.map((t) => ({ id: t.id, title: t.title }))}
              onStatusChange={handleStatusChange}
              onAddPinned={async (title) => {
                const res = await fetch("/api/checklist", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title, category: "general" }),
                });
                const task = await res.json();
                setPinned((prev) => [...prev, task]);
              }}
              onCompletePinned={completePinnedTask}
            />
          )}
          {mobileView === "week" && (
            <FullWeekView
              items={items}
              weekStart={currentWeek}
              todayIdx={todayIdx >= 0 ? todayIdx : 0}
              totalHours={totalHours}
              budgetTotal={35}
              onWeekSwipe={navigateWeek}
            />
          )}
          {mobileView === "backlog" && (
            <BacklogView
              items={items}
              weekStart={currentWeek}
              onSchedule={handleSchedule}
              onStatusChange={handleStatusChange}
              onDrop={handleDrop}
            />
          )}
        </div>
      </div>

      {/* ── Side project + Competency (desktop only, side by side) ── */}
      <div className={`hidden md:grid gap-3 ${sideProject ? "grid-cols-2" : "grid-cols-1"}`}>
        {sideProject && (
          <SideProjectBrief project={sideProject} weekLabel={`· WK${weekNum}`} />
        )}
        <CompetencySpotlight competencies={competencies} />
      </div>

      {/* ── Pinned tasks (desktop) ── */}
      <div className="hidden md:block">
        <div className="flex items-center gap-3 flex-wrap px-4 py-2.5 rounded-sm border border-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pinned</span>
          {pinned.map((task) => (
            <div key={task.id} className="flex items-center gap-1.5 group">
              <button onClick={() => completePinnedTask(task.id)} className="text-muted-foreground hover:text-success transition-colors">
                <Square className="h-3 w-3" />
              </button>
              <span className="text-[12px]">{task.title}</span>
              <button onClick={() => deletePinnedTask(task.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger transition-all">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {showAddTask ? (
            <div className="flex gap-1.5 items-center">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Task..."
                className="h-6 text-[12px] w-40"
                onKeyDown={(e) => e.key === "Enter" && addPinnedTask()}
                autoFocus
              />
              <Button size="xs" onClick={addPinnedTask} className="h-6 text-[10px]">Add</Button>
              <button onClick={() => { setShowAddTask(false); setNewTask(""); }} className="text-muted-foreground"><X className="h-3 w-3" /></button>
            </div>
          ) : (
            <button onClick={() => setShowAddTask(true)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="h-3 w-3" /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
