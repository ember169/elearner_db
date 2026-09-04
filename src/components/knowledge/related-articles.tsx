"use client";

import { useEffect, useState } from "react";
import { Notebook } from "lucide-react";

type ArticleRef = { id: number; title: string; depthTier: number };

/**
 * The Knowledge articles for a set of competencies, shown inside the Learn
 * detail panel. This is the crossing the audit found missing: a resource and an
 * article on the same competency never referenced each other.
 *
 * Fetched on demand rather than passed down, so opening the panel does not pull
 * every competency's articles up front.
 */
export function RelatedArticles({
  competencyIds,
  onOpen,
}: {
  competencyIds: string[];
  onOpen?: (id: number) => void;
}) {
  const [articles, setArticles] = useState<ArticleRef[]>([]);

  useEffect(() => {
    if (competencyIds.length === 0) return;
    let cancelled = false;
    (async () => {
      // One article set per competency; dedupe, since a resource can map to
      // several and the same article must not appear twice.
      const seen = new Map<number, ArticleRef>();
      for (const cid of competencyIds) {
        const res = await fetch(
          `/api/knowledge?competencyId=${encodeURIComponent(cid)}`,
        );
        if (!res.ok) continue;
        const data = await res.json();
        for (const a of data.articles ?? []) {
          if (!seen.has(a.id))
            seen.set(a.id, { id: a.id, title: a.title, depthTier: a.depthTier });
        }
      }
      if (!cancelled)
        setArticles(
          [...seen.values()].sort((a, b) => a.depthTier - b.depthTier),
        );
    })();
    return () => {
      cancelled = true;
    };
  }, [competencyIds]);

  if (articles.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="cb-label-mono flex items-center gap-1 text-cb-caption text-cb-muted">
        <Notebook className="h-3 w-3" />
        read in Knowledge
      </p>
      <div className="space-y-1">
        {articles.slice(0, 6).map((a) => {
          const inner = (
            <>
              <span className="cb-label-mono shrink-0 text-cb-caption text-cb-second">
                L{a.depthTier}
              </span>
              <span className="truncate font-cb-sans text-cb-foot text-cb-second group-hover:text-cb-text">
                {a.title}
              </span>
            </>
          );
          const className =
            "group flex w-full items-center gap-2 rounded-cb-chip-sm px-2 py-1.5 text-left transition-colors hover:bg-cb-raised";
          return onOpen ? (
            <button key={a.id} type="button" onClick={() => onOpen(a.id)} className={className}>
              {inner}
            </button>
          ) : (
            <a key={a.id} href={`/knowledge?article=${a.id}`} className={className}>
              {inner}
            </a>
          );
        })}
      </div>
    </div>
  );
}
