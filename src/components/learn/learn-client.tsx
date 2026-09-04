"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function LearnClient({
  competencies,
  progress,
  areas,
}: {
  competencies: CompetencyInfo[];
  progress: CompetencyProgress[];
  areas: string[];
}) {
  const byArea = areas
    .map((area) => ({ area, items: progress.filter((p) => p.area === area) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title text-cb-text">Learn</h1>
        <p className="mt-1 font-cb-sans text-cb-foot text-cb-muted">
          Everything for a competency in one place — what to read and what to do.
        </p>
      </div>

      <div className="space-y-5">
        {byArea.map((group) => (
          <section key={group.area} className="space-y-2">
            <h2 className="cb-label-mono text-cb-caption text-cb-muted">{group.area}</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {group.items.map((c) => (
                <CompetencyRow key={c.id} c={c} />
              ))}
            </div>
          </section>
        ))}
      </div>
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
      <span className="cb-label-mono text-cb-caption text-cb-muted">{label}</span>
      <span
        className={cn(
          "cb-label-mono rounded-cb-chip-sm px-2 py-0.5 text-cb-caption",
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
          <span className="truncate font-cb-sans text-cb-body font-bold text-cb-text">
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
          "cb-label-mono flex shrink-0 items-center gap-1 rounded-cb-chip-sm px-2 py-1 text-cb-caption",
          c.isValidated ? "bg-cb-or-tint text-cb-or" : "bg-cb-raised text-cb-second",
        )}
        title={c.isValidated ? "Validated by assessment" : "Inferred from activity"}
      >
        L{c.level}
      </span>
    </Link>
  );
}
