"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, RefreshCw, AlertTriangle } from "lucide-react";
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

type CompetencySlim = { id: string; label: string; area: string; level: number };

export function SuggestPane({
  competencies,
  onDone,
}: {
  competencies: CompetencySlim[];
  onDone: () => void;
}) {
  const [suggestion, setSuggestion] = useState<GoalSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const hasFetched = useRef(false);

  const gaps = competencies.filter((c) => c.level < 2).sort((a, b) => a.level - b.level);

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

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      generate();
    }
  }, []);

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
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: "var(--primary)" }} />
            <h2 className="text-[18px] font-bold">Goal Suggestion</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generate}
            disabled={loading}
            className="text-[11px]"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            {suggestion ? "New suggestion" : "Retry"}
          </Button>
        </div>

        {/* Competency gaps context */}
        {gaps.length > 0 && (
          <div className="rounded-sm border border-border px-4 py-3" style={{ background: "var(--card)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Competency gaps driving this suggestion
            </p>
            <div className="flex flex-wrap gap-1.5">
              {gaps.slice(0, 6).map((c) => (
                <span
                  key={c.id}
                  className="text-[11px] px-2 py-0.5 rounded-sm"
                  style={{
                    color: c.level === 0 ? "var(--status-danger)" : "var(--status-warning)",
                    background: c.level === 0
                      ? "color-mix(in oklch, var(--status-danger) 10%, transparent)"
                      : "color-mix(in oklch, var(--status-warning) 10%, transparent)",
                  }}
                >
                  {c.label} ({c.level}/5)
                </span>
              ))}
              {gaps.length > 6 && (
                <span className="text-[11px] text-muted-foreground px-1">
                  +{gaps.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="py-12 text-center">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-3" style={{ color: "var(--primary)" }} />
            <p className="text-[13px] text-muted-foreground">Analyzing your progress and gaps...</p>
            <p className="text-[11px] text-muted-foreground mt-1">This can take 1-2 min with a local LLM. Browse goals while it loads.</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="py-6 rounded-sm border border-border px-4" style={{ background: "var(--card)" }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4" style={{ color: "var(--status-danger)" }} />
              <p className="text-[13px] font-medium">Failed to generate</p>
            </div>
            <p className="text-[12px] text-muted-foreground">{error}</p>
          </div>
        )}

        {/* Suggestion result */}
        {suggestion && (
          <div className="space-y-4">
            {/* Reasoning */}
            <div className="rounded-sm border border-border px-4 py-3" style={{ background: "var(--card)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Why this suggestion
              </p>
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                {suggestion.reasoning}
              </p>
            </div>

            {/* Epic + issues tree */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
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
                <div key={idx} className="pl-4">
                  <label className="flex items-center gap-2 text-[12px] py-1 cursor-pointer">
                    <Checkbox
                      checked={selectedIssues.has(idx)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selectedIssues);
                        checked ? next.add(idx) : next.delete(idx);
                        setSelectedIssues(next);
                      }}
                      className="h-3.5 w-3.5"
                    />
                    <Badge variant="outline" className="text-[8px] px-1 py-0">ISSUE</Badge>
                    <span className="font-medium">{issue.title}</span>
                    {issue.deadline && (
                      <span className="text-muted-foreground text-[10px]">by {issue.deadline}</span>
                    )}
                    <span className="text-muted-foreground text-[10px]">· {issue.tasks.length} tasks</span>
                  </label>
                  {selectedIssues.has(idx) && (
                    <div className="pl-7 space-y-1 pb-1">
                      {issue.tasks.map((task, tIdx) => (
                        <div key={tIdx} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
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

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleAccept} disabled={applying || selectedIssues.size === 0}>
                {applying ? "Creating..." : `Accept ${selectedIssues.size} issue${selectedIssues.size !== 1 ? "s" : ""}`}
              </Button>
              <Button variant="ghost" size="sm" onClick={generate} disabled={loading}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Different suggestion
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
