"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Clock,
  RefreshCw,
  Plus,
  X,
  Check,
  ArrowRight,
  Settings,
  Square,
} from "lucide-react";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";
import { assertOk } from "@/lib/utils";

type MentorFocus = {
  type: string;
  title: string;
  why: string;
  estimatedTime: string;
  priority: "high" | "medium" | "low";
  ref?: string;
  link?: string;
  status?: string;
  blocking?: string;
  skillLabel?: string;
};

type MentorCompetency = {
  id: string;
  level: number;
  evidence: string;
  nextStep: string;
};

type SideProject = {
  title: string;
  description: string;
  skills?: string[];
  prerequisites?: { label: string; status: string }[];
  steps?: { title: string; description: string; estimatedHours: number }[];
  bonus_extensions?: string[];
  capstone_connection?: string;
};

type MentorPlan = {
  version: number;
  generatedAt: string;
  objectiveEcho: string;
  headline: string;
  focus: MentorFocus[];
  competencies: MentorCompetency[];
  fallback?: boolean;
  side_project?: SideProject;
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
  ft: { level: number | null; coalition: string | null; delta: number | null } | null;
  thm: { rank: number | null; roomsCompleted: number | null; streak: number | null; delta: number | null } | null;
  htb: { rank: string | null; points: number | null; owns: number; delta: number | null } | null;
  rootme: { score: number | null; position: number | null; solved: number | null; delta: number | null } | null;
  maldev: { progress: number | null; delta: number | null } | null;
}

type CompetencyEntry = {
  id: string;
  label: string;
  area: string;
  level: number;
  evidence: string;
};

interface PathClientProps {
  mentor: MentorResult;
  pinnedTasks: PinnedTask[];
  platforms: PlatformStatus;
  lastSync: string | null;
  competencies: CompetencyEntry[];
}

const FOCUS_TYPE_LABELS: Record<string, string> = {
  "42": "42",
  maldev: "MAL",
  thm: "THM",
  rootme: "RM",
  htb: "HTB",
  "side-project": "SP",
  skill: "SK",
};

export function PathClient({ mentor, pinnedTasks: initialPinned, platforms, lastSync, competencies }: PathClientProps) {
  const [plan, setPlan] = useState(mentor.plan);
  const [stale, setStale] = useState(mentor.stale);
  const [hasKey, setHasKey] = useState(mentor.hasKey);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pinned, setPinned] = useState(initialPinned);
  const [newTask, setNewTask] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  const heroItem = plan.focus[0] ?? null;
  const alsoItems = plan.focus.slice(1, 4);

  const sorted = [...competencies].sort((a, b) => a.level - b.level);
  const weakest = sorted.slice(0, 3);
  const strongest = [...competencies].sort((a, b) => b.level - a.level)[0];
  const spotlightItems = strongest && !weakest.some((w) => w.id === strongest.id)
    ? [...weakest, strongest]
    : sorted.slice(0, 4);

  const focusCompetencyIds = new Set(
    plan.competencies
      ?.filter((c) => c.level <= 2)
      .slice(0, 3)
      .map((c) => c.id) ?? []
  );

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
    <div className="space-y-6 max-w-[896px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Mentor</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {plan.objectiveEcho}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-2">
          {stale && <Badge variant="warning">Stale</Badge>}
          <span className="text-[12px] text-muted-foreground" suppressHydrationWarning>
            {lastSync ? `Synced ${formatRelative(lastSync)}` : "Never synced"}
          </span>
          <Button
            variant="outline"
            size="xs"
            onClick={regeneratePlan}
            disabled={regenerating}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${regenerating ? "animate-spin" : ""}`} />
            {regenerating ? "Generating..." : "Regenerate"}
          </Button>
        </div>
      </div>

      {plan.fallback && !hasKey && (
        <p className="text-[12px] text-muted-foreground -mt-3">
          Rule-based plan —{" "}
          <a href="/settings" className="underline hover:text-foreground transition-colors">
            add an API key
          </a>{" "}
          for full mentor guidance
        </p>
      )}

      {regenError && (
        <p className="text-[13px] text-destructive -mt-3">{regenError}</p>
      )}

      {/* Platform pulse bar */}
      <PulseBar platforms={platforms} syncing={syncing} onSync={handleSync} />

      {/* Right now hero */}
      {heroItem && (
        <div>
          <p className="section-label mb-2">Right now</p>
          <div className="gold-glow overflow-visible">
            <Card
              className="relative z-10"
              style={{ borderColor: "oklch(0.82 0.055 80 / 0.2)" }}
            >
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex items-start gap-3">
                  <PlatformCircle type={heroItem.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                      <span className="text-[18px] font-bold tracking-tight">{heroItem.title}</span>
                      {heroItem.status && (
                        <Badge variant="danger">{heroItem.status}</Badge>
                      )}
                    </div>
                    <p className="text-[14px] leading-relaxed" style={{ color: "oklch(0.75 0.01 80)" }}>
                      {heroItem.why}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-[12px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {heroItem.estimatedTime} estimated
                      </span>
                      {heroItem.blocking && (
                        <span className="flex items-center gap-1">
                          <span style={{ color: "var(--status-warning)" }}>&#x1F4CD;</span>
                          {heroItem.blocking}
                        </span>
                      )}
                    </div>
                  </div>
                  {heroItem.link && (
                    <a
                      href={heroItem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 mt-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Also this week */}
      {alsoItems.length > 0 && (
        <div>
          <p className="section-label mb-2">Also this week</p>
          <div className="space-y-2">
            {alsoItems.map((item, i) => (
              <AlsoRow key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {plan.focus.length === 0 && pinned.length === 0 && (
        <div className="rounded-sm border border-dashed border-border px-6 py-14 text-center">
          <p className="text-[14px] text-muted-foreground">
            Sync your platforms to get mentor recommendations.
          </p>
        </div>
      )}

      {/* Side project brief */}
      {plan.side_project && (
        <SideProjectBrief project={plan.side_project} />
      )}

      {/* Competency spotlight */}
      {spotlightItems.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4 px-5">
            <p className="section-label mb-3">Competency spotlight</p>
            <p className="text-[13px] text-muted-foreground mb-4">
              Your biggest gaps relative to your red team objective:
            </p>
            <div className="space-y-2.5">
              {spotlightItems.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-[12px] text-muted-foreground w-[130px] shrink-0">
                    {c.label}
                  </span>
                  <div className="flex gap-[3px] flex-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-[1px]"
                        style={{
                          background:
                            i < c.level
                              ? "var(--primary)"
                              : "var(--muted)",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[12px] text-muted-foreground tabular-nums w-8 text-right">
                    {c.level} / 5
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground mt-4 leading-relaxed">
              This week&apos;s tasks target your lowest competencies.{" "}
              <a href="/progress" className="text-primary hover:underline">Full map</a>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pinned tasks */}
      <div>
        <p className="section-label mb-2">Pinned tasks</p>
        {pinned.length > 0 && (
          <div className="space-y-1.5">
            {pinned.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 rounded-sm border border-border group"
              >
                <button
                  onClick={() => completePinnedTask(task.id)}
                  className="text-muted-foreground hover:text-success transition-colors shrink-0"
                >
                  <Square className="h-4 w-4" />
                </button>
                <span className="text-[14px] flex-1 min-w-0">{task.title}</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Pinned
                </span>
                <button
                  onClick={() => deletePinnedTask(task.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:text-danger text-muted-foreground transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddTask ? (
          <div className="flex gap-2 mt-2">
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
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mt-2 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Pin a task
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Platform pulse bar ─── */

function PulseBar({
  platforms,
  syncing,
  onSync,
}: {
  platforms: PlatformStatus;
  syncing: boolean;
  onSync: () => void;
}) {
  const items: { color: string; label: string; value: string; delta: string | null }[] = [];
  if (platforms.ft) {
    const d = platforms.ft.delta;
    items.push({
      color: PLATFORM_COLORS["42"],
      label: "42",
      value: (platforms.ft.level ?? 0).toFixed(1),
      delta: d && d > 0 ? `+${d.toFixed(1)} this month` : null,
    });
  }
  if (platforms.thm) {
    const d = platforms.thm.delta;
    items.push({
      color: PLATFORM_COLORS.thm,
      label: "THM",
      value: `${platforms.thm.roomsCompleted ?? 0} rooms`,
      delta: d && d > 0 ? `+${d} this month` : null,
    });
  }
  if (platforms.htb) {
    const d = platforms.htb.delta;
    items.push({
      color: PLATFORM_COLORS.htb,
      label: "HTB",
      value: platforms.htb.rank ?? `${platforms.htb.owns} owns`,
      delta: d && d > 0 ? `+${d} this month` : null,
    });
  }
  if (platforms.rootme) {
    const d = platforms.rootme.delta;
    items.push({
      color: PLATFORM_COLORS.rootme,
      label: "Root-me",
      value: `${platforms.rootme.score ?? 0} pts`,
      delta: d && d > 0 ? `+${d} this month` : null,
    });
  }
  if (platforms.maldev) {
    const d = platforms.maldev.delta;
    items.push({
      color: PLATFORM_COLORS.maldev,
      label: "Maldev",
      value: `${(platforms.maldev.progress ?? 0).toFixed(0)}%`,
      delta: d && d > 0 ? `+${d.toFixed(0)}% this month` : null,
    });
  }

  if (items.length === 0) return null;

  return (
    <div
      className="flex items-center rounded-sm px-4 py-2.5"
      style={{ background: "oklch(0.16 0.005 75)" }}
    >
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center">
          {i > 0 && <PulseDivider />}
          <div className="flex items-center gap-2 px-3">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[12px] text-muted-foreground">{item.label}</span>
            <span className="text-[13px] font-bold tabular-nums">{item.value}</span>
            {item.delta && (
              <span className="text-[11px] tabular-nums" style={{ color: "var(--status-success)" }}>
                {item.delta}
              </span>
            )}
          </div>
        </div>
      ))}
      <div className="ml-auto">
        <Button variant="ghost" size="xs" onClick={onSync} disabled={syncing}>
          <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  );
}

function PulseDivider() {
  return (
    <div
      className="h-3 w-px shrink-0"
      style={{ background: "oklch(0.25 0.007 70)" }}
    />
  );
}

/* ─── Platform circle badge ─── */

function PlatformCircle({ type }: { type: string }) {
  const color = PLATFORM_COLORS[type] ?? "var(--muted-foreground)";
  const label = FOCUS_TYPE_LABELS[type] ?? type.toUpperCase().slice(0, 3);
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
      style={{
        background: `color-mix(in oklch, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
      }}
    >
      <span
        className="text-[11px] font-bold"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── Also this week row ─── */

function AlsoRow({ item }: { item: MentorFocus }) {
  const color = PLATFORM_COLORS[item.type] ?? "var(--muted-foreground)";
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-sm border border-border transition-colors hover:bg-accent/30"
      style={{ background: "oklch(0.19 0.006 75 / 0.4)" }}
    >
      <PlatformCircle type={item.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-[14px] font-semibold">{item.title}</span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.estimatedTime}
          </span>
          {item.skillLabel && (
            <>
              <span className="text-[11px] text-muted-foreground">&middot;</span>
              <span className="text-[11px] text-muted-foreground">{item.skillLabel}</span>
            </>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{item.why}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
}

/* ─── Side project brief ─── */

function SideProjectBrief({ project }: { project: SideProject }) {
  return (
    <div>
      <p className="section-label mb-2">Side project brief</p>
      <div
        className="rounded-sm border border-border px-5 py-4"
        style={{ borderLeft: "3px solid var(--primary)" }}
      >
        <h3 className="text-[16px] font-bold mb-1.5">{project.title}</h3>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
          {project.description}
        </p>

        {project.prerequisites && project.prerequisites.length > 0 && (
          <div
            className="rounded-sm px-4 py-3 mb-3"
            style={{ background: "oklch(0.16 0.005 75)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Prerequisites
            </p>
            <div className="space-y-1">
              {project.prerequisites.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px]">
                  <span>
                    {p.status === "done" ? (
                      <span className="text-success">{"✓"}</span>
                    ) : p.status === "partial" ? (
                      <span className="text-warning">~</span>
                    ) : (
                      <span className="text-danger">{"✗"}</span>
                    )}
                  </span>
                  <span className="text-muted-foreground">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {project.steps && project.steps.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {project.steps.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-2.5 rounded-sm border border-border"
              >
                <span className="text-[12px] font-bold text-muted-foreground mt-0.5 shrink-0">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium">{step.title}</span>
                  <p className="text-[12px] text-muted-foreground">{step.description}</p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  ~{step.estimatedHours}h
                </span>
              </div>
            ))}
          </div>
        )}

        {project.bonus_extensions && project.bonus_extensions.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {project.bonus_extensions.map((ext, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-sm border border-dashed border-border text-[12px] text-muted-foreground"
              >
                <span>{"☆"}</span>
                {ext}
              </div>
            ))}
          </div>
        )}

        {project.skills && project.skills.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {project.skills.map((skill) => (
              <span
                key={skill}
                className="text-[11px] font-medium px-2.5 py-1 rounded-sm border border-border"
                style={{ color: "var(--primary)" }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {project.capstone_connection && (
          <div
            className="mt-3 rounded-sm px-4 py-3 text-[12px] text-muted-foreground leading-relaxed"
            style={{ background: "oklch(0.82 0.055 80 / 0.06)" }}
          >
            <span className="font-semibold text-primary">Capstone:</span>{" "}
            {project.capstone_connection}
          </div>
        )}
      </div>
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
