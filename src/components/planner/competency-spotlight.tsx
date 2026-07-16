"use client";

type CompetencyEntry = {
  id: string;
  label: string;
  area: string;
  level: number;
  evidence: string;
};

export function CompetencySpotlight({ competencies }: { competencies: CompetencyEntry[] }) {
  const sorted = [...competencies].sort((a, b) => a.level - b.level);
  const gaps = sorted.slice(0, 3);

  if (gaps.length === 0) return null;

  const targetAreas = gaps
    .filter((c) => c.level <= 2)
    .map((c) => c.label)
    .slice(0, 2);

  return (
    <div className="rounded-sm border border-border px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Biggest gaps
      </p>
      <div className="space-y-2.5">
        {gaps.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <span className="text-[12px] text-muted-foreground w-[110px] shrink-0 truncate">
              {c.label}
            </span>
            <div className="flex gap-[3px] flex-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-[1px]"
                  style={{
                    background: i < c.level ? "var(--primary)" : "var(--muted)",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {targetAreas.length > 0 && (
        <p className="text-[11px] text-muted-foreground mt-3">
          This week targets {targetAreas.join(" + ")}
        </p>
      )}
      <a href="/progress" className="text-[11px] text-primary hover:underline mt-1 inline-block">
        Full map →
      </a>
    </div>
  );
}
