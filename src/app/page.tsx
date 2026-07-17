import { db } from "@/lib/db";
import {
  ftProfile,
  thmProfile,
  htbProfile,
  maldevProfile,
  rootmeProfile,
  syncLog,
  tasks,
  settings,
} from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { loadCurrentPlan } from "@/lib/mentor/store";
import { runGuidanceEngine, flattenGoals } from "@/lib/guidance/engine";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES } from "@/lib/mentor/competency-map";
import { getWeekStart, getMonthWeekStarts, getOrCreateWeekPlan, getISOWeekNumber } from "@/lib/week/store";
import { PlannerClient } from "@/components/planner/planner-client";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const now = new Date();
  const todayWeek = getWeekStart();
  const weekStarts = getMonthWeekStarts(now);
  const monthPlans = weekStarts.map((ws) => ({
    weekStart: ws,
    weekNum: getISOWeekNumber(ws),
    plan: getOrCreateWeekPlan(ws),
  }));

  const mentorResult = loadCurrentPlan();
  const cfg = db.select().from(settings).limit(1).all()[0] ?? null;
  const objective = cfg?.objective ?? "Red team / malware dev";

  const pinnedTasks = db
    .select()
    .from(tasks)
    .where(eq(tasks.isCompleted, false))
    .all();

  const guidance = runGuidanceEngine();
  const signals = computeCompetencySignals(guidance.snapshot, guidance.ftProgress);

  const competencies = COMPETENCIES.map((c) => ({
    id: c.id,
    label: c.label,
    area: c.area,
    level: signals[c.id]?.autoLevel ?? 0,
    evidence: signals[c.id]?.evidence ?? "",
  }));

  const activeGoals = flattenGoals(guidance.goals)
    .filter((g) => g.status === "active" && g.children.length === 0)
    .map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      goalType: g.goalType,
      currentValue: g.currentValue,
      targetValue: g.targetValue,
      cadenceValue: g.cadenceValue,
      cadenceUnit: g.cadenceUnit,
      parentGoalId: g.parentGoalId,
      pacing: g.pacing,
    }));

  return (
    <PlannerClient
      monthPlans={monthPlans}
      currentMonth={{ year: now.getFullYear(), month: now.getMonth() }}
      todayWeek={todayWeek}
      objective={objective}
      competencies={competencies}
      goals={activeGoals}
      pinnedTasks={pinnedTasks}
      sideProject={mentorResult.plan.side_project ?? null}
      hasKey={mentorResult.hasKey}
      stale={mentorResult.stale}
    />
  );
}
