"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  X,
  Pin,
  Check,
  ArrowRight,
} from "lucide-react";
import type { GuidanceResult, Recommendation, GoalWithPacing } from "@/lib/guidance/engine";
import { PLATFORM_COLORS } from "@/lib/platform-colors";
import { assertOk } from "@/lib/utils";

interface PinnedTask {
  id: number;
  title: string;
  category: string | null;
  isCompleted: boolean | null;
}

interface PlatformStatus {
  ft: { level: number | null; coalition: string | null } | null;
  thm: { rank: number | null; roomsCompleted: number | null; streak: number | null } | null;
  htb: { rank: string | null; points: number | null; owns: number } | null;
  rootme: { score: number | null; position: number | null; solved: number | null } | null;
  maldev: { progress: number | null } | null;
}

interface PathClientProps {
  guidance: GuidanceResult;
  pinnedTasks: PinnedTask[];
  platforms: PlatformStatus;
  lastSync: string | null;
}

const priorityVariant: Record<string, "danger" | "warning" | "info"> = {
  high: "danger",
  medium: "warning",
  low: "info",
};

export function PathClient({ guidance, pinnedTasks: initialPinned, platforms, lastSync }: PathClientProps) {
  const [llmAdvice, setLlmAdvice] = useState<string | null>(null);
  const [loadingLlm, setLoadingLlm] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pinned, setPinned] = useState(initialPinned);
  const [newTask, setNewTask] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  async function fetchLlmAdvice() {
    setLoadingLlm(true);
    setLlmError(null);
    try {
      const res = await fetch("/api/guidance", { method: "POST" });
      const data = await res.json();
      if (data.llmAdvice?.startsWith("Error:")) {
        setLlmError(data.llmAdvice);
      } else {
        setLlmAdvice(data.llmAdvice);
      }
    } catch {
      setLlmError("Failed to fetch AI guidance.");
    } finally {
      setLoadingLlm(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      await assertOk(res);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Sync failed.");
      setSyncing(false);
    }
  }

  async function addPinnedTask() {
    if (!newTask.trim()) return;
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask.trim(), category: "general" }),
      });
      await assertOk(res);
      const task = await res.json();
      setPinned((prev) => [...prev, task]);
      setNewTask("");
      setShowAddTask(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add task.");
    }
  }

  async function completePinnedTask(id: number) {
    try {
      const res = await fetch("/api/checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isCompleted: true }),
      });
      await assertOk(res);
      setPinned((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to complete task.");
    }
  }

  async function deletePinnedTask(id: number) {
    try {
      const res = await fetch("/api/checklist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await assertOk(res);
      setPinned((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete task.");
    }
  }

  const { recommendations, goals } = guidance;
  const behindGoals = goals.filter(
    (g) => g.pacing && !g.pacing.onTrack && g.pacing.percentComplete < 100
  );
  const nextDeadline = goals
    .filter((g) => g.deadline && g.pacing)
    .sort((a, b) => (a.pacing!.daysRemaining > b.pacing!.daysRemaining ? 1 : -1))[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="page-title">Learning path</h1>
        <p className="page-subtitle mt-1">
          Your personalized guidance based on current progress and goals
        </p>
      </div>

      {/* Behind-on-goal alerts */}
      {behindGoals.map((g) => (
        <div key={g.id} className="flex items-start gap-3 rounded-sm border border-danger/25 bg-danger/8 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
          <div>
            <p className="text-[14px] font-medium text-danger">
              Behind on &ldquo;{g.title}&rdquo;
            </p>
            {g.pacing && (
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {g.pacing.percentComplete.toFixed(0)}% done, {g.pacing.daysRemaining}d left
                {g.pacing.requiredPace !== "Complete!" &&
                  g.pacing.requiredPace !== "Overdue" &&
                  ` — need ${g.pacing.requiredPace}`}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Main grid */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1fr_200px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Focus Queue */}
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="section-label mb-3">Focus queue</p>

              <div className="space-y-1.5">
                {/* Pinned tasks */}
                {pinned.map((task) => (
                  <div
                    key={`pin-${task.id}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-sm border border-border group"
                  >
                    <Pin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[14px] font-medium flex-1 min-w-0 truncate">{task.title}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pinned</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => completePinnedTask(task.id)} className="p-1 hover:text-success text-muted-foreground transition-colors">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deletePinnedTask(task.id)} className="p-1 hover:text-danger text-muted-foreground transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Recommendations */}
                {recommendations.length === 0 && pinned.length === 0 ? (
                  <p className="text-[14px] text-muted-foreground text-center py-10">
                    Sync your platforms and set goals to get recommendations.
                  </p>
                ) : (
                  recommendations.map((rec, i) => (
                    <RecommendationRow key={i} rec={rec} />
                  ))
                )}
              </div>

              {/* Add task */}
              {showAddTask ? (
                <div className="flex gap-2 mt-3">
                  <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Personal task..."
                    className="h-8 text-[13px]"
                    onKeyDown={(e) => e.key === "Enter" && addPinnedTask()}
                    autoFocus
                  />
                  <Button size="xs" onClick={addPinnedTask}>Add</Button>
                  <Button size="xs" variant="ghost" onClick={() => { setShowAddTask(false); setNewTask(""); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mt-3 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Pin a personal task
                </button>
              )}
            </CardContent>
          </Card>

          {/* AI Insight */}
          <Card className="gold-glow overflow-visible">
            <CardContent className="pt-4 pb-4 px-4 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <p className="section-label !text-primary">AI insight</p>
                </div>
                {(llmAdvice || llmError) && (
                  <button
                    onClick={fetchLlmAdvice}
                    disabled={loadingLlm}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingLlm ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                )}
              </div>

              {llmAdvice ? (
                <div
                  className="text-[14px] text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_h3]:text-foreground [&_h3]:font-semibold [&_h3]:text-[14px] [&_h3]:mt-3 [&_h3]:mb-1 [&_li]:ml-3 [&_li]:list-disc"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(llmAdvice) }}
                />
              ) : llmError ? (
                <div>
                  <p className="text-[14px] text-destructive">{llmError}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Configure your Anthropic API key in Settings to enable AI guidance.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[14px] text-muted-foreground mb-3">
                    Get personalized learning advice powered by Claude
                  </p>
                  <Button onClick={fetchLlmAdvice} disabled={loadingLlm} size="sm">
                    {loadingLlm ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1.5" />
                        Get AI advice
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="section-label mb-3">Platforms</p>
              <div className="space-y-2.5">
                <StatusRow color={PLATFORM_COLORS["42"]} label="42" value={platforms.ft ? `Lvl ${(platforms.ft.level ?? 0).toFixed(1)}` : "—"} />
                <StatusRow color={PLATFORM_COLORS.thm} label="THM" value={platforms.thm ? `Top ${platforms.thm.rank ?? "?"}%` : "—"} />
                <StatusRow color={PLATFORM_COLORS.htb} label="HTB" value={platforms.htb ? (platforms.htb.rank ?? "—") : "—"} />
                <StatusRow color={PLATFORM_COLORS.rootme} label="Root-me" value={platforms.rootme ? `${(platforms.rootme.score ?? 0).toLocaleString()} pts` : "—"} />
                <StatusRow color={PLATFORM_COLORS.maldev} label="Maldev" value={platforms.maldev ? `${(platforms.maldev.progress ?? 0).toFixed(0)}%` : "—"} />
              </div>

              {nextDeadline?.pacing && (
                <>
                  <div className="border-t border-border my-3.5" />
                  <div>
                    <p className="section-label">Next deadline</p>
                    <p className="text-[13px] font-medium mt-1.5 truncate">{nextDeadline.title}</p>
                    <div className="progress-track mt-2">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${nextDeadline.pacing.percentComplete}%`,
                          backgroundColor: nextDeadline.pacing.onTrack ? "var(--status-success)" : "var(--status-danger)",
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
                      <span>{nextDeadline.pacing.percentComplete.toFixed(0)}%</span>
                      <span>{nextDeadline.pacing.daysRemaining}d left</span>
                    </div>
                  </div>
                </>
              )}

              <div className="border-t border-border my-3.5" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {lastSync ? `Synced ${formatRelative(lastSync)}` : "Never synced"}
                </span>
                <Button variant="outline" size="xs" onClick={handleSync} disabled={syncing}>
                  <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
                  Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function RecommendationRow({ rec }: { rec: Recommendation }) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-sm border border-border hover:bg-accent/30 transition-colors group">
      <span
        className="mt-1.5 h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: PLATFORM_COLORS[rec.platform] ?? "var(--muted-foreground)" }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[14px] font-medium">{rec.title}</span>
          <Badge variant={priorityVariant[rec.priority]}>
            {rec.priority}
          </Badge>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{rec.reason}</p>
        {rec.estimatedHours && (
          <div className="flex items-center gap-1 mt-1 text-[12px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            ~{rec.estimatedHours}h
            {rec.skills && rec.skills.length > 0 && (
              <span className="ml-1">· {rec.skills.slice(0, 3).join(", ")}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n{2,}/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
