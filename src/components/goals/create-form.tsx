"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { METRIC_SOURCES, GOAL_PRESETS } from "@/lib/goals/shared";
import type { GoalWithPacing } from "@/lib/guidance/engine";
import { assertOk } from "@/lib/utils";

function flattenGoalTree(tree: GoalWithPacing[]): GoalWithPacing[] {
  const result: GoalWithPacing[] = [];
  function walk(g: GoalWithPacing) {
    result.push(g);
    for (const child of g.children) walk(child);
  }
  tree.forEach(walk);
  return result;
}

const QUICK_PRESETS = GOAL_PRESETS.filter((p) =>
  ["Complete 42 common core", "Reach 42 level 10", "50 Root-me challenges", ">= 2 THM rooms/week"].includes(p.title)
);

export function CreateForm({
  allGoals,
  editingGoal,
  parentGoal,
  onDone,
  onCancel,
  mobile,
}: {
  allGoals: GoalWithPacing[];
  editingGoal?: GoalWithPacing | null;
  parentGoal?: GoalWithPacing | null;
  onDone: () => void;
  onCancel: () => void;
  mobile?: boolean;
}) {
  const isEditing = !!editingGoal;
  const allFlat = flattenGoalTree(allGoals);

  const [title, setTitle] = useState(editingGoal?.title ?? "");
  const [goalType, setGoalType] = useState<"cumulative" | "cadence">(
    (editingGoal?.goalType as "cumulative" | "cadence") ?? "cumulative"
  );
  const [category, setCategory] = useState(editingGoal?.category ?? "general");
  const [metricSource, setMetricSource] = useState(editingGoal?.metricSource ?? "");
  const [targetValue, setTargetValue] = useState(
    editingGoal?.targetValue != null ? String(editingGoal.targetValue) : ""
  );
  const [cadenceValue, setCadenceValue] = useState(
    editingGoal?.cadenceValue != null ? String(editingGoal.cadenceValue) : ""
  );
  const [cadenceUnit, setCadenceUnit] = useState<"per_week" | "per_month">(
    (editingGoal?.cadenceUnit as "per_week" | "per_month") ?? "per_week"
  );
  const [deadline, setDeadline] = useState(editingGoal?.deadline ?? "");
  const [parentId, setParentId] = useState<string>(
    parentGoal ? String(parentGoal.id) : editingGoal?.parentGoalId ? String(editingGoal.parentGoalId) : "none"
  );

  const metricSourcesForCategory = Object.entries(METRIC_SOURCES).filter(
    ([, meta]) => category === "general" || meta.platform === category
  );

  const possibleParents = allFlat.filter((g) => {
    if (isEditing && g.id === editingGoal.id) return false;
    if (g.parentGoalId && allFlat.find((p) => p.id === g.parentGoalId)?.parentGoalId) return false;
    return true;
  });

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

  async function handleSubmit() {
    if (!title.trim()) return;
    const payload: Record<string, unknown> = {
      title,
      category,
      goalType,
      parentGoalId: parentId !== "none" ? parseInt(parentId) : null,
    };
    if (goalType === "cadence") {
      payload.cadenceValue = cadenceValue ? parseFloat(cadenceValue) : null;
      payload.cadenceUnit = cadenceUnit;
      payload.metricSource = metricSource && metricSource !== "manual" ? metricSource : null;
      payload.targetValue = null;
      payload.deadline = null;
    } else {
      payload.targetValue = targetValue ? parseFloat(targetValue) : null;
      payload.deadline = deadline || null;
      payload.metricSource = metricSource && metricSource !== "manual" ? metricSource : null;
      payload.cadenceValue = null;
      payload.cadenceUnit = null;
    }
    try {
      const res = await fetch("/api/goals", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { id: editingGoal!.id, ...payload } : payload),
      });
      await assertOk(res);
      onDone();
    } catch (e) {
      alert(e instanceof Error ? e.message : `Failed to ${isEditing ? "update" : "create"} goal.`);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5 max-w-xl">
        {mobile ? (
          <div className="flex items-center justify-between mb-4">
            <button className="text-[15px] text-muted-foreground" onClick={onCancel}>Cancel</button>
            <span className="text-[15px] font-bold">{isEditing ? "Edit goal" : "New goal"}</span>
            <button
              className="text-[15px] font-bold"
              style={{ color: "oklch(0.82 0.055 80)" }}
              onClick={handleSubmit}
            >
              {isEditing ? "Save" : "Create"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[15px] font-bold uppercase tracking-wider px-1.5 py-0"
                style={{ borderColor: "oklch(0.82 0.055 80)", color: "oklch(0.82 0.055 80)" }}
              >
                {isEditing ? "EDIT" : "NEW"}
              </Badge>
              <span className="text-[14px] text-muted-foreground">
                {isEditing ? `Editing "${editingGoal!.title}"` : "Creating a goal"}
              </span>
            </div>
            <button
              className="text-[15px] text-muted-foreground hover:text-foreground"
              onClick={onCancel}
            >
              Esc to cancel
            </button>
          </div>
        )}

        <input
          className="w-full text-[20px] font-bold tracking-tight bg-transparent border-b border-dashed border-muted-foreground/30 outline-none py-1 mb-5 placeholder:text-muted-foreground/40"
          placeholder="Untitled goal..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        {!isEditing && !parentGoal && (
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[14px] text-muted-foreground">Presets:</span>
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.title}
                onClick={() => applyPreset(p)}
                className="text-[15px] px-2 py-1 rounded-sm border border-border hover:bg-accent transition-colors"
              >
                {p.title.replace("Complete 42 common core", "42 common core").replace("Reach 42 level 10", "42 level 10").replace("50 Root-me challenges", "50 RM challs")}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3.5">
          <div className="grid grid-cols-[80px_1fr] items-center gap-x-3">
            <span className="text-[14px] text-muted-foreground">Type</span>
            <div className="flex rounded-sm border border-border overflow-hidden w-fit">
              <button
                className="text-[14px] px-3 py-1.5 transition-colors"
                style={{
                  background: goalType === "cumulative" ? "var(--accent)" : "transparent",
                  fontWeight: goalType === "cumulative" ? 600 : 400,
                }}
                onClick={() => setGoalType("cumulative")}
              >
                Cumulative
              </button>
              <button
                className="text-[14px] px-3 py-1.5 transition-colors border-l border-border"
                style={{
                  background: goalType === "cadence" ? "var(--accent)" : "transparent",
                  fontWeight: goalType === "cadence" ? 600 : 400,
                }}
                onClick={() => setGoalType("cadence")}
              >
                Cadence
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[80px_1fr] items-center gap-x-3">
            <span className="text-[14px] text-muted-foreground">Platform</span>
            <Select
              value={category}
              onValueChange={(v) => {
                if (v) setCategory(v);
                setMetricSource("");
              }}
            >
              <SelectTrigger className="w-[160px] h-8 text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["general", "42", "thm", "htb", "rootme", "maldev"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "general" ? "General" : c === "42" ? "42 Paris" : c === "thm" ? "TryHackMe" : c === "htb" ? "HackTheBox" : c === "rootme" ? "Root-me" : "Maldev"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[80px_1fr] items-center gap-x-3">
            <span className="text-[14px] text-muted-foreground">Auto-track</span>
            <Select value={metricSource || "manual"} onValueChange={(v) => setMetricSource(!v || v === "manual" ? "" : v)}>
              <SelectTrigger className="w-[160px] h-8 text-[14px]">
                <SelectValue placeholder="Manual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                {metricSourcesForCategory.map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {goalType === "cadence" ? (
            <>
              <div className="grid grid-cols-[80px_1fr] items-center gap-x-3">
                <span className="text-[14px] text-muted-foreground">Rate</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">&ge;</span>
                  <Input
                    type="number"
                    min="1"
                    className="w-[80px] h-8 text-[14px]"
                    value={cadenceValue}
                    onChange={(e) => setCadenceValue(e.target.value)}
                    placeholder="e.g., 2"
                  />
                  <Select value={cadenceUnit} onValueChange={(v) => setCadenceUnit(v as "per_week" | "per_month")}>
                    <SelectTrigger className="w-[120px] h-8 text-[14px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_week">per week</SelectItem>
                      <SelectItem value="per_month">per month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-[80px_1fr] items-center gap-x-3">
                <span className="text-[14px] text-muted-foreground">Target</span>
                <Input
                  type="number"
                  className="w-[120px] h-8 text-[14px]"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center gap-x-3">
                <span className="text-[14px] text-muted-foreground">Deadline</span>
                <Input
                  type="date"
                  className="w-[160px] h-8 text-[14px]"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-[80px_1fr] items-center gap-x-3">
            <span className="text-[14px] text-muted-foreground">Parent</span>
            <Select value={parentId} onValueChange={(v) => setParentId(v ?? "none")}>
              <SelectTrigger className="w-[200px] h-8 text-[14px]">
                <SelectValue placeholder="None (standalone)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (standalone)</SelectItem>
                {possibleParents.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <Button onClick={handleSubmit} size="sm">
            {isEditing ? "Save changes" : "Create goal"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
