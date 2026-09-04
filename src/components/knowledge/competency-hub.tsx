"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Check, Circle, CircleCheck, ExternalLink, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS } from "@/lib/platform-colors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ArticleRef = { id: number; title: string; depthTier: number; isRead: boolean };
type ResourceRef = {
  id: number;
  title: string;
  platform: string;
  difficulty: string | null;
  status: string;
  url: string | null;
  description: string | null;
  estimatedHours: number | null;
};

const TIER_PURPOSE: Record<number, string> = {
  0: "Overview",
  1: "Basics cheatsheet",
  2: "Detailed course",
  3: "Advanced techniques",
  4: "Advanced techniques",
  5: "Expert reference",
};

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
  const [readState, setReadState] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    for (const a of articles) map[a.id] = a.isRead;
    return map;
  });

  const byTier = new Map(articles.map((a) => [a.depthTier, a]));

  const DIFF_ORDER: Record<string, number> = {
    beginner: 0, intermediate: 1, advanced: 2, expert: 3,
  };
  const orderedResources = [...resources].sort(
    (a, b) =>
      (DIFF_ORDER[a.difficulty ?? ""] ?? 4) - (DIFF_ORDER[b.difficulty ?? ""] ?? 4),
  );
  const [resourceStatuses, setResourceStatuses] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {};
    for (const r of resources) m[r.id] = r.status;
    return m;
  });
  const [selectedResource, setSelectedResource] = useState<ResourceRef | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const resDone = resources.filter((r) => (resourceStatuses[r.id] ?? r.status) === "completed").length;

  const changeResourceStatus = useCallback(async (id: number, status: string) => {
    setUpdatingStatus(true);
    const prev = resourceStatuses[id];
    setResourceStatuses((s) => ({ ...s, [id]: status }));
    try {
      await fetch(`/api/learn/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      setResourceStatuses((s) => ({ ...s, [id]: prev }));
    } finally {
      setUpdatingStatus(false);
    }
  }, [resourceStatuses]);
  const readDone = articles.filter(
    (a) => readState[a.id],
  ).length;

  async function toggleRead(articleId: number, currentlyRead: boolean) {
    const next = !currentlyRead;
    setReadState((prev) => ({ ...prev, [articleId]: next }));
    try {
      await fetch(`/api/knowledge/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: next }),
      });
    } catch {
      setReadState((prev) => ({ ...prev, [articleId]: currentlyRead }));
    }
  }

  return (
    <div className="mx-auto min-w-0 max-w-4xl space-y-6">
      <Link
        href="/learn"
        className="flex items-center gap-1.5 font-cb-sans text-cb-foot text-cb-muted transition-colors hover:text-cb-text"
      >
        <ArrowLeft className="h-4 w-4" />
        All competencies
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="cb-label-mono rounded-cb-chip-sm bg-cb-raised px-2 py-1 text-cb-caption text-cb-second">
            {area}
          </span>
          <span
            className={
              isValidated
                ? "cb-label-mono flex items-center gap-1 rounded-cb-chip-sm bg-cb-or-tint px-2 py-1 text-cb-caption text-cb-or"
                : "cb-label-mono rounded-cb-chip-sm bg-cb-raised px-2 py-1 text-cb-caption text-cb-second"
            }
            title={isValidated ? "Validated by assessment" : "Inferred from platform activity"}
          >
            {isValidated && <BadgeCheck className="h-3 w-3" />}
            level L{level}
          </span>
        </div>
        <h1 className="page-title text-cb-text">{label}</h1>
        <p className="font-cb-sans text-cb-foot leading-relaxed text-cb-muted">
          {description}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        {/* Understand — the six tiers. */}
        <section className="space-y-2">
          <h2 className="font-cb-sans text-cb-card text-cb-text">
            Understand
            <span className="cb-label-mono ml-2 text-cb-caption text-cb-muted">
              {readDone}/{articles.length || 6}
            </span>
          </h2>
          <div className="space-y-1.5">
            {Array.from({ length: 6 }, (_, tier) => {
              const found = byTier.get(tier);
              if (!found) {
                return (
                  <div
                    key={tier}
                    className="flex items-center gap-2 rounded-cb-card border border-dashed border-cb-line px-3 py-2.5"
                  >
                    <span className="cb-label-mono text-cb-caption text-cb-muted">L{tier}</span>
                    <span className="font-cb-sans text-cb-foot text-cb-muted">
                      No article yet
                    </span>
                  </div>
                );
              }
              const isRead = readState[found.id] || false;
              const reached = isRead;
              return (
                <div
                  key={tier}
                  className="group flex items-center gap-3 rounded-cb-card border border-cb-line bg-cb-card px-3 py-2.5 transition-colors hover:bg-cb-raised"
                >
                  <button
                    type="button"
                    onClick={() => void toggleRead(found.id, isRead)}
                    aria-label={isRead ? "Mark as unread" : "Mark as read"}
                    title={isRead ? "Mark as unread" : "Mark as read"}
                    className="shrink-0 text-cb-muted transition-colors hover:text-cb-or"
                  >
                    {reached ? (
                      <CircleCheck className="h-4 w-4 text-cb-or" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "cb-label-mono shrink-0 rounded-cb-chip-sm px-2 py-1 text-cb-caption",
                      reached
                        ? "bg-cb-or text-cb-on-or"
                        : "bg-cb-raised text-cb-second",
                    )}
                  >
                    L{tier}
                  </span>
                  <Link
                    href={`/knowledge?article=${found.id}`}
                    className="min-w-0 flex-1"
                  >
                    <span className="block truncate font-cb-sans text-cb-foot font-bold text-cb-text group-hover:text-cb-or">
                      {found.title}
                    </span>
                    <span className="cb-label-mono text-cb-caption text-cb-muted">
                      {TIER_PURPOSE[tier]}
                      {!reached && " · above your level"}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Practice — the Learn resources. */}
        <section className="space-y-2">
          <h2 className="font-cb-sans text-cb-card text-cb-text">
            Practice
            <span className="cb-label-mono ml-2 text-cb-caption text-cb-muted">
              {resDone}/{resources.length}
            </span>
          </h2>
          {resources.length === 0 ? (
            <div className="rounded-cb-card border border-dashed border-cb-line px-3 py-6 text-center font-cb-sans text-cb-foot text-cb-muted">
              No resources mapped to this competency.
            </div>
          ) : (
            <div className="space-y-1.5">
              {orderedResources.map((r) => {
                const st = resourceStatuses[r.id] ?? r.status;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedResource(r)}
                    className="group flex w-full items-center gap-2.5 rounded-cb-card border border-cb-line bg-cb-card px-3 py-2.5 text-left transition-colors hover:bg-cb-raised"
                  >
                    {st === "completed" ? (
                      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-cb-success">
                        <Check className="h-2.5 w-2.5 text-cb-bg" strokeWidth={3} />
                      </span>
                    ) : (
                      <span
                        className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
                          st === "in_progress" ? "border-cb-or" : "border-cb-line"
                        }`}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate font-cb-sans text-cb-foot text-cb-second group-hover:text-cb-text">
                      {r.title}
                    </span>
                    {r.difficulty && (
                      <span className="cb-label-mono hidden shrink-0 text-cb-caption text-cb-muted sm:inline">
                        {r.difficulty}
                      </span>
                    )}
                    <span className="cb-label-mono shrink-0 rounded-cb-chip-sm bg-cb-raised px-2 py-0.5 text-cb-caption text-cb-second">
                      {PLATFORM_LABELS[r.platform] ?? r.platform}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Resource detail dialog */}
      <Dialog open={selectedResource != null} onOpenChange={(open) => { if (!open) setSelectedResource(null); }}>
        <DialogContent className="max-w-md">
          {selectedResource && (() => {
            const st = resourceStatuses[selectedResource.id] ?? selectedResource.status;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <span className="cb-label-mono rounded-cb-chip-sm bg-cb-raised px-2 py-0.5 text-cb-caption text-cb-second">
                      {PLATFORM_LABELS[selectedResource.platform] ?? selectedResource.platform}
                    </span>
                    {selectedResource.difficulty && (
                      <span className="cb-label-mono text-cb-caption text-cb-muted">
                        {selectedResource.difficulty}
                      </span>
                    )}
                  </div>
                  <DialogTitle className="text-cb-body font-semibold leading-snug">
                    {selectedResource.title}
                  </DialogTitle>
                </DialogHeader>

                {selectedResource.description && (
                  <p className="font-cb-sans text-cb-foot leading-relaxed text-cb-muted">
                    {selectedResource.description}
                  </p>
                )}

                {selectedResource.estimatedHours != null && (
                  <div className="flex justify-between font-cb-sans text-cb-foot">
                    <span className="text-cb-muted">Estimated</span>
                    <span>{selectedResource.estimatedHours}h</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <p className="font-cb-sans text-cb-foot text-cb-muted">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["not_started", "in_progress", "completed"] as const).map((s) => (
                      <Button
                        key={s}
                        size="xs"
                        variant={st === s ? "default" : "outline"}
                        disabled={updatingStatus}
                        onClick={() => void changeResourceStatus(selectedResource.id, s)}
                      >
                        {updatingStatus && st !== s && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        {s.replace(/_/g, " ")}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedResource.url && (
                  <a
                    href={selectedResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-cb-button border border-cb-line bg-cb-raised px-4 py-2 font-cb-sans text-cb-foot font-bold text-cb-text transition-colors hover:bg-cb-raised-hover"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open on {PLATFORM_LABELS[selectedResource.platform] ?? selectedResource.platform}
                  </a>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
