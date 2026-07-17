import { db } from "@/lib/db";
import { goals, ftProjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { FT_COMMON_CORE, getCircleProgress, getAvailableProjects } from "@/lib/guidance/ft-project-tree";
import { getMainDeadline, computeBackwardPlan } from "@/lib/planning/backward-planner";

function getCompletedSlugs(): string[] {
  const projects = db.select().from(ftProjects).all();
  return projects
    .filter((p) => p.validated)
    .map((p) => (p.slug ?? p.name).toLowerCase().replace(/[^a-z0-9_]/g, ""));
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const completedSlugs = getCompletedSlugs();
  const circleProgress = getCircleProgress(completedSlugs);

  const deadline = getMainDeadline();
  const targetDate = body.targetDate ?? deadline?.targetDate ?? null;
  if (!targetDate) {
    return NextResponse.json(
      { error: "No target date. Set a 42 deadline in Settings first." },
      { status: 400 }
    );
  }

  const plan = computeBackwardPlan(targetDate, completedSlugs);

  const epicRow = db
    .insert(goals)
    .values({
      title: "Complete 42 Common-Core",
      category: "42",
      goalType: "cumulative",
      targetValue: FT_COMMON_CORE.length,
      currentValue: completedSlugs.length,
      metricSource: "ft:projects_validated",
      deadline: targetDate,
      sortOrder: 0,
    })
    .run();
  const epicId = Number(epicRow.lastInsertRowid);

  const circleGroups: Record<number, typeof FT_COMMON_CORE> = {};
  for (const p of FT_COMMON_CORE) {
    if (!circleGroups[p.circle]) circleGroups[p.circle] = [];
    circleGroups[p.circle].push(p);
  }

  let issueOrder = 0;
  let totalTasks = 0;
  let totalIssues = 0;
  const completedSet = new Set(completedSlugs);

  for (let circle = 0; circle <= 6; circle++) {
    const projects = circleGroups[circle];
    if (!projects || projects.length === 0) continue;

    const circlePlan = plan.circlePlans.find((c) => c.circle === circle);
    const circleDeadline = circlePlan?.dueBy ?? targetDate;
    const cp = circleProgress[circle];
    const isCircleDone = cp && cp.done >= cp.total;

    const issueRow = db
      .insert(goals)
      .values({
        title: `Complete Circle ${circle}`,
        category: "42",
        goalType: "cumulative",
        targetValue: projects.length,
        currentValue: projects.filter((p) => completedSet.has(p.slug)).length,
        deadline: circleDeadline,
        parentGoalId: epicId,
        sortOrder: issueOrder++,
        status: isCircleDone ? "completed" : "active",
      })
      .run();
    const issueId = Number(issueRow.lastInsertRowid);
    totalIssues++;

    let taskOrder = 0;
    for (const p of projects) {
      const isDone = completedSet.has(p.slug);
      db.insert(goals)
        .values({
          title: p.name,
          category: "42",
          goalType: "cumulative",
          targetValue: 1,
          currentValue: isDone ? 1 : 0,
          ftSlug: p.slug,
          estimatedHours: p.estimatedHours,
          parentGoalId: issueId,
          sortOrder: taskOrder++,
          status: isDone ? "completed" : "active",
        })
        .run();
      totalTasks++;
    }
  }

  return NextResponse.json({
    ok: true,
    epicId,
    totalIssues,
    totalTasks,
    preCompleted: completedSlugs.length,
  });
}

export async function GET() {
  const completedSlugs = getCompletedSlugs();
  const circleProgress = getCircleProgress(completedSlugs);
  const deadline = getMainDeadline();
  const targetDate = deadline?.targetDate ?? null;

  const plan = targetDate ? computeBackwardPlan(targetDate, completedSlugs) : null;

  const existing = db
    .select()
    .from(goals)
    .all()
    .find(
      (g) =>
        g.category === "42" &&
        !g.parentGoalId &&
        g.title?.includes("42 Common-Core")
    );

  const circleGroups: Record<number, typeof FT_COMMON_CORE> = {};
  for (const p of FT_COMMON_CORE) {
    if (!circleGroups[p.circle]) circleGroups[p.circle] = [];
    circleGroups[p.circle].push(p);
  }

  const completedSet = new Set(completedSlugs);
  const circles = Object.entries(circleGroups)
    .map(([c, projects]) => {
      const circle = parseInt(c);
      const cp = circleProgress[circle];
      const circlePlan = plan?.circlePlans.find((p) => p.circle === circle);
      return {
        circle,
        deadline: circlePlan?.dueBy ?? targetDate,
        totalTasks: projects.length,
        completedTasks: projects.filter((p) => completedSet.has(p.slug)).length,
        isComplete: cp ? cp.done >= cp.total : false,
      };
    })
    .sort((a, b) => a.circle - b.circle);

  return NextResponse.json({
    existingEpicId: existing?.id ?? null,
    targetDate,
    circles,
    totalTasks: FT_COMMON_CORE.length,
    preCompleted: completedSlugs.length,
  });
}
