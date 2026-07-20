"use client";

import { useState } from "react";
import { formatRelative } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  Radar,
  Activity,
} from "lucide-react";
import type { FtProject } from "@/lib/guidance/ft-project-tree";
import { PLATFORM_COLORS } from "@/lib/platform-colors";

interface FtProfileData {
  login: string;
  level: number | null;
  correctionPoints: number | null;
  wallet: number | null;
  coalition: string | null;
}

interface Snapshot {
  id: number;
  platform: string;
  date: string;
  data: string;
}

interface Skill {
  id: number;
  skillId: number;
  name: string;
  level: number | null;
}

interface ActivityItem {
  id: number;
  platform: string;
  eventType: string;
  title: string;
  details: string | null;
  timestamp: string;
}

interface CompetencyEntry {
  id: string;
  label: string;
  area: string;
  level: number;
  evidence: string;
}

interface ProgressClientProps {
  ft: FtProfileData | null;
  htb: {
    username: string;
    rank: string | null;
    points: number | null;
    systemOwns: number | null;
    userOwns: number | null;
  } | null;
  maldev: { overallProgress: number | null; modulesCompleted: number | null; totalModules: number | null } | null;
  rootme: {
    username: string;
    score: number | null;
    position: number | null;
    challengesSolved: number | null;
  } | null;
  activity: ActivityItem[];
  ftProgress: {
    currentCircle: number;
    circleBreakdown: Record<number, { total: number; done: number }>;
    completedProjects: string[];
    inProgressProjects: string[];
    availableProjects: FtProject[];
  };
  competencies: CompetencyEntry[];
  lastSync: string | null;
}

type Period = "week" | "month" | "all";

const LEVEL_LABELS = ["None", "Basics", "Familiar", "Proficient", "Strong", "Expert"];

export function ProgressClient({
  ft,
  htb,
  maldev,
  rootme,
  activity,
  ftProgress,
  competencies,
  lastSync,
}: ProgressClientProps) {
  const [period, setPeriod] = useState<Period>("all");
  const recentActivity = activity.filter((a) => a.eventType !== "sync");
  const milestones = recentActivity.slice(0, 15);

  const grouped = groupByArea(competencies);

  const nextProjects = ftProgress.availableProjects.slice(0, 3);
  const nextLabel = nextProjects.map((p) => p.name).join(", ");

  return (
    <div className="space-y-5">
      {/* Header + period toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Progress</h1>
          <p className="page-subtitle mt-1">
            {lastSync ? `Last synced ${formatRelative(lastSync)}` : "Your position across all platforms and how you got here"}
          </p>
        </div>
        <div className="flex rounded-sm border border-border overflow-hidden shrink-0 mt-1">
          {(["week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 text-[14px] font-medium transition-colors"
              style={{
                background: period === p ? "color-mix(in oklch, var(--primary) 10%, transparent)" : "transparent",
                color: period === p ? "var(--primary)" : "var(--muted-foreground)",
              }}
            >
              {p === "week" ? "This week" : p === "month" ? "This month" : "All time"}
            </button>
          ))}
        </div>
      </div>

      {/* Narrative summary — week/month views */}
      {period !== "all" && (
        <div
          className="rounded-sm border border-border px-5 py-4"
          style={{ background: "var(--card)" }}
        >
          <p className="text-[14px] font-semibold uppercase tracking-wider text-primary mb-2">
            {period === "week" ? currentWeekLabel() : currentMonthLabel()}
          </p>
          {milestones.length > 0 ? (
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {milestones.length} activit{milestones.length === 1 ? "y" : "ies"} recorded.
              {" "}Keep syncing to build a richer picture here.
            </p>
          ) : (
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              No activity recorded yet for this period. Sync your platforms to see a summary here.
            </p>
          )}
        </div>
      )}

      {/* Delta stats row — week/month views */}
      {period !== "all" && (
        <div className="grid grid-cols-5 gap-2">
          <DeltaStat
            label="42"
            value={ft ? (ft.level ?? 0).toFixed(1) : "—"}
          />
          <DeltaStat
            label="HTB"
            value={htb ? `${(htb.systemOwns ?? 0) + (htb.userOwns ?? 0)}` : "—"}
          />
          <DeltaStat
            label="Root-me"
            value={rootme ? `${rootme.challengesSolved ?? 0}` : "—"}
          />
          <DeltaStat
            label="Maldev"
            value={maldev ? `${(maldev.overallProgress ?? 0).toFixed(0)}%` : "—"}
          />
          <DeltaStat
            label="Total"
            value={
              String(
                (ft ? 1 : 0) +
                (htb ? (htb.systemOwns ?? 0) + (htb.userOwns ?? 0) : 0) +
                (rootme?.challengesSolved ?? 0)
              )
            }
          />
        </div>
      )}

      {/* Platform cards — all time view */}
      {period === "all" && (
        <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4">
          <PlatformCard
            color={PLATFORM_COLORS["42"]}
            name="42 Paris"
            value={ft ? (ft.level ?? 0).toFixed(1) : "—"}
            detail={ft ? `Level · ${ft.correctionPoints ?? 0} corr` : "Not connected"}
          />
          <PlatformCard
            color={PLATFORM_COLORS.htb}
            name="HackTheBox"
            value={htb ? (htb.rank ?? "—") : "—"}
            detail={htb ? `${htb.points ?? 0} pts · ${(htb.systemOwns ?? 0) + (htb.userOwns ?? 0)} owns` : "Not connected"}
          />
          <PlatformCard
            color={PLATFORM_COLORS.maldev}
            name="Maldev"
            value={maldev ? `${(maldev.overallProgress ?? 0).toFixed(0)}%` : "—"}
            detail={maldev ? `${maldev.modulesCompleted ?? 0}/${maldev.totalModules ?? 0} modules` : "Not connected"}
          />
          <PlatformCard
            color={PLATFORM_COLORS.rootme}
            name="Root-me"
            value={rootme ? (rootme.score ?? 0).toLocaleString("en-US") : "—"}
            detail={rootme ? `${rootme.challengesSolved ?? 0} solved · #${rootme.position ?? "?"}` : "Not connected"}
          />
        </div>
      )}

      {/* Competency map — changes view for week/month, full for all time */}
      {period !== "all" ? (
        <Card>
          <CardContent className="pt-4 pb-4 px-5">
            <div className="flex items-center gap-2 mb-3">
              <Radar className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="section-label">Competency changes this {period === "week" ? "week" : "month"}</p>
            </div>
            {(() => {
              const nonZero = competencies.filter((c) => c.level > 0);
              if (nonZero.length === 0) {
                return (
                  <p className="text-[15px] text-muted-foreground text-center py-4">
                    All competencies at 0 — sync platforms and complete activities to see changes here.
                  </p>
                );
              }
              return (
                <div className="space-y-2">
                  {nonZero.map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="text-[14px] w-[140px] shrink-0" style={{ color: c.level < 2 ? "var(--status-warning)" : "var(--foreground)" }}>
                        {c.label}
                      </span>
                      <div className="flex gap-[3px] flex-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-1.5 flex-1 rounded-[1px]"
                            style={{ background: i < c.level ? (c.level < 2 ? "var(--status-warning)" : "var(--primary)") : "var(--muted)" }}
                          />
                        ))}
                      </div>
                      <span className="text-[14px] text-muted-foreground tabular-nums w-8 text-right">
                        {c.level} / 5
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="text-center mt-3">
              <button
                onClick={() => setPeriod("all")}
                className="text-[14px] text-primary hover:underline"
              >
                View full competency map
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 pb-4 px-5">
            <div className="flex items-center gap-2 mb-3">
              <Radar className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="section-label">Competency map</p>
            </div>
            {competencies.length === 0 ? (
              <p className="text-[15px] text-muted-foreground text-center py-8">
                Sync platforms to build your competency map.
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
                {grouped.map(([area, entries]) => (
                  <div key={area}>
                    <p className="text-[14px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      {area}
                    </p>
                    <div className="space-y-2">
                      {entries.map((c) => {
                        const isGap = c.level < 2;
                        return (
                          <div key={c.id}>
                            <div className="flex items-center gap-3">
                              <span
                                className="text-[14px] w-[140px] shrink-0"
                                style={{
                                  color: isGap ? "var(--status-warning)" : "var(--muted-foreground)",
                                }}
                              >
                                {c.label}
                              </span>
                              <div className="flex-1 flex gap-[3px]">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <div
                                    key={i}
                                    className="h-1.5 flex-1 rounded-[1px]"
                                    style={{
                                      backgroundColor:
                                        i < c.level
                                          ? isGap ? "var(--status-warning)" : "var(--primary)"
                                          : "var(--muted)",
                                    }}
                                  />
                                ))}
                              </div>
                              <span className="text-[15px] text-muted-foreground w-8 text-right tabular-nums">
                                {c.level} / 5
                              </span>
                            </div>
                            {c.evidence && c.evidence !== "No tracked activity yet" && (
                              <p className="text-[15px] text-muted-foreground/70 pl-[calc(140px+0.75rem)] mt-0.5 leading-tight">
                                {c.evidence}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {competencies.some((c) => c.level < 2) && (
              <p className="text-[14px] text-muted-foreground mt-4 leading-relaxed">
                Items in{" "}
                <span style={{ color: "var(--status-warning)" }}>orange</span>
                {" "}are below where they should be for your red team objective.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Holy Graph + Weekly activity side by side */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="section-label">42 Holy Graph</p>
            </div>
            <div className="space-y-2.5">
              {Object.entries(ftProgress.circleBreakdown)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([circle, { total, done }]) => (
                  <div key={circle} className="flex items-center gap-3">
                    <span className="text-[14px] text-muted-foreground w-16 tabular-nums">
                      Circle {circle}
                    </span>
                    <div className="flex-1 progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${total > 0 ? (done / total) * 100 : 0}%`,
                          backgroundColor: PLATFORM_COLORS["42"],
                        }}
                      />
                    </div>
                    <span className="text-[14px] text-muted-foreground w-8 text-right tabular-nums">
                      {done}/{total}
                    </span>
                  </div>
                ))}
            </div>
            {nextProjects.length > 0 && (
              <>
                <div className="border-t border-border my-3" />
                <p className="section-label mb-2">Available now</p>
                <div className="flex flex-wrap gap-1.5">
                  {ftProgress.availableProjects.map((p) => (
                    <Badge key={p.slug} variant="secondary">
                      {p.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-[15px] text-muted-foreground mt-2">
                  Next: {nextLabel} → unlock Circle {ftProgress.currentCircle + 1}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Weekly activity by platform */}
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="section-label">
                {period === "week" ? "This week" : period === "month" ? "This month" : "All time"} activity by platform
              </p>
            </div>
            <PlatformActivityBars
              activity={activity}
              period={period}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent milestones */}
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="section-label">Recent milestones</p>
          </div>
          {milestones.length === 0 ? (
            <p className="text-[15px] text-muted-foreground text-center py-8">
              No activity yet. Sync your platforms to see milestones here.
            </p>
          ) : (
            <div className="relative pl-5">
              <div
                className="absolute left-[3px] top-2 bottom-2 w-[2px]"
                style={{ background: "var(--border)" }}
              />
              <div className="space-y-3">
                {milestones.map((item) => {
                  const isSignificant = item.eventType === "validation" || item.eventType === "own" || item.eventType === "milestone";
                  return (
                    <div key={item.id} className="relative flex items-start gap-3">
                      <div
                        className="absolute left-[-17px] top-1.5 h-2.5 w-2.5 rounded-full border-2"
                        style={{
                          borderColor: isSignificant ? "var(--status-success)" : "var(--border)",
                          background: isSignificant ? "var(--status-success)" : "var(--background)",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: PLATFORM_COLORS[item.platform] ?? "var(--muted-foreground)" }}
                          />
                          <span className="text-[15px] font-medium truncate">{item.title}</span>
                          <span className="text-[15px] text-muted-foreground shrink-0 tabular-nums ml-auto" suppressHydrationWarning>
                            {formatRelative(item.timestamp)}
                          </span>
                        </div>
                        {item.details && (
                          <p className="text-[15px] text-muted-foreground mt-0.5 pl-[14px]">
                            {tryParseDetails(item.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

/* ─── Delta stats ─── */

function DeltaStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-sm border border-border text-center px-3 py-2.5"
      style={{ background: "var(--card)" }}
    >
      <p className="text-[15px] text-muted-foreground">{label}</p>
      <p className="text-[18px] font-bold tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

/* ─── Platform cards ─── */

function PlatformCard({ color, name, value, detail }: { color: string; name: string; value: string; detail: string }) {
  return (
    <a href="/settings" className="block group">
      <Card className="overflow-hidden gap-0 py-0 transition-colors group-hover:border-primary/30">
        <div className="h-[3px]" style={{ backgroundColor: color }} />
        <CardContent className="pt-3.5 pb-3.5 px-3.5">
          <p className="section-label">{name}</p>
          <p className="stat-value mt-1.5">{value}</p>
          <p className="text-[15px] text-muted-foreground mt-1">{detail}</p>
        </CardContent>
      </Card>
    </a>
  );
}

/* ─── Platform activity bars ─── */

function PlatformActivityBars({ activity, period }: { activity: ActivityItem[]; period: Period }) {
  const now = new Date();
  const cutoff = new Date();
  if (period === "week") cutoff.setDate(now.getDate() - 7);
  else if (period === "month") cutoff.setDate(now.getDate() - 30);
  else cutoff.setFullYear(2000);

  const filtered = activity.filter(
    (a) => a.eventType !== "sync" && new Date(a.timestamp) >= cutoff
  );

  const counts: Record<string, number> = {};
  for (const a of filtered) {
    counts[a.platform] = (counts[a.platform] ?? 0) + 1;
  }

  const platforms = [
    { key: "42", label: "42 Paris" },
    { key: "thm", label: "TryHackMe" },
    { key: "htb", label: "HackTheBox" },
    { key: "rootme", label: "Root-me" },
    { key: "maldev", label: "Maldev" },
  ];

  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="space-y-2">
      {platforms.map((p) => {
        const count = counts[p.key] ?? 0;
        const pct = (count / maxCount) * 100;
        return (
          <div key={p.key} className="flex items-center gap-3">
            <span className="text-[15px] text-muted-foreground w-[70px] shrink-0 truncate">
              {p.label}
            </span>
            <div
              className="flex-1 h-2 rounded-[1px]"
              style={{ background: "var(--muted)" }}
            >
              {count > 0 && (
                <div
                  className="h-full rounded-[1px] transition-all"
                  style={{
                    width: `${Math.max(pct, 3)}%`,
                    background: `color-mix(in oklch, ${PLATFORM_COLORS[p.key]} 75%, transparent)`,
                  }}
                />
              )}
            </div>
            <span className="text-[15px] text-muted-foreground tabular-nums w-6 text-right">
              {count}
            </span>
          </div>
        );
      })}
      {Object.keys(counts).length === 0 && (
        <p className="text-[14px] text-muted-foreground text-center py-4">
          No activity recorded for this period.
        </p>
      )}
    </div>
  );
}

/* ─── Helpers ─── */

function groupByArea(competencies: CompetencyEntry[]): [string, CompetencyEntry[]][] {
  const map = new Map<string, CompetencyEntry[]>();
  for (const c of competencies) {
    const list = map.get(c.area) ?? [];
    list.push(c);
    map.set(c.area, list);
  }
  return [...map.entries()];
}

function tryParseDetails(details: string): string {
  try {
    const parsed = JSON.parse(details);
    if (typeof parsed === "object" && parsed !== null) {
      return Object.entries(parsed)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
    }
    return details;
  } catch {
    return details;
  }
}

function currentWeekLabel(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekNum = getWeekNumber(now);
  return `Week ${weekNum} · ${formatShortDate(monday)}–${formatShortDate(sunday)}`;
}

function currentMonthLabel(): string {
  const now = new Date();
  return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getWeekNumber(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

