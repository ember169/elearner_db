import { db } from "@/lib/db";
import { assessments, assessmentQuestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { assessLog } from "@/lib/assess/log";

const STALE_GRADING_MS = 15 * 60 * 1000;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const assessmentId = parseInt(id, 10);
  if (isNaN(assessmentId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  let assessment = db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .get();

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Recover stale grading — if stuck in "grading" for over 15 minutes,
  // the background job likely died (server restart). Mark as failed so
  // the user can retry.
  if (assessment.status === "grading" && assessment.startedAt) {
    const elapsed = Date.now() - new Date(assessment.startedAt).getTime();
    if (elapsed > STALE_GRADING_MS) {
      assessLog("error", `Assessment #${assessmentId} stuck in grading for ${Math.round(elapsed / 60000)}m — marking as failed`);
      db.update(assessments)
        .set({
          status: "grading_failed",
          gapsJson: JSON.stringify(["Grading timed out — the server may have restarted. Please retry."]),
          completedAt: new Date().toISOString(),
        })
        .where(eq(assessments.id, assessmentId))
        .run();

      assessment = db
        .select()
        .from(assessments)
        .where(eq(assessments.id, assessmentId))
        .get()!;
    }
  }

  const questions = db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, assessmentId))
    .all()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return NextResponse.json({ assessment, questions });
}
