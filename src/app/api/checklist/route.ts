import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  db.insert(tasks)
    .values({
      title: body.title,
      description: body.description || null,
      category: body.category || "general",
      dueDate: body.dueDate || null,
      isRecurring: body.isRecurring || false,
      recurrencePattern: body.recurrencePattern || null,
    })
    .run();
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  db.update(tasks)
    .set({
      isCompleted: body.isCompleted,
      completedAt: body.isCompleted ? new Date().toISOString() : null,
    })
    .where(eq(tasks.id, body.id))
    .run();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  db.delete(tasks).where(eq(tasks.id, body.id)).run();
  return NextResponse.json({ ok: true });
}
