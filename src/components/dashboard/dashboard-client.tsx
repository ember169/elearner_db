"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn, assertOk } from "@/lib/utils";
import { CardDetail } from "./card-detail";
import { PLATFORM_LABELS } from "@/lib/platform-colors";

type FocusItem = {
  id: number;
  title: string;
  type: string;
  priority: string;
  estimatedHours: number | null;
  boardStatus: string | null;
  link: string | null;
};

type CompetencyEntry = { id: string; label: string; area: string; level: number };

function todayLabel() {
  return new Date()
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .toLowerCase();
}

/**
 * Competency levels as a sequential encoding: one hue, light to dark. Not a
 * categorical palette — magnitude is the job, so a single ramp is the correct
 * form and there is no colourblind-separation question to answer.
 */
function MiniHeatmap({ competencies }: { competencies: CompetencyEntry[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {competencies.map((c) => (
        <span
          key={c.id}
          title={`${c.label} — L${c.level}`}
          className={cn(
            "h-6 w-6 rounded-[5px]",
            c.level === 0 ? "bg-cb-raised" : "bg-cb-or",
          )}
          style={
            c.level === 0
              ? undefined
              : { opacity: 0.22 + c.level * 0.17 }
          }
        />
      ))}
    </div>
  );
}

export function DashboardClient({
  focus: initialFocus,
  briefing,
  collapsedBriefing,
  competencies,
  briefingStale,
  boardCount,
}: {
  focus: FocusItem[];
  briefing: string | null;
  collapsedBriefing: string | null;
  competencies: CompetencyEntry[];
  briefingStale: boolean;
  boardCount: number;
}) {
  const [focus, setFocus] = useState(initialFocus);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  async function markDone(id: number) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/board", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, boardStatus: "done" }),
      });
      await assertOk(res);
      setFocus((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update that item");
    } finally {
      setBusyId(null);
    }
  }

  const shown = expanded ? briefing : (collapsedBriefing ?? briefing);

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-3">
        <h1 className="page-title text-cb-text">Today</h1>
        <span className="cb-label-mono text-[10px] text-cb-muted">{todayLabel()}</span>
      </div>

      {error && (
        <div className="rounded-cb-card border border-cb-line bg-cb-danger-tint px-4 py-3 font-cb-sans text-[14px] text-cb-danger">
          {error}
        </div>
      )}

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-cb-sans text-[19px] font-bold text-cb-text">Daily focus</h2>
          <Link href="/board" className="cb-label-mono text-[10px] text-cb-or">
            see board · {boardCount}
          </Link>
        </div>

        {focus.length === 0 ? (
          <div className="rounded-cb-card border border-dashed border-cb-line px-4 py-8 text-center font-cb-sans text-[14px] text-cb-muted">
            Nothing in flight. Pull something from the backlog on the board.
          </div>
        ) : (
          focus.map((item) => (
            <article
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-cb-card border border-cb-line bg-cb-card p-4 transition-colors hover:bg-cb-raised"
            >
              {/* The card body opens the detail; Done stays a separate control
                  so marking done never means "and open the panel". */}
              <button
                type="button"
                onClick={() => setDetailId(item.id)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="cb-label-mono inline-block rounded-cb-chip-sm bg-cb-raised px-2 py-1 text-[10px] text-cb-second">
                  {PLATFORM_LABELS[item.type] ?? item.type}
                </span>
                <h3 className="mt-2 font-cb-sans text-[15px] font-bold leading-snug text-cb-text">
                  {item.title}
                </h3>
                <p className="mt-1 font-cb-mono text-[11px] text-cb-muted">
                  {[
                    item.boardStatus === "in_progress" ? "in progress" : "todo",
                    item.estimatedHours ? `${item.estimatedHours}h` : null,
                    item.priority,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </button>
              <button
                type="button"
                onClick={() => void markDone(item.id)}
                disabled={busyId === item.id}
                className="flex h-9 shrink-0 items-center gap-1 rounded-[12px] bg-cb-raised px-3 font-cb-sans text-[13px] font-bold text-cb-text transition-colors hover:bg-cb-raised-hover disabled:opacity-50"
              >
                {busyId === item.id && <Loader2 className="h-3 w-3 animate-spin" />}
                Done
              </button>
            </article>
          ))
        )}
      </section>

      {shown && (
        <section className="rounded-cb-card border border-cb-line bg-cb-card p-4">
          <div className="flex items-center gap-2">
            <span className="cb-label-mono text-[10px] text-cb-muted">
              mentor briefing
            </span>
            {briefingStale && (
              <span className="cb-label-mono rounded-cb-chip-sm bg-cb-warn-tint px-2 py-0.5 text-[10px] text-cb-warn">
                stale
              </span>
            )}
          </div>
          <p className="mt-2 font-cb-sans text-[14px] leading-[1.6] text-cb-second">
            {shown}
          </p>
          {briefing && collapsedBriefing && briefing !== collapsedBriefing && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 font-cb-mono text-[11px] text-cb-or"
            >
              {expanded ? "collapse" : "read more"}
            </button>
          )}
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-cb-sans text-[19px] font-bold text-cb-text">
            Competencies
          </h2>
          <Link href="/progress" className="cb-label-mono text-[10px] text-cb-or">
            see all
          </Link>
        </div>
        <div className="rounded-cb-card border border-cb-line bg-cb-card p-4">
          <MiniHeatmap competencies={competencies} />
        </div>
      </section>

      {detailId !== null && (
        <CardDetail itemId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
