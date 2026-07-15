"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Compass,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  X,
  Pin,
  Check,
} from "lucide-react";
import type { GuidanceResult, Recommendation, GoalWithPacing } from "@/lib/guidance/engine";

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

const priorityStyles = {
  high: "bg-red-500/10 text-red-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  low: "bg-blue-500/10 text-blue-500",
};

const platformDots: Record<string, string> = {
  "42": "#00babc",
  thm: "#ef4444",
  htb: "#9fef00",
  rootme: "#f59e0b",
  maldev: "#a855f7",
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
      await fetch("/api/sync", { method: "POST" });
      window.location.reload();
    } finally {
      setSyncing(false);
    }
  }

  async function addPinnedTask() {
    if (!newTask.trim()) return;
    const res = await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask.trim(), category: "general" }),
    });
    if (res.ok) {
      const task = await res.json();
      setPinned((prev) => [...prev, task]);
      setNewTask("");
      setShowAddTask(false);
    }
  }

  async function completePinnedTask(id: number) {
    await fetch("/api/checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isCompleted: true }),
    });
    setPinned((prev) => prev.filter((t) => t.id !== id));
  }

  async function deletePinnedTask(id: number) {
    await fetch("/api/checklist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPinned((prev) => prev.filter((t) => t.id !== id));
  }

  const { recommendations, goals } = guidance;
  const behindGoals = goals.filter(
    (g) => g.pacing && !g.pacing.onTrack && g.pacing.percentComplete < 100
  );
  const nextDeadline = goals
    .filter((g) => g.deadline && g.pacing)
    .sort((a, b) => (a.pacing!.daysRemaining > b.pacing!.daysRemaining ? 1 : -1))[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Compass className="h-6 w-6" />
          Learning path
        </h1>
        <p className="text-sm text-muted-foreground">
          Your personalized guidance based on current progress and goals
        </p>
      </div>

      {/* Behind-on-goal alert */}
      {behindGoals.map((g) => (
        <Card key={g.id} className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-500">
                  Behind on &ldquo;{g.title}&rdquo;
                </p>
                {g.pacing && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {g.pacing.percentComplete.toFixed(0)}% done, {g.pacing.daysRemaining}d left
                    {g.pacing.requiredPace !== "Complete!" &&
                      g.pacing.requiredPace !== "Overdue" &&
                      ` — need ${g.pacing.requiredPace}`}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Main grid: Focus Queue + Status sidebar */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_220px]">
        {/* Left: Focus Queue */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Focus queue
              </h2>

              {/* Pinned personal tasks */}
              {pinned.map((task) => (
                <div
                  key={`pin-${task.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border mb-2 group"
                >
                  <Pin className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{task.title}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Pinned
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => completePinnedTask(task.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deletePinnedTask(task.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Engine recommendations */}
              {recommendations.length === 0 && pinned.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sync your platforms and set goals to get recommendations.
                </p>
              ) : (
                recommendations.map((rec, i) => (
                  <RecommendationRow key={i} rec={rec} />
                ))
              )}

              {/* Add pinned task */}
              {showAddTask ? (
                <div className="flex gap-2 mt-3">
                  <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Personal task..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && addPinnedTask()}
                    autoFocus
                  />
                  <Button size="sm" className="h-8" onClick={addPinnedTask}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => {
                      setShowAddTask(false);
                      setNewTask("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Pin a personal task
                </button>
              )}
            </CardContent>
          </Card>

          {/* AI Insight — always visible */}
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  AI insight
                </h2>
                {(llmAdvice || llmError) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={fetchLlmAdvice}
                    disabled={loadingLlm}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${loadingLlm ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                )}
              </div>

              {llmAdvice ? (
                <div
                  className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none [&_strong]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(llmAdvice) }}
                />
              ) : llmError ? (
                <div>
                  <p className="text-sm text-destructive">{llmError}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure your Anthropic API key in Settings to enable AI guidance.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
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
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Status sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Platforms
              </h2>
              <div className="space-y-1.5">
                <StatusRow
                  color="#00babc"
                  label="42"
                  value={platforms.ft ? `Lvl ${(platforms.ft.level ?? 0).toFixed(1)}` : "—"}
                />
                <StatusRow
                  color="#ef4444"
                  label="THM"
                  value={
                    platforms.thm
                      ? `#${(platforms.thm.rank ?? "?").toLocaleString()}`
                      : "—"
                  }
                />
                <StatusRow
                  color="#9fef00"
                  label="HTB"
                  value={platforms.htb ? (platforms.htb.rank ?? "—") : "—"}
                />
                <StatusRow
                  color="#f59e0b"
                  label="Root-me"
                  value={
                    platforms.rootme
                      ? `${(platforms.rootme.score ?? 0).toLocaleString()} pts`
                      : "—"
                  }
                />
                <StatusRow
                  color="#a855f7"
                  label="Maldev"
                  value={
                    platforms.maldev
                      ? `${(platforms.maldev.progress ?? 0).toFixed(0)}%`
                      : "—"
                  }
                />
              </div>

              {/* Next deadline */}
              {nextDeadline?.pacing && (
                <>
                  <div className="border-t border-border my-3" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Next deadline
                    </p>
                    <p className="text-xs font-medium mt-0.5 truncate">{nextDeadline.title}</p>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden mt-1.5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${nextDeadline.pacing.percentComplete}%`,
                          backgroundColor: nextDeadline.pacing.onTrack
                            ? "#22c55e"
                            : "#ef4444",
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{nextDeadline.pacing.percentComplete.toFixed(0)}%</span>
                      <span>{nextDeadline.pacing.daysRemaining}d left</span>
                    </div>
                  </div>
                </>
              )}

              {/* Sync */}
              <div className="border-t border-border my-3" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {lastSync
                    ? `Synced ${formatRelative(lastSync)}`
                    : "Never synced"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <RefreshCw
                    className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`}
                  />
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

function StatusRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function RecommendationRow({ rec }: { rec: Recommendation }) {
  const styles = priorityStyles[rec.priority];
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border mb-2 hover:bg-accent/30 transition-colors">
      <span
        className="mt-1.5 h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: platformDots[rec.platform] ?? "#888" }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium">{rec.title}</span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${styles}`}
          >
            {rec.priority}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{rec.reason}</p>
        {rec.estimatedHours && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            ~{rec.estimatedHours}h
            {rec.skills && rec.skills.length > 0 && (
              <span className="ml-1">
                · {rec.skills.slice(0, 3).join(", ")}
              </span>
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
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
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
