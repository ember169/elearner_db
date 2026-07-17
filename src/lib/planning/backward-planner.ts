import { db } from "@/lib/db";
import { deadlines } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  FT_COMMON_CORE,
  getAvailableProjects,
  type FtProject,
} from "@/lib/guidance/ft-project-tree";

export type Deadline = typeof deadlines.$inferSelect;

export type CirclePlan = {
  circle: number;
  projects: { slug: string; name: string; hours: number; group?: string }[];
  totalHours: number;
  startBy: string;
  dueBy: string;
};

export type BackwardPlan = {
  targetDate: string;
  circlePlans: CirclePlan[];
  weeklyHoursNeeded: number;
  totalHoursRemaining: number;
  weeksAvailable: number;
  warnings: string[];
  feasible: boolean;
};

const BUFFER_WEEKS = 2;
const MAX_WEEKLY_42_HOURS = 25;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

function weeksBetween(from: string, to: string): number {
  const a = new Date(from + "T12:00:00");
  const b = new Date(to + "T12:00:00");
  return Math.max(0, (b.getTime() - a.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

function circleProjects(circle: number): FtProject[] {
  return FT_COMMON_CORE.filter((p) => p.circle === circle);
}

// For choice groups (e.g., circle2-graphics: pick one), use the shortest option
// as the optimistic estimate.
function minHoursForCircle(
  circle: number,
  completed: Set<string>
): { projects: { slug: string; name: string; hours: number; group?: string }[]; totalHours: number } {
  const all = circleProjects(circle);
  const groups = new Map<string, FtProject[]>();
  const ungrouped: FtProject[] = [];

  for (const p of all) {
    if (completed.has(p.slug)) continue;
    if (p.group) {
      const list = groups.get(p.group) ?? [];
      list.push(p);
      groups.set(p.group, list);
    } else {
      ungrouped.push(p);
    }
  }

  const projects: { slug: string; name: string; hours: number; group?: string }[] = [];

  for (const p of ungrouped) {
    projects.push({ slug: p.slug, name: p.name, hours: p.estimatedHours, group: p.group });
  }

  for (const [groupName, members] of groups) {
    // Check if any member is already completed (group satisfied)
    if (members.length === 0) continue;
    const shortest = members.reduce((a, b) =>
      a.estimatedHours <= b.estimatedHours ? a : b
    );
    projects.push({
      slug: shortest.slug,
      name: shortest.name,
      hours: shortest.estimatedHours,
      group: groupName,
    });
  }

  return {
    projects,
    totalHours: projects.reduce((s, p) => s + p.hours, 0),
  };
}

export function computeBackwardPlan(
  targetDate: string,
  completedSlugs: string[],
  weeklyBudget42: number = 15,
  today?: string
): BackwardPlan {
  const now = today ?? isoDate(new Date());
  const completed = new Set(completedSlugs.map((s) => s.toLowerCase()));
  const warnings: string[] = [];

  // Find the first incomplete circle
  let firstIncomplete = 0;
  for (let c = 0; c <= 6; c++) {
    const { totalHours } = minHoursForCircle(c, completed);
    if (totalHours > 0) {
      firstIncomplete = c;
      break;
    }
  }

  // Build circle plans from current state to circle 6
  const circlePlans: CirclePlan[] = [];
  let totalHoursRemaining = 0;

  for (let c = firstIncomplete; c <= 6; c++) {
    const { projects, totalHours } = minHoursForCircle(c, completed);
    if (totalHours === 0) continue;
    totalHoursRemaining += totalHours;
    circlePlans.push({
      circle: c,
      projects,
      totalHours,
      startBy: "",
      dueBy: "",
    });
  }

  if (circlePlans.length === 0) {
    return {
      targetDate,
      circlePlans: [],
      weeklyHoursNeeded: 0,
      totalHoursRemaining: 0,
      weeksAvailable: weeksBetween(now, targetDate),
      warnings: [],
      feasible: true,
    };
  }

  const weeksAvailable = weeksBetween(now, targetDate) - BUFFER_WEEKS;

  if (weeksAvailable <= 0) {
    warnings.push(
      `Target date ${targetDate} is in the past or too close. Need at least ${BUFFER_WEEKS} weeks of buffer.`
    );
    return {
      targetDate,
      circlePlans,
      weeklyHoursNeeded: Infinity,
      totalHoursRemaining,
      weeksAvailable: Math.max(0, weeksBetween(now, targetDate)),
      warnings,
      feasible: false,
    };
  }

  const weeklyHoursNeeded = totalHoursRemaining / weeksAvailable;

  // Backward-assign dates: start from target, subtract each circle's duration
  let cursor = targetDate;
  for (let i = circlePlans.length - 1; i >= 0; i--) {
    const plan = circlePlans[i];
    const weeksForCircle = plan.totalHours / weeklyBudget42;
    const daysForCircle = Math.ceil(weeksForCircle * 7);
    plan.dueBy = cursor;
    plan.startBy = addDays(cursor, -daysForCircle);
    cursor = plan.startBy;
  }

  // Check feasibility
  if (weeklyHoursNeeded > MAX_WEEKLY_42_HOURS) {
    warnings.push(
      `Need ${weeklyHoursNeeded.toFixed(1)}h/week on 42 alone — that's above the ${MAX_WEEKLY_42_HOURS}h/week ceiling. Consider extending the deadline or cutting scope.`
    );
  } else if (weeklyHoursNeeded > weeklyBudget42) {
    const deficit = weeklyHoursNeeded - weeklyBudget42;
    warnings.push(
      `At ${weeklyBudget42}h/week on 42, you'll miss by ~${Math.ceil(deficit * weeksAvailable / weeklyBudget42)} weeks. Options: bump to ${Math.ceil(weeklyHoursNeeded)}h/week, or push deadline to ${addDays(targetDate, Math.ceil(deficit * weeksAvailable / weeklyBudget42) * 7)}.`
    );
  }

  // Check if earliest circle start is before today
  const earliestStart = circlePlans[0]?.startBy;
  if (earliestStart && earliestStart < now) {
    warnings.push(
      `Backward plan puts Circle ${circlePlans[0].circle} start at ${earliestStart}, which is in the past. You're behind schedule — increase weekly hours or extend the deadline.`
    );
  }

  // Per-circle warnings for big projects
  for (const plan of circlePlans) {
    for (const proj of plan.projects) {
      if (proj.hours >= 100) {
        const weeksNeeded = proj.hours / weeklyBudget42;
        warnings.push(
          `${proj.name} alone needs ~${weeksNeeded.toFixed(0)} weeks at ${weeklyBudget42}h/week — plan accordingly.`
        );
      }
    }
  }

  return {
    targetDate,
    circlePlans,
    weeklyHoursNeeded: Math.round(weeklyHoursNeeded * 10) / 10,
    totalHoursRemaining,
    weeksAvailable: Math.round(weeksAvailable * 10) / 10,
    warnings,
    feasible: weeklyHoursNeeded <= MAX_WEEKLY_42_HOURS,
  };
}

// Compute how many hours/week the rule engine should allocate to 42 this week,
// given deadline pressure. Returns a number between minHours and maxHours.
export function deadline42Pressure(
  completedSlugs: string[],
  weeklyBaseline: number = 15
): { hoursThisWeek: number; urgency: "normal" | "elevated" | "critical"; reason: string } {
  const rows = db.select().from(deadlines).where(eq(deadlines.type, "common_core")).all();
  if (rows.length === 0) {
    return { hoursThisWeek: weeklyBaseline, urgency: "normal", reason: "No deadline set." };
  }

  const dl = rows[0];
  const plan = computeBackwardPlan(dl.targetDate, completedSlugs, weeklyBaseline);

  if (!plan.feasible) {
    return {
      hoursThisWeek: MAX_WEEKLY_42_HOURS,
      urgency: "critical",
      reason: `Need ${plan.weeklyHoursNeeded}h/week for 42 — deadline at risk.`,
    };
  }

  if (plan.weeklyHoursNeeded > weeklyBaseline * 1.3) {
    return {
      hoursThisWeek: Math.min(MAX_WEEKLY_42_HOURS, Math.ceil(plan.weeklyHoursNeeded)),
      urgency: "elevated",
      reason: `Deadline pressure: ${plan.weeklyHoursNeeded}h/week needed (baseline ${weeklyBaseline}h).`,
    };
  }

  return {
    hoursThisWeek: weeklyBaseline,
    urgency: "normal",
    reason: `On track at ${weeklyBaseline}h/week.`,
  };
}

// CRUD helpers

export function getDeadlines(): Deadline[] {
  return db.select().from(deadlines).all();
}

export function getMainDeadline(): Deadline | null {
  return db.select().from(deadlines).where(eq(deadlines.type, "common_core")).get() ?? null;
}

export function upsertCommonCoreDeadline(
  targetDate: string,
  completedSlugs: string[],
  weeklyBudget42: number = 15
): { deadline: Deadline; plan: BackwardPlan } {
  // Delete old common_core and its auto-generated children
  db.delete(deadlines).where(eq(deadlines.type, "common_core")).run();
  db.delete(deadlines).where(eq(deadlines.autoGenerated, true)).run();

  const plan = computeBackwardPlan(targetDate, completedSlugs, weeklyBudget42);

  const main = db
    .insert(deadlines)
    .values({
      type: "common_core",
      label: "42 Common Core",
      targetDate,
      weeklyHoursNeeded: plan.weeklyHoursNeeded === Infinity ? null : plan.weeklyHoursNeeded,
      warning: plan.warnings.length > 0 ? plan.warnings[0] : null,
    })
    .returning()
    .get();

  // Insert auto-generated circle deadlines
  for (const cp of plan.circlePlans) {
    db.insert(deadlines)
      .values({
        type: "circle",
        label: `Circle ${cp.circle}`,
        targetDate: cp.dueBy,
        circle: cp.circle,
        parentId: main.id,
        autoGenerated: true,
        weeklyHoursNeeded: plan.weeklyHoursNeeded === Infinity ? null : plan.weeklyHoursNeeded,
      })
      .run();
  }

  return { deadline: main, plan };
}

export function deleteDeadline(id: number) {
  // Also delete children
  db.delete(deadlines).where(eq(deadlines.parentId, id)).run();
  db.delete(deadlines).where(eq(deadlines.id, id)).run();
}
