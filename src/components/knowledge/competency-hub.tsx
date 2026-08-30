import Link from "next/link";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/platform-colors";

type ArticleRef = { id: number; title: string; depthTier: number };
type ResourceRef = {
  id: number;
  title: string;
  platform: string;
  difficulty: string | null;
  status: string;
};

const TIER_PURPOSE: Record<number, string> = {
  0: "Overview",
  1: "Basics cheatsheet",
  2: "Detailed course",
  3: "Advanced techniques",
  4: "Advanced techniques",
  5: "Expert reference",
};

const STATUS_TONE: Record<string, string> = {
  completed: "text-cb-success",
  in_progress: "text-cb-info",
  not_started: "text-cb-muted",
};

/**
 * The competency hub: one competency, its six tiers of Knowledge and its Learn
 * resources side by side.
 *
 * This is what the audit's page-per-competency argument asked for — the two
 * halves of a competency in one place — while Learn and Knowledge stay as the
 * cross-cutting browse surfaces. Server-rendered; tiers and resources deep-link
 * into their existing readers.
 */
export function CompetencyHub({
  label,
  area,
  description,
  level,
  isValidated,
  articles,
  resources,
}: {
  label: string;
  area: string;
  description: string;
  level: number;
  isValidated: boolean;
  articles: ArticleRef[];
  resources: ResourceRef[];
}) {
  const byTier = new Map(articles.map((a) => [a.depthTier, a]));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/knowledge"
        className="flex items-center gap-1.5 font-cb-sans text-[14px] text-cb-muted transition-colors hover:text-cb-text"
      >
        <ArrowLeft className="h-4 w-4" />
        All competencies
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="cb-label-mono rounded-cb-chip-sm bg-cb-raised px-2 py-1 text-[10px] text-cb-second">
            {area}
          </span>
          <span
            className={
              isValidated
                ? "cb-label-mono flex items-center gap-1 rounded-cb-chip-sm bg-cb-or-tint px-2 py-1 text-[10px] text-cb-or"
                : "cb-label-mono rounded-cb-chip-sm bg-cb-raised px-2 py-1 text-[10px] text-cb-second"
            }
            title={isValidated ? "Validated by assessment" : "Inferred from platform activity"}
          >
            {isValidated && <BadgeCheck className="h-3 w-3" />}
            level L{level}
          </span>
        </div>
        <h1 className="page-title text-cb-text">{label}</h1>
        <p className="font-cb-sans text-[14px] leading-relaxed text-cb-muted">
          {description}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Understand — the six tiers. */}
        <section className="space-y-2">
          <h2 className="font-cb-sans text-[17px] font-bold text-cb-text">Understand</h2>
          <div className="space-y-1.5">
            {Array.from({ length: 6 }, (_, tier) => {
              const found = byTier.get(tier);
              const atLevel = tier <= level;
              if (!found) {
                return (
                  <div
                    key={tier}
                    className="flex items-center gap-2 rounded-cb-card border border-dashed border-cb-line px-3 py-2.5"
                  >
                    <span className="cb-label-mono text-[10px] text-cb-muted">L{tier}</span>
                    <span className="font-cb-sans text-[13px] text-cb-muted">
                      No article yet
                    </span>
                  </div>
                );
              }
              return (
                <Link
                  key={tier}
                  href={`/knowledge?article=${found.id}`}
                  className="group flex items-center gap-3 rounded-cb-card border border-cb-line bg-cb-card px-3 py-2.5 transition-colors hover:bg-cb-raised"
                >
                  <span
                    className={
                      atLevel
                        ? "cb-label-mono shrink-0 rounded-cb-chip-sm bg-cb-or-tint px-2 py-1 text-[10px] text-cb-or"
                        : "cb-label-mono shrink-0 rounded-cb-chip-sm bg-cb-raised px-2 py-1 text-[10px] text-cb-second"
                    }
                  >
                    L{tier}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-cb-sans text-[14px] font-bold text-cb-text">
                      {found.title}
                    </span>
                    <span className="cb-label-mono text-[10px] text-cb-muted">
                      {TIER_PURPOSE[tier]}
                      {!atLevel && " · above your level"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Practise — the Learn resources. */}
        <section className="space-y-2">
          <h2 className="font-cb-sans text-[17px] font-bold text-cb-text">
            Practise
            <span className="cb-label-mono ml-2 text-[10px] text-cb-muted">
              {resources.length}
            </span>
          </h2>
          {resources.length === 0 ? (
            <div className="rounded-cb-card border border-dashed border-cb-line px-3 py-6 text-center font-cb-sans text-[13px] text-cb-muted">
              No resources mapped to this competency.
            </div>
          ) : (
            <div className="space-y-1.5">
              {resources.map((r) => (
                <Link
                  key={r.id}
                  href={`/learn?resource=${r.id}`}
                  className="group flex items-center gap-2.5 rounded-cb-card border border-cb-line bg-cb-card px-3 py-2.5 transition-colors hover:bg-cb-raised"
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      r.status === "completed"
                        ? "bg-cb-success"
                        : r.status === "in_progress"
                          ? "bg-cb-info"
                          : "bg-cb-line"
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate font-cb-sans text-[14px] text-cb-second group-hover:text-cb-text">
                    {r.title}
                  </span>
                  {r.difficulty && (
                    <span className="cb-label-mono hidden shrink-0 text-[10px] text-cb-muted sm:inline">
                      {r.difficulty}
                    </span>
                  )}
                  <span className="cb-label-mono shrink-0 rounded-cb-chip-sm bg-cb-raised px-2 py-0.5 text-[10px] text-cb-second">
                    {PLATFORM_LABELS[r.platform] ?? r.platform}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
