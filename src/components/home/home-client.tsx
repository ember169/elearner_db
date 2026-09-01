"use client";

import { useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { PlannerClient } from "@/components/planner/planner-client";
import { TodayDashboard } from "./today-dashboard";
import type {
  FocusItem,
  CircleSlice,
  CompetencyEntry as PulseEntry,
  WithinReach,
  HomeStats,
} from "./today-dashboard";
import type { PlanItemData, GoalSlim, SideProject } from "@/components/planner/types";

type SideProjectState = {
  title: string;
  goalId: number;
  status: "accepted" | "done" | "aborted";
} | null;

type View = "today" | "board";

export function HomeClient({
  focus,
  briefing,
  collapsedBriefing,
  briefingStale,
  boardCount,
  circles,
  stats,
  withinReach,
  competencies,
  boardItems,
  objective,
  sideProject,
  sideProjectState,
  hasKey,
  goals,
  initialView,
}: {
  focus: FocusItem[];
  briefing: string | null;
  collapsedBriefing: string | null;
  briefingStale: boolean;
  boardCount: number;
  circles: CircleSlice[];
  stats: HomeStats;
  withinReach: WithinReach[];
  competencies: PulseEntry[];
  boardItems: PlanItemData[];
  objective: string;
  sideProject: SideProject | null;
  sideProjectState: SideProjectState;
  hasKey: boolean;
  goals: GoalSlim[];
  initialView: View;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>(initialView);

  const select = useCallback(
    (next: View) => {
      setView(next);
      // Keep the URL deep-linkable (?view=board) without a full navigation.
      const params = new URLSearchParams(searchParams.toString());
      if (next === "board") params.set("view", "board");
      else params.delete("view");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  // Today reads best contained (the old full-width column was the complaint);
  // the Board's multi-column kanban wants the full content width.
  const shellWidth = view === "today" ? "mx-auto max-w-5xl" : "";

  return (
    <div className={cn("space-y-5", shellWidth)}>
      {/* Header: title + Today | Board switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title text-cb-text">
          {view === "today" ? "Today" : "Board"}
        </h1>
        <div
          role="tablist"
          aria-label="Home view"
          className="flex w-fit gap-1 rounded-[12px] bg-cb-raised p-[5px]"
        >
          {(
            [
              ["today", "Today"],
              ["board", "Board"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => select(key)}
              className={cn(
                "rounded-[9px] px-3.5 py-1.5 font-cb-sans text-[13px] font-bold transition-colors",
                view === key ? "bg-cb-or text-cb-on-or" : "text-cb-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "today" ? (
        <TodayDashboard
          focus={focus}
          briefing={briefing}
          collapsedBriefing={collapsedBriefing}
          briefingStale={briefingStale}
          boardCount={boardCount}
          circles={circles}
          stats={stats}
          withinReach={withinReach}
          competencies={competencies}
          onSeeBoard={() => select("board")}
        />
      ) : (
        <PlannerClient
          embedded
          boardItems={boardItems}
          mentorBriefing={briefing}
          collapsedBriefing={collapsedBriefing}
          objective={objective}
          competencies={[]}
          goals={goals}
          sideProject={sideProject}
          sideProjectState={sideProjectState}
          hasKey={hasKey}
          stale={briefingStale}
        />
      )}
    </div>
  );
}
