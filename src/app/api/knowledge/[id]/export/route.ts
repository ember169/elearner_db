import { NextRequest, NextResponse } from "next/server";
import { getArticle } from "@/lib/knowledge/store";
import { getCompetency } from "@/lib/mentor/competency-map";
import {
  articleToMarkdown,
  articleToPrintHtml,
  articleToSlidesHtml,
  type ExportFormat,
} from "@/lib/knowledge/export";

const FORMATS: ExportFormat[] = ["md", "slides", "pdf"];

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "article"
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await params;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const format = (request.nextUrl.searchParams.get("format") ??
    "md") as ExportFormat;
  if (!FORMATS.includes(format)) {
    return NextResponse.json(
      { error: `format must be one of: ${FORMATS.join(", ")}` },
      { status: 400 },
    );
  }

  const article = getArticle(id);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const label = getCompetency(article.competencyId)?.label ?? article.competencyId;
  const slug = slugify(article.title);

  if (format === "md") {
    return new NextResponse(articleToMarkdown(article, label), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}.md"`,
      },
    });
  }

  if (format === "slides") {
    return new NextResponse(articleToSlidesHtml(article, label), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}-slides.html"`,
      },
    });
  }

  // Served inline rather than downloaded: the page calls window.print() on
  // load, so the browser's own engine produces the PDF.
  return new NextResponse(articleToPrintHtml(article, label), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
