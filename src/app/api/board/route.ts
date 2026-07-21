import { NextResponse } from "next/server";
import {
  loadBoard,
  initializeBoard,
  populateBacklog,
  updateBoardItem,
  reorderItem,
  addBoardItem,
  archiveDone,
  deleteBoardItem,
  type BoardStatus,
  type BoardCategory,
  BOARD_STATUSES,
  BOARD_CATEGORIES,
} from "@/lib/board/store";

export async function GET() {
  const board = initializeBoard();
  return NextResponse.json(board);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body as {
    id: number;
    boardStatus?: BoardStatus;
    status?: string;
    sortOrder?: number;
    goalId?: number | null;
    blockedReason?: string | null;
    description?: string | null;
  };
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const item = updateBoardItem(id, updates);
  return NextResponse.json(item);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "populate") {
    const newItems = populateBacklog(body.mentorBriefing, body.collapsedBriefing);
    return NextResponse.json({ items: newItems });
  }

  if (body.action === "add") {
    const { title, type, why, estimatedHours, priority, goalId, category, boardStatus } = body;
    if (!title || !type) {
      return NextResponse.json(
        { error: "title and type required" },
        { status: 400 }
      );
    }
    const item = addBoardItem({
      title,
      type,
      why,
      estimatedHours,
      priority,
      goalId,
      category,
      boardStatus,
    });
    return NextResponse.json(item);
  }

  if (body.action === "reorder") {
    const { id, boardStatus, category, sortOrder } = body;
    if (!id || !boardStatus || !category || sortOrder === undefined) {
      return NextResponse.json(
        { error: "id, boardStatus, category, and sortOrder required" },
        { status: 400 }
      );
    }
    reorderItem(id, boardStatus, category, sortOrder);
    const board = loadBoard();
    return NextResponse.json(board);
  }

  if (body.action === "delete") {
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    deleteBoardItem(id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "archive-done") {
    const count = archiveDone();
    return NextResponse.json({ archived: count });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
