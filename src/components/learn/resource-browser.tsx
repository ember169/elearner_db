"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  X,
  ExternalLink,
  BookOpen,
  Circle,
  CircleDot,
  CircleCheck,
  ChevronDown,
  ChevronRight,
  Loader2,
  Play,
} from "lucide-react";
import { cn, assertOk } from "@/lib/utils";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";
import { RelatedArticles } from "@/components/knowledge/related-articles";

export type LearnResource = {
  id: number;
  platform: string;
  externalId: string | null;
  title: string;
  description: string | null;
  url: string | null;
  difficulty: string | null;
  estimatedHours: number | null;
  contentType: string | null;
  tagsJson: string | null;
  competencyIds: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

type CompetencyInfo = {
  id: string;
  label: string;
  area: string;
  description: string;
};

const STATUSES = [
  { value: "not_started", label: "Not started", icon: Circle },
  { value: "in_progress", label: "In progress", icon: CircleDot },
  { value: "completed", label: "Completed", icon: CircleCheck },
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced", "expert"];

const DIFFICULTY_VARIANT: Record<
  string,
  "success" | "info" | "warning" | "danger"
> = {
  beginner: "success",
  intermediate: "info",
  advanced: "warning",
  expert: "danger",
};

const UNMAPPED = "__unmapped__";

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Toggleable filter pill. */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[13px] transition-colors",
        active
          ? "border-primary/40 bg-primary/12 text-primary"
          : "border-border text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function StatusDot({ status }: { status: string }) {
  const entry = STATUSES.find((s) => s.value === status) ?? STATUSES[0];
  const Icon = entry.icon;
  return (
    <Icon
      className={cn(
        "h-3.5 w-3.5 shrink-0",
        status === "completed"
          ? "text-success"
          : status === "in_progress"
            ? "text-info"
            : "text-muted-foreground/50"
      )}
    />
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const color = PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.general;
  return (
    <span
      className="inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[12px] font-semibold tracking-wide"
      style={{ color, backgroundColor: `color-mix(in oklch, ${color} 14%, transparent)` }}
    >
      {PLATFORM_LABELS[platform] ?? platform.toUpperCase()}
    </span>
  );
}

export function ResourceBrowser({
  resources: initialResources,
  competencies,
  areas,
}: {
  resources: LearnResource[];
  competencies: CompetencyInfo[];
  areas: string[];
}) {
  const [resources, setResources] = useState(initialResources);
  const [search, setSearch] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  // Deep link from Knowledge: /learn?resource=N opens that resource's panel on
  // first render. A lazy initialiser rather than an effect, so nothing sets
  // state after mount and no Suspense boundary is needed.
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const id = Number(new URLSearchParams(window.location.search).get("resource"));
    return Number.isInteger(id) && id > 0 ? id : null;
  });
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState<string | null>(null);

  const competencyById = useMemo(() => {
    const map: Record<string, CompetencyInfo> = {};
    for (const c of competencies) map[c.id] = c;
    return map;
  }, [competencies]);

  // Resource ids are stable, so parsed tag/competency arrays are cached once
  // rather than re-parsed on every keystroke of the search box.
  const parsed = useMemo(() => {
    const map: Record<number, { tags: string[]; competencyIds: string[] }> = {};
    for (const r of resources) {
      map[r.id] = {
        tags: parseJsonArray(r.tagsJson),
        competencyIds: parseJsonArray(r.competencyIds),
      };
    }
    return map;
  }, [resources]);

  const availablePlatforms = useMemo(() => {
    const set = new Set(resources.map((r) => r.platform));
    return [...set].sort();
  }, [resources]);

  function toggle(
    value: string,
    list: string[],
    setList: (next: string[]) => void
  ) {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    );
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      if (platforms.length && !platforms.includes(r.platform)) return false;
      if (difficulties.length && !(r.difficulty && difficulties.includes(r.difficulty)))
        return false;
      if (statuses.length && !statuses.includes(r.status)) return false;
      if (!q) return true;

      const { tags, competencyIds } = parsed[r.id] ?? { tags: [], competencyIds: [] };
      const haystack = [
        r.title,
        r.description ?? "",
        r.contentType ?? "",
        r.platform,
        ...tags,
        ...competencyIds.map((id) => competencyById[id]?.label ?? id),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [resources, search, platforms, difficulties, statuses, parsed, competencyById]);

  // Group by competency, ordered by area then by the competency map's own
  // ordering. A resource mapped to several competencies appears under each.
  const groups = useMemo(() => {
    const byCompetency: Record<string, LearnResource[]> = {};
    const unmapped: LearnResource[] = [];

    for (const r of filtered) {
      const ids = (parsed[r.id]?.competencyIds ?? []).filter((id) => competencyById[id]);
      if (!ids.length) {
        unmapped.push(r);
        continue;
      }
      for (const id of ids) {
        (byCompetency[id] ??= []).push(r);
      }
    }

    const ordered: {
      key: string;
      label: string;
      area: string;
      items: LearnResource[];
    }[] = [];

    for (const area of areas) {
      for (const c of competencies) {
        if (c.area !== area) continue;
        const items = byCompetency[c.id];
        if (items?.length) {
          ordered.push({ key: c.id, label: c.label, area: c.area, items });
        }
      }
    }

    if (unmapped.length) {
      ordered.push({
        key: UNMAPPED,
        label: "Unmapped",
        area: "No competency assigned",
        items: unmapped,
      });
    }

    return ordered;
  }, [filtered, parsed, competencyById, competencies, areas]);

  const selected = selectedId != null ? resources.find((r) => r.id === selectedId) : undefined;

  const activeFilterCount = platforms.length + difficulties.length + statuses.length;

  function clearFilters() {
    setPlatforms([]);
    setDifficulties([]);
    setStatuses([]);
    setSearch("");
  }

  async function setStatus(id: number, status: string) {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/learn/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await assertOk(res);
      const data = (await res.json()) as { resource: LearnResource };
      setResources((prev) => prev.map((r) => (r.id === id ? data.resource : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  async function startLearning(id: number) {
    setUpdating(true);
    setError(null);
    setStarted(null);
    try {
      const res = await fetch("/api/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", id }),
      });
      await assertOk(res);
      const data = (await res.json()) as {
        resource: LearnResource;
        createdBoardItem: boolean;
      };
      setResources((prev) => prev.map((r) => (r.id === id ? data.resource : r)));
      setStarted(
        data.createdBoardItem
          ? "Added to your board"
          : "Already on your board"
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start resource");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Search + filter chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources by title, tag, or competency"
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {availablePlatforms.map((p) => (
            <Chip
              key={p}
              active={platforms.includes(p)}
              onClick={() => toggle(p, platforms, setPlatforms)}
            >
              {PLATFORM_LABELS[p] ?? p.toUpperCase()}
            </Chip>
          ))}
          <Separator orientation="vertical" className="mx-1 h-4" />
          {DIFFICULTIES.map((d) => (
            <Chip
              key={d}
              active={difficulties.includes(d)}
              onClick={() => toggle(d, difficulties, setDifficulties)}
            >
              {d}
            </Chip>
          ))}
          <Separator orientation="vertical" className="mx-1 h-4" />
          {STATUSES.map((s) => (
            <Chip
              key={s.value}
              active={statuses.includes(s.value)}
              onClick={() => toggle(s.value, statuses, setStatuses)}
            >
              <s.icon className="h-3 w-3" />
              {s.label}
            </Chip>
          ))}
          {(activeFilterCount > 0 || search) && (
            <Button variant="ghost" size="xs" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <p className="text-[13px] text-muted-foreground">
          {filtered.length} of {resources.length} resources
        </p>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="px-4 py-3 text-[14px] text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Competency-grouped grid */}
        <div className="space-y-5">
          {groups.length === 0 ? (
            <Card>
              <CardContent className="px-4 py-8 text-center">
                <BookOpen className="mx-auto h-6 w-6 text-muted-foreground/50" />
                <p className="mt-2 text-[14px] text-muted-foreground">
                  No resources match the current search and filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            groups.map((group) => {
              const isCollapsed = collapsed.includes(group.key);
              return (
                <section key={group.key} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggle(group.key, collapsed, setCollapsed)}
                    className="flex w-full items-center gap-2 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-[15px] font-semibold">{group.label}</span>
                    <Badge variant="outline">{group.area}</Badge>
                    <span className="text-[13px] text-muted-foreground">
                      {group.items.length}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.items.map((r) => (
                        <button
                          key={`${group.key}-${r.id}`}
                          type="button"
                          onClick={() => {
                            setSelectedId(r.id);
                            setStarted(null);
                          }}
                          className={cn(
                            "rounded-md border px-3 py-2.5 text-left transition-colors",
                            selectedId === r.id
                              ? "border-primary/40 bg-primary/8"
                              : "border-border hover:bg-accent"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <StatusDot status={r.status} />
                            <span className="flex-1 text-[14px] font-medium leading-snug">
                              {r.title}
                            </span>
                            <PlatformBadge platform={r.platform} />
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-5.5">
                            {r.difficulty && (
                              <Badge variant={DIFFICULTY_VARIANT[r.difficulty] ?? "outline"}>
                                {r.difficulty}
                              </Badge>
                            )}
                            {r.contentType && (
                              <span className="text-[12px] text-muted-foreground">
                                {r.contentType}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>

        {/* Detail panel — sticky beside the grid on desktop, overlay on mobile */}
        {selected && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSelectedId(null)}
            />
            <div
              className={cn(
                "z-50 max-lg:fixed max-lg:inset-x-3 max-lg:bottom-3 max-lg:top-16 max-lg:overflow-y-auto",
                "lg:sticky lg:top-8"
              )}
            >
              <ResourceDetail
                resource={selected}
                tags={parsed[selected.id]?.tags ?? []}
                competencyIds={parsed[selected.id]?.competencyIds ?? []}
                competencyById={competencyById}
                updating={updating}
                started={started}
                onClose={() => {
                  setSelectedId(null);
                  setStarted(null);
                }}
                onStatusChange={(status) => setStatus(selected.id, status)}
                onStart={() => startLearning(selected.id)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ResourceDetail({
  resource,
  tags,
  competencyIds,
  competencyById,
  updating,
  started,
  onClose,
  onStatusChange,
  onStart,
}: {
  resource: LearnResource;
  tags: string[];
  competencyIds: string[];
  competencyById: Record<string, CompetencyInfo>;
  updating: boolean;
  started: string | null;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onStart: () => void;
}) {
  // Only surface timestamps the current status actually justifies. The store
  // clears them on reset, but rows seeded from platform syncs predate that, so
  // this keeps a legacy date off an untouched resource.
  const startedAt =
    resource.status === "not_started" ? null : formatDate(resource.startedAt);
  const completedAt =
    resource.status === "completed" ? formatDate(resource.completedAt) : null;

  return (
    <Card>
      <CardContent className="space-y-3 px-4 pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <PlatformBadge platform={resource.platform} />
            {resource.difficulty && (
              <Badge variant={DIFFICULTY_VARIANT[resource.difficulty] ?? "outline"}>
                {resource.difficulty}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Close">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <h2 className="text-[16px] font-semibold leading-snug">{resource.title}</h2>

        {resource.description && (
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            {resource.description}
          </p>
        )}

        <Separator />

        <dl className="space-y-1.5 text-[13px]">
          {resource.contentType && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Type</dt>
              <dd>{resource.contentType}</dd>
            </div>
          )}
          {resource.estimatedHours != null && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Estimated</dt>
              <dd>{resource.estimatedHours}h</dd>
            </div>
          )}
          {startedAt && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Started</dt>
              <dd>{startedAt}</dd>
            </div>
          )}
          {completedAt && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Completed</dt>
              <dd>{completedAt}</dd>
            </div>
          )}
        </dl>

        {competencyIds.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[13px] text-muted-foreground">Competencies</p>
            <div className="flex flex-wrap gap-1">
              {competencyIds.map((id) => (
                <Badge key={id} variant="secondary">
                  {competencyById[id]?.label ?? id}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* The Knowledge articles for these competencies — the crossing the
            audit found missing. Links out to the reader on /knowledge. */}
        {competencyIds.length > 0 && (
          <RelatedArticles competencyIds={competencyIds} />
        )}

        {tags.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[13px] text-muted-foreground">Tags</p>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-1.5">
          <p className="text-[13px] text-muted-foreground">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <Button
                key={s.value}
                size="xs"
                variant={resource.status === s.value ? "default" : "outline"}
                disabled={updating}
                onClick={() => onStatusChange(s.value)}
              >
                {updating && resource.status !== s.value ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <s.icon className="h-3 w-3 mr-1" />
                )}
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Button
            size="sm"
            className="w-full"
            disabled={updating}
            onClick={onStart}
          >
            {updating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1" />
            )}
            Start learning
          </Button>
          {started && (
            <p className="text-[13px] text-muted-foreground text-center">{started}</p>
          )}
        </div>

        {resource.url && (
          <Button
            render={
              <a href={resource.url} target="_blank" rel="noopener noreferrer" />
            }
            variant="outline"
            size="sm"
            className="w-full"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Open on {PLATFORM_LABELS[resource.platform] ?? resource.platform}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
