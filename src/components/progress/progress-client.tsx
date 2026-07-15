"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
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
        <h1 className="text-xl font-semibold tracking-tight">Progress</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Your position across all platforms and how you got here
        </p>
      </div>

      {/* Platform cards */}
      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
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

      {/* Holy Graph + Skill Profile */}
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
                    <span className="text-[11px] text-muted-foreground w-14 tabular-nums">
                      Circle {circle}
                    </span>
                    <div className="flex-1 progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${total > 0 ? (done / total) * 100 : 0}%`,
                          backgroundColor: "#00babc",
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground w-8 text-right tabular-nums">
                      {done}/{total}
                    </span>
                  </div>
                ))}
            </div>
            {ftProgress.availableProjects.length > 0 && (
              <>
                <div className="border-t border-border my-3" />
                <p className="section-label mb-1.5">Available now</p>
                <div className="flex flex-wrap gap-1">
                  {ftProgress.availableProjects.map((p) => (
                    <Badge key={p.slug} variant="secondary" className="text-[10px]">
                      {p.name}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-3">
              <Radar className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="section-label">Skill Profile</p>
            </div>
            {Object.keys(skillProfile).length === 0 ? (
              <p className="text-[12px] text-muted-foreground text-center py-8">
                Sync platforms to build your skill profile.
              </p>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(skillProfile)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([skill, level]) => (
                    <div key={skill} className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground w-20 capitalize truncate">
                        {skill.replace(/-/g, " ")}
                      </span>
                      <div className="flex-1 progress-track">
                        <div
                          className="progress-fill bg-primary"
                          style={{ width: `${Math.min(100, (level / 20) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground w-8 text-right tabular-nums">
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
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="section-label">Activity · 365 days</p>
          </div>
          <ActivityHeatmap data={heatmapData} />
        </CardContent>
      </Card>

      {/* Progress Over Time */}
      {progressData.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="section-label">Progress over time</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "2px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="42 Level" stroke="#00babc" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="HTB Points" stroke="#9fef00" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="THM Rooms" stroke="#ef4444" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="section-label">Recent activity</p>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-[12px] text-muted-foreground text-center py-8">
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
                    style={{ backgroundColor: platformColors[item.platform] ?? "#6b7280" }}
                  />
                  <Badge variant="secondary" className="text-[9px] px-1.5 shrink-0 uppercase">
                    {item.platform}
                  </Badge>
                  <span className="text-[13px] flex-1 truncate">{item.title}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
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

function PlatformCard({ color, name, value, detail }: { color: string; name: string; value: string; detail: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-0.5" style={{ backgroundColor: color }} />
      <CardContent className="pt-3 pb-3 px-3">
        <p className="section-label">{name}</p>
        <p className="text-lg font-semibold tracking-tight mt-1 tabular-nums">{value}</p>
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
      <div className="flex gap-[2px] min-w-fit">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((day) => {
              const intensity = day.count / maxCount;
              return (
                <div
                  key={day.date}
                  className="w-2.5 h-2.5 rounded-[1px]"
                  title={`${day.date}: ${day.count} activities`}
                  style={{
                    backgroundColor:
                      day.count === 0
                        ? "var(--muted)"
                        : `color-mix(in oklch, var(--primary) ${Math.max(intensity * 100, 25)}%, transparent)`,
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
      if (s.platform === "42" && parsed.level) byDate[s.date]["42 Level"] = parsed.level;
      if (s.platform === "htb" && parsed.points) byDate[s.date]["HTB Points"] = parsed.points;
      if (s.platform === "thm" && parsed.roomsCompleted) byDate[s.date]["THM Rooms"] = parsed.roomsCompleted;
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
