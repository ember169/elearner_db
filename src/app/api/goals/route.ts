import { db } from "@/lib/db";
import { goals, goalGroups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function recomputeParentValues(parentId: number) {
  const children = db.select().from(goals).where(eq(goals.parentGoalId, parentId)).all();
  const total = children.length;
  const completed = children.filter((c) => c.status === "completed").length;
  db.update(goals)
    .set({ targetValue: total, currentValue: completed })
    .where(eq(goals.id, parentId))
    .run();

  if (total > 0 && completed === total) {
    db.update(goals).set({ status: "completed" }).where(eq(goals.id, parentId)).run();
    const parent = db.select().from(goals).where(eq(goals.id, parentId)).all()[0];
    if (parent?.parentGoalId) recomputeParentValues(parent.parentGoalId);
  }
}

function getDepth(goalId: number): number {
  const allGoals = db.select().from(goals).all();
  const byId = new Map(allGoals.map((g) => [g.id, g]));
  let depth = 0;
  let current = byId.get(goalId);
  while (current?.parentGoalId) {
    depth++;
    if (depth > 3) break;
    current = byId.get(current.parentGoalId);
  }
  return depth;
}

function cascadeComplete(goalId: number) {
  const children = db.select().from(goals).where(eq(goals.parentGoalId, goalId)).all();
  for (const child of children) {
    if (child.status !== "completed") {
      db.update(goals).set({ status: "completed" }).where(eq(goals.id, child.id)).run();
      cascadeComplete(child.id);
    }
  }
}

function cascadeReopen(goalId: number) {
  const goal = db.select().from(goals).where(eq(goals.id, goalId)).all()[0];
  if (!goal) return;
  if (goal.parentGoalId) {
    const parent = db.select().from(goals).where(eq(goals.id, goal.parentGoalId)).all()[0];
    if (parent?.status === "completed") {
      db.update(goals).set({ status: "active" }).where(eq(goals.id, parent.id)).run();
      cascadeReopen(parent.id);
    }
  }
}

function deleteDescendants(goalId: number) {
  const children = db.select().from(goals).where(eq(goals.parentGoalId, goalId)).all();
  for (const child of children) {
    deleteDescendants(child.id);
    db.delete(goals).where(eq(goals.id, child.id)).run();
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body._type === "group") {
    const depth = body.parentGroupId
      ? db.select().from(goalGroups).where(eq(goalGroups.id, body.parentGroupId)).all()[0]?.parentGroupId
        ? 2
        : 1
      : 0;
    if (depth >= 2) {
      return NextResponse.json({ error: "Max nesting depth is 2" }, { status: 400 });
    }
    db.insert(goalGroups)
      .values({
        title: body.title,
        operator: body.operator || "and",
        parentGroupId: body.parentGroupId || null,
      })
      .run();
    return NextResponse.json({ ok: true });
  }

  if (body.parentGoalId) {
    const parentDepth = getDepth(body.parentGoalId);
    if (parentDepth >= 2) {
      return NextResponse.json({ error: "Max nesting depth is 3 levels" }, { status: 400 });
    }
  }

  db.insert(goals)
    .values({
      title: body.title,
      description: body.description || null,
      category: body.category || "general",
      goalType: body.goalType || "cumulative",
      targetValue: body.targetValue ?? null,
      currentValue: body.currentValue ?? 0,
      cadenceValue: body.cadenceValue ?? null,
      cadenceUnit: body.cadenceUnit || null,
      deadline: body.deadline || null,
      metricSource: body.metricSource || null,
      groupId: body.groupId ?? null,
      parentGoalId: body.parentGoalId ?? null,
    })
    .run();

  if (body.parentGoalId) {
    recomputeParentValues(body.parentGoalId);
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  if (body._type === "group") {
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.operator !== undefined) updates.operator = body.operator;
    if (body.parentGroupId !== undefined) updates.parentGroupId = body.parentGroupId;
    db.update(goalGroups).set(updates).where(eq(goalGroups.id, body.id)).run();
    return NextResponse.json({ ok: true });
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.currentValue !== undefined) updates.currentValue = body.currentValue;
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.category !== undefined) updates.category = body.category;
  if (body.goalType !== undefined) updates.goalType = body.goalType;
  if (body.targetValue !== undefined) updates.targetValue = body.targetValue;
  if (body.cadenceValue !== undefined) updates.cadenceValue = body.cadenceValue;
  if (body.cadenceUnit !== undefined) updates.cadenceUnit = body.cadenceUnit;
  if (body.deadline !== undefined) updates.deadline = body.deadline;
  if (body.metricSource !== undefined) updates.metricSource = body.metricSource;
  if (body.groupId !== undefined) updates.groupId = body.groupId;
  if (body.parentGoalId !== undefined) updates.parentGoalId = body.parentGoalId;

  db.update(goals).set(updates).where(eq(goals.id, body.id)).run();

  if (body.status === "completed") {
    cascadeComplete(body.id);
    const goal = db.select().from(goals).where(eq(goals.id, body.id)).all()[0];
    if (goal?.parentGoalId) recomputeParentValues(goal.parentGoalId);
  } else if (body.status === "active") {
    const goal = db.select().from(goals).where(eq(goals.id, body.id)).all()[0];
    if (goal?.parentGoalId) {
      recomputeParentValues(goal.parentGoalId);
      cascadeReopen(body.id);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();

  if (body._type === "group") {
    db.update(goals).set({ groupId: null }).where(eq(goals.groupId, body.id)).run();
    db.update(goalGroups).set({ parentGroupId: null }).where(eq(goalGroups.parentGroupId, body.id)).run();
    db.delete(goalGroups).where(eq(goalGroups.id, body.id)).run();
    return NextResponse.json({ ok: true });
  }

  const goal = db.select().from(goals).where(eq(goals.id, body.id)).all()[0];
  deleteDescendants(body.id);
  db.delete(goals).where(eq(goals.id, body.id)).run();

  if (goal?.parentGoalId) {
    recomputeParentValues(goal.parentGoalId);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const allGoals = db.select().from(goals).all();
  const allGroups = db.select().from(goalGroups).all();
  return NextResponse.json({ goals: allGoals, groups: allGroups });
}
