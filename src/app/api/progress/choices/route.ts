import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectChoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { FT_COMMON_CORE } from "@/lib/guidance/ft-project-tree";

export async function GET() {
  const rows = db.select().from(projectChoices).all();
  return NextResponse.json({
    choices: rows.map((r) => ({ groupName: r.groupName, chosenSlug: r.chosenSlug })),
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { groupName, chosenSlug } = body as { groupName?: string; chosenSlug?: string };

  if (!groupName || !chosenSlug) {
    return NextResponse.json({ error: "groupName and chosenSlug required" }, { status: 400 });
  }

  const member = FT_COMMON_CORE.find((p) => p.group === groupName && p.slug === chosenSlug);
  if (!member) {
    return NextResponse.json({ error: "slug does not belong to that group" }, { status: 400 });
  }

  const existing = db
    .select()
    .from(projectChoices)
    .where(eq(projectChoices.groupName, groupName))
    .all()[0];

  if (existing) {
    db.update(projectChoices)
      .set({ chosenSlug, chosenAt: new Date().toISOString() })
      .where(eq(projectChoices.groupName, groupName))
      .run();
  } else {
    db.insert(projectChoices).values({ groupName, chosenSlug }).run();
  }

  return NextResponse.json({ ok: true, groupName, chosenSlug });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { groupName } = body as { groupName?: string };

  if (!groupName) {
    return NextResponse.json({ error: "groupName required" }, { status: 400 });
  }

  db.delete(projectChoices).where(eq(projectChoices.groupName, groupName)).run();
  return NextResponse.json({ ok: true });
}
