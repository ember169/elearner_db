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
  Settings,
} from "lucide-react";
import { PLATFORM_COLORS } from "@/lib/platform-colors";
import { assertOk } from "@/lib/utils";

type MentorFocus = {
  type: string;
  title: string;
  why: string;
  estimatedTime: string;
  priority: "high" | "medium" | "low";
  ref?: string;
  link?: string;
};

type MentorCompetency = {
  id: string;
  level: number;
  evidence: string;
  nextStep: string;
};

type MentorPlan = {
  version: number;
  generatedAt: string;
  objectiveEcho: string;
  headline: string;
  focus: MentorFocus[];
  competencies: MentorCompetency[];
  fallback?: boolean;
};

type MentorResult = {
  plan: MentorPlan;
  stale: boolean;
  hasKey: boolean;
};

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
  mentor: MentorResult;
  pinnedTasks: PinnedTask[];
  platforms: PlatformStatus;
  lastSync: string | null;
}

const priorityVariant: Record<string, "danger" | "warning" | "info"> = {
  high: "danger",
  medium: "warning",
  low: "info",
};

const FOCUS_TYPE_LABELS: Record<string, string> = {
  "42": "42 Paris",
  maldev: "Maldev",
  thm: "TryHackMe",
  rootme: "Root-me",
  htb: "HackTheBox",
  "side-project": "Side project",
  skill: "Skill",
};

export function PathClient({ mentor, pinnedTasks: initialPinned, platforms, lastSync }: PathClientProps) {
  const [plan, setPlan] = useState(mentor.plan);
  const [stale, setStale] = useState(mentor.stale);
  const [hasKey, setHasKey] = useState(mentor.hasKey);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pinned, setPinned] = useState(initialPinned);
  const [newTask, setNewTask] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  async function regeneratePlan() {
    setRegenerating(true);
    setRegenError(null);
    try {
      const res = await fetch("/api/mentor", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRegenError(data.error ?? "Failed to generate plan.");
        return;
      }
      setPlan(data.plan);
      setStale(data.stale);
      setHasKey(data.hasKey);
    } catch {
      setRegenError("Failed to reach the mentor API.");
    } finally {
      setRegenerating(false);
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

  return (
    <div className="space-y-5">
      {/* Objective banner */}
      <div>
        <h1 className="page-title">Mentor</h1>
        <p className="page-subtitle mt-1">{plan.objectiveEcho}</p>
        <div className="flex items-center gap-3 mt-2">
          {stale && (
            <Badge variant="warning">Stale</Badge>
          )}
          {plan.fallback && !hasKey && (
            <span className="text-[12px] text-muted-foreground">
              Rule-based plan —{" "}
              <a href="/settings" className="underline hover:text-foreground transition-colors">
                add an API key
              </a>{" "}
              for full mentor guidance
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={regeneratePlan}
              disabled={regenerating}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Generating..." : "Regenerate"}
            </Button>
            <a href="/settings">
              <Button variant="ghost" size="xs">
                <Settings className="h-3 w-3" />
              </Button>
            </a>
          </div>
        </div>
        {regenError && (
          <p className="text-[13px] text-destructive mt-2">{regenError}</p>
        )}
      </div>

      {/* Headline */}
      {plan.headline && (
        <Card className="gold-glow overflow-visible">
          <CardContent className="pt-3 pb-3 px-4 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[14px] font-medium text-primary">{plan.headline}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main grid */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1fr_200px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Focus items */}
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="section-label mb-3">This week&apos;s focus</p>

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

                {/* Focus items from mentor plan */}
                {plan.focus.length === 0 && pinned.length === 0 ? (
                  <p className="text-[14px] text-muted-foreground text-center py-10">
                    Sync your platforms to get mentor recommendations.
                  </p>
                ) : (
                  plan.focus.map((item, i) => (
                    <FocusRow key={i} item={item} />
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
                <StatusRow color={PLATFORM_COLORS.rootme} label="Root-me" value={platforms.rootme ? `${(platforms.rootme.score ?? 0).toLocaleString("en-US")} pts` : "—"} />
                <StatusRow color={PLATFORM_COLORS.maldev} label="Maldev" value={platforms.maldev ? `${(platforms.maldev.progress ?? 0).toFixed(0)}%` : "—"} />
              </div>

              <div className="border-t border-border my-3.5" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
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

function FocusRow({ item }: { item: MentorFocus }) {
  const color = PLATFORM_COLORS[item.type] ?? "var(--muted-foreground)";
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-sm border border-border hover:bg-accent/30 transition-colors group">
      <span
        className="mt-1.5 h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[14px] font-medium">{item.title}</span>
          <Badge variant={priorityVariant[item.priority]}>
            {item.priority}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {FOCUS_TYPE_LABELS[item.type] ?? item.type}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{item.why}</p>
        <div className="flex items-center gap-1 mt-1 text-[12px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {item.estimatedTime}
          {item.ref && (
            <span className="ml-1.5 font-mono text-[11px] text-muted-foreground/70">
              {item.ref}
            </span>
          )}
        </div>
      </div>
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 mt-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
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
