"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  ArrowRight,
  Pause,
  AlertTriangle,
  Circle,
} from "lucide-react";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";

type MentorFocus = {
  type: string;
  title: string;
  why: string;
  estimatedTime: string;
  priority: "high" | "medium" | "low";
  ref?: string;
  link?: string;
};

type GoalSlim = {
  id: number;
  title: string;
  category: string | null;
  currentValue: number | null;
  targetValue: number | null;
  pacing: {
    onTrack: boolean;
    percentComplete: number;
    requiredPace: string;
    currentPace: string;
  } | null;
};

type WeekItem = {
  type: string;
  title: string;
  why: string;
  hours: number;
  priority: "high" | "medium" | "low";
  status: "done" | "active" | "blocked" | "stuck" | "upcoming";
  day: number; // 0=Mon ... 6=Sun
};

export type WeekClientProps = {
  focusItems: MentorFocus[];
  goals: GoalSlim[];
  hasPlan: boolean;
  ftInProgress?: string[];
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekBounds(date: Date): { start: Date; end: Date; weekNum: number } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const jan1 = new Date(start.getFullYear(), 0, 1);
  const days = Math.floor((start.getTime() - jan1.getTime()) / 86400000);
  const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);

  return { start, end, weekNum };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function parseHours(est: string): number {
  const match = est.match(/(\d+(?:\.\d+)?)\s*h/i);
  if (match) return parseFloat(match[1]);
  if (/evening/i.test(est)) return 3 * (parseInt(est) || 1);
  if (/session/i.test(est)) return 2 * (parseInt(est) || 1);
  return 2;
}

function distributeItems(items: MentorFocus[], today: Date): WeekItem[] {
  const { start } = getWeekBounds(today);
  const todayDay = today.getDay();
  const todayIdx = todayDay === 0 ? 6 : todayDay - 1; // 0=Mon

  const result: WeekItem[] = [];
  const dayLoad = [0, 0, 0, 0, 0, 0, 0];

  const sorted = [...items].sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 };
    return pOrder[a.priority] - pOrder[b.priority];
  });

  for (const item of sorted) {
    const hours = parseHours(item.estimatedTime);
    let bestDay = 0;
    let minLoad = Infinity;
    for (let d = 0; d < 7; d++) {
      if (dayLoad[d] < minLoad) {
        minLoad = dayLoad[d];
        bestDay = d;
      }
    }
    dayLoad[bestDay] += hours;

    let status: WeekItem["status"];
    if (bestDay < todayIdx) {
      status = "done";
    } else if (bestDay === todayIdx) {
      status = "active";
    } else {
      status = "upcoming";
    }

    result.push({
      type: item.type,
      title: item.title,
      why: item.why,
      hours,
      priority: item.priority,
      status,
      day: bestDay,
    });
  }

  return result.sort((a, b) => a.day - b.day || a.hours - b.hours);
}

const STATUS_ICONS: Record<string, { icon: typeof Check; color: string; label: string }> = {
  done: { icon: Check, color: "var(--status-success)", label: "done" },
  active: { icon: ArrowRight, color: "var(--primary)", label: "active" },
  blocked: { icon: Pause, color: "var(--status-warning)", label: "blocked" },
  stuck: { icon: AlertTriangle, color: "var(--status-danger)", label: "stuck" },
  upcoming: { icon: Circle, color: "var(--muted-foreground)", label: "upcoming" },
};

export function WeekClient({ focusItems, goals, hasPlan, ftInProgress }: WeekClientProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const now = new Date();
  const { start, end, weekNum } = getWeekBounds(now);
  const todayDay = now.getDay();
  const todayIdx = todayDay === 0 ? 6 : todayDay - 1;

  const items = distributeItems(focusItems, now);

  const statusCounts: Record<string, number> = { done: 0, active: 0, blocked: 0, stuck: 0, upcoming: 0 };
  for (const item of items) statusCounts[item.status]++;

  const platformHours: Record<string, number> = {};
  let totalHours = 0;
  for (const item of items) {
    const key = item.type;
    platformHours[key] = (platformHours[key] || 0) + item.hours;
    totalHours += item.hours;
  }
  const doneHours = items.filter((i) => i.status === "done").reduce((s, i) => s + i.hours, 0);

  const filteredItems = filter ? items.filter((i) => i.status === filter) : items;

  const itemsByDay: Record<number, WeekItem[]> = {};
  for (const item of filteredItems) {
    if (!itemsByDay[item.day]) itemsByDay[item.day] = [];
    itemsByDay[item.day].push(item);
  }

  if (!hasPlan || focusItems.length === 0) {
    return (
      <div className="space-y-5 max-w-[896px]">
        <div>
          <h1 className="page-title">This Week</h1>
          <p className="page-subtitle mt-1">
            {formatDate(start)} – {formatDate(end)} · Week {weekNum}
          </p>
        </div>
        <div className="rounded-sm border border-dashed border-border px-6 py-16 text-center">
          <p className="text-[14px] text-muted-foreground mb-1">
            Nothing planned this week.
          </p>
          <p className="text-[12px] text-muted-foreground">
            Sync your platforms in{" "}
            <a href="/settings" className="text-primary hover:underline">Settings</a>{" "}
            to get weekly recommendations, or generate a plan on the{" "}
            <a href="/" className="text-primary hover:underline">Mentor page</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[896px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">This Week</h1>
          <p className="page-subtitle mt-1">
            {formatDate(start)} – {formatDate(end)} · Week {weekNum}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[13px] pt-2">
          <button className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors px-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            Week {weekNum - 1}
          </button>
          <span className="font-semibold px-2">Week {weekNum}</span>
          <button className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors px-1">
            Week {weekNum + 1}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap">
        {(["done", "active", "blocked", "stuck", "upcoming"] as const).map((s) => {
          if (statusCounts[s] === 0) return null;
          const { icon: Icon, color } = STATUS_ICONS[s];
          const active = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(active ? null : s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors"
              style={{
                background: active ? `color-mix(in oklch, ${color} 8%, transparent)` : "oklch(0.17 0.005 75)",
                border: `1px solid ${active ? `color-mix(in oklch, ${color} 20%, transparent)` : "transparent"}`,
                color: active ? color : "var(--muted-foreground)",
              }}
            >
              <Icon className="h-3 w-3" />
              {statusCounts[s]} {s}
            </button>
          );
        })}
      </div>

      {/* Week budget bar */}
      <Card>
        <CardContent className="pt-4 pb-4 px-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold">
              Week budget: ~{totalHours.toFixed(0)}h planned
            </span>
            <span className="text-[12px] text-muted-foreground">
              {doneHours.toFixed(0)}h done · {(totalHours - doneHours).toFixed(0)}h remaining
            </span>
          </div>
          <div className="flex rounded-sm overflow-hidden h-2.5 mb-2" style={{ background: "oklch(0.22 0.005 75)" }}>
            {Object.entries(platformHours).map(([platform, hours]) => (
              <div
                key={platform}
                style={{
                  width: `${(hours / totalHours) * 100}%`,
                  backgroundColor: PLATFORM_COLORS[platform] ?? "var(--muted-foreground)",
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {Object.entries(platformHours).map(([platform, hours]) => (
              <span key={platform} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-[1px]"
                  style={{ backgroundColor: PLATFORM_COLORS[platform] ?? "var(--muted-foreground)" }}
                />
                {PLATFORM_LABELS[platform] ?? platform} · {hours.toFixed(0)}h
              </span>
            ))}
            {goals.length > 0 && (
              <span className="text-[11px] text-muted-foreground ml-auto">
                Goal coverage:{" "}
                {goals.map((g, i) => {
                  const onTrack = g.pacing?.onTrack ?? true;
                  return (
                    <span key={g.id}>
                      {i > 0 && " · "}
                      <span style={{ color: onTrack ? "var(--status-success)" : "var(--status-warning)" }}>
                        {g.title.length > 20 ? g.title.slice(0, 18) + "…" : g.title}{" "}
                        {onTrack ? "✓" : "⚠"}
                      </span>
                    </span>
                  );
                })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily breakdown */}
      <div className="space-y-1">
        {DAY_NAMES.map((dayName, dayIdx) => {
          const dayItems = itemsByDay[dayIdx];
          const dayDate = new Date(start);
          dayDate.setDate(start.getDate() + dayIdx);
          const isToday = dayIdx === todayIdx;
          const isPast = dayIdx < todayIdx;

          if (!dayItems || dayItems.length === 0) {
            if (filter) return null;
            return (
              <div key={dayIdx} className="flex items-start gap-4 py-3">
                <div className="w-[60px] shrink-0 pt-0.5">
                  <p className={`text-[13px] font-semibold ${isToday ? "text-primary" : ""}`}>
                    {dayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {isToday && <span className="text-primary ml-1">Today</span>}
                  </p>
                </div>
                <div className="flex-1 py-2 text-[12px] text-muted-foreground" style={{ opacity: 0.5 }}>
                  — rest day
                </div>
              </div>
            );
          }

          return (
            <div key={dayIdx}>
              <div
                className="flex items-start gap-4 py-3 px-2 -mx-2 rounded-sm"
                style={isToday ? { background: "oklch(0.82 0.055 80 / 0.03)" } : undefined}
              >
                <div className="w-[60px] shrink-0 pt-2">
                  <p className={`text-[13px] font-semibold ${isToday ? "text-primary" : ""}`}>
                    {dayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {isToday && <span className="text-primary ml-1">Today</span>}
                  </p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {dayItems.map((item, i) => (
                    <WeekItemRow key={i} item={item} />
                  ))}
                </div>
              </div>
              {dayIdx < 6 && <div className="border-b border-border ml-[76px]" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekItemRow({ item }: { item: WeekItem }) {
  const { icon: StatusIcon, color: statusColor } = STATUS_ICONS[item.status];
  const platformColor = PLATFORM_COLORS[item.type] ?? "var(--muted-foreground)";
  const platformLabel = PLATFORM_LABELS[item.type] ?? item.type.toUpperCase().slice(0, 3);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-sm"
      style={{ background: "oklch(0.17 0.005 75)" }}
    >
      <StatusIcon className="h-3.5 w-3.5 shrink-0" style={{ color: statusColor }} />
      <span
        className="text-[11px] font-bold px-1.5 py-0.5 rounded-sm shrink-0"
        style={{
          color: platformColor,
          background: `color-mix(in oklch, ${platformColor} 12%, transparent)`,
        }}
      >
        {platformLabel}
      </span>
      <span className="text-[13px] font-medium flex-1 min-w-0 truncate">{item.title}</span>
      <span className="text-[12px] text-muted-foreground tabular-nums shrink-0 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {item.hours}h
      </span>
    </div>
  );
}
