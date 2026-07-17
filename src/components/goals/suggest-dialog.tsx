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
import { Zap, RefreshCw, Sparkles } from "lucide-react";
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
  const [resultMode, setResultMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());

  async function generate(mode: "quick" | "auto") {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setResultMode(null);
    try {
      const res = await fetch("/api/goals/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "full_epic", mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate suggestion.");
        return;
      }
      setSuggestion(data.suggestion);
      setResultMode(data.mode ?? "unknown");
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
      const payload = {
        epic: suggestion.epic,
        issues: suggestion.issues
          .filter((_, idx) => selectedIssues.has(idx))
          .map((issue, idx) => ({
            title: issue.title,
            deadline: issue.deadline ?? null,
            sortOrder: idx,
            tasks: issue.tasks.map((task, tIdx) => ({
              title: task.title,
              ftSlug: task.ftSlug ?? null,
              sortOrder: tIdx,
            })),
          })),
      };

      const res = await fetch("/api/goals/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await assertOk(res);
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
            <Zap className="h-4 w-4" style={{ color: "var(--primary)" }} />
            Goal Suggestion
          </DialogTitle>
        </DialogHeader>

        {!suggestion && !loading && !error && (
          <div className="py-4 text-center space-y-3">
            <p className="text-[12px] text-muted-foreground">
              Generate a goal tree based on your competency gaps and current progress.
            </p>
            <div className="flex justify-center gap-2">
              <Button size="sm" onClick={() => generate("quick")}>
                <Sparkles className="h-3 w-3 mr-1" />
                Quick suggest
              </Button>
              <Button size="sm" variant="outline" onClick={() => generate("auto")}>
                <Zap className="h-3 w-3 mr-1" />
                Use LLM
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              Quick uses your competency data directly. LLM generates custom suggestions (needs API key).
            </p>
          </div>
        )}

        {loading && (
          <div className="py-8 text-center text-[12px] text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
            Generating suggestions...
          </div>
        )}

        {error && (
          <div className="py-4">
            <p className="text-[12px] text-red-400 mb-3">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => generate("quick")}>
              Try quick suggest instead
            </Button>
          </div>
        )}

        {suggestion && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-muted-foreground italic flex-1">
                &ldquo;{suggestion.reasoning}&rdquo;
              </p>
              {resultMode && (
                <Badge
                  variant="outline"
                  className="text-[8px] px-1 py-0 shrink-0"
                  style={{
                    borderColor: resultMode === "llm" ? "var(--primary)" : "var(--muted-foreground)",
                    color: resultMode === "llm" ? "var(--primary)" : "var(--muted-foreground)",
                  }}
                >
                  {resultMode === "llm" ? "AI" : "RULE-BASED"}
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[12px] font-semibold">
                <Badge
                  variant="outline"
                  className="text-[8px] px-1 py-0"
                  style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
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
                    <span className="text-muted-foreground text-[10px]">&middot; {issue.tasks.length} tasks</span>
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
              <Button variant="ghost" size="sm" onClick={() => generate("quick")} disabled={loading}>
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
