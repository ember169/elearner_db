"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Map,
  GitBranch,
  Radar,
  Calendar,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { FtProject } from "@/lib/guidance/ft-project-tree";

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

interface ProgressClientProps {
  ft: FtProfileData | null;
  thm: {
    username: string;
    rank: number | null;
    roomsCompleted: number | null;
    streak: number | null;
  } | null;
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
  skills: Skill[];
  activity: ActivityItem[];
  snapshots: Snapshot[];
  ftProgress: {
    currentCircle: number;
    circleBreakdown: Record<number, { total: number; done: number }>;
    completedProjects: string[];
    inProgressProjects: string[];
    availableProjects: FtProject[];
  };
  skillProfile: Record<string, number>;
}

const platformColors: Record<string, string> = {
  "42": "#00babc",
  thm: "#ef4444",
  htb: "#9fef00",
  rootme: "#f59e0b",
  maldev: "#a855f7",
  system: "#6b7280",
};

export function ProgressClient({
  ft,
  thm,
  htb,
  maldev,
  rootme,
  skills,
  activity,
  snapshots,
  ftProgress,
  skillProfile,
}: ProgressClientProps) {
  const heatmapData = buildHeatmapData(activity);
  const progressData = buildProgressData(snapshots);
  const recentActivity = activity.slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Map className="h-6 w-6" />
          Progress
        </h1>
        <p className="text-sm text-muted-foreground">
          Your position across all platforms and how you got here
        </p>
      </div>

      {/* Platform cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <PlatformCard
          color="#00babc"
          name="42 Paris"
          value={ft ? (ft.level ?? 0).toFixed(1) : "—"}
          detail={ft ? `Level · ${ft.correctionPoints ?? 0} corr` : "Not connected"}
        />
        <PlatformCard
          color="#ef4444"
          name="TryHackMe"
          value={thm ? `#${(thm.rank ?? "?").toLocaleString()}` : "—"}
          detail={thm ? `${thm.roomsCompleted ?? 0} rooms · ${thm.streak ?? 0}d streak` : "Not connected"}
        />
        <PlatformCard
          color="#9fef00"
          name="HackTheBox"
          value={htb ? (htb.rank ?? "—") : "—"}
          detail={htb ? `${htb.points ?? 0} pts · ${(htb.systemOwns ?? 0) + (htb.userOwns ?? 0)} owns` : "Not connected"}
        />
        <PlatformCard
          color="#a855f7"
          name="Maldev"
          value={maldev ? `${(maldev.overallProgress ?? 0).toFixed(0)}%` : "—"}
          detail={maldev ? `${maldev.modulesCompleted ?? 0}/${maldev.totalModules ?? 0} modules` : "Not connected"}
        />
        <PlatformCard
          color="#f59e0b"
          name="Root-me"
          value={rootme ? (rootme.score ?? 0).toLocaleString() : "—"}
          detail={rootme ? `${rootme.challengesSolved ?? 0} solved · #${rootme.position ?? "?"}` : "Not connected"}
        />
      </div>

      {/* Middle row: Holy Graph + Skill Profile */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* 42 Holy Graph */}
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <h2 className="text-sm font-medium flex items-center gap-1.5 mb-3">
              <GitBranch className="h-4 w-4" />
              42 holy graph
            </h2>
            <div className="space-y-2">
              {Object.entries(ftProgress.circleBreakdown)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([circle, { total, done }]) => (
                  <div key={circle} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-14">
                      Circle {circle}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${total > 0 ? (done / total) * 100 : 0}%`,
                          backgroundColor: "#00babc",
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {done}/{total}
                    </span>
                  </div>
                ))}
            </div>
            {ftProgress.availableProjects.length > 0 && (
              <>
                <Separator className="my-3" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                  Available now
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ftProgress.availableProjects.map((p) => (
                    <Badge key={p.slug} variant="secondary" className="text-xs">
                      {p.name}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cross-platform Skill Profile */}
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <h2 className="text-sm font-medium flex items-center gap-1.5 mb-3">
              <Radar className="h-4 w-4" />
              Skill profile
            </h2>
            {Object.keys(skillProfile).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Sync platforms to build your skill profile.
              </p>
            ) : (
              <div className="space-y-2">
                {Object.entries(skillProfile)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([skill, level]) => (
                    <div key={skill} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20 capitalize truncate">
                        {skill.replace(/-/g, " ")}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${Math.min(100, (level / 20) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {level.toFixed(1)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <h2 className="text-sm font-medium flex items-center gap-1.5 mb-3">
            <Calendar className="h-4 w-4" />
            Activity (365 days)
          </h2>
          <ActivityHeatmap data={heatmapData} />
        </CardContent>
      </Card>

      {/* Progress Over Time */}
      {progressData.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <h2 className="text-sm font-medium flex items-center gap-1.5 mb-3">
              <TrendingUp className="h-4 w-4" />
              Progress over time
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Line type="monotone" dataKey="42 Level" stroke="#00babc" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="HTB Points" stroke="#9fef00" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="THM Rooms" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <h2 className="text-sm font-medium flex items-center gap-1.5 mb-3">
            <Activity className="h-4 w-4" />
            Recent activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No activity yet. Sync your platforms to see updates here.
            </p>
          ) : (
            <div className="space-y-0">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: platformColors[item.platform] ?? "#6b7280",
                    }}
                  />
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                    {item.platform}
                  </Badge>
                  <span className="text-sm flex-1 truncate">{item.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelative(item.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlatformCard({
  color,
  name,
  value,
  detail,
}: {
  color: string;
  name: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1" style={{ backgroundColor: color }} />
      <CardContent className="pt-3 pb-3 px-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {name}
        </p>
        <p className="text-xl font-semibold mt-0.5">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>
      </CardContent>
    </Card>
  );
}

function ActivityHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] min-w-fit">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => {
              const intensity = day.count / maxCount;
              return (
                <div
                  key={day.date}
                  className="w-3 h-3 rounded-sm"
                  title={`${day.date}: ${day.count} activities`}
                  style={{
                    backgroundColor:
                      day.count === 0
                        ? "hsl(var(--muted))"
                        : `color-mix(in oklch, hsl(var(--primary)) ${Math.max(intensity * 100, 20)}%, transparent)`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildHeatmapData(activity: ActivityItem[]) {
  const counts: Record<string, number> = {};
  activity.forEach((a) => {
    const date = a.timestamp.split("T")[0];
    counts[date] = (counts[date] || 0) + 1;
  });

  const today = new Date();
  const data = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    data.push({ date: key, count: counts[key] || 0 });
  }
  return data;
}

function buildProgressData(snapshots: Snapshot[]) {
  const byDate: Record<string, Record<string, number>> = {};

  snapshots.forEach((s) => {
    try {
      const parsed = JSON.parse(s.data);
      if (!byDate[s.date]) byDate[s.date] = {};
      if (s.platform === "42" && parsed.level)
        byDate[s.date]["42 Level"] = parsed.level;
      if (s.platform === "htb" && parsed.points)
        byDate[s.date]["HTB Points"] = parsed.points;
      if (s.platform === "thm" && parsed.roomsCompleted)
        byDate[s.date]["THM Rooms"] = parsed.roomsCompleted;
    } catch {}
  });

  return Object.entries(byDate)
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => a.date.localeCompare(b.date));
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
