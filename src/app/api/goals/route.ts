import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  db.insert(goals)
    .values({
      title: body.title,
      description: body.description || null,
      category: body.category || "general",
      targetValue: body.targetValue || null,
      deadline: body.deadline || null,
      metricSource: body.metricSource || null,
    })
    .run();
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.currentValue !== undefined) updates.currentValue = body.currentValue;
  if (body.title !== undefined) updates.title = body.title;

  db.update(goals).set(updates).where(eq(goals.id, body.id)).run();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  db.delete(goals).where(eq(goals.id, body.id)).run();
  return NextResponse.json({ ok: true });
}
