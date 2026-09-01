"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { Search, X, ArrowLeft, Loader2, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, assertOk } from "@/lib/utils";
import { ArticleReader, type ReaderSection } from "./article-reader";
import { RelatedResources } from "@/components/learn/related-resources";
import type { UserBlock } from "./user-block";
import { ExportMenu } from "./export-menu";

type ArticleRef = {
  id: number;
  depthTier: number;
  title: string;
  recommendedLevel: number;
  status: string;
};

type CompetencyEntry = {
  id: string;
  label: string;
  area: string;
  description: string;
  level: number;
  isValidated: boolean;
  articles: ArticleRef[];
};

type LoadedArticle = {
  id: number;
  title: string;
  competencyId: string;
  depthTier: number;
  sections: ReaderSection[];
  userBlocks: UserBlock[];
};

const TIERS = [0, 1, 2, 3, 4, 5];

/** What each tier is for — the plan's progressive depth ladder. */
const TIER_PURPOSE: Record<number, string> = {
  0: "Overview",
  1: "Basics cheatsheet",
  2: "Detailed course",
  3: "Advanced techniques",
  4: "Advanced techniques",
  5: "Expert reference",
};

export function KnowledgeClient({
  competencies,
  areas,
}: {
  competencies: CompetencyEntry[];
  areas: string[];
}) {
  const [search, setSearch] = useState("");
  const [article, setArticle] = useState<LoadedArticle | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openArticle = useCallback(async (id: number) => {
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/knowledge/${id}`);
      await assertOk(res);
      const data = await res.json();
      setArticle(data.article as LoadedArticle);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load article");
    } finally {
      setLoadingId(null);
    }
  }, []);

  // Deep link from Learn: /knowledge?article=N opens that article. openArticle
  // is a fetch, not a lazy initialiser, so it runs from the effect — deferred a
  // tick so its setState is not synchronous with mount.
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("article"));
    if (!Number.isInteger(id) || id <= 0) return;
    const t = setTimeout(() => void openArticle(id), 0);
    return () => clearTimeout(t);
  }, [openArticle]);

  /** Every mutation returns the whole article, so the reader re-renders from
   *  the server's version rather than a locally patched guess. */
  const mutate = useCallback(
    async (url: string, body: unknown, method: "POST" | "DELETE" = "POST") => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          ...(method === "DELETE" ? {} : { body: JSON.stringify(body) }),
        });
        await assertOk(res);
        const data = await res.json();
        if (data.article) setArticle(data.article as LoadedArticle);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        return false;
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const refetch = useCallback(async (id: number) => {
    const res = await fetch(`/api/knowledge/${id}`);
    if (res.ok) setArticle((await res.json()).article as LoadedArticle);
  }, []);

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (c: CompetencyEntry) =>
      !q ||
      c.label.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.area.toLowerCase().includes(q) ||
      c.articles.some((a) => a.title.toLowerCase().includes(q));

    return areas
      .map((area) => ({
        area,
        items: competencies.filter((c) => c.area === area && match(c)),
      }))
      .filter((g) => g.items.length > 0);
  }, [competencies, areas, search]);

  // ── Reader ───────────────────────────────────────────────────────────────
  if (article) {
    const competency = competencies.find((c) => c.id === article.competencyId);
    const aboveLevel = competency ? article.depthTier > competency.level : false;

    // Tiers of THIS competency that actually have an article, in depth order —
    // the ladder the reader steps through with prev/next and the chip row.
    const tiers = competency
      ? [...competency.articles].sort((a, b) => a.depthTier - b.depthTier)
      : [];
    const idx = tiers.findIndex((a) => a.id === article.id);
    const prevTier = idx > 0 ? tiers[idx - 1] : null;
    const nextTier = idx >= 0 && idx < tiers.length - 1 ? tiers[idx + 1] : null;

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          {/* Back to the competency it belongs to, not the whole catalogue. */}
          {competency ? (
            <Link
              href={`/knowledge/${competency.id}`}
              className="flex items-center gap-1.5 font-cb-sans text-[14px] text-cb-muted transition-colors hover:text-cb-text"
            >
              <ArrowLeft className="h-4 w-4" />
              {competency.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setArticle(null)}
              className="flex items-center gap-1.5 font-cb-sans text-[14px] text-cb-muted transition-colors hover:text-cb-text"
            >
              <ArrowLeft className="h-4 w-4" />
              All competencies
            </button>
          )}
          <ExportMenu articleId={article.id} />
        </div>

        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="cb-label-mono rounded-cb-chip-sm bg-cb-raised px-2 py-1 text-[10px] text-cb-second">
              L{article.depthTier} · {TIER_PURPOSE[article.depthTier]}
            </span>
            {competency && (
              <span className="cb-label-mono rounded-cb-chip-sm bg-cb-raised px-2 py-1 text-[10px] text-cb-second">
                {competency.label}
              </span>
            )}
            {aboveLevel && (
              <span className="cb-label-mono rounded-cb-chip-sm bg-cb-warn-tint px-2 py-1 text-[10px] text-cb-warn">
                above your level
              </span>
            )}
          </div>
          <h1 className="cb-content-title text-[32px] text-cb-text">{article.title}</h1>
          {/* The other half of the Learn/Knowledge crossing: the resources that
              practise this competency. */}
          <RelatedResources competencyId={article.competencyId} />
        </header>

        {/* Step through the competency's depth tiers without leaving the reader. */}
        {tiers.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => prevTier && void openArticle(prevTier.id)}
              disabled={!prevTier || loadingId != null}
              aria-label="Previous tier"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-cb-chip-sm bg-cb-raised text-cb-second transition-colors hover:bg-cb-raised-hover hover:text-cb-text disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-wrap gap-1.5">
              {tiers.map((t) => {
                const current = t.id === article.id;
                const isLoading = loadingId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => !current && void openArticle(t.id)}
                    disabled={isLoading}
                    aria-current={current}
                    title={t.title}
                    className={cn(
                      "cb-label-mono flex items-center gap-1 rounded-cb-chip-sm px-2 py-1 text-[10px] transition-colors",
                      current
                        ? "bg-cb-or text-cb-on-or"
                        : "bg-cb-raised text-cb-second hover:bg-cb-raised-hover hover:text-cb-text",
                    )}
                  >
                    {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                    L{t.depthTier}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => nextTier && void openArticle(nextTier.id)}
              disabled={!nextTier || loadingId != null}
              aria-label="Next tier"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-cb-chip-sm bg-cb-raised text-cb-second transition-colors hover:bg-cb-raised-hover hover:text-cb-text disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <hr className="border-cb-line" />

        <ArticleReader
          sections={article.sections}
          userBlocks={article.userBlocks ?? []}
          busy={busy}
          onAnnotate={async (sectionId, text, start, end, note) => {
            await mutate(`/api/knowledge/${article.id}/annotate`, {
              sectionId,
              highlightText: text,
              startOffset: start,
              endOffset: end,
              noteText: note,
            });
          }}
          onUpdateNote={async (annotationId, noteText) => {
            await mutate(`/api/knowledge/${article.id}/annotate`, {
              annotationId,
              noteText,
            });
          }}
          onDeleteAnnotation={async (annotationId) => {
            // This route returns { ok } rather than the article, so refetch.
            const ok = await mutate(
              `/api/knowledge/annotations/${annotationId}`,
              null,
              "DELETE"
            );
            if (ok) await refetch(article.id);
          }}
          onAddBlock={async (afterSectionId, blockType, content) => {
            await mutate(`/api/knowledge/${article.id}/block`, {
              action: "create",
              afterSectionId,
              blockType,
              content,
            });
          }}
          onDeleteBlock={async (blockId) => {
            await mutate(`/api/knowledge/${article.id}/block`, {
              action: "delete",
              blockId,
            });
          }}
        />
      </div>
    );
  }

  // ── Competency grid ──────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title text-cb-text">Knowledge</h1>
        <p className="mt-1 font-cb-sans text-[14px] text-cb-muted">
          Courses written for each competency, six depth tiers deep. Every tier is
          readable — the level badge is a marker, not a gate.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cb-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search competencies and articles"
          className="h-11 w-full rounded-cb-button border border-cb-line bg-cb-card pl-9 pr-9 font-cb-sans text-[15px] text-cb-text placeholder:text-cb-muted focus-visible:border-cb-or focus-visible:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cb-muted hover:text-cb-text"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-cb-card border border-cb-line bg-cb-danger-tint px-4 py-3 font-cb-sans text-[14px] text-cb-danger">
          {error}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="rounded-cb-card border border-dashed border-cb-line px-4 py-8 text-center font-cb-sans text-[14px] text-cb-muted">
          No competency matches that search.
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.area} className="space-y-2">
            <h2 className="cb-label-mono text-[10px] text-cb-muted">{group.area}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {group.items.map((c) => (
                <CompetencyCard
                  key={c.id}
                  competency={c}
                  loadingId={loadingId}
                  onOpen={openArticle}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function CompetencyCard({
  competency,
  loadingId,
  onOpen,
}: {
  competency: CompetencyEntry;
  loadingId: number | null;
  onOpen: (id: number) => void;
}) {
  const byTier = new Map(competency.articles.map((a) => [a.depthTier, a]));

  return (
    <article className="rounded-cb-card border border-cb-line bg-cb-card p-4">
      <div className="flex items-start justify-between gap-2">
        {/* The card title opens the competency hub — its six tiers and its
            Learn resources side by side. The tier chips below still open an
            article inline; this is the whole-competency view. */}
        <Link
          href={`/knowledge/${competency.id}`}
          className="font-cb-sans text-[15px] font-bold text-cb-text hover:text-cb-or"
        >
          {competency.label}
        </Link>
        <span
          className={cn(
            "cb-label-mono flex shrink-0 items-center gap-1 rounded-cb-chip-sm px-2 py-1 text-[10px]",
            competency.isValidated
              ? "bg-cb-or-tint text-cb-or"
              : "bg-cb-raised text-cb-second"
          )}
          title={
            competency.isValidated
              ? "Validated by assessment"
              : "Inferred from platform activity"
          }
        >
          {competency.isValidated && <BadgeCheck className="h-3 w-3" />}
          L{competency.level}
        </span>
      </div>

      <p className="mt-1.5 font-cb-sans text-[13px] leading-[1.5] text-cb-muted">
        {competency.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TIERS.map((tier) => {
          const found = byTier.get(tier);
          if (!found) {
            // Never a filled cell for absent content — family "cellule vide".
            return (
              <span
                key={tier}
                className="cb-label-mono rounded-cb-chip-sm border border-dashed border-cb-line px-2 py-1 text-[10px] text-cb-muted"
                title="No article for this tier yet"
              >
                L{tier}
              </span>
            );
          }
          const atLevel = tier <= competency.level;
          const isLoading = loadingId === found.id;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => onOpen(found.id)}
              disabled={isLoading}
              title={`${found.title} — ${atLevel ? "at your level" : "above your level"}`}
              className={cn(
                "cb-label-mono flex items-center gap-1 rounded-cb-chip-sm px-2 py-1 text-[10px] transition-colors",
                atLevel
                  ? "bg-cb-or-tint text-cb-or hover:bg-cb-or/25"
                  : "bg-cb-raised text-cb-second hover:bg-cb-raised-hover"
              )}
            >
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              L{tier}
            </button>
          );
        })}
      </div>
    </article>
  );
}
