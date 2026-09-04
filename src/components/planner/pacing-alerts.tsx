"use client";

import Link from "next/link";
import { PLATFORM_COLORS } from "@/lib/platform-colors";
import type { GoalSlim } from "./types";

/**
 * Goals falling behind their required pace.
 *
 * Urgency is carried by a tint plate plus a mono label, never by colour alone —
 * the family reserves status colour for a plate and a label, and a reader who
 * cannot separate the hues still gets "23 days left" in text.
 */
export function PacingAlerts({ goals }: { goals: GoalSlim[] }) {
  const behind = goals.filter((g) => g.pacing && !g.pacing.onTrack);

  if (behind.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-cb-card border border-cb-line bg-cb-card px-4 py-3">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cb-success" />
        <span className="font-cb-sans text-cb-foot text-cb-muted">
          All goals on track
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="cb-label-mono text-cb-caption text-cb-muted">Pacing alerts</p>

      {behind.map((goal) => {
        const days = goal.pacing!.daysRemaining;
        // Two steps, not three: under six weeks is urgent, under ten is a
        // warning. A third "muted" tier read as decoration.
        const urgent = days < 45;
        const tone = urgent
          ? { text: "text-cb-danger", plate: "bg-cb-danger-tint", border: "border-cb-danger/30" }
          : { text: "text-cb-warn", plate: "bg-cb-warn-tint", border: "border-cb-warn/30" };
        const platformColor =
          PLATFORM_COLORS[goal.category ?? "general"] ?? "var(--cb-text-muted)";

        return (
          <Link
            key={goal.id}
            href={`/goals?goal=${goal.id}`}
            className={`block rounded-cb-card border ${tone.border} ${tone.plate} px-3 py-2.5 transition-colors hover:bg-cb-raised-hover`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: platformColor }}
              />
              <span className="truncate font-cb-sans text-cb-foot font-bold text-cb-text">
                {goal.title}
              </span>
              <span className={`cb-label-mono ml-auto shrink-0 text-cb-caption ${tone.text}`}>
                {days}d left
              </span>
            </div>
            <p className="mt-1 font-cb-mono text-cb-foot text-cb-muted">
              {goal.pacing!.percentComplete.toFixed(0)}% · need{" "}
              {goal.pacing!.requiredPace}, at {goal.pacing!.currentPace}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
