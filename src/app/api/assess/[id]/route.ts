import { db } from "@/lib/db";
import { assessments, assessmentQuestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const assessmentId = parseInt(id, 10);
  if (isNaN(assessmentId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const assessment = db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .get();

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const questions = db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, assessmentId))
    .all()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return NextResponse.json({ assessment, questions });
}
