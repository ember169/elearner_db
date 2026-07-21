"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Plus,
  Zap,
} from "lucide-react";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";
import type { GoalWithPacing } from "@/lib/guidance/engine";
import { assertOk } from "@/lib/utils";

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtMonth(iso: string): string {
  const [y, m] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} '${y.slice(2)}`;
}

type NavState =
  | { view: "list" }
  | { view: "detail"; goalId: number };

function findGoalById(id: number, tree: GoalWithPacing[]): GoalWithPacing | null {
  for (const g of tree) {
    if (g.id === id) return g;
    const found = findGoalById(id, g.children);
    if (found) return found;
  }
  return null;
}

function findParent(goalId: number, tree: GoalWithPacing[]): GoalWithPacing | null {
  for (const g of tree) {
    for (const c of g.children) {
      if (c.id === goalId) return g;
      const found = findParent(goalId, [c]);
      if (found) return found;
    }
  }
  return null;
}

function GoalCard({
  goal,
  onTap,
}: {
  goal: GoalWithPacing;
  onTap: () => void;
}) {
  const platformColor = PLATFORM_COLORS[goal.category ?? "general"];
  const isEpic = goal.children.length > 0 && !goal.parentGoalId;
  const isCadence = goal.goalType === "cadence";
  const progress =
    goal.targetValue && goal.currentValue != null
      ? Math.round((goal.currentValue / goal.targetValue) * 100)
      : 0;
  const isBehind = goal.pacing && !goal.pacing.onTrack && goal.pacing.percentComplete < 100;

  return (
    <button
      className="w-full text-left rounded-sm border border-border overflow-hidden"
      onClick={onTap}
    >
      <div className="h-[3px]" style={{ backgroundColor: platformColor }} />
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {isEpic && (
                <>
                  <Badge
                    variant="outline"
                    className="text-[14px] px-1 py-0"
                    style={{ borderColor: platformColor, color: platformColor }}
                  >
                    EPIC
                  </Badge>
                  <span className="text-[15px] font-bold" style={{ color: platformColor }}>
                    {PLATFORM_LABELS[goal.category ?? "general"]}
                  </span>
                </>
              )}
              {isCadence && (
                <Badge variant="outline" className="text-[14px] px-1 py-0 font-mono">
                  /wk
                </Badge>
              )}
            </div>
            <h3 className="text-[14px] font-semibold truncate">{goal.title}</h3>
            {isCadence && goal.pacing && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[14px] px-1 py-0"
                  style={{
                    borderColor: goal.pacing.onTrack ? "var(--status-success)" : "var(--status-danger)",
                    color: goal.pacing.onTrack ? "var(--status-success)" : "var(--status-danger)",
                  }}
                >
                  {goal.pacing.onTrack ? "ON PACE" : "BEHIND"}
                </Badge>
                <span className="text-[14px] text-muted-foreground">
                  {goal.currentValue ?? 0}/{goal.cadenceValue ?? 0} this week
                </span>
              </div>
            )}
            {!isCadence && !isEpic && goal.deadline && (
              <p className="text-[14px] text-muted-foreground">
                by {fmtMonth(goal.deadline)} · {goal.metricSource ? "Auto" : "Manual"}
              </p>
            )}
            {isEpic && (
              <div className="flex items-center gap-1 flex-wrap">
                {goal.children.map((child) => {
                  const done = child.status === "completed";
                  const behind = child.pacing && !child.pacing.onTrack && child.pacing.percentComplete < 100;
                  return (
                    <span
                      key={child.id}
                      className={`text-[15px] px-1.5 py-0.5 rounded-sm ${
                        done
                          ? "bg-green-500/10 text-green-500"
                          : behind
                          ? "bg-red-500/10 text-red-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? "✓ " : ""}
                      {child.title.replace("Complete ", "")} · {child.currentValue ?? 0}/{child.targetValue ?? child.children.length}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            {isCadence ? (
              <span className="text-[28px] font-bold" style={{ color: platformColor }}>
                {goal.currentValue ?? 0}
              </span>
            ) : (
              <div>
                <span className="text-[18px] font-bold">{progress}%</span>
                {goal.targetValue && (
                  <p className="text-[15px] text-muted-foreground">
                    {goal.currentValue ?? 0}/{goal.targetValue}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {!isCadence && (
          <Progress
            value={progress}
            className="h-[3px]"
            style={
              { "--progress-foreground": isBehind ? "var(--status-danger)" : platformColor } as React.CSSProperties
            }
          />
        )}
      </div>
    </button>
  );
}

function MobileGoalsList({
  goals,
  onTap,
  onSuggest,
  onNewGoal,
}: {
  goals: GoalWithPacing[];
  onTap: (id: number) => void;
  onSuggest: () => void;
  onNewGoal: () => void;
}) {
  const behindGoals = goals.filter(
    (g) => g.status === "active" && g.pacing && !g.pacing.onTrack && g.pacing.percentComplete < 100
  );

  let activeCount = 0;
  for (const g of goals) {
    if (g.status === "active") activeCount++;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-14 pb-2">
        <div>
          <h1 className="text-[22px] font-bold">Goals</h1>
          <p className="text-[15px] text-muted-foreground">
            {activeCount} active
            {behindGoals.length > 0 && (
              <span className="text-red-400"> · {behindGoals.length} behind</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
            onClick={onSuggest}
          >
            <Zap className="h-4 w-4" />
          </button>
          <button
            className="h-8 w-8 rounded-full flex items-center justify-center text-background"
            style={{ backgroundColor: "var(--primary)" }}
            onClick={onNewGoal}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {behindGoals.length > 0 && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-sm bg-red-500/10 border border-red-500/20">
          {behindGoals.map((g) => (
            <div key={g.id} className="flex items-center gap-1.5 text-[15px] text-red-400 py-0.5">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{g.title} behind pace</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onTap={() => onTap(goal.id)} />
        ))}
      </div>
    </div>
  );
}

function MobileEpicView({
  goal,
  allGoals,
  onBack,
  onTap,
  onNewChild,
}: {
  goal: GoalWithPacing;
  allGoals: GoalWithPacing[];
  onBack: () => void;
  onTap: (id: number) => void;
  onNewChild: () => void;
}) {
  const platformColor = PLATFORM_COLORS[goal.category ?? "general"];
  const progress =
    goal.targetValue && goal.currentValue != null
      ? Math.round((goal.currentValue / goal.targetValue) * 100)
      : 0;
  const isBehind = goal.pacing && !goal.pacing.onTrack && goal.pacing.percentComplete < 100;
  const childrenDone = goal.children.filter((c) => c.status === "completed").length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-14 pb-3">
        <button
          className="flex items-center gap-1 text-[14px] text-muted-foreground mb-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-3 w-3" />
          Goals
        </button>
        <div className="flex items-center gap-1.5 mb-1">
          <Badge
            variant="outline"
            className="text-[14px] px-1 py-0"
            style={{ borderColor: platformColor, color: platformColor }}
          >
            EPIC
          </Badge>
          <span className="text-[15px] font-bold" style={{ color: platformColor }}>
            {PLATFORM_LABELS[goal.category ?? "general"]}
          </span>
        </div>
        <h1 className="text-[20px] font-bold">{goal.title}</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="outline"
            className="text-[14px] px-1 py-0"
            style={{
              borderColor: isBehind ? "var(--status-danger)" : "var(--status-success)",
              color: isBehind ? "var(--status-danger)" : "var(--status-success)",
            }}
          >
            {isBehind ? "BEHIND" : "ON TRACK"}
          </Badge>
          {goal.deadline && (
            <span className="text-[15px] text-muted-foreground">
              by {fmtMonth(goal.deadline)}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-sm border border-border p-3 text-center">
          <div>
            <span className="text-[22px] font-bold">{goal.currentValue ?? 0}</span>
            <span className="text-[14px] text-muted-foreground">/{goal.targetValue ?? "?"}</span>
          </div>
          <p className="text-[14px] text-muted-foreground">Projects</p>
        </div>
        <div className="rounded-sm border border-border p-3 text-center">
          <div>
            <span className="text-[22px] font-bold">{childrenDone}</span>
            <span className="text-[14px] text-muted-foreground">/{goal.children.length}</span>
          </div>
          <p className="text-[14px] text-muted-foreground">Milestones</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="text-[14px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Issues
        </p>
        <div className="space-y-1">
          {goal.children.map((child) => {
            const done = child.status === "completed";
            const behind =
              child.pacing && !child.pacing.onTrack && child.pacing.percentComplete < 100;
            return (
              <button
                key={child.id}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-sm border border-border text-left ${
                  done ? "opacity-40" : behind ? "border-red-500/20" : ""
                }`}
                onClick={() => onTap(child.id)}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : null}
                <span className={`text-[15px] flex-1 ${done ? "line-through" : "font-medium"}`}>
                  {child.title.replace("Complete ", "")}
                </span>
                {behind && (
                  <Badge variant="outline" className="text-[14px] px-1 py-0 text-red-400 border-red-400">
                    BEHIND
                  </Badge>
                )}
                <span className="text-[14px] text-muted-foreground">
                  {child.currentValue ?? 0}/{child.targetValue ?? child.children.length}
                </span>
                {!done && <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              </button>
            );
          })}
          <button
            className="w-full py-2.5 rounded-sm border border-dashed border-border text-[14px] text-muted-foreground"
            onClick={onNewChild}
          >
            + Add issue
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileIssueView({
  goal,
  parent,
  onBack,
  onTap,
  onNewChild,
}: {
  goal: GoalWithPacing;
  parent: GoalWithPacing | null;
  onBack: () => void;
  onTap: (id: number) => void;
  onNewChild: () => void;
}) {
  const platformColor = PLATFORM_COLORS[goal.category ?? "general"];
  const isBehind = goal.pacing && !goal.pacing.onTrack && goal.pacing.percentComplete < 100;
  const doneCount = goal.children.filter((c) => c.status === "completed").length;
  const progress = goal.children.length > 0 ? Math.round((doneCount / goal.children.length) * 100) : 0;

  const daysLeft = goal.deadline
    ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-14 pb-3">
        <button
          className="flex items-center gap-1 text-[14px] text-muted-foreground mb-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-3 w-3" />
          {parent?.title.replace("Complete ", "") ?? "Goals"}
        </button>
        <div className="flex items-center gap-1.5 mb-1">
          <Badge variant="outline" className="text-[14px] px-1 py-0">
            ISSUE
          </Badge>
          {isBehind && (
            <Badge variant="outline" className="text-[14px] px-1 py-0 text-red-400 border-red-400">
              BEHIND
            </Badge>
          )}
        </div>
        <h1 className="text-[20px] font-bold">{goal.title.replace("Complete ", "")}</h1>
        <p className="text-[15px] text-muted-foreground mt-0.5">
          {goal.deadline && <>by {fmtDate(goal.deadline)} · </>}
          {daysLeft !== null && <>{daysLeft}d left · </>}
          {doneCount}/{goal.children.length} tasks
        </p>
        <Progress
          value={progress}
          className="h-[3px] mt-2"
          style={
            { "--progress-foreground": isBehind ? "var(--status-danger)" : platformColor } as React.CSSProperties
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="text-[14px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Tasks
        </p>
        <div className="space-y-1">
          {goal.children.map((task) => {
            const done = task.status === "completed";
            const taskDeadlineWarning =
              !done &&
              task.deadline &&
              goal.deadline &&
              task.deadline > goal.deadline;
            return (
              <button
                key={task.id}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-sm border border-border text-left ${
                  done ? "opacity-40" : ""
                }`}
                onClick={() => !done && onTap(task.id)}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <span className="h-4 w-4 border border-muted-foreground/40 rounded-sm flex-shrink-0" />
                )}
                <span className={`text-[15px] flex-1 ${done ? "line-through" : ""}`}>
                  {task.title}
                </span>
                {task.deadline && !done && (
                  <span
                    className={`text-[14px] ${
                      taskDeadlineWarning ? "text-amber-400" : "text-muted-foreground"
                    }`}
                  >
                    {taskDeadlineWarning && "⚠ "}
                    {fmtMonth(task.deadline)}
                  </span>
                )}
                {!done && <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              </button>
            );
          })}
          <button
            className="w-full py-2.5 rounded-sm border border-dashed border-border text-[14px] text-muted-foreground"
            onClick={onNewChild}
          >
            + Add task
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileTaskView({
  goal,
  parent,
  onBack,
  onEdit,
  onDelete,
}: {
  goal: GoalWithPacing;
  parent: GoalWithPacing | null;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const isCompleted = goal.status === "completed";

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: goal.id,
          status: isCompleted ? "active" : "completed",
        }),
      });
      await assertOk(res);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed.");
      setCompleting(false);
    }
  }

  const daysLeft = goal.deadline
    ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-14 pb-3">
        <button
          className="flex items-center gap-1 text-[14px] text-muted-foreground mb-3"
          onClick={onBack}
        >
          <ArrowLeft className="h-3 w-3" />
          {parent?.title.replace("Complete ", "") ?? "Goals"}
        </button>

        <div className="flex items-center gap-2">
          <span
            className={`h-[18px] w-[18px] border-2 rounded-sm flex items-center justify-center flex-shrink-0 ${
              isCompleted ? "bg-green-500 border-green-500" : "border-muted-foreground/40"
            }`}
          >
            {isCompleted && <Check className="h-3 w-3 text-background" />}
          </span>
          <h1 className={`text-[20px] font-bold ${isCompleted ? "line-through opacity-50" : ""}`}>
            {goal.title}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <div className="space-y-2">
          <MetaRow label="Status">
            <span className="flex items-center gap-1.5 text-[15px]">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: isCompleted
                    ? "var(--status-success)"
                    : "var(--primary)",
                }}
              />
              {isCompleted ? "Completed" : "In progress"}
            </span>
          </MetaRow>
          {goal.ftSlug && (
            <MetaRow label="Project">
              <code className="text-[14px] font-mono">{goal.ftSlug}</code>
            </MetaRow>
          )}
          {goal.deadline && (
            <MetaRow label="Deadline">
              <span className="text-[15px]">
                {fmtDate(goal.deadline)}
                {daysLeft !== null && (
                  <span className="text-muted-foreground"> · {daysLeft}d</span>
                )}
              </span>
            </MetaRow>
          )}
          {goal.metricSource && (
            <MetaRow label="Auto-done">
              <span className="text-[15px]">On validation ✓</span>
            </MetaRow>
          )}
        </div>

        {!isCompleted && (
          <Button
            className="w-full"
            variant="default"
            style={{ backgroundColor: "var(--status-success)" }}
            onClick={handleComplete}
            disabled={completing}
          >
            <Check className="h-4 w-4 mr-1" />
            {completing ? "Completing..." : "Mark complete"}
          </Button>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="outline" className="flex-1 text-red-400 border-red-400/30" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center">
      <span className="w-[90px] text-[14px] text-muted-foreground flex-shrink-0">{label}</span>
      {children}
    </div>
  );
}

function MobileStandaloneView({
  goal,
  onBack,
  onEdit,
  onDelete,
}: {
  goal: GoalWithPacing;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const platformColor = PLATFORM_COLORS[goal.category ?? "general"];
  const isCompleted = goal.status === "completed";
  const isCadence = goal.goalType === "cadence";
  const progress =
    goal.targetValue && goal.currentValue != null
      ? Math.round((goal.currentValue / goal.targetValue) * 100)
      : 0;

  async function handleToggle() {
    setCompleting(true);
    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: goal.id,
          status: isCompleted ? "active" : "completed",
        }),
      });
      await assertOk(res);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed.");
      setCompleting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-14 pb-3">
        <button
          className="flex items-center gap-1 text-[14px] text-muted-foreground mb-3"
          onClick={onBack}
        >
          <ArrowLeft className="h-3 w-3" />
          Goals
        </button>
        {isCadence && (
          <Badge variant="outline" className="text-[14px] px-1 py-0 font-mono mb-1">
            /wk
          </Badge>
        )}
        <h1 className="text-[20px] font-bold">{goal.title}</h1>
        {goal.pacing && (
          <Badge
            variant="outline"
            className="text-[14px] px-1 py-0 mt-1"
            style={{
              borderColor: goal.pacing.onTrack ? "var(--status-success)" : "var(--status-danger)",
              color: goal.pacing.onTrack ? "var(--status-success)" : "var(--status-danger)",
            }}
          >
            {goal.pacing.onTrack ? "ON TRACK" : "BEHIND"}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {isCadence ? (
          <div className="text-center py-4">
            <span className="text-[44px] font-bold" style={{ color: platformColor }}>
              {goal.currentValue ?? 0}
            </span>
            <span className="text-[14px] text-muted-foreground">
              / {goal.cadenceValue ?? 0} this week
            </span>
          </div>
        ) : (
          <div className="rounded-sm border border-border p-3">
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-[22px] font-bold">{goal.currentValue ?? 0}</span>
              <span className="text-[14px] text-muted-foreground">/ {goal.targetValue ?? "?"}</span>
            </div>
            <Progress
              value={progress}
              className="h-[4px]"
              style={{ "--progress-foreground": platformColor } as React.CSSProperties}
            />
          </div>
        )}

        <div className="space-y-2">
          <MetaRow label="Platform">
            <span className="text-[15px]" style={{ color: platformColor }}>
              {PLATFORM_LABELS[goal.category ?? "general"]}
            </span>
          </MetaRow>
          {goal.metricSource && (
            <MetaRow label="Metric">
              <code className="text-[15px] font-mono">{goal.metricSource}</code>
            </MetaRow>
          )}
          {isCadence && (
            <MetaRow label="Rate">
              <span className="text-[15px]">
                ≥ {goal.cadenceValue}/{goal.cadenceUnit === "per_week" ? "week" : "month"}
              </span>
            </MetaRow>
          )}
          {goal.deadline && (
            <MetaRow label="Deadline">
              <span className="text-[15px]">{fmtDate(goal.deadline)}</span>
            </MetaRow>
          )}
        </div>

        {!isCompleted && !isCadence && (
          <Button
            className="w-full"
            style={{ backgroundColor: "var(--status-success)" }}
            onClick={handleToggle}
            disabled={completing}
          >
            <Check className="h-4 w-4 mr-1" />
            {completing ? "..." : "Mark complete"}
          </Button>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="outline" className="flex-1 text-red-400 border-red-400/30" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GoalsMobile({
  goals,
  onSuggest,
  on42Plan,
  onNewGoal,
  onNewChild,
  onEdit,
  onDelete,
}: {
  goals: GoalWithPacing[];
  onSuggest: () => void;
  on42Plan: () => void;
  onNewGoal: () => void;
  onNewChild: (parent: GoalWithPacing) => void;
  onEdit: (goal: GoalWithPacing) => void;
  onDelete: (goalId: number) => void;
}) {
  const [nav, setNav] = useState<NavState>({ view: "list" });

  function drill(id: number) {
    setNav({ view: "detail", goalId: id });
  }

  if (nav.view === "list") {
    return (
      <MobileGoalsList
        goals={goals}
        onTap={drill}
        onSuggest={onSuggest}
        onNewGoal={onNewGoal}
      />
    );
  }

  const goal = findGoalById(nav.goalId, goals);
  if (!goal) {
    return (
      <MobileGoalsList
        goals={goals}
        onTap={drill}
        onSuggest={onSuggest}
        onNewGoal={onNewGoal}
      />
    );
  }

  const parent = findParent(goal.id, goals);
  const isEpic = goal.children.length > 0 && !goal.parentGoalId;
  const isIssue = goal.children.length > 0 && goal.parentGoalId !== null;
  const isTask = goal.children.length === 0 && goal.parentGoalId !== null;

  function goBack() {
    if (parent) {
      setNav({ view: "detail", goalId: parent.id });
    } else {
      setNav({ view: "list" });
    }
  }

  if (isEpic) {
    return (
      <MobileEpicView
        goal={goal}
        allGoals={goals}
        onBack={() => setNav({ view: "list" })}
        onTap={drill}
        onNewChild={() => onNewChild(goal)}
      />
    );
  }

  if (isIssue) {
    return (
      <MobileIssueView
        goal={goal}
        parent={parent}
        onBack={goBack}
        onTap={drill}
        onNewChild={() => onNewChild(goal)}
      />
    );
  }

  if (isTask) {
    return (
      <MobileTaskView
        goal={goal}
        parent={parent}
        onBack={goBack}
        onEdit={() => onEdit(goal)}
        onDelete={() => onDelete(goal.id)}
      />
    );
  }

  return (
    <MobileStandaloneView
      goal={goal}
      onBack={() => setNav({ view: "list" })}
      onEdit={() => onEdit(goal)}
      onDelete={() => onDelete(goal.id)}
    />
  );
}
