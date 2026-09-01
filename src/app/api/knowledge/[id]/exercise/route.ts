import { NextRequest, NextResponse } from "next/server";
import { recordExerciseAttempt } from "@/lib/knowledge/exercise-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await params; // article id is implied by the exercise; not needed here
  const body = await req.json().catch(() => null);
  const exerciseId = Number(body?.exerciseId);
  const selectedIndex = Number(body?.selectedIndex);

  if (!Number.isInteger(exerciseId) || !Number.isInteger(selectedIndex)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = recordExerciseAttempt(exerciseId, selectedIndex);
  if (!result) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
