import { NextRequest, NextResponse } from "next/server";
import {
  listResources,
  getResource,
  updateResourceStatus,
  type ResourceFilters,
} from "@/lib/learn/store";
import { addBoardItem, loadBoard } from "@/lib/board/store";

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

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.action === "start") {
    const id = Number(body.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const resource = getResource(id);
    if (!resource) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Starting a resource that was never touched moves it to in_progress. An
    // already-completed one keeps its status — re-opening it to reread should
    // not undo the completion.
    if (resource.status === "not_started") {
      updateResourceStatus(id, "in_progress");
    }

    // The board has no link back to a resource, so dedupe on title: a second
    // "Start learning" must not stack another card on the board. A finished
    // card does not block a fresh one — that is a deliberate retry.
    const existing = loadBoard().items.find(
      (item) => item.title === resource.title && item.boardStatus !== "done"
    );

    const boardItem =
      existing ??
      addBoardItem({
        title: resource.title,
        // categoryFromType() reads the platform off `type`, matching how
        // populateBacklog() files synced recommendations.
        type: resource.platform,
        why: `Started from Learn${resource.difficulty ? ` · ${resource.difficulty}` : ""}`,
        estimatedHours: resource.estimatedHours ?? undefined,
        boardStatus: "todo",
      });

    return NextResponse.json({
      resource: getResource(id),
      boardItem,
      createdBoardItem: !existing,
    });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
