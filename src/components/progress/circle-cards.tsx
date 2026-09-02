"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FT_COMMON_CORE, type FtProject } from "@/lib/guidance/ft-project-tree";

interface CircleCardsProps {
  currentCircle: number;
  completedProjects: string[];
  inProgressProjects: string[];
  availableProjects: FtProject[];
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
      return "h-2.5 w-2.5 rounded-full bg-cb-success";
    case "in-progress":
      return "h-2.5 w-2.5 rounded-full bg-cb-or shadow-[0_0_0_2px_var(--cb-or-tint)]";
    case "available":
      return "h-2.5 w-2.5 rounded-full border-2 border-cb-or";
    case "locked":
      return "h-2.5 w-2.5 rounded-full border-2 border-cb-line";
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
}: CircleCardsProps) {
  const completedSet = new Set(completedProjects);
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
    const done = projects.filter((p) => completedSet.has(p.slug)).length;
    const state = circleState(c, currentCircle, done, projects.length);
    if (state !== "locked" || c === currentCircle + 1) initialOpen.add(c);
  }

  const [open, setOpen] = useState(initialOpen);

  const toggle = (c: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  const coreDone = completedProjects.length;
  const coreTotal = FT_COMMON_CORE.length;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-cb-sans text-[17px] font-bold text-cb-text">Circles</h2>
        <span className="cb-label-mono text-[10px] text-cb-muted">
          {coreDone} of {coreTotal} projects done
        </span>
      </div>

      <div className="space-y-2">
        {circles.map(([c, projects]) => {
          const done = projects.filter((p) => completedSet.has(p.slug)).length;
          const total = countEffective(projects, completedSet);
          const state = circleState(c, currentCircle, done, total);
          const isOpen = open.has(c);

          const groups = groupProjects(projects);

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
                  <span className="font-cb-sans text-[15px] font-bold text-cb-text">
                    Circle {c}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-cb-mono text-[11px] tabular-nums",
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
                  {groups.map((group, gi) => (
                    <div key={gi}>
                      {group.label && (
                        <div className="mb-2 flex items-center gap-2">
                          <span className="cb-label-mono rounded bg-cb-or-tint px-1.5 py-0.5 text-[9px] text-cb-or">
                            pick one
                          </span>
                          <span className="font-cb-sans text-[12px] text-cb-muted">
                            {group.label}
                          </span>
                        </div>
                      )}
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {group.projects.map((p) => {
                          const st = projectStatus(p.slug, completedSet, inProgressSet, availableSet);
                          const isAlt =
                            group.label != null &&
                            st === "locked" &&
                            group.projects.some((gp) => completedSet.has(gp.slug));
                          return (
                            <div
                              key={p.slug}
                              className={cn(
                                "rounded-[10px] border border-transparent bg-cb-raised px-3 py-2.5 transition-colors hover:border-cb-line",
                                isAlt && "opacity-50",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className={statusDot(st)} />
                                <span
                                  className={cn(
                                    "flex-1 font-cb-sans text-[13px] font-bold",
                                    st === "done" ? "text-cb-second" : st === "locked" ? "text-cb-muted" : "text-cb-text",
                                  )}
                                >
                                  {p.name}
                                </span>
                                {isAlt && (
                                  <span className="font-cb-mono text-[10px] text-cb-muted">alt</span>
                                )}
                                <span className="font-cb-mono text-[10px] text-cb-muted">
                                  {p.estimatedHours}h
                                </span>
                              </div>
                              {st !== "done" && p.description && (
                                <p className="mt-1 line-clamp-2 font-cb-sans text-[12px] leading-[1.4] text-cb-muted">
                                  {p.description}
                                </p>
                              )}
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {p.skills.slice(0, 4).map((s) => (
                                  <span
                                    key={s}
                                    className="rounded bg-cb-card px-1.5 py-px font-cb-mono text-[9px] text-cb-muted"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusChip({ state }: { state: "done" | "current" | "locked" }) {
  const base = "cb-label-mono rounded-[6px] px-2 py-0.5 text-[10px]";
  switch (state) {
    case "done":
      return <span className={cn(base, "bg-cb-success-tint text-cb-success")}>done</span>;
    case "current":
      return <span className={cn(base, "bg-cb-or text-cb-on-or")}>in progress</span>;
    case "locked":
      return <span className={cn(base, "bg-cb-raised text-cb-muted")}>locked</span>;
  }
}

type ProjectGroup = { label: string | null; projects: FtProject[] };

function groupProjects(projects: FtProject[]): ProjectGroup[] {
  const groups: ProjectGroup[] = [];
  const seen = new Set<string>();

  for (const p of projects) {
    if (seen.has(p.slug)) continue;
    if (p.group) {
      const members = projects.filter((q) => q.group === p.group);
      for (const m of members) seen.add(m.slug);
      const label = p.group.replace(/^circle\d+-/, "").replace(/-/g, " ");
      groups.push({ label, projects: members });
    } else {
      seen.add(p.slug);
      groups.push({ label: null, projects: [p] });
    }
  }
  return groups;
}

function countEffective(projects: FtProject[], completed: Set<string>): number {
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
