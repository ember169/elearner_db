"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/platform-colors";

type ResourceRef = {
  id: number;
  title: string;
  platform: string;
  difficulty: string | null;
};

/**
 * The Learn resources for one competency, shown in the Knowledge article
 * header — the other half of the crossing. Fetched on demand.
 */
export function RelatedResources({ competencyId }: { competencyId: string }) {
  const [resources, setResources] = useState<ResourceRef[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/learn?competencyId=${encodeURIComponent(competencyId)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!cancelled)
        setResources(
          (data.resources ?? []).map((r: ResourceRef) => ({
            id: r.id,
            title: r.title,
            platform: r.platform,
            difficulty: r.difficulty,
          })),
        );
    })();
    return () => {
      cancelled = true;
    };
  }, [competencyId]);

  if (resources.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="cb-label-mono flex items-center gap-1 text-cb-caption text-cb-muted">
        <BookOpen className="h-3 w-3" />
        practise in Learn · {resources.length}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {resources.slice(0, 8).map((r) => (
          <a
            key={r.id}
            href={`/learn?resource=${r.id}`}
            className="flex items-center gap-1.5 rounded-cb-chip-sm bg-cb-raised px-2 py-1 transition-colors hover:bg-cb-raised-hover"
          >
            <span className="cb-label-mono text-cb-caption text-cb-muted">
              {PLATFORM_LABELS[r.platform] ?? r.platform}
            </span>
            <span className="max-w-[180px] truncate font-cb-sans text-cb-foot text-cb-second">
              {r.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
