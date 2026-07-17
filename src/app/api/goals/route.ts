import { db } from "@/lib/db";
import { goals, goalGroups } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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
    })
    .run();
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

  db.update(goals).set(updates).where(eq(goals.id, body.id)).run();
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

  db.delete(goals).where(eq(goals.id, body.id)).run();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const allGoals = db.select().from(goals).all();
  const allGroups = db.select().from(goalGroups).all();
  return NextResponse.json({ goals: allGoals, groups: allGroups });
}
