"use client";

import { useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FT_COMMON_CORE, type FtProject } from "@/lib/guidance/ft-project-tree";

interface CircleCardsProps {
  currentCircle: number;
  completedProjects: string[];
  inProgressProjects: string[];
  availableProjects: FtProject[];
  projectChoices: Record<string, string>;
  manualCompletions: string[];
}

type ProjectStatus = "done" | "in-progress" | "available" | "locked";

function projectStatus(
  slug: string,
  completed: Set<string>,
  inProgress: Set<string>,
  available: Set<string>,
): ProjectStatus {
  if (completed.has(slug)) return "done";
  if (inProgress.has(slug)) return "in-progress";
  if (available.has(slug)) return "available";
  return "locked";
}

function statusDot(status: ProjectStatus) {
  switch (status) {
    case "done":
      return "h-2.5 w-2.5 shrink-0 rounded-full bg-cb-success";
    case "in-progress":
      return "h-2.5 w-2.5 shrink-0 rounded-full bg-cb-or shadow-[0_0_0_2px_var(--cb-or-tint)]";
    case "available":
      return "h-2.5 w-2.5 shrink-0 rounded-full border-2 border-cb-or";
    case "locked":
      return "h-2.5 w-2.5 shrink-0 rounded-full border-2 border-cb-line";
  }
}

function circleState(
  circle: number,
  currentCircle: number,
  done: number,
  total: number,
): "done" | "current" | "locked" {
  if (done === total && total > 0) return "done";
  if (circle <= currentCircle) return "current";
  return "locked";
}

export function CircleCards({
  currentCircle,
  completedProjects,
  inProgressProjects,
  availableProjects,
  projectChoices: initialChoices,
  manualCompletions: initialManual,
}: CircleCardsProps) {
  const [manualSet, setManualSet] = useState(() => new Set(initialManual));
  const [choices, setChoices] = useState<Record<string, string>>(initialChoices);

  const allCompleted = new Set([...completedProjects, ...manualSet]);
  const inProgressSet = new Set(inProgressProjects);
  const availableSet = new Set(availableProjects.map((p) => p.slug));

  const byCircle = new Map<number, FtProject[]>();
  for (const p of FT_COMMON_CORE) {
    const list = byCircle.get(p.circle) ?? [];
    list.push(p);
    byCircle.set(p.circle, list);
  }

  const circles = Array.from(byCircle.entries()).sort(([a], [b]) => a - b);

  const initialOpen = new Set<number>();
  for (const [c] of circles) {
    const projects = byCircle.get(c)!;
    const done = projects.filter((p) => allCompleted.has(p.slug)).length;
    const total = countEffective(projects);
    const state = circleState(c, currentCircle, done, total);
    if (state === "current" || c === currentCircle + 1) initialOpen.add(c);
  }

  const [open, setOpen] = useState(initialOpen);

  const toggle = (c: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  async function toggleManual(slug: string) {
    const wasManual = manualSet.has(slug);
    const next = !wasManual;
    setManualSet((prev) => {
      const s = new Set(prev);
      if (next) s.add(slug);
      else s.delete(slug);
      return s;
    });
    try {
      await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, completed: next }),
      });
    } catch {
      setManualSet((prev) => {
        const s = new Set(prev);
        if (wasManual) s.add(slug);
        else s.delete(slug);
        return s;
      });
    }
  }

  const selectChoice = useCallback(async (groupName: string, slug: string) => {
    const prev = choices[groupName];
    if (prev === slug) {
      setChoices((c) => { const n = { ...c }; delete n[groupName]; return n; });
      try { await fetch("/api/progress/choices", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupName }) }); } catch { setChoices((c) => ({ ...c, [groupName]: slug })); }
    } else {
      setChoices((c) => ({ ...c, [groupName]: slug }));
      try { await fetch("/api/progress/choices", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupName, chosenSlug: slug }) }); } catch { if (prev) setChoices((c) => ({ ...c, [groupName]: prev })); else setChoices((c) => { const n = { ...c }; delete n[groupName]; return n; }); }
    }
  }, [choices]);

  const allCircleProjects = Array.from(byCircle.values());
  const coreTotal = allCircleProjects.reduce((s, ps) => s + countEffective(ps), 0);
  const coreDone = allCircleProjects.reduce((s, ps) => {
    const { groups, standalone } = splitProjects(ps);
    let done = standalone.filter((p) => allCompleted.has(p.slug)).length;
    for (const g of groups) {
      if (g.projects.some((p) => allCompleted.has(p.slug))) done++;
    }
    return s + done;
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-cb-sans text-cb-card text-cb-text">Circles</h2>
        <span className="cb-label-mono text-cb-caption text-cb-muted">
          {coreDone} of {coreTotal} projects done
        </span>
      </div>

      <div className="space-y-2">
        {circles.map(([c, projects]) => {
          const done = projects.filter((p) => allCompleted.has(p.slug)).length;
          const total = countEffective(projects);
          const state = circleState(c, currentCircle, done, total);
          const isOpen = open.has(c);

          const { groups, standalone } = splitProjects(projects);

          return (
            <div
              key={c}
              className={cn(
                "rounded-cb-card border bg-cb-card overflow-hidden",
                state === "current" ? "border-cb-or" : "border-cb-line",
              )}
            >
              <button
                type="button"
                onClick={() => toggle(c)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-cb-raised",
                  state === "current" && "bg-cb-or-tint",
                )}
              >
                <div className="flex items-center gap-2">
                  <StatusChip state={state} />
                  <span className="font-cb-sans text-cb-body font-bold text-cb-text">
                    Circle {c}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-cb-mono text-cb-foot tabular-nums",
                      state === "current" ? "text-cb-or" : "text-cb-second",
                    )}
                  >
                    {done}/{total}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-cb-muted transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="space-y-3 px-4 pb-4 pt-1">
                  {/* Choice groups */}
                  {groups.map((group) => {
                    const groupKey = group.projects[0]?.group ?? group.label;
                    const chosen = choices[groupKey];
                    const anyValidated = group.projects.some((gp) => completedProjects.includes(gp.slug));
                    return (
                      <div key={group.label}>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="cb-label-mono rounded bg-cb-or-tint px-1.5 py-0.5 text-cb-caption text-cb-or">
                            pick one
                          </span>
                          <span className="font-cb-sans text-cb-foot text-cb-muted">
                            {group.label}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {group.projects.map((p) => {
                            const st = projectStatus(p.slug, allCompleted, inProgressSet, availableSet);
                            const isChosen = chosen === p.slug;
                            const isUnchosen = !!chosen && !isChosen;
                            const isValidatedByOther = anyValidated && !allCompleted.has(p.slug);
                            return (
                              <ProjectCard
                                key={p.slug}
                                project={p}
                                status={st}
                                isAlt={isValidatedByOther}
                                dimmed={isUnchosen && !isValidatedByOther}
                                isManual={manualSet.has(p.slug)}
                                isSynced={completedProjects.includes(p.slug)}
                                onToggle={() => void toggleManual(p.slug)}
                                radioState={anyValidated ? (allCompleted.has(p.slug) ? "locked" : "disabled") : isChosen ? "selected" : "unselected"}
                                onRadio={() => void selectChoice(groupKey, p.slug)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* All standalone projects in one grid */}
                  {standalone.length > 0 && (
                    <div className="space-y-1.5">
                      {standalone.map((p) => {
                        const st = projectStatus(p.slug, allCompleted, inProgressSet, availableSet);
                        return (
                          <ProjectCard
                            key={p.slug}
                            project={p}
                            status={st}
                            isAlt={false}
                            isManual={manualSet.has(p.slug)}
                            isSynced={completedProjects.includes(p.slug)}
                            onToggle={() => void toggleManual(p.slug)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RadioDot({ state, onRadio }: { state?: "selected" | "unselected" | "locked" | "disabled"; onRadio?: () => void }) {
  if (!state) return null;
  const base = "h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors";
  if (state === "locked") return <span className={cn(base, "border-cb-success bg-cb-success-tint cursor-default")}><span className="h-2 w-2 rounded-full bg-cb-success" /></span>;
  if (state === "disabled") return <span className={cn(base, "border-cb-line cursor-default")} />;
  return (
    <button type="button" onClick={onRadio} className={cn(base, state === "selected" ? "border-cb-or cursor-pointer" : "border-cb-line cursor-pointer hover:border-cb-second")}>
      {state === "selected" && <span className="h-2 w-2 rounded-full bg-cb-or" />}
    </button>
  );
}

function ProjectCard({
  project,
  status,
  isAlt,
  dimmed,
  isManual,
  isSynced,
  onToggle,
  radioState,
  onRadio,
}: {
  project: FtProject;
  status: ProjectStatus;
  isAlt: boolean;
  dimmed?: boolean;
  isManual: boolean;
  isSynced: boolean;
  onToggle: () => void;
  radioState?: "selected" | "unselected" | "locked" | "disabled";
  onRadio?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-cb-card border border-cb-line bg-cb-raised px-3.5 py-2.5 transition-colors hover:bg-cb-card",
        isAlt && "opacity-50",
        dimmed && "opacity-40",
      )}
    >
      {radioState && <RadioDot state={radioState} onRadio={onRadio} />}
      <button
        type="button"
        onClick={onToggle}
        disabled={isSynced}
        aria-label={isSynced ? "Validated by 42" : isManual ? "Mark as not done" : "Mark as done manually"}
        className={cn(
          "shrink-0 transition-colors",
          isSynced ? "cursor-default" : "cursor-pointer hover:opacity-70",
        )}
      >
        <span className={statusDot(status)} />
      </button>
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "font-cb-sans text-cb-foot font-bold",
            status === "done" ? "text-cb-second" : status === "locked" ? "text-cb-muted" : "text-cb-text",
          )}
        >
          {project.name}
        </span>
        {status !== "done" && project.description && (
          <p className="line-clamp-1 font-cb-sans text-cb-caption leading-snug text-cb-muted">
            {project.description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isManual && !isSynced && (
          <span className="cb-label-mono rounded bg-cb-or-tint px-1 py-px text-cb-caption text-cb-or">
            manual
          </span>
        )}
        {isAlt && (
          <span className="font-cb-mono text-cb-caption text-cb-muted">alt</span>
        )}
        <span className="font-cb-mono text-cb-caption text-cb-muted tabular-nums">
          {project.estimatedHours}h
        </span>
      </div>
    </div>
  );
}

function StatusChip({ state }: { state: "done" | "current" | "locked" }) {
  const base = "cb-label-mono rounded-[6px] px-2 py-0.5 text-cb-caption";
  switch (state) {
    case "done":
      return <span className={cn(base, "bg-cb-success-tint text-cb-success")}>done</span>;
    case "current":
      return <span className={cn(base, "bg-cb-or text-cb-on-or")}>in progress</span>;
    case "locked":
      return <span className={cn(base, "bg-cb-raised text-cb-muted")}>locked</span>;
  }
}

type ProjectGroup = { label: string; projects: FtProject[] };

function splitProjects(projects: FtProject[]): {
  groups: ProjectGroup[];
  standalone: FtProject[];
} {
  const groups: ProjectGroup[] = [];
  const standalone: FtProject[] = [];
  const seenGroups = new Set<string>();

  for (const p of projects) {
    if (p.group) {
      if (seenGroups.has(p.group)) continue;
      seenGroups.add(p.group);
      const members = projects.filter((q) => q.group === p.group);
      const label = p.group.replace(/^circle\d+-/, "").replace(/-/g, " ");
      groups.push({ label, projects: members });
    } else {
      standalone.push(p);
    }
  }
  return { groups, standalone };
}

function countEffective(projects: FtProject[]): number {
  const groupsSeen = new Set<string>();
  let count = 0;
  for (const p of projects) {
    if (p.group) {
      if (groupsSeen.has(p.group)) continue;
      groupsSeen.add(p.group);
    }
    count++;
  }
  return count;
}
