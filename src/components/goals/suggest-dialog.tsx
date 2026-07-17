"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Zap, RefreshCw } from "lucide-react";
import { assertOk } from "@/lib/utils";

type SuggestedTask = { title: string; ftSlug?: string };
type SuggestedIssue = { title: string; deadline?: string; tasks: SuggestedTask[] };
type GoalSuggestion = {
  epic: {
    title: string;
    platform: string;
    metricSource?: string;
    targetValue?: number;
    deadline?: string;
  };
  issues: SuggestedIssue[];
  reasoning: string;
};

export function SuggestDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [suggestion, setSuggestion] = useState<GoalSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());

  async function generate() {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/goals/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "full_epic" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate suggestion.");
        return;
      }
      setSuggestion(data.suggestion);
      setSelectedIssues(new Set(data.suggestion.issues.map((_: SuggestedIssue, i: number) => i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!suggestion) return;
    setApplying(true);
    try {
      const epicRes = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: suggestion.epic.title,
          category: suggestion.epic.platform,
          goalType: "cumulative",
          targetValue: suggestion.epic.targetValue ?? null,
          metricSource: suggestion.epic.metricSource ?? null,
          deadline: suggestion.epic.deadline ?? null,
        }),
      });
      await assertOk(epicRes);

      const allGoals = await fetch("/api/goals").then((r) => r.json());
      const epicGoal = allGoals
        .filter((g: { title: string }) => g.title === suggestion.epic.title)
        .pop();
      if (!epicGoal) throw new Error("Could not find created epic.");
      const epicId = epicGoal.id;

      for (const [idx, issue] of suggestion.issues.entries()) {
        if (!selectedIssues.has(idx)) continue;
        const issueRes = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: issue.title,
            category: suggestion.epic.platform,
            goalType: "cumulative",
            deadline: issue.deadline ?? null,
            parentGoalId: epicId,
            sortOrder: idx,
          }),
        });
        await assertOk(issueRes);

        const updatedGoals = await fetch("/api/goals").then((r) => r.json());
        const issueGoal = updatedGoals
          .filter((g: { title: string; parentGoalId: number | null }) =>
            g.title === issue.title && g.parentGoalId === epicId
          )
          .pop();
        if (!issueGoal) continue;

        for (const [tIdx, task] of issue.tasks.entries()) {
          await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: task.title,
              category: suggestion.epic.platform,
              goalType: "cumulative",
              ftSlug: task.ftSlug ?? null,
              parentGoalId: issueGoal.id,
              sortOrder: tIdx,
            }),
          });
        }
      }

      onDone();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create goals.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <Zap className="h-4 w-4" style={{ color: "oklch(0.82 0.055 80)" }} />
            LLM Goal Suggestion
          </DialogTitle>
        </DialogHeader>

        {!suggestion && !loading && !error && (
          <div className="py-4 text-center">
            <p className="text-[12px] text-muted-foreground mb-3">
              Ask the AI to suggest a goal tree based on your competency gaps and current progress.
            </p>
            <Button size="sm" onClick={generate}>
              <Zap className="h-3 w-3 mr-1" />
              Generate suggestion
            </Button>
          </div>
        )}

        {loading && (
          <div className="py-8 text-center text-[12px] text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
            Asking the AI for suggestions...
          </div>
        )}

        {error && (
          <div className="py-4">
            <p className="text-[12px] text-red-400 mb-3">{error}</p>
            <Button variant="ghost" size="sm" onClick={generate}>
              Try again
            </Button>
          </div>
        )}

        {suggestion && (
          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground italic">
              &ldquo;{suggestion.reasoning}&rdquo;
            </p>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[12px] font-semibold">
                <Badge
                  variant="outline"
                  className="text-[8px] px-1 py-0"
                  style={{ borderColor: "oklch(0.82 0.055 80)", color: "oklch(0.82 0.055 80)" }}
                >
                  EPIC
                </Badge>
                {suggestion.epic.title}
                {suggestion.epic.deadline && (
                  <span className="text-muted-foreground font-normal text-[10px]">
                    by {suggestion.epic.deadline}
                  </span>
                )}
              </div>

              {suggestion.issues.map((issue, idx) => (
                <div key={idx} className="pl-3">
                  <label className="flex items-center gap-2 text-[11px] py-0.5 cursor-pointer">
                    <Checkbox
                      checked={selectedIssues.has(idx)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selectedIssues);
                        checked ? next.add(idx) : next.delete(idx);
                        setSelectedIssues(next);
                      }}
                      className="h-3 w-3"
                    />
                    <Badge variant="outline" className="text-[8px] px-1 py-0">ISSUE</Badge>
                    <span className="font-medium">{issue.title}</span>
                    {issue.deadline && (
                      <span className="text-muted-foreground text-[10px]">by {issue.deadline}</span>
                    )}
                    <span className="text-muted-foreground text-[10px]">· {issue.tasks.length} tasks</span>
                  </label>
                  {selectedIssues.has(idx) && (
                    <div className="pl-6 space-y-0.5">
                      {issue.tasks.map((task, tIdx) => (
                        <div key={tIdx} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                          {task.title}
                          {task.ftSlug && (
                            <span className="font-mono text-[9px]">{task.ftSlug}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleAccept} disabled={applying || selectedIssues.size === 0}>
                {applying ? "Creating..." : `Accept (${selectedIssues.size} issues)`}
              </Button>
              <Button variant="ghost" size="sm" onClick={generate} disabled={loading}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Regenerate
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
