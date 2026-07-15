import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  let row = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (!row) {
    db.insert(settings).values({ id: 1 }).run();
    row = db.select().from(settings).where(eq(settings.id, 1)).get()!;
  }
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const existing = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (!existing) {
    db.insert(settings).values({ id: 1, ...body }).run();
  } else {
    db.update(settings).set(body).where(eq(settings.id, 1)).run();
  }
  return NextResponse.json({ ok: true });
}
