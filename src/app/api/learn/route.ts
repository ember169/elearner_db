import { NextRequest, NextResponse } from "next/server";
import { listResources, type ResourceFilters } from "@/lib/learn/store";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const filters: ResourceFilters = {};

  const platform = sp.get("platform");
  const difficulty = sp.get("difficulty");
  const status = sp.get("status");
  const competencyId = sp.get("competencyId");
  const search = sp.get("search");

  if (platform) filters.platform = platform;
  if (difficulty) filters.difficulty = difficulty;
  if (status) filters.status = status;
  if (competencyId) filters.competencyId = competencyId;
  if (search) filters.search = search;

  const resources = listResources(filters);
  return NextResponse.json({ resources });
}
