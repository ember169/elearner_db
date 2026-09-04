"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResourceBrowser } from "./resource-browser";
import type { LearnResource } from "./resource-browser";

type CompetencyInfo = { id: string; label: string; area: string; description: string };

type CompetencyProgress = {
  id: string;
  label: string;
  area: string;
  level: number;
  isValidated: boolean;
  articleCount: number;
  readDone: number;
  resTotal: number;
  resDone: number;
};

type Lens = "competency" | "browse";

export function LearnClient({
  competencies,
  progress,
  areas,
  resources,
  browseCompetencies,
  openResourceId,
}: {
  competencies: CompetencyInfo[];
  progress: CompetencyProgress[];
  areas: string[];
  resources: LearnResource[];
  browseCompetencies: CompetencyInfo[];
  openResourceId?: number;
}) {
  const [lens, setLens] = useState<Lens>(openResourceId ? "browse" : "competency");

  const byArea = areas
    .map((area) => ({ area, items: progress.filter((p) => p.area === area) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title text-cb-text">Learn</h1>
        <p className="mt-1 font-cb-sans text-[14px] text-cb-muted">
          Everything for a competency in one place — what to read and what to do.
        </p>
      </div>

      {/* Lens toggle: family segmented control. */}
      <div className="flex w-fit gap-1 rounded-cb-card bg-cb-raised p-[5px]">
        {(
          [
            ["competency", "by competency"],
            ["browse", "browse"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setLens(key)}
            className={cn(
              "rounded-cb-chip px-3.5 py-1.5 font-cb-sans text-[13px] font-bold transition-colors",
              lens === key ? "bg-cb-or text-cb-on-or" : "text-cb-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {lens === "browse" ? (
        <ResourceBrowser
          resources={resources}
          competencies={browseCompetencies}
          areas={areas}
          openResourceId={openResourceId}
        />
      ) : (
        <div className="space-y-5">
          {byArea.map((group) => (
            <section key={group.area} className="space-y-2">
              <h2 className="cb-label-mono text-[10px] text-cb-muted">{group.area}</h2>
              <div className="grid gap-2 md:grid-cols-2">
                {group.items.map((c) => (
                  <CompetencyRow key={c.id} c={c} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function CountChip({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label: string;
}) {
  const complete = total > 0 && done >= total;
  return (
    <span className="flex items-center gap-1.5">
      <span className="cb-label-mono text-[10px] text-cb-muted">{label}</span>
      <span
        className={cn(
          "cb-label-mono rounded-cb-chip-sm px-2 py-0.5 text-[10px]",
          complete ? "bg-cb-success-tint text-cb-success" : "bg-cb-raised text-cb-second",
        )}
      >
        {done}/{total}
      </span>
    </span>
  );
}

function CompetencyRow({ c }: { c: CompetencyProgress }) {
  const frac =
    (c.readDone + c.resDone) / Math.max(1, c.articleCount + c.resTotal);
  return (
    <Link
      href={`/knowledge/${c.id}`}
      className="group relative flex items-center gap-4 overflow-hidden rounded-cb-card border border-cb-line bg-cb-card py-3 pl-4 pr-4 transition-colors hover:bg-cb-raised"
    >
      {/* Progress rail down the left edge. */}
      <span className="absolute inset-y-0 left-0 w-[3px] bg-cb-line" />
      <span
        className="absolute left-0 top-0 w-[3px] bg-cb-or"
        style={{ height: `${Math.round(frac * 100)}%` }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-cb-sans text-[15px] font-bold text-cb-text">
            {c.label}
          </span>
          {c.resTotal > 0 && c.resDone >= c.resTotal && (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cb-success">
              <Check className="h-2.5 w-2.5 text-cb-bg" strokeWidth={3} />
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <CountChip done={c.readDone} total={c.articleCount} label="read" />
          <CountChip done={c.resDone} total={c.resTotal} label="do" />
        </div>
      </div>

      <span
        className={cn(
          "cb-label-mono flex shrink-0 items-center gap-1 rounded-cb-chip-sm px-2 py-1 text-[10px]",
          c.isValidated ? "bg-cb-or-tint text-cb-or" : "bg-cb-raised text-cb-second",
        )}
        title={c.isValidated ? "Validated by assessment" : "Inferred from activity"}
      >
        L{c.level}
      </span>
    </Link>
  );
}
