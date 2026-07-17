import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function recomputeParentValues(parentId: number) {
  const children = db.select().from(goals).where(eq(goals.parentGoalId, parentId)).all();
  const completed = children.filter((c) => c.status === "completed").length;
  db.update(goals)
    .set({ currentValue: completed })
    .where(eq(goals.id, parentId))
    .run();

  if (children.length > 0 && completed === children.length) {
    db.update(goals).set({ status: "completed" }).where(eq(goals.id, parentId)).run();
    const parent = db.select().from(goals).where(eq(goals.id, parentId)).all()[0];
    if (parent?.parentGoalId) recomputeParentValues(parent.parentGoalId);
  }
}

function validateParentChain(goalId: number | null, proposedParentId: number): { valid: boolean; error?: string } {
  let currentId = proposedParentId;
  let depth = 1;
  for (; depth <= 3; depth++) {
    if (currentId === goalId) return { valid: false, error: "Circular reference detected" };
    const rows = db.select().from(goals).where(eq(goals.id, currentId)).all();
    const parentId = rows[0]?.parentGoalId as number | null;
    if (!parentId) break;
    currentId = parentId;
  }
  if (depth > 3) return { valid: false, error: "Max nesting depth is 3 levels" };
  return { valid: true };
}

function orphanChildren(goalId: number) {
  db.update(goals)
    .set({ parentGoalId: null })
    .where(eq(goals.parentGoalId, goalId))
    .run();
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

  if (body.parentGoalId) {
    const validation = validateParentChain(null, body.parentGoalId);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
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
      parentGoalId: body.parentGoalId ?? null,
      sortOrder: body.sortOrder ?? 0,
      ftSlug: body.ftSlug || null,
      estimatedHours: body.estimatedHours ?? null,
      originalTarget: body.originalTarget ?? null,
    })
    .run();

  if (body.parentGoalId) {
    recomputeParentValues(body.parentGoalId);
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  if (body.parentGoalId !== undefined && body.parentGoalId !== null) {
    const validation = validateParentChain(body.id, body.parentGoalId);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
  }

  const oldGoal = db.select().from(goals).where(eq(goals.id, body.id)).all()[0];

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
  if (body.parentGoalId !== undefined) updates.parentGoalId = body.parentGoalId;
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
  if (body.ftSlug !== undefined) updates.ftSlug = body.ftSlug;
  if (body.estimatedHours !== undefined) updates.estimatedHours = body.estimatedHours;
  if (body.originalTarget !== undefined) updates.originalTarget = body.originalTarget;
  if (body.customFields !== undefined) updates.customFields = body.customFields;

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

  if (body.parentGoalId !== undefined && oldGoal?.parentGoalId && oldGoal.parentGoalId !== body.parentGoalId) {
    recomputeParentValues(oldGoal.parentGoalId);
  }
  if (body.parentGoalId) {
    recomputeParentValues(body.parentGoalId);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();

  const goal = db.select().from(goals).where(eq(goals.id, body.id)).all()[0];

  if (body.orphan) {
    orphanChildren(body.id);
  } else {
    deleteDescendants(body.id);
  }

  db.delete(goals).where(eq(goals.id, body.id)).run();

  if (goal?.parentGoalId) {
    recomputeParentValues(goal.parentGoalId);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const allGoals = db.select().from(goals).all();
  return NextResponse.json({ goals: allGoals });
}
