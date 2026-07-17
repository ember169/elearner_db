"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ChevronLeft, ChevronRight, Plus, X, Square, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonthBoard, type MonthWeek } from "./month-board";
import { TodayView, FullWeekView, BacklogView, ViewToggle } from "./mobile-views";
import { SideProjectBrief } from "./side-project-brief";
import { CompetencySpotlight } from "./competency-spotlight";
import type { PlanItemData, WeekPlanData, GoalSlim, SideProject, CompetencyEntry } from "./types";
import { assertOk } from "@/lib/utils";
import { FT_COMMON_CORE } from "@/lib/guidance/ft-project-tree";

interface PinnedTask {
  id: number;
  title: string;
  category: string | null;
  isCompleted: boolean | null;
}

export interface MonthPlanEntry {
  weekStart: string;
  weekNum: number;
  plan: WeekPlanData;
}

interface PlannerClientProps {
  monthPlans: MonthPlanEntry[];
  currentMonth: { year: number; month: number };
  todayWeek: string;
  objective: string;
  competencies: CompetencyEntry[];
  goals: GoalSlim[];
  pinnedTasks: PinnedTask[];
  sideProject?: SideProject | null;
  hasKey: boolean;
  stale: boolean;
}

const STATUS_CYCLE = ["pending", "active", "done"] as const;
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function buildGoalResolver(goals: GoalSlim[]) {
  const byTitle = new Map<string, number>();
  const byCategory = new Map<string, number>();
  for (const g of goals) {
    byTitle.set(g.title.toLowerCase(), g.id);
    if (g.category && !byCategory.has(g.category)) {
      byCategory.set(g.category, g.id);
    }
  }

  const slugToName = new Map<string, string>();
  for (const p of FT_COMMON_CORE) {
    slugToName.set(p.slug, p.name);
  }

  return function resolve(item: PlanItemData): number | null {
    if (item.ref) {
      const projectName = slugToName.get(item.ref);
      if (projectName) {
        const id = byTitle.get(projectName.toLowerCase());
        if (id) return id;
      }
      const id = byTitle.get(item.ref.toLowerCase());
      if (id) return id;
    }
    if (item.type) return byCategory.get(item.type) ?? null;
    return null;
  };
}

function attachGoalIds(items: PlanItemData[], resolve: (item: PlanItemData) => number | null): PlanItemData[] {
  return items.map((item) => ({ ...item, goalId: resolve(item) }));
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getTodayIdx(weekStart: string): number {
  const now = new Date();
  const start = new Date(weekStart + "T00:00:00");
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  if (diff < 0 || diff > 6) return -1;
  return diff;
}

export function PlannerClient({
  monthPlans: initialMonthPlans,
  currentMonth: initialMonth,
  todayWeek,
  objective,
  competencies,
  goals,
  pinnedTasks: initialPinned,
  sideProject: initialSideProject,
  hasKey,
  stale,
}: PlannerClientProps) {
  const router = useRouter();
  const resolveGoal = buildGoalResolver(goals);
  const [month, setMonth] = useState(initialMonth);
  const [weeks, setWeeks] = useState<MonthWeek[]>(
    initialMonthPlans.map((mp) => ({ weekStart: mp.weekStart, weekNum: mp.weekNum, items: attachGoalIds(mp.plan.items, resolveGoal) }))
  );
  const [sideProject, setSideProject] = useState(initialSideProject);
  const [regenerating, setRegenerating] = useState(false);
  const [regenStep, setRegenStep] = useState<string | null>(null);
  const [pinned, setPinned] = useState(initialPinned);
  const [newTask, setNewTask] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [deadlineWarnings, setDeadlineWarnings] = useState<string[]>([]);
  const [deadlineUrgency, setDeadlineUrgency] = useState<string>("normal");
  const [mobileView, setMobileView] = useState<"today" | "week" | "backlog">("today");

  const [briefingCollapsed, setBriefingCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("planner-briefing-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("planner-briefing-collapsed", String(briefingCollapsed));
  }, [briefingCollapsed]);

  const currentWeekData = initialMonthPlans.find((mp) => mp.weekStart === todayWeek);
  const briefing = currentWeekData?.plan.mentorBriefing ?? initialMonthPlans[0]?.plan.mentorBriefing ?? null;
  const collapsedBriefing = currentWeekData?.plan.collapsedBriefing ?? initialMonthPlans[0]?.plan.collapsedBriefing ?? null;

  const isCurrentMonth = month.year === initialMonth.year && month.month === initialMonth.month;
  const monthLabel = `${MONTH_NAMES[month.month]} ${month.year}`;
  const todayStr = getTodayStr();

  const allVisibleItems = weeks.flatMap((w) => w.items).filter((i) => i.status !== "deferred");
  const totalMonthHours = allVisibleItems.reduce((s, i) => s + (i.estimatedHours ?? 2), 0);
  const doneMonthHours = allVisibleItems.filter((i) => i.status === "done").reduce((s, i) => s + (i.estimatedHours ?? 2), 0);

  // Mobile: current week items
  const mobileWeek = weeks.find((w) => w.weekStart === todayWeek) ?? weeks[0];
  const mobileItems = mobileWeek?.items ?? [];
  const mobileTodayIdx = mobileWeek ? getTodayIdx(mobileWeek.weekStart) : 0;
  const mobileBacklogCount = mobileItems.filter((i) => i.dayIndex === null && i.status !== "deferred").length;

  async function navigateMonth(delta: number) {
    let newMonth = month.month + delta;
    let newYear = month.year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setMonth({ year: newYear, month: newMonth });
    const res = await fetch(`/api/week?month=${newYear}-${String(newMonth + 1).padStart(2, "0")}`);
    const data = await res.json();
    setWeeks(
      data.plans.map((p: { weekStart: string; weekNum: number; plan: WeekPlanData }) => ({
        weekStart: p.weekStart,
        weekNum: p.weekNum,
        items: attachGoalIds(p.plan.items, resolveGoal),
      }))
    );
  }

  const cycleStatus = useCallback((id: number) => {
    setWeeks((prev) =>
      prev.map((w) => ({
        ...w,
        items: w.items.map((item) => {
          if (item.id !== id) return item;
          const idx = STATUS_CYCLE.indexOf(item.status as (typeof STATUS_CYCLE)[number]);
          const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
          fetch("/api/week", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: next }),
          });
          return { ...item, status: next, completedAt: next === "done" ? new Date().toISOString() : null };
        }),
      }))
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
      setWeeks((prev) =>
        prev.map((w) => ({
          ...w,
          items: w.items.map((item) => item.id === id ? { ...item, status: "deferred", deferredTo } : item),
        }))
      );
    } else {
      fetch("/api/week", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: action }),
      });
      setWeeks((prev) =>
        prev.map((w) => ({
          ...w,
          items: w.items.map((item) => item.id === id ? { ...item, status: action } : item),
        }))
      );
    }
  }, []);

  const handleMoveItem = useCallback((id: number, sourceWeek: string, targetWeek: string, targetDay: number) => {
    if (sourceWeek === targetWeek) {
      setWeeks((prev) =>
        prev.map((w) => ({
          ...w,
          items: w.items.map((item) => item.id === id ? { ...item, dayIndex: targetDay } : item),
        }))
      );
      fetch("/api/week", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, dayIndex: targetDay }),
      });
    } else {
      setWeeks((prev) => {
        const item = prev.flatMap((w) => w.items).find((i) => i.id === id);
        if (!item) return prev;
        return prev.map((w) => {
          if (w.weekStart === sourceWeek) {
            return { ...w, items: w.items.filter((i) => i.id !== id) };
          }
          if (w.weekStart === targetWeek) {
            return { ...w, items: [...w.items, { ...item, dayIndex: targetDay }] };
          }
          return w;
        });
      });
      fetch("/api/week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move-item", itemId: id, targetWeek, targetDayIndex: targetDay }),
      });
    }
  }, []);

  const handleStatusChange = useCallback((id: number, status: string) => {
    fetch("/api/week", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setWeeks((prev) =>
      prev.map((w) => ({
        ...w,
        items: w.items.map((item) =>
          item.id === id ? { ...item, status, completedAt: status === "done" ? new Date().toISOString() : null } : item
        ),
      }))
    );
  }, []);

  const handleSchedule = useCallback((id: number, dayIndex: number) => {
    fetch("/api/week", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, dayIndex, status: "pending" }),
    });
    setWeeks((prev) =>
      prev.map((w) => ({
        ...w,
        items: w.items.map((item) =>
          item.id === id ? { ...item, dayIndex, status: "pending" } : item
        ),
      }))
    );
  }, []);

  const handleDrop = useCallback((id: number) => {
    fetch("/api/week", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "deferred", deferredTo: "9999-12-31" }),
    });
    setWeeks((prev) =>
      prev.map((w) => ({
        ...w,
        items: w.items.map((item) =>
          item.id === id ? { ...item, status: "deferred", deferredTo: "9999-12-31" } : item
        ),
      }))
    );
  }, []);

  async function handleRegenerate() {
    setRegenerating(true);
    setRegenStep("Running rule engine...");
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
      if (mentorData.warnings) {
        setDeadlineWarnings(mentorData.warnings);
      }
      if (mentorData.deadlinePressure) {
        setDeadlineUrgency(mentorData.deadlinePressure.urgency);
      }

      setRegenStep("Building month schedule...");
      const weekStarts = weeks.map((w) => w.weekStart);
      const res = await fetch("/api/week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reroll-month", weekStarts }),
      });
      const data = await res.json();
      setWeeks(
        data.plans.map((p: { weekStart: string; weekNum: number; plan: WeekPlanData }) => ({
          weekStart: p.weekStart,
          weekNum: p.weekNum,
          items: attachGoalIds(p.plan.items, resolveGoal),
        }))
      );
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
      alert(e instanceof Error ? e.message : "Failed.");
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

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold tracking-tight leading-tight">Planner</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
            {monthLabel} · {objective}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-2">
          <button onClick={() => navigateMonth(-1)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[12px] font-semibold text-primary tabular-nums">
            {MONTH_NAMES[month.month].slice(0, 3)} {month.year}
          </span>
          <button onClick={() => navigateMonth(1)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ChevronRight className="h-4 w-4" />
          </button>

          <div
            className="flex items-center gap-1.5 rounded-sm px-2.5 py-1 ml-1"
            style={{ background: "var(--muted)" }}
          >
            <span className="text-[11px] font-semibold tabular-nums">{totalMonthHours.toFixed(0)}h</span>
            <div className="w-[40px] h-1 rounded-[1px] overflow-hidden" style={{ background: "var(--accent)" }}>
              <div
                className="h-full rounded-[1px]"
                style={{
                  width: `${Math.min(100, (doneMonthHours / Math.max(totalMonthHours, 1)) * 100)}%`,
                  background: "var(--primary)",
                }}
              />
            </div>
          </div>

          <Button variant="outline" size="xs" onClick={handleRegenerate} disabled={regenerating} className="ml-1">
            <RefreshCw className={`h-3 w-3 mr-1 ${regenerating ? "animate-spin" : ""}`} />
            {regenerating ? "..." : "Regenerate"}
          </Button>
        </div>
      </div>

      {/* ── Regen progress ── */}
      {regenStep && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-sm border border-primary/30" style={{ background: "color-mix(in oklch, var(--primary) 4%, transparent)" }}>
          <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
          <span className="text-[13px] text-primary font-medium">{regenStep}</span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "color-mix(in oklch, var(--primary) 10%, transparent)" }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                background: "var(--primary)",
                width: regenStep === "Running rule engine..." ? "30%" : regenStep === "Building month schedule..." ? "75%" : "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Mentor briefing + Side project (2-col on desktop) ── */}
      <div className="hidden md:grid md:grid-cols-2 gap-3">
        <div
          className="rounded-sm px-4 py-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "var(--primary)" }}
            >
              <span className="text-[9px] font-bold" style={{ color: "var(--primary-foreground)" }}>M</span>
            </div>
            <p className="text-[13px] leading-relaxed flex-1 min-w-0" style={{ color: "var(--muted-foreground)" }}>
              {briefingCollapsed ? collapsedBriefing ?? briefing : briefing}
            </p>
            {briefing && (
              <button
                onClick={() => setBriefingCollapsed(!briefingCollapsed)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                {briefingCollapsed ? "More" : "Less"}
              </button>
            )}
          </div>
          {!hasKey && (
            <p className="text-[11px] text-muted-foreground mt-2 pl-8">
              Rule-based plan —{" "}
              <a href="/settings" className="underline hover:text-foreground transition-colors">add an API key</a>{" "}
              for full guidance
            </p>
          )}
        </div>

        {sideProject ? (
          <SideProjectBrief project={sideProject} />
        ) : (
          <div
            className="rounded-sm border border-border px-4 py-4 flex items-center justify-center"
            style={{ background: "var(--card)" }}
          >
            <p className="text-[12px] text-muted-foreground">
              <a href="/settings" className="underline hover:text-foreground transition-colors">Configure an LLM</a>{" "}
              for side-project suggestions
            </p>
          </div>
        )}
      </div>

      {/* Mobile: briefing only */}
      <div className="md:hidden">
        {briefing && (
          <div
            className="rounded-sm px-4 py-3"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "var(--primary)" }}
              >
                <span className="text-[9px] font-bold" style={{ color: "var(--primary-foreground)" }}>M</span>
              </div>
              <p className="text-[12px] leading-relaxed flex-1 min-w-0" style={{ color: "var(--muted-foreground)" }}>
                {collapsedBriefing ?? briefing}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Deadline warnings ── */}
      {deadlineWarnings.length > 0 && (
        <div
          className="rounded-sm px-4 py-2.5 space-y-1"
          style={{
            background: deadlineUrgency === "critical"
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
                color: deadlineUrgency === "critical"
                  ? "var(--status-danger)"
                  : deadlineUrgency === "elevated"
                    ? "var(--status-warning)"
                    : "var(--muted-foreground)",
              }}
            />
            <span className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>
              {deadlineUrgency === "critical" ? "Deadline pressure: critical" : deadlineUrgency === "elevated" ? "Deadline pressure: elevated" : "Deadline notes"}
            </span>
          </div>
          {deadlineWarnings.map((w, i) => (
            <p key={i} className="text-[12px] leading-relaxed pl-5.5" style={{ color: "var(--muted-foreground)" }}>
              {w}
            </p>
          ))}
        </div>
      )}

      {/* ── Desktop: Month Board ── */}
      <div className="hidden md:block">
        <MonthBoard
          weeks={weeks}
          todayStr={todayStr}
          monthNum={month.month}
          onStatusToggle={cycleStatus}
          onMenuAction={handleMenuAction}
          onMoveItem={handleMoveItem}
        />
      </div>

      {/* ── Mobile: weekly views ── */}
      <div className="md:hidden">
        <ViewToggle active={mobileView} backlogCount={mobileBacklogCount} onChange={setMobileView} />
        <div className="mt-3">
          {mobileView === "today" && (
            <TodayView
              items={mobileItems}
              weekStart={mobileWeek?.weekStart ?? todayWeek}
              todayIdx={mobileTodayIdx >= 0 ? mobileTodayIdx : 0}
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
              items={mobileItems}
              weekStart={mobileWeek?.weekStart ?? todayWeek}
              todayIdx={mobileTodayIdx >= 0 ? mobileTodayIdx : 0}
              totalHours={mobileItems.filter((i) => i.status !== "deferred").reduce((s, i) => s + (i.estimatedHours ?? 2), 0)}
              budgetTotal={35}
              onWeekSwipe={() => {}}
            />
          )}
          {mobileView === "backlog" && (
            <BacklogView
              items={mobileItems}
              weekStart={mobileWeek?.weekStart ?? todayWeek}
              onSchedule={handleSchedule}
              onStatusChange={handleStatusChange}
              onDrop={handleDrop}
            />
          )}
        </div>
      </div>

      {/* ── Secondary section (desktop) ── */}
      <div className="hidden md:block space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <CompetencySpotlight competencies={competencies} />
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
    </div>
  );
}
