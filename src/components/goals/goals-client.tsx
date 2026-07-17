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
  FolderPlus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { GoalWithPacing } from "@/lib/guidance/engine";
import { METRIC_SOURCES, GOAL_PRESETS } from "@/lib/goals/shared";
import type { MetricSourceKey } from "@/lib/goals/shared";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";
import { assertOk } from "@/lib/utils";

type GoalGroup = {
  id: number;
  title: string;
  operator: string;
  parentGroupId: number | null;
  createdAt: string;
};

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

function computeGroupStatus(
  group: GoalGroup,
  goals: GoalWithPacing[],
  groups: GoalGroup[]
): { onTrack: boolean; total: number; met: number } {
  const childGoals = goals.filter((g) => g.groupId === group.id);
  const childGroups = groups.filter((g) => g.parentGroupId === group.id);

  const results: boolean[] = [];
  for (const g of childGoals) {
    results.push(g.pacing?.onTrack ?? true);
  }
  for (const sub of childGroups) {
    const subStatus = computeGroupStatus(sub, goals, groups);
    results.push(subStatus.onTrack);
  }

  const met = results.filter(Boolean).length;
  const onTrack = group.operator === "and"
    ? results.every(Boolean)
    : results.some(Boolean);

  return { onTrack, total: results.length, met };
}

export function GoalsClient({
  goals,
  groups,
  competencies,
  focusItems = [],
}: {
  goals: GoalWithPacing[];
  groups: GoalGroup[];
  competencies: CompetencySlim[];
  focusItems?: FocusSlim[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [goalType, setGoalType] = useState<"cumulative" | "cadence">("cumulative");
  const [targetValue, setTargetValue] = useState("");
  const [cadenceValue, setCadenceValue] = useState("");
  const [cadenceUnit, setCadenceUnit] = useState<"per_week" | "per_month">("per_week");
  const [deadline, setDeadline] = useState("");
  const [metricSource, setMetricSource] = useState("");
  const [groupId, setGroupId] = useState<string>("");

  const [groupTitle, setGroupTitle] = useState("");
  const [groupOperator, setGroupOperator] = useState<"and" | "or">("and");
  const [groupParentId, setGroupParentId] = useState<string>("");

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

  const topLevelGroups = groups.filter((g) => g.parentGroupId === null);
  const ungroupedGoals = activeGoals.filter((g) => !g.groupId);

  function applyPreset(preset: (typeof GOAL_PRESETS)[number]) {
    setTitle(preset.title);
    setCategory(preset.category);
    setGoalType(preset.goalType);
    setMetricSource(preset.metricSource);
    if (preset.goalType === "cadence") {
      setCadenceValue(String(preset.cadenceValue ?? ""));
      setCadenceUnit(preset.cadenceUnit ?? "per_week");
      setTargetValue("");
      setDeadline("");
    } else {
      setTargetValue(String(preset.targetValue ?? ""));
      setCadenceValue("");
    }
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setCategory("general");
    setGoalType("cumulative");
    setTargetValue("");
    setCadenceValue("");
    setCadenceUnit("per_week");
    setDeadline("");
    setMetricSource("");
    setGroupId("");
  }

  function openEdit(goal: GoalWithPacing) {
    setEditingId(goal.id);
    setTitle(goal.title);
    setCategory(goal.category ?? "general");
    setGoalType((goal.goalType as "cumulative" | "cadence") ?? "cumulative");
    setTargetValue(goal.targetValue != null ? String(goal.targetValue) : "");
    setCadenceValue(goal.cadenceValue != null ? String(goal.cadenceValue) : "");
    setCadenceUnit((goal.cadenceUnit as "per_week" | "per_month") ?? "per_week");
    setDeadline(goal.deadline ?? "");
    setMetricSource(goal.metricSource ?? "");
    setGroupId(goal.groupId != null ? String(goal.groupId) : "");
    setDialogOpen(true);
  }

  async function submitGoal() {
    if (!title.trim()) return;
    const payload: Record<string, unknown> = {
      title,
      category,
      goalType,
      metricSource: metricSource && metricSource !== "manual" ? metricSource : null,
      groupId: groupId ? parseInt(groupId) : null,
    };
    if (goalType === "cadence") {
      payload.cadenceValue = cadenceValue ? parseFloat(cadenceValue) : null;
      payload.cadenceUnit = cadenceUnit;
      payload.targetValue = null;
      payload.deadline = null;
    } else {
      payload.targetValue = targetValue ? parseFloat(targetValue) : null;
      payload.deadline = deadline || null;
      payload.cadenceValue = null;
      payload.cadenceUnit = null;
    }
    try {
      const res = await fetch("/api/goals", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      await assertOk(res);
      resetForm();
      setDialogOpen(false);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : `Failed to ${editingId ? "update" : "create"} goal.`);
    }
  }

  async function submitGroup() {
    if (!groupTitle.trim()) return;
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _type: "group",
          title: groupTitle,
          operator: groupOperator,
          parentGroupId: groupParentId ? parseInt(groupParentId) : null,
        }),
      });
      await assertOk(res);
      setGroupTitle("");
      setGroupOperator("and");
      setGroupParentId("");
      setGroupDialogOpen(false);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create group.");
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

  async function deleteGroup(groupId: number) {
    try {
      const res = await fetch("/api/goals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _type: "group", id: groupId }),
      });
      await assertOk(res);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete group.");
    }
  }

  async function toggleGroupOperator(group: GoalGroup) {
    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _type: "group",
          id: group.id,
          operator: group.operator === "and" ? "or" : "and",
        }),
      });
      await assertOk(res);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update group.");
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

  const cumulativePresets = GOAL_PRESETS.filter((p) => p.goalType === "cumulative");
  const cadencePresets = GOAL_PRESETS.filter((p) => p.goalType === "cadence");

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
        <div className="flex gap-2">
          <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setGroupTitle("");
                    setGroupOperator("and");
                    setGroupParentId("");
                  }}
                />
              }
            >
              <FolderPlus className="h-3.5 w-3.5 mr-1" />
              Group
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New goal group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Group title</Label>
                  <Input
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    placeholder='e.g., "Weekly cybersec targets"'
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">Logic</Label>
                    <Select
                      value={groupOperator}
                      onValueChange={(v) => setGroupOperator(v as "and" | "or")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="and">AND — all must pass</SelectItem>
                        <SelectItem value="or">OR — any can pass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {topLevelGroups.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-[13px]">Parent group</Label>
                      <Select value={groupParentId} onValueChange={(v) => setGroupParentId(v ?? "")}>
                        <SelectTrigger>
                          <SelectValue placeholder="None (top level)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (top level)</SelectItem>
                          {topLevelGroups.map((g) => (
                            <SelectItem key={g.id} value={String(g.id)}>
                              {g.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <Button onClick={submitGroup} className="w-full">
                  Create group
                  <ArrowRight className="h-3 w-3 ml-1.5" />
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
                      <div className="space-y-2">
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Cumulative</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cumulativePresets.map((p) => (
                              <button
                                key={p.title}
                                onClick={() => applyPreset(p)}
                                className="text-[12px] px-2.5 py-1.5 rounded-sm border border-border bg-transparent hover:bg-accent transition-colors"
                              >
                                {p.title}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Cadence</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cadencePresets.map((p) => (
                              <button
                                key={p.title}
                                onClick={() => applyPreset(p)}
                                className="text-[12px] px-2.5 py-1.5 rounded-sm border border-border bg-transparent hover:bg-accent transition-colors"
                              >
                                {p.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Goal type toggle */}
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Goal type</Label>
                  <div className="flex rounded-sm border border-border overflow-hidden">
                    <button
                      className="flex-1 text-[13px] py-2 transition-colors"
                      style={{
                        background: goalType === "cumulative" ? "var(--accent)" : "transparent",
                        fontWeight: goalType === "cumulative" ? 600 : 400,
                      }}
                      onClick={() => setGoalType("cumulative")}
                    >
                      Cumulative
                    </button>
                    <button
                      className="flex-1 text-[13px] py-2 transition-colors border-l border-border"
                      style={{
                        background: goalType === "cadence" ? "var(--accent)" : "transparent",
                        fontWeight: goalType === "cadence" ? 600 : 400,
                      }}
                      onClick={() => setGoalType("cadence")}
                    >
                      Cadence
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {goalType === "cumulative"
                      ? "Reach a total target by a deadline"
                      : "Maintain a rate over a rolling window"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px]">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      goalType === "cadence"
                        ? "e.g., >= 2 THM rooms per week"
                        : "e.g., 50 Root-me challenges by Dec"
                    }
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

                {goalType === "cadence" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[13px]">{"Rate (>=)"}</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={cadenceValue}
                        onChange={(e) => setCadenceValue(e.target.value)}
                        placeholder="e.g., 2"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px]">Period</Label>
                      <Select value={cadenceUnit} onValueChange={(v) => setCadenceUnit(v as "per_week" | "per_month")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_week">Per week</SelectItem>
                          <SelectItem value="per_month">Per month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
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
                )}

                {groups.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">Group</Label>
                    <Select value={groupId} onValueChange={(v) => setGroupId(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="No group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No group</SelectItem>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.title} ({g.operator.toUpperCase()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={submitGoal} className="w-full">
                  {editingId ? "Save changes" : "Create goal"}
                  <ArrowRight className="h-3 w-3 ml-1.5" />
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                — {g.goalType === "cadence"
                  ? `${g.pacing?.currentPace}, need ${g.pacing?.requiredPace}`
                  : `${g.pacing?.daysRemaining}d left, need ${g.pacing?.requiredPace}`
                }
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Goal groups */}
      {topLevelGroups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          goals={activeGoals}
          groups={groups}
          onComplete={completeGoal}
          onDelete={deleteGoal}
          onDeleteGroup={deleteGroup}
          onEdit={openEdit}
          onToggleOperator={toggleGroupOperator}
          focusItems={focusItems}
          competencies={competencies}
        />
      ))}

      {/* Ungrouped active goals */}
      {activeGoals.length === 0 && completedGoals.length === 0 && groups.length === 0 ? (
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
          {ungroupedGoals.map((goal) => (
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

function GroupCard({
  group,
  goals,
  groups,
  onComplete,
  onDelete,
  onDeleteGroup,
  onEdit,
  onToggleOperator,
  focusItems,
  competencies,
}: {
  group: GoalGroup;
  goals: GoalWithPacing[];
  groups: GoalGroup[];
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onDeleteGroup: (id: number) => void;
  onEdit: (goal: GoalWithPacing) => void;
  onToggleOperator: (group: GoalGroup) => void;
  focusItems: FocusSlim[];
  competencies: CompetencySlim[];
}) {
  const [expanded, setExpanded] = useState(true);
  const childGoals = goals.filter((g) => g.groupId === group.id);
  const childGroups = groups.filter((g) => g.parentGroupId === group.id);
  const status = computeGroupStatus(group, goals, groups);

  if (childGoals.length === 0 && childGroups.length === 0) return null;

  return (
    <div
      className="rounded-sm border border-border overflow-hidden"
      style={{ background: "oklch(0.15 0.005 75 / 0.5)" }}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground transition-colors">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <h3 className="text-[14px] font-semibold flex-1">{group.title}</h3>
        <button
          onClick={() => onToggleOperator(group)}
          className="text-[11px] font-mono px-2 py-0.5 rounded-sm border border-border hover:bg-accent transition-colors"
          title="Click to toggle AND/OR"
        >
          {group.operator.toUpperCase()}
        </button>
        <Badge variant={status.onTrack ? "success" : "danger"}>
          {status.met}/{status.total} met
        </Badge>
        <button
          onClick={() => onDeleteGroup(group.id)}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {childGroups.map((sub) => (
            <GroupCard
              key={sub.id}
              group={sub}
              goals={goals}
              groups={groups}
              onComplete={onComplete}
              onDelete={onDelete}
              onDeleteGroup={onDeleteGroup}
              onEdit={onEdit}
              onToggleOperator={onToggleOperator}
              focusItems={focusItems}
              competencies={competencies}
            />
          ))}
          {childGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
              weekItems={matchFocusToGoal(goal, focusItems)}
              competencyTags={getCompetencyTags(goal, competencies)}
            />
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
  const isCadence = goal.goalType === "cadence";
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
              {isCadence && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border border-border text-muted-foreground">
                  {goal.cadenceUnit === "per_month" ? "/mo" : "/wk"}
                </span>
              )}
              {goal.pacing && <PaceStatus pacing={goal.pacing} isCadence={isCadence} />}
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
            {!isCadence && goal.deadline && (
              <p className="text-[12px] text-muted-foreground mt-0.5">
                by {goal.deadline}
              </p>
            )}
          </div>
          {isCadence ? (
            <span
              className="text-[20px] font-bold tabular-nums shrink-0"
              style={{ color: isBehind ? "var(--status-danger)" : "var(--foreground)" }}
            >
              {goal.pacing ? `${Math.round(progress)}%` : "—"}
            </span>
          ) : goal.targetValue != null ? (
            <span
              className="text-[24px] font-bold tabular-nums shrink-0"
              style={{ color: isBehind ? "var(--status-danger)" : "var(--foreground)" }}
            >
              {progress.toFixed(0)}%
            </span>
          ) : null}
        </div>

        {/* Progress bar */}
        {(isCadence || goal.targetValue != null) && (
          <div className="space-y-1">
            <div className="relative">
              <div className="progress-track" style={{ height: "6px" }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: isBehind ? "var(--status-danger)" : color,
                    height: "6px",
                  }}
                />
              </div>
              {!isCadence && goal.milestones.map((m) => {
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
              {isCadence ? (
                <span>
                  {goal.pacing?.currentPace ?? "No data"} — target: {goal.cadenceValue}{goal.cadenceUnit === "per_month" ? "/mo" : "/wk"}
                </span>
              ) : (
                <span>{goal.currentValue ?? 0} / {goal.targetValue}</span>
              )}
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
              {isCadence
                ? `${goal.pacing.daysRemaining}d left ${goal.cadenceUnit === "per_month" ? "this month" : "this week"}`
                : `${goal.pacing.daysRemaining}d left`
              }
            </span>
            {goal.pacing.requiredPace !== "Complete!" && goal.pacing.requiredPace !== "Target met" && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {goal.pacing.requiredPace}
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
            <span className="text-muted-foreground">
              {isCadence
                ? "Behind pace — increase effort this period"
                : "Action needed — increase effort, extend deadline, or reduce scope"
              }
            </span>
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
          {!isCadence && (
            <button onClick={() => onComplete(goal.id)} className="p-1 hover:text-success text-muted-foreground transition-colors" title="Mark complete">
              <CheckCircle className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => onDelete(goal.id)} className="p-1 hover:text-destructive text-muted-foreground transition-colors" title="Delete goal">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaceStatus({ pacing, isCadence }: { pacing: NonNullable<GoalWithPacing["pacing"]>; isCadence?: boolean }) {
  if (!isCadence && pacing.percentComplete >= 100) {
    return <Badge variant="success">Complete</Badge>;
  }
  if (isCadence && pacing.onTrack) {
    return <Badge variant="success">On pace</Badge>;
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
  return <Badge variant="danger">Behind</Badge>;
}
