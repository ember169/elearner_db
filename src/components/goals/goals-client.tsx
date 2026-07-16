"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Zap,
  Clock,
  ArrowRight,
  Pencil,
} from "lucide-react";
import type { GoalWithPacing } from "@/lib/guidance/engine";
import { METRIC_SOURCES, GOAL_PRESETS } from "@/lib/goals/shared";
import type { MetricSourceKey } from "@/lib/goals/shared";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";
import { assertOk } from "@/lib/utils";

type CompetencySlim = {
  id: string;
  label: string;
  area: string;
  level: number;
};

type FocusSlim = { type: string; title: string };

function matchFocusToGoal(goal: GoalWithPacing, focusItems: FocusSlim[]): FocusSlim[] {
  return focusItems.filter((f) => {
    if (goal.category && goal.category !== "general" && f.type === goal.category) return true;
    const goalLower = goal.title.toLowerCase();
    if (goalLower.includes(f.title.toLowerCase().slice(0, 15))) return true;
    return false;
  });
}

function getCompetencyTags(goal: GoalWithPacing, competencies: CompetencySlim[]): string[] {
  const titleLower = goal.title.toLowerCase();
  const match = competencies.find((c) => titleLower.includes(c.label.toLowerCase()));
  if (match) return [match.area];
  if (goal.category && goal.category !== "general") {
    const platformAreas: Record<string, string[]> = {
      "42": ["Low-level & C", "Linux & systems"],
      thm: ["Networking", "Active Directory"],
      htb: ["Networking", "Active Directory"],
      rootme: ["Web", "Crypto & forensics basics"],
      maldev: ["Windows internals & maldev"],
    };
    return platformAreas[goal.category] ?? [];
  }
  return [];
}

export function GoalsClient({
  goals,
  competencies,
  focusItems = [],
}: {
  goals: GoalWithPacing[];
  competencies: CompetencySlim[];
  focusItems?: FocusSlim[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [metricSource, setMetricSource] = useState("");

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const behindGoals = activeGoals.filter(
    (g) => g.pacing && !g.pacing.onTrack && g.pacing.percentComplete < 100
  );
  const [adding, setAdding] = useState<string | null>(null);
  const goalTitles = new Set(goals.map((g) => g.title.toLowerCase()));
  const suggestedGoals = competencies
    .filter((c) => c.level < 2 && !goalTitles.has(`improve ${c.label}`.toLowerCase()))
    .slice(0, 3);

  function applyPreset(preset: (typeof GOAL_PRESETS)[number]) {
    setTitle(preset.title);
    setCategory(preset.category);
    setTargetValue(String(preset.targetValue));
    setMetricSource(preset.metricSource);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setCategory("general");
    setTargetValue("");
    setDeadline("");
    setMetricSource("");
  }

  function openEdit(goal: GoalWithPacing) {
    setEditingId(goal.id);
    setTitle(goal.title);
    setCategory(goal.category ?? "general");
    setTargetValue(goal.targetValue != null ? String(goal.targetValue) : "");
    setDeadline(goal.deadline ?? "");
    setMetricSource(goal.metricSource ?? "");
    setDialogOpen(true);
  }

  async function submitGoal() {
    if (!title.trim()) return;
    const payload = {
      title,
      category,
      targetValue: targetValue ? parseFloat(targetValue) : null,
      deadline: deadline || null,
      metricSource:
        metricSource && metricSource !== "manual" ? metricSource : null,
    };
    try {
      const res = await fetch("/api/goals", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, ...payload } : payload
        ),
      });
      await assertOk(res);
      resetForm();
      setDialogOpen(false);
      window.location.reload();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : `Failed to ${editingId ? "update" : "create"} goal.`
      );
    }
  }

  async function deleteGoal(goalId: number) {
    try {
      const res = await fetch("/api/goals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goalId }),
      });
      await assertOk(res);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete goal.");
    }
  }

  async function completeGoal(goalId: number) {
    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goalId, status: "completed" }),
      });
      await assertOk(res);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update goal.");
    }
  }

  const metricSourcesForCategory = Object.entries(METRIC_SOURCES).filter(
    ([, meta]) => category === "general" || meta.platform === category
  );

  return (
    <div className="space-y-5 max-w-[896px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle mt-1">
            {activeGoals.length > 0 || completedGoals.length > 0 ? (
              <>
                {activeGoals.length} active
                {behindGoals.length > 0 && (
                  <span style={{ color: "var(--status-danger)" }}>
                    {" "}· {behindGoals.length} behind pace
                  </span>
                )}
              </>
            ) : (
              "Your destinations — where you're heading and whether you're on pace"
            )}
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger render={<Button size="sm" onClick={resetForm} />}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            New goal
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit goal" : "New goal"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              {!editingId && (
                <>
                  <div>
                    <p className="section-label mb-2">Quick presets</p>
                    <div className="flex flex-wrap gap-1.5">
                      {GOAL_PRESETS.map((p) => (
                        <button
                          key={p.metricSource}
                          onClick={() => applyPreset(p)}
                          className="text-[12px] px-2.5 py-1.5 rounded-sm border border-border bg-transparent hover:bg-accent transition-colors"
                        >
                          {p.title}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              <div className="space-y-1.5">
                <Label className="text-[13px]">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 50 Root-me challenges by Dec"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Platform</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => {
                      if (!v) return;
                      setCategory(v);
                      setMetricSource("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["42", "thm", "htb", "rootme", "maldev", "general"].map(
                        (c) => (
                          <SelectItem key={c} value={c}>
                            {c === "42"
                              ? "42 Paris"
                              : c === "thm"
                                ? "TryHackMe"
                                : c === "htb"
                                  ? "HackTheBox"
                                  : c === "rootme"
                                    ? "Root-me"
                                    : c === "maldev"
                                      ? "Maldev"
                                      : "General"}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Auto-track metric</Label>
                  <Select
                    value={metricSource}
                    onValueChange={(v) => v && setMetricSource(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Manual tracking" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual tracking</SelectItem>
                      {metricSourcesForCategory.map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Target value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="e.g., 50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Deadline</Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={submitGoal} className="w-full">
                {editingId ? "Save changes" : "Create goal"}
                <ArrowRight className="h-3 w-3 ml-1.5" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Behind-pace alert */}
      {behindGoals.length > 0 && (
        <div
          className="rounded-sm px-4 py-3 space-y-2"
          style={{
            background: "oklch(0.70 0.18 25 / 0.08)",
            border: "1px solid oklch(0.70 0.18 25 / 0.2)",
          }}
        >
          {behindGoals.map((g) => (
            <div key={g.id} className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--status-danger)" }} />
              <span className="text-[13px] font-medium" style={{ color: "var(--status-danger)" }}>
                {g.title}
              </span>
              <span className="text-[12px] text-muted-foreground">
                — {g.pacing?.daysRemaining}d left, need {g.pacing?.requiredPace}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-[14px] text-muted-foreground mb-1">
              No destinations set yet.
            </p>
            <p className="text-[12px] text-muted-foreground">
              Create a goal to start tracking your pace toward it.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onComplete={completeGoal}
              onDelete={deleteGoal}
              onEdit={openEdit}
              weekItems={matchFocusToGoal(goal, focusItems)}
              competencyTags={getCompetencyTags(goal, competencies)}
            />
          ))}
        </div>
      )}

      {/* Suggested goals from competency gaps */}
      {suggestedGoals.length > 0 && (
        <div>
          <p className="section-label mb-2">
            Suggested goals (based on competency gaps)
          </p>
          <div className="space-y-1.5">
            {suggestedGoals.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3 rounded-sm border border-dashed border-border"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium">
                    Improve {c.label}
                  </span>
                  <span className="text-[12px] text-muted-foreground ml-2">
                    {c.level}/5 → target {Math.min(c.level + 2, 5)}/5
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={adding === c.id}
                  onClick={async () => {
                    setAdding(c.id);
                    const target = Math.min(c.level + 2, 5);
                    const deadlineDate = new Date();
                    deadlineDate.setMonth(deadlineDate.getMonth() + 3);
                    const dl = deadlineDate.toISOString().slice(0, 10);
                    try {
                      const res = await fetch("/api/goals", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: `Improve ${c.label}`,
                          description: `Reach competency level ${target}/5 in ${c.area}. Currently at ${c.level}/5.`,
                          category: "general",
                          targetValue: target,
                          currentValue: c.level,
                          deadline: dl,
                          metricSource: null,
                        }),
                      });
                      await assertOk(res);
                      window.location.reload();
                    } catch (e) {
                      alert(e instanceof Error ? e.message : "Failed to create goal.");
                      setAdding(null);
                    }
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {adding === c.id ? "Adding..." : "Add"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedGoals.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="section-label">Completed · {completedGoals.length}</p>
          {completedGoals.map((goal) => (
            <Card key={goal.id} className="opacity-50">
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                  <span className="text-[14px] font-medium flex-1">{goal.title}</span>
                  {goal.category && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: PLATFORM_COLORS[goal.category] ?? "var(--muted-foreground)" }}
                    >
                      {PLATFORM_LABELS[goal.category] ?? goal.category}
                    </span>
                  )}
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  onComplete,
  onDelete,
  onEdit,
  weekItems,
  competencyTags,
}: {
  goal: GoalWithPacing;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (goal: GoalWithPacing) => void;
  weekItems: FocusSlim[];
  competencyTags: string[];
}) {
  const progress = goal.pacing?.percentComplete ?? 0;
  const color = PLATFORM_COLORS[goal.category ?? "general"] ?? "var(--muted-foreground)";
  const isBehind = goal.pacing && !goal.pacing.onTrack && goal.pacing.percentComplete < 100;

  return (
    <Card
      className="overflow-hidden group gap-0 py-0"
      style={isBehind ? { borderColor: "oklch(0.70 0.18 25 / 0.3)" } : undefined}
    >
      <div className="h-[3px]" style={{ backgroundColor: color }} />
      <CardContent className="pt-4 pb-4 px-5 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] font-semibold tracking-tight">{goal.title}</h3>
              {goal.pacing && (
                <PaceStatus pacing={goal.pacing} />
              )}
              {competencyTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-sm"
                  style={{ color: "var(--muted-foreground)", background: "oklch(0.22 0.005 75)" }}
                >
                  → {tag}
                </span>
              ))}
            </div>
            {goal.deadline && (
              <p className="text-[12px] text-muted-foreground mt-0.5">
                by {goal.deadline}
              </p>
            )}
          </div>
          {goal.targetValue != null && (
            <span
              className="text-[24px] font-bold tabular-nums shrink-0"
              style={{ color: isBehind ? "var(--status-danger)" : "var(--foreground)" }}
            >
              {progress.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Progress bar with milestone markers */}
        {goal.targetValue != null && (
          <div className="space-y-1">
            <div className="relative">
              <div className="progress-track" style={{ height: "6px" }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: isBehind ? "var(--status-danger)" : color,
                    height: "6px",
                  }}
                />
              </div>
              {goal.milestones.map((m) => {
                if (!goal.targetValue) return null;
                const mVal = m.targetValue ?? 0;
                const pos = (mVal / goal.targetValue) * 100;
                return (
                  <div
                    key={m.id}
                    className="absolute top-0 -translate-x-1/2"
                    style={{ left: `${Math.min(pos, 100)}%` }}
                  >
                    <div
                      className="h-[6px] w-[2px]"
                      style={{
                        background: m.reachedAt ? "var(--status-success)" : "var(--foreground)",
                        opacity: m.reachedAt ? 1 : 0.4,
                      }}
                    />
                    <span className="text-[9px] text-muted-foreground block mt-0.5 whitespace-nowrap">
                      {m.reachedAt ? "✓" : ""}{mVal}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[12px] text-muted-foreground tabular-nums">
              <span>{goal.currentValue ?? 0} / {goal.targetValue}</span>
              {goal.metricSource && (
                <span className="text-[11px]">
                  Auto: {METRIC_SOURCES[goal.metricSource as MetricSourceKey]?.label ?? goal.metricSource}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pacing stats */}
        {goal.pacing && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {goal.pacing.daysRemaining}d left
            </span>
            {goal.pacing.requiredPace !== "Complete!" && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Need {goal.pacing.requiredPace}
                {goal.pacing.currentPace !== "No progress yet" &&
                  ` (doing ${goal.pacing.currentPace})`}
              </span>
            )}
          </div>
        )}

        {/* This week connection */}
        {weekItems.length > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-sm text-[12px]"
            style={{ background: "oklch(0.58 0.16 250 / 0.06)" }}
          >
            <span className="font-semibold text-primary shrink-0">THIS WEEK</span>
            <span className="text-muted-foreground">
              {weekItems.length}× {weekItems.map((w) => w.title).join(", ").slice(0, 60)}
              {weekItems.map((w) => w.title).join(", ").length > 60 ? "…" : ""} from mentor plan
            </span>
          </div>
        )}

        {/* Actions row for behind-pace goals */}
        {isBehind && (
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-sm text-[12px]"
            style={{ background: "oklch(0.70 0.18 25 / 0.06)" }}
          >
            <AlertTriangle className="h-3 w-3 shrink-0" style={{ color: "var(--status-danger)" }} />
            <span className="text-muted-foreground">Action needed — increase effort, extend deadline, or reduce scope</span>
            <button
              onClick={() => onEdit(goal)}
              className="text-primary hover:underline ml-auto shrink-0"
            >
              Adjust →
            </button>
          </div>
        )}

        {/* Hover actions */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(goal)} className="p-1 hover:text-primary text-muted-foreground transition-colors" title="Edit goal">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onComplete(goal.id)} className="p-1 hover:text-success text-muted-foreground transition-colors" title="Mark complete">
            <CheckCircle className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(goal.id)} className="p-1 hover:text-destructive text-muted-foreground transition-colors" title="Delete goal">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaceStatus({ pacing }: { pacing: NonNullable<GoalWithPacing["pacing"]> }) {
  if (pacing.percentComplete >= 100) {
    return <Badge variant="success">Complete</Badge>;
  }
  if (pacing.requiredPace === "Overdue") {
    return (
      <Badge variant="danger">
        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
        Overdue
      </Badge>
    );
  }
  if (pacing.onTrack) {
    return <Badge variant="success">On track</Badge>;
  }
  return (
    <Badge variant="danger">
      Behind
    </Badge>
  );
}
