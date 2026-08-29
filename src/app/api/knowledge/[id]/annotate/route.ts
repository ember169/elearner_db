import { NextRequest, NextResponse } from "next/server";
import {
  getArticle,
  addAnnotation,
  updateAnnotation,
} from "@/lib/knowledge/store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await params;
  const articleId = parseInt(raw, 10);
  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const article = getArticle(articleId);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();

  // Editing an existing note.
  if (body.annotationId != null) {
    const id = Number(body.annotationId);
    const owned = article.sections.some((s) =>
      s.annotations.some((a) => a.id === id),
    );
    if (!owned) {
      return NextResponse.json(
        { error: "Annotation does not belong to this article" },
        { status: 404 },
      );
    }
    updateAnnotation(id, String(body.noteText ?? ""));
    return NextResponse.json({ article: getArticle(articleId) });
  }

  const sectionId = Number(body.sectionId);
  const highlightText = String(body.highlightText ?? "");
  if (!article.sections.some((s) => s.id === sectionId)) {
    return NextResponse.json(
      { error: "Section does not belong to this article" },
      { status: 400 },
    );
  }
  if (!highlightText.trim()) {
    return NextResponse.json(
      { error: "highlightText required" },
      { status: 400 },
    );
  }

  addAnnotation({
    sectionId,
    startOffset: Number(body.startOffset ?? 0),
    endOffset: Number(body.endOffset ?? highlightText.length),
    highlightText,
    noteText: body.noteText ? String(body.noteText) : undefined,
  });

  return NextResponse.json({ article: getArticle(articleId) });
}
