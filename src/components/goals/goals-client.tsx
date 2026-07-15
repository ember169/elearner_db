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
  Target,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Zap,
  Clock,
} from "lucide-react";
import type { GoalWithPacing } from "@/lib/guidance/engine";
import { METRIC_SOURCES, GOAL_PRESETS } from "@/lib/goals/shared";
import type { MetricSourceKey } from "@/lib/goals/shared";

const platformColors: Record<string, string> = {
  "42": "#00babc",
  thm: "#ef4444",
  htb: "#9fef00",
  rootme: "#f59e0b",
  maldev: "#a855f7",
  general: "#6b7280",
};

const platformLabels: Record<string, string> = {
  "42": "42",
  thm: "THM",
  htb: "HTB",
  rootme: "RM",
  maldev: "Mal",
  general: "Gen",
};

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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Goals
          </h1>
          <p className="text-sm text-muted-foreground">
            Your destinations — where you&apos;re heading and whether you&apos;re on
            pace
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
            <Plus className="h-4 w-4 mr-1.5" />
            New Goal
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Presets */}
              <div>
                <Label className="text-xs text-muted-foreground">
                  Quick presets
                </Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {GOAL_PRESETS.map((p) => (
                    <button
                      key={p.metricSource}
                      onClick={() => applyPreset(p)}
                      className="text-xs px-2.5 py-1 rounded-md border border-border bg-card hover:bg-accent transition-colors"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 50 Root-me challenges by Dec"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Platform</Label>
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
                <div className="space-y-2">
                  <Label>Auto-track metric</Label>
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
                <div className="space-y-2">
                  <Label>Target value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="e.g., 50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={addGoal} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active goals */}
      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-1">
              No destinations set yet.
            </p>
            <p className="text-xs text-muted-foreground">
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
            />
          ))}
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Completed ({completedGoals.length})
          </h2>
          {completedGoals.map((goal) => (
            <Card key={goal.id} className="opacity-60">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm font-medium flex-1">
                    {goal.title}
                  </span>
                  {goal.category && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                      style={{
                        borderColor:
                          platformColors[goal.category] ?? "#6b7280",
                      }}
                    >
                      {platformLabels[goal.category] ?? goal.category}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
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
  const color = platformColors[goal.category ?? "general"] ?? "#6b7280";

  return (
    <Card className="overflow-hidden group">
      <div className="h-1" style={{ backgroundColor: color }} />
      <CardContent className="pt-3 pb-3 px-4 space-y-2.5">
        {/* Top: title + platform badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{goal.title}</h3>
              {goal.category && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 shrink-0"
                  style={{ borderColor: color }}
                >
                  {platformLabels[goal.category] ?? goal.category}
                </Badge>
              )}
            </div>
            {goal.deadline && (
              <p className="text-xs text-muted-foreground mt-0.5">
                by {goal.deadline}
              </p>
            )}
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onComplete(goal.id)}
            >
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDelete(goal.id)}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {goal.targetValue != null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {goal.currentValue ?? 0} / {goal.targetValue}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {progress.toFixed(0)}%
                </span>
                {goal.pacing && <PaceStatus pacing={goal.pacing} />}
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        )}

        {/* Pacing details */}
        {goal.pacing && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
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

        {/* Auto-tracked indicator */}
        {goal.metricSource && (
          <p className="text-[10px] text-muted-foreground">
            Auto-tracked:{" "}
            {METRIC_SOURCES[goal.metricSource as MetricSourceKey]?.label ??
              goal.metricSource}
          </p>
        )}

        {/* Milestones */}
        {goal.milestones.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {goal.milestones.map((m) => (
              <span
                key={m.id}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  m.reachedAt
                    ? "border-green-500/30 text-green-500"
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

function PaceStatus({
  pacing,
}: {
  pacing: NonNullable<GoalWithPacing["pacing"]>;
}) {
  if (pacing.percentComplete >= 100) {
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-500">
        Complete
      </Badge>
    );
  }
  if (pacing.requiredPace === "Overdue") {
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-500">
        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
        Overdue
      </Badge>
    );
  }
  if (pacing.onTrack) {
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-500">
        On track
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-yellow-500/10 text-yellow-500">
      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
      Behind
    </Badge>
  );
}
