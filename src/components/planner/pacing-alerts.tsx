"use client";

import { AlertTriangle, TrendingUp, Check } from "lucide-react";
import { PLATFORM_COLORS } from "@/lib/platform-colors";
import type { GoalSlim } from "./types";

export function PacingAlerts({ goals }: { goals: GoalSlim[] }) {
  const behind = goals.filter((g) => g.pacing && !g.pacing.onTrack);

  if (behind.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-sm border border-border">
        <Check className="h-4 w-4" style={{ color: "var(--status-done)" }} />
        <span className="text-[14px] text-muted-foreground">
          All goals on track
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
        Pacing Alerts
      </span>
      {behind.map((goal) => {
        const days = goal.pacing!.daysRemaining;
        const urgency = days < 45 ? "red" : days < 70 ? "amber" : "muted";
        const borderColor =
          urgency === "red"
            ? "var(--status-danger)"
            : urgency === "amber"
              ? "var(--status-warning)"
              : "var(--border)";
        const iconColor =
          urgency === "red"
            ? "var(--status-danger)"
            : urgency === "amber"
              ? "var(--status-warning)"
              : "var(--muted-foreground)";
        const platformColor =
          PLATFORM_COLORS[goal.category ?? "general"] ??
          "var(--muted-foreground)";

        return (
          <a
            key={goal.id}
            href={`/goals?goal=${goal.id}`}
            className="flex items-start gap-2.5 px-3 py-2 rounded-sm transition-colors hover:bg-accent/50"
            style={{
              border: `1px solid ${borderColor}`,
              background:
                urgency !== "muted"
                  ? `color-mix(in oklch, ${borderColor} 8%, transparent)`
                  : "var(--card)",
            }}
          >
            {urgency !== "muted" ? (
              <AlertTriangle
                className="h-3.5 w-3.5 shrink-0 mt-0.5"
                style={{ color: iconColor }}
              />
            ) : (
              <TrendingUp
                className="h-3.5 w-3.5 shrink-0 mt-0.5"
                style={{ color: iconColor }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: platformColor }}
                />
                <span className="text-[14px] font-medium truncate">
                  {goal.title}
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {goal.pacing!.percentComplete.toFixed(0)}% complete
                {" — "}
                need {goal.pacing!.requiredPace}, currently{" "}
                {goal.pacing!.currentPace}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: iconColor }}>
                {days} days remaining
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
