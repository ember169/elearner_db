import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { manualProjectCompletions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { slug: string; completed: boolean };
  const { slug, completed } = body;

  if (!slug || typeof completed !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (completed) {
    db.insert(manualProjectCompletions)
      .values({ slug })
      .onConflictDoNothing()
      .run();
  } else {
    db.delete(manualProjectCompletions)
      .where(eq(manualProjectCompletions.slug, slug))
      .run();
  }

  const rows = db.select().from(manualProjectCompletions).all();
  return NextResponse.json({ slugs: rows.map((r) => r.slug) });
}

export async function GET() {
  const rows = db.select().from(manualProjectCompletions).all();
  return NextResponse.json({ slugs: rows.map((r) => r.slug) });
}
