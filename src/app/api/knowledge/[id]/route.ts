import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeArticles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getArticle } from "@/lib/knowledge/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await params;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const article = getArticle(id);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.update(knowledgeArticles)
    .set({ readAt: sql`datetime('now')` })
    .where(eq(knowledgeArticles.id, id))
    .run();

  return NextResponse.json({ article });
}
