"use client";

import Link from "next/link";

type CompetencyEntry = {
  id: string;
  label: string;
  area: string;
  level: number;
  evidence: string;
};

export function CompetencySpotlight({ competencies }: { competencies: CompetencyEntry[] }) {
  const gaps = [...competencies].sort((a, b) => a.level - b.level).slice(0, 3);
  if (gaps.length === 0) return null;

  const targetAreas = gaps
    .filter((c) => c.level <= 2)
    .map((c) => c.label)
    .slice(0, 2);

  return (
    <div className="rounded-cb-card border border-cb-line bg-cb-card px-4 py-4">
      <p className="cb-label-mono text-[10px] text-cb-muted">Biggest gaps</p>

      <div className="mt-3 space-y-2.5">
        {gaps.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <span className="w-[112px] shrink-0 truncate font-cb-sans text-[13px] text-cb-second">
              {c.label}
            </span>
            {/* Progress segments: filled in the accent, remaining in --cb-line.
                Family spec — 3px bars, radius 2, 5px gap. */}
            <div className="flex flex-1 gap-[5px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={
                    i < c.level
                      ? "h-[3px] flex-1 rounded-[2px] bg-cb-or"
                      : "h-[3px] flex-1 rounded-[2px] bg-cb-line"
                  }
                />
              ))}
            </div>
            <span className="cb-label-mono w-6 shrink-0 text-right text-[10px] text-cb-muted">
              L{c.level}
            </span>
          </div>
        ))}
      </div>

      {targetAreas.length > 0 && (
        <p className="mt-3 font-cb-sans text-[13px] text-cb-muted">
          This week targets {targetAreas.join(" + ")}
        </p>
      )}
      <Link
        href="/progress"
        className="cb-label-mono mt-2 inline-block text-[10px] text-cb-or"
      >
        full map
      </Link>
    </div>
  );
}
