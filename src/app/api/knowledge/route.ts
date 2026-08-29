import { NextRequest, NextResponse } from "next/server";
import { listArticles } from "@/lib/knowledge/store";

export async function GET(request: NextRequest) {
  const competencyId = request.nextUrl.searchParams.get("competencyId");
  const articles = listArticles(competencyId ?? undefined);
  return NextResponse.json({ articles });
}
