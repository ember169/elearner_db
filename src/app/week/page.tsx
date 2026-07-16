import { runGuidanceEngine } from "@/lib/guidance/engine";
import { loadCurrentPlan } from "@/lib/mentor/store";
import { WeekClient } from "@/components/week/week-client";

export const dynamic = "force-dynamic";

export default function WeekPage() {
  const guidance = runGuidanceEngine();
  const mentorResult = loadCurrentPlan();

  const recommendations = guidance.recommendations.map((r) => ({
    type: r.platform,
    title: r.title,
    why: r.reason,
    estimatedTime: r.estimatedHours ? `~${r.estimatedHours}h` : "~2h",
    priority: r.priority,
  }));

  const mentorFocus = mentorResult.plan.focus;

  const items = mentorFocus.length > 0 ? mentorFocus : recommendations;

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

  const ftInProgress = guidance.ftProgress.inProgressProjects;

  return (
    <WeekClient
      focusItems={items}
      goals={activeGoals}
      hasPlan={items.length > 0}
      ftInProgress={ftInProgress}
    />
  );
}
