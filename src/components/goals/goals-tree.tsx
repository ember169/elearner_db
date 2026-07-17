"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLATFORM_COLORS } from "@/lib/platform-colors";
import type { GoalWithPacing } from "@/lib/guidance/engine";

function TreeItem({
  goal,
  depth,
  selectedId,
  onSelect,
  expanded,
  onToggle,
}: {
  goal: GoalWithPacing;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  expanded: Record<number, boolean>;
  onToggle: (id: number) => void;
}) {
  const isSelected = selectedId === goal.id;
  const isCompleted = goal.status === "completed";
  const hasChildren = goal.children.length > 0;
  const isExpanded = expanded[goal.id] ?? (depth < 1);
  const isBehind =
    goal.pacing && !goal.pacing.onTrack && goal.pacing.percentComplete < 100;

  const paddingLeft = depth === 0 ? 10 : depth === 1 ? 28 : 44;
  const platformColor = PLATFORM_COLORS[goal.category ?? "general"];

  const progress =
    goal.targetValue && goal.currentValue != null
      ? Math.round((goal.currentValue / goal.targetValue) * 100)
      : null;

  return (
    <>
      <button
        className={cn(
          "w-full text-left flex items-center gap-1.5 py-1.5 pr-2 text-[14px] transition-colors relative",
          isSelected && "bg-[oklch(0.82_0.055_80/0.08)] border-l-2 border-l-[oklch(0.82_0.055_80)]",
          !isSelected && "border-l-2 border-l-transparent hover:bg-accent/50",
          isCompleted && "opacity-40"
        )}
        style={{ paddingLeft }}
        onClick={() => onSelect(goal.id)}
      >
        {depth === 0 && (
          <span
            className="absolute left-[2px] top-[6px] bottom-[6px] w-[3px] rounded-full"
            style={{ backgroundColor: platformColor }}
          />
        )}

        {hasChildren && (
          <span
            className="flex-shrink-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(goal.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </span>
        )}

        {depth === 2 && !hasChildren && (
          <span className="flex-shrink-0">
            {isCompleted ? (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            ) : (
              <span className="inline-block h-3 w-3 border border-muted-foreground/40 rounded-sm" />
            )}
          </span>
        )}

        <span
          className={cn(
            "truncate flex-1",
            depth === 0 && "font-semibold",
            isCompleted && "line-through"
          )}
        >
          {goal.title}
        </span>

        {isBehind && depth > 0 && !hasChildren && (
          <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
        )}

        {(() => {
          if (hasChildren && depth > 0) {
            const behindCount = goal.children.filter(
              (c) => c.status === "active" && c.pacing && !c.pacing.onTrack && c.pacing.percentComplete < 100
            ).length;
            if (behindCount > 0) {
              return (
                <span className="flex-shrink-0 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[15px] font-bold flex items-center justify-center">
                  {behindCount}
                </span>
              );
            }
          }
          return null;
        })()}

        {progress !== null && depth === 0 && !hasChildren && (
          <span className="text-[14px] text-muted-foreground flex-shrink-0">
            {progress}%
          </span>
        )}

        {goal.pacing && depth === 0 && hasChildren && (
          <span className="text-[14px] text-muted-foreground flex-shrink-0">
            {Math.round(goal.pacing.percentComplete)}%
          </span>
        )}

        {goal.goalType === "cadence" && goal.pacing && goal.pacing.onTrack && !isCompleted && (
          <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
        )}

        {hasChildren && depth > 0 && (
          <span className="text-[14px] text-muted-foreground flex-shrink-0">
            {goal.currentValue ?? 0}/{goal.targetValue ?? goal.children.length}
          </span>
        )}
      </button>

      {hasChildren && isExpanded && (
        <div>
          {goal.children.map((child) => (
            <TreeItem
              key={child.id}
              goal={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function GoalsTree({
  goals,
  selectedId,
  onSelect,
  onNewGoal,
  onSuggest,
  on42Plan,
}: {
  goals: GoalWithPacing[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNewGoal: () => void;
  onSuggest?: () => void;
  on42Plan?: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    try {
      const stored = localStorage.getItem("learnerdb-goals-expanded");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem("learnerdb-goals-expanded", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function flatCount(tree: GoalWithPacing[]): { active: number; behind: number } {
    let active = 0;
    let behind = 0;
    function walk(g: GoalWithPacing) {
      if (g.status === "active") {
        active++;
        if (g.pacing && !g.pacing.onTrack && g.pacing.percentComplete < 100 && g.children.length === 0) {
          behind++;
        }
      }
      g.children.forEach(walk);
    }
    tree.forEach(walk);
    return { active, behind };
  }

  const { active, behind } = flatCount(goals);

  const epics = goals.filter((g) => g.children.length > 0);
  const standalone = goals.filter((g) => g.children.length === 0);

  const behindGoals = (() => {
    const result: GoalWithPacing[] = [];
    function walk(g: GoalWithPacing) {
      if (
        g.status === "active" &&
        g.pacing &&
        !g.pacing.onTrack &&
        g.pacing.percentComplete < 100 &&
        g.children.length === 0
      ) {
        result.push(g);
      }
      g.children.forEach(walk);
    }
    goals.forEach(walk);
    return result;
  })();

  return (
    <div className="flex flex-col h-full w-[200px] border-r border-border">
      <div className="px-3 pt-4 pb-2">
        <h3 className="text-[18px] font-bold leading-tight">Goals</h3>
        <p className="text-[15px] text-muted-foreground mt-0.5">
          {active} active
          {behind > 0 && (
            <span className="text-red-400"> &middot; {behind} behind</span>
          )}
        </p>
      </div>

      {behindGoals.length > 0 && (
        <div className="mx-2 mb-2 px-2 py-1.5 rounded-sm bg-red-500/10 border border-red-500/20">
          {behindGoals.map((g) => (
            <button
              key={g.id}
              className="flex items-center gap-1 text-[15px] text-red-400 w-full hover:text-red-300 py-0.5"
              onClick={() => onSelect(g.id)}
            >
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{g.title}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {epics.map((goal) => (
          <TreeItem
            key={goal.id}
            goal={goal}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
            expanded={expanded}
            onToggle={toggleExpand}
          />
        ))}

        {standalone.length > 0 && epics.length > 0 && (
          <div className="mx-3 my-2 border-t border-border" />
        )}

        {standalone.map((goal) => (
          <TreeItem
            key={goal.id}
            goal={goal}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
            expanded={expanded}
            onToggle={toggleExpand}
          />
        ))}
      </div>

      <div className="border-t border-border flex">
        <button
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[15px] text-muted-foreground hover:text-foreground transition-colors"
          onClick={onSuggest}
        >
          <Zap className="h-3 w-3" />
          Suggest
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[15px] text-muted-foreground hover:text-foreground transition-colors border-l border-border"
          onClick={on42Plan}
        >
          42 plan
        </button>
        <Button
          size="sm"
          className="flex-1 rounded-none text-[15px] h-auto py-2"
          onClick={onNewGoal}
        >
          <Plus className="h-3 w-3 mr-0.5" />
          New
        </Button>
      </div>
    </div>
  );
}
