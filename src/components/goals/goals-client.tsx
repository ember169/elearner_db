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
} from "lucide-react";
import type { GoalWithPacing } from "@/lib/guidance/engine";
import { METRIC_SOURCES, GOAL_PRESETS } from "@/lib/goals/shared";
import type { MetricSourceKey } from "@/lib/goals/shared";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";

export function GoalsClient({ goals }: { goals: GoalWithPacing[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [metricSource, setMetricSource] = useState("");

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  function applyPreset(preset: (typeof GOAL_PRESETS)[number]) {
    setTitle(preset.title);
    setCategory(preset.category);
    setTargetValue(String(preset.targetValue));
    setMetricSource(preset.metricSource);
  }

  function resetForm() {
    setTitle("");
    setCategory("general");
    setTargetValue("");
    setDeadline("");
    setMetricSource("");
  }

  async function addGoal() {
    if (!title.trim()) return;
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        targetValue: targetValue ? parseFloat(targetValue) : null,
        deadline: deadline || null,
        metricSource: metricSource && metricSource !== "manual" ? metricSource : null,
      }),
    });
    resetForm();
    setDialogOpen(false);
    window.location.reload();
  }

  async function deleteGoal(goalId: number) {
    await fetch("/api/goals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goalId }),
    });
    window.location.reload();
  }

  async function completeGoal(goalId: number) {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goalId, status: "completed" }),
    });
    window.location.reload();
  }

  const metricSourcesForCategory = Object.entries(METRIC_SOURCES).filter(
    ([, meta]) => category === "general" || meta.platform === category
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle mt-1">
            Your destinations — where you&apos;re heading and whether you&apos;re on pace
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            New goal
            <ArrowRight className="h-3 w-3 ml-1" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
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
              <Button onClick={addGoal} className="w-full">
                Create goal
                <ArrowRight className="h-3 w-3 ml-1.5" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
        <div className="space-y-2.5">
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onComplete={completeGoal}
              onDelete={deleteGoal}
            />
          ))}
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
}: {
  goal: GoalWithPacing;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const progress = goal.pacing?.percentComplete ?? 0;
  const color = PLATFORM_COLORS[goal.category ?? "general"] ?? "var(--muted-foreground)";

  return (
    <Card className="overflow-hidden group gap-0 py-0">
      <div className="h-[3px]" style={{ backgroundColor: color }} />
      <CardContent className="pt-3.5 pb-3.5 px-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[14px] tracking-tight truncate">{goal.title}</h3>
              {goal.category && (
                <span
                  className="text-[10px] font-bold uppercase tracking-widest shrink-0"
                  style={{ color }}
                >
                  {PLATFORM_LABELS[goal.category] ?? goal.category}
                </span>
              )}
            </div>
            {goal.deadline && (
              <p className="text-[12px] text-muted-foreground mt-0.5">
                by {goal.deadline}
              </p>
            )}
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onComplete(goal.id)} className="p-1 hover:text-success text-muted-foreground transition-colors">
              <CheckCircle className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(goal.id)} className="p-1 hover:text-destructive text-muted-foreground transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {goal.targetValue != null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground tabular-nums">
                {goal.currentValue ?? 0} / {goal.targetValue}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground tabular-nums">
                  {progress.toFixed(0)}%
                </span>
                {goal.pacing && <PaceStatus pacing={goal.pacing} />}
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: color }} />
            </div>
          </div>
        )}

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

        {goal.metricSource && (
          <p className="text-[11px] text-muted-foreground">
            Auto-tracked:{" "}
            {METRIC_SOURCES[goal.metricSource as MetricSourceKey]?.label ?? goal.metricSource}
          </p>
        )}

        {goal.milestones.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {goal.milestones.map((m) => (
              <span
                key={m.id}
                className={`text-[11px] px-1.5 py-0.5 rounded-sm border ${
                  m.reachedAt
                    ? "border-success/30 text-success"
                    : "border-border text-muted-foreground"
                }`}
              >
                {m.reachedAt ? "✓" : "○"} {m.title}
              </span>
            ))}
          </div>
        )}
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
    <Badge variant="warning">
      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
      Behind
    </Badge>
  );
}
