import { runGuidanceEngine } from "@/lib/guidance/engine";
import { getWeekStart, getOrCreateWeekPlan } from "@/lib/week/store";
import { WeekClient } from "@/components/week/week-client";

export const dynamic = "force-dynamic";

export default function WeekPage() {
  const guidance = runGuidanceEngine();
  const weekStart = getWeekStart();
  const plan = getOrCreateWeekPlan(weekStart);

  const activeGoals = guidance.goals
    .filter((g) => g.status === "active")
    .map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      currentValue: g.currentValue,
      targetValue: g.targetValue,
      pacing: g.pacing,
    }));

  return <WeekClient plan={plan} goals={activeGoals} />;
}
