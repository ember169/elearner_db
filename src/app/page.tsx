import { loadBoard } from "@/lib/board/store";
import { loadCurrentPlan } from "@/lib/mentor/store";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES } from "@/lib/mentor/competency-map";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

const FOCUS_STATUSES = new Set(["in_progress", "todo"]);
const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function TodayPage() {
  // loadBoard, never initializeBoard: the latter normalises titles, rewrites
  // estimatedHours and can trigger the legacy-plan migration. Opening the
  // Dashboard must not write to the database.
  const board = loadBoard();

  const focus = board.items
    .filter((i) => FOCUS_STATUSES.has(i.boardStatus ?? ""))
    .sort((a, b) => {
      const p =
        (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
      return p !== 0 ? p : (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .slice(0, 4)
    .map((i) => ({
      id: i.id,
      title: i.title,
      type: i.type,
      priority: i.priority,
      estimatedHours: i.estimatedHours,
      boardStatus: i.boardStatus,
      link: i.link,
    }));

  const guidance = runGuidanceEngine();
  const signals = computeCompetencySignals(guidance.snapshot, guidance.ftProgress);
  const competencies = COMPETENCIES.map((c) => ({
    id: c.id,
    label: c.label,
    area: c.area as string,
    level: signals[c.id]?.autoLevel ?? 0,
  }));

  const mentor = loadCurrentPlan();

  return (
    <DashboardClient
      focus={focus}
      briefing={board.mentorBriefing}
      collapsedBriefing={board.collapsedBriefing}
      competencies={competencies}
      briefingStale={mentor.stale}
      boardCount={board.items.length}
    />
  );
}
