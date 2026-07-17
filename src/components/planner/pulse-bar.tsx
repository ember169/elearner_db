"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { PLATFORM_COLORS } from "@/lib/platform-colors";

export interface PlatformStatus {
  ft: { level: number | null; coalition: string | null; delta: number | null } | null;
  thm: { rank: number | null; roomsCompleted: number | null; streak: number | null; delta: number | null } | null;
  htb: { rank: string | null; points: number | null; owns: number; delta: number | null } | null;
  rootme: { score: number | null; position: number | null; solved: number | null; delta: number | null } | null;
  maldev: { progress: number | null; delta: number | null } | null;
}

export function PulseBar({
  platforms,
  syncing,
  onSync,
  budgetUsed,
  budgetTotal,
}: {
  platforms: PlatformStatus;
  syncing: boolean;
  onSync: () => void;
  budgetUsed?: number;
  budgetTotal?: number;
}) {
  const items: { color: string; label: string; value: string; delta: string | null }[] = [];
  if (platforms.ft) {
    const d = platforms.ft.delta;
    items.push({
      color: PLATFORM_COLORS["42"],
      label: "42",
      value: (platforms.ft.level ?? 0).toFixed(1),
      delta: d && d > 0 ? `+${d.toFixed(1)}` : null,
    });
  }
  if (platforms.thm) {
    const d = platforms.thm.delta;
    items.push({
      color: PLATFORM_COLORS.thm,
      label: "THM",
      value: platforms.thm.rank ? String(platforms.thm.rank) : `${platforms.thm.roomsCompleted ?? 0}`,
      delta: d && d > 0 ? `+${d}` : null,
    });
  }
  if (platforms.htb) {
    const d = platforms.htb.delta;
    items.push({
      color: PLATFORM_COLORS.htb,
      label: "HTB",
      value: platforms.htb.rank ?? `${platforms.htb.owns}`,
      delta: d && d > 0 ? `+${d}` : null,
    });
  }
  if (platforms.rootme) {
    const d = platforms.rootme.delta;
    items.push({
      color: PLATFORM_COLORS.rootme,
      label: "RM",
      value: `${platforms.rootme.score ?? 0}`,
      delta: d && d > 0 ? `+${d}` : null,
    });
  }
  if (platforms.maldev) {
    const d = platforms.maldev.delta;
    items.push({
      color: PLATFORM_COLORS.maldev,
      label: "Mal",
      value: `${(platforms.maldev.progress ?? 0).toFixed(0)}%`,
      delta: d && d > 0 ? `+${d.toFixed(0)}%` : null,
    });
  }

  if (items.length === 0 && budgetUsed == null) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <div
        className="flex items-center rounded-sm px-3 py-2 flex-1 min-w-0"
        style={{ background: "var(--muted)" }}
      >
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center">
            {i > 0 && (
              <div className="h-3 w-px shrink-0 mx-1" style={{ background: "var(--border)" }} />
            )}
            <div className="flex items-center gap-1.5 px-2">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] font-bold tabular-nums">{item.value}</span>
              {item.delta && (
                <span className="text-[10px] tabular-nums" style={{ color: "var(--status-success)" }}>
                  {item.delta}
                </span>
              )}
            </div>
          </div>
        ))}
        <div className="ml-auto shrink-0">
          <Button variant="ghost" size="xs" onClick={onSync} disabled={syncing}>
            <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {budgetTotal != null && (
        <div
          className="flex items-center gap-2 rounded-sm px-3 py-2 shrink-0"
          style={{ background: "var(--muted)" }}
        >
          <span className="text-[11px] font-semibold tabular-nums">
            Budget
          </span>
          <span className="text-[12px] font-bold tabular-nums">
            {(budgetUsed ?? 0).toFixed(0)}h
          </span>
          <div
            className="w-[60px] h-1 rounded-[1px] overflow-hidden"
            style={{ background: "var(--accent)" }}
          >
            <div
              className="h-full rounded-[1px]"
              style={{
                width: `${Math.min(100, ((budgetUsed ?? 0) / budgetTotal) * 100)}%`,
                background: (budgetUsed ?? 0) > budgetTotal ? "var(--status-warning)" : "var(--primary)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
