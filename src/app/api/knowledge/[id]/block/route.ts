import { NextRequest, NextResponse } from "next/server";
import {
  getArticle,
  addUserBlock,
  updateUserBlock,
  deleteUserBlock,
} from "@/lib/knowledge/store";

const BLOCK_TYPES = ["text", "image", "table", "mermaid"];

/** An image block is a data URI held in a text column. Cap it so a dropped
 *  screenshot cannot bloat the row past what SQLite and the reader handle
 *  comfortably. */
const MAX_CONTENT_BYTES = 2 * 1024 * 1024;

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
  const action = body.action ?? "create";

  if (action === "delete") {
    const blockId = Number(body.blockId);
    if (!article.userBlocks.some((b) => b.id === blockId)) {
      return NextResponse.json(
        { error: "Block does not belong to this article" },
        { status: 404 },
      );
    }
    deleteUserBlock(blockId);
    return NextResponse.json({ article: getArticle(articleId) });
  }

  const content = String(body.content ?? "");
  if (!content.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }
  if (Buffer.byteLength(content, "utf8") > MAX_CONTENT_BYTES) {
    return NextResponse.json(
      { error: "Content exceeds the 2MB block limit" },
      { status: 413 },
    );
  }

  if (action === "update") {
    const blockId = Number(body.blockId);
    if (!article.userBlocks.some((b) => b.id === blockId)) {
      return NextResponse.json(
        { error: "Block does not belong to this article" },
        { status: 404 },
      );
    }
    updateUserBlock(blockId, content);
    return NextResponse.json({ article: getArticle(articleId) });
  }

  const blockType = String(body.blockType ?? "");
  if (!BLOCK_TYPES.includes(blockType)) {
    return NextResponse.json(
      { error: `blockType must be one of: ${BLOCK_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  const afterSectionId =
    body.afterSectionId == null ? undefined : Number(body.afterSectionId);
  if (
    afterSectionId !== undefined &&
    !article.sections.some((s) => s.id === afterSectionId)
  ) {
    return NextResponse.json(
      { error: "afterSectionId does not belong to this article" },
      { status: 400 },
    );
  }

  // Blocks sharing an anchor keep insertion order behind it.
  const siblings = article.userBlocks.filter(
    (b) => b.afterSectionId === (afterSectionId ?? null),
  );
  const sortOrder = siblings.reduce((m, b) => Math.max(m, b.sortOrder ?? 0), 0) + 1;

  addUserBlock({ articleId, afterSectionId, sortOrder, blockType, content });
  return NextResponse.json({ article: getArticle(articleId) });
}
