import { db } from "@/lib/db";
import { goals, ftProjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getAvailableProjects, FT_COMMON_CORE } from "@/lib/guidance/ft-project-tree";
import { getMainDeadline, computeBackwardPlan } from "@/lib/planning/backward-planner";

function getCompletedSlugs(): string[] {
  const projects = db.select().from(ftProjects).all();
  return projects
    .filter((p) => p.validated)
    .map((p) => (p.slug ?? p.name).toLowerCase().replace(/[^a-z0-9_]/g, ""));
}

function findAllDescendants(parentId: number): (typeof goals.$inferSelect)[] {
  const allGoals = db.select().from(goals).all();
  const result: (typeof goals.$inferSelect)[] = [];
  function walk(pid: number) {
    for (const g of allGoals) {
      if (g.parentGoalId === pid) {
        result.push(g);
        walk(g.id);
      }
    }
  }
  walk(parentId);
  return result;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const epicId = body.epicId as number;

  const epic = db.select().from(goals).where(eq(goals.id, epicId)).all()[0];
  if (!epic) {
    return NextResponse.json({ error: "Epic not found" }, { status: 404 });
  }

  const descendants = findAllDescendants(epicId);
  const taskGoals = descendants.filter((g) => g.ftSlug);
  const completedSlugs = getCompletedSlugs();
  const completedSet = new Set(completedSlugs);

  const autoCompleted: { id: number; title: string; ftSlug: string }[] = [];
  for (const task of taskGoals) {
    if (task.status !== "completed" && task.ftSlug && completedSet.has(task.ftSlug)) {
      autoCompleted.push({ id: task.id, title: task.title, ftSlug: task.ftSlug });
    }
  }

  const existingSlugs = new Set(taskGoals.map((t) => t.ftSlug).filter(Boolean));
  const available = getAvailableProjects(completedSlugs);
  const newTasks = available.filter((p) => !existingSlugs.has(p.slug));

  const deadline = getMainDeadline();
  const targetDate = deadline?.targetDate ?? epic.deadline;
  const deadlineShifts: { circle: number; issueId: number; oldDate: string; newDate: string }[] = [];

  if (targetDate) {
    const plan = computeBackwardPlan(targetDate, completedSlugs);
    const issues = descendants.filter((g) => g.parentGoalId === epicId);
    for (const issue of issues) {
      const circleMatch = issue.title.match(/Circle (\d+)/);
      if (!circleMatch) continue;
      const circle = parseInt(circleMatch[1]);
      const circlePlan = plan.circlePlans.find((c) => c.circle === circle);
      if (circlePlan && issue.deadline && issue.deadline !== circlePlan.dueBy) {
        deadlineShifts.push({
          circle,
          issueId: issue.id,
          oldDate: issue.deadline,
          newDate: circlePlan.dueBy,
        });
      }
    }
  }

  return NextResponse.json({
    autoCompleted,
    newTasks: newTasks.map((p) => ({
      slug: p.slug,
      name: p.name,
      circle: p.circle,
      estimatedHours: p.estimatedHours,
    })),
    deadlineShifts,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { epicId, applyAutoComplete, newTaskSlugs, applyDeadlineShifts } = body;

  const epic = db.select().from(goals).where(eq(goals.id, epicId)).all()[0];
  if (!epic) {
    return NextResponse.json({ error: "Epic not found" }, { status: 404 });
  }

  const descendants = findAllDescendants(epicId);
  let updatedCount = 0;

  if (applyAutoComplete) {
    const completedSlugs = getCompletedSlugs();
    const completedSet = new Set(completedSlugs);
    for (const task of descendants) {
      if (task.ftSlug && task.status !== "completed" && completedSet.has(task.ftSlug)) {
        db.update(goals)
          .set({ status: "completed", currentValue: 1 })
          .where(eq(goals.id, task.id))
          .run();
        updatedCount++;
      }
    }
    recomputeChain(epicId);
  }

  if (newTaskSlugs && newTaskSlugs.length > 0) {
    const issues = descendants.filter((g) => g.parentGoalId === epicId);
    for (const slug of newTaskSlugs) {
      const project = FT_COMMON_CORE.find((p) => p.slug === slug);
      if (!project) continue;
      const issue = issues.find((i) => i.title.includes(`Circle ${project.circle}`));
      if (!issue) continue;
      const existingTasks = descendants.filter((g) => g.parentGoalId === issue.id);
      db.insert(goals)
        .values({
          title: project.name,
          category: "42",
          goalType: "cumulative",
          targetValue: 1,
          currentValue: 0,
          ftSlug: project.slug,
          parentGoalId: issue.id,
          sortOrder: existingTasks.length,
        })
        .run();
      updatedCount++;
    }
  }

  if (applyDeadlineShifts) {
    const completedSlugs = getCompletedSlugs();
    const deadline = getMainDeadline();
    const targetDate = deadline?.targetDate ?? epic.deadline;
    if (targetDate) {
      const plan = computeBackwardPlan(targetDate, completedSlugs);
      const issues = descendants.filter((g) => g.parentGoalId === epicId);
      for (const issue of issues) {
        const circleMatch = issue.title.match(/Circle (\d+)/);
        if (!circleMatch) continue;
        const circle = parseInt(circleMatch[1]);
        const circlePlan = plan.circlePlans.find((c) => c.circle === circle);
        if (circlePlan && issue.deadline !== circlePlan.dueBy) {
          db.update(goals)
            .set({ deadline: circlePlan.dueBy })
            .where(eq(goals.id, issue.id))
            .run();
          updatedCount++;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, updatedCount });
}

function recomputeChain(goalId: number) {
  const children = db.select().from(goals).where(eq(goals.parentGoalId, goalId)).all();
  const completed = children.filter((c) => c.status === "completed").length;
  db.update(goals).set({ currentValue: completed }).where(eq(goals.id, goalId)).run();
  for (const child of children) {
    const grandchildren = db.select().from(goals).where(eq(goals.parentGoalId, child.id)).all();
    if (grandchildren.length > 0) {
      const gCompleted = grandchildren.filter((c) => c.status === "completed").length;
      db.update(goals).set({ currentValue: gCompleted }).where(eq(goals.id, child.id)).run();
    }
  }
}
