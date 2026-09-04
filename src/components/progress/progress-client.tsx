"use client";

import Link from "next/link";
import { formatRelative } from "@/lib/format";
import type { FtProject } from "@/lib/guidance/ft-project-tree";
import { CoreDonut, CircleBars, type CircleSlice } from "./core-donut";
import { CircleCards } from "./circle-cards";
import { DepTree } from "./dep-tree";
import { StatTile } from "@/components/ui/stat-tile";

interface ProgressClientProps {
  goalsEntry: { active: number; behind: number };
  assessEntry: { validated: number; total: number; open: number };
  level: number | null;
  circles: CircleSlice[];
  coreDone: number;
  coreTotal: number;
  currentCircle: number;
  completedProjects: string[];
  inProgressProjects: string[];
  availableProjects: FtProject[];
  manualCompletions: string[];
  lastSync: string | null;
}

export function ProgressClient({
  goalsEntry,
  assessEntry,
  level,
  circles,
  coreDone,
  coreTotal,
  currentCircle,
  completedProjects,
  inProgressProjects,
  availableProjects,
  manualCompletions,
  lastSync,
}: ProgressClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Progress</h1>
        <p className="page-subtitle mt-1">
          {lastSync
            ? `42 common core · last synced ${formatRelative(lastSync)}`
            : "42 common core · Holy Graph"}
        </p>
      </div>

      {/* Goals + Assess entry cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/goals"
          className="rounded-cb-card border border-cb-line bg-cb-card p-4 transition-colors hover:bg-cb-raised"
        >
          <p className="cb-label-mono text-cb-caption text-cb-muted">Goals</p>
          <p className="mt-2 font-cb-sans text-cb-head text-cb-text">
            {goalsEntry.active} active
          </p>
          <p className="mt-1 font-cb-mono text-cb-foot text-cb-muted">
            {goalsEntry.behind > 0 ? (
              <span className="text-cb-warn">{goalsEntry.behind} behind pace</span>
            ) : (
              "all on pace"
            )}
          </p>
        </Link>

        <Link
          href="/assess"
          className="rounded-cb-card border border-cb-line bg-cb-card p-4 transition-colors hover:bg-cb-raised"
        >
          <p className="cb-label-mono text-cb-caption text-cb-muted">Assess</p>
          <p className="mt-2 font-cb-sans text-cb-head text-cb-text">
            {assessEntry.validated} of {assessEntry.total} validated
          </p>
          <p className="mt-1 font-cb-mono text-cb-foot text-cb-muted">
            {assessEntry.open > 0 ? (
              <span className="text-cb-or">{assessEntry.open} in progress</span>
            ) : (
              "no assessment running"
            )}
          </p>
        </Link>
      </div>

      {/* Hero: donut + bars + KPIs */}
      <div className="rounded-cb-card border border-cb-line bg-cb-card p-5">
        <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
          <CoreDonut
            circles={circles}
            coreDone={coreDone}
            coreTotal={coreTotal}
            level={level}
          />
          <div className="space-y-4">
            <CircleBars circles={circles} />
            <div className="grid grid-cols-3 gap-2">
              <StatTile value={`C${currentCircle}`} label="current circle" />
              <StatTile
                value={String(availableProjects.length)}
                label="available now"
              />
              <StatTile
                value={`${coreTotal > 0 ? Math.round((coreDone / coreTotal) * 100) : 0}`}
                sub="%"
                label="core progress"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Circle cards */}
      <CircleCards
        currentCircle={currentCircle}
        completedProjects={completedProjects}
        inProgressProjects={inProgressProjects}
        availableProjects={availableProjects}
        manualCompletions={manualCompletions}
      />

      {/* Dependency tree */}
      <DepTree
        completedProjects={completedProjects}
        inProgressProjects={inProgressProjects}
        availableSlugs={availableProjects.map((p) => p.slug)}
        currentCircle={currentCircle}
      />
    </div>
  );
}

