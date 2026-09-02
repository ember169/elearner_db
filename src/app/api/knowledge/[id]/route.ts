import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeArticles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getArticle } from "@/lib/knowledge/store";
import { listExercisesForArticle } from "@/lib/knowledge/exercise-store";

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

  const exercises = listExercisesForArticle(id);

  return NextResponse.json({ article: { ...article, exercises } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await params;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = (await req.json()) as { read?: boolean };
  const readAt = body.read ? sql`datetime('now')` : null;

  db.update(knowledgeArticles)
    .set({ readAt })
    .where(eq(knowledgeArticles.id, id))
    .run();

  const row = db
    .select({ readAt: knowledgeArticles.readAt })
    .from(knowledgeArticles)
    .where(eq(knowledgeArticles.id, id))
    .get();

  return NextResponse.json({ id, isRead: row?.readAt != null });
}
