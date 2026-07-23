import { db } from "@/lib/db";
import { assessments, assessmentQuestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { gradeQuestionInBackground } from "@/lib/assess/grade-question";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const assessmentId = parseInt(id, 10);
  const body = await req.json();
  const { questionId, answer, difficultyFlag } = body;

  if (!questionId || !answer) {
    return NextResponse.json({ error: "questionId and answer required" }, { status: 400 });
  }

  const question = db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.id, questionId))
    .get();

  if (!question || question.assessmentId !== assessmentId) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  db.update(assessmentQuestions)
    .set({
      studentAnswer: answer,
      difficultyFlag: difficultyFlag ?? null,
      answeredAt: new Date().toISOString(),
    })
    .where(eq(assessmentQuestions.id, questionId))
    .run();

  // Start grading this question immediately in the background
  gradeQuestionInBackground(questionId);

  // Update assessment status to in_progress if not already
  const assessment = db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .get();

  if (assessment && assessment.status === "ready") {
    db.update(assessments)
      .set({ status: "in_progress", startedAt: new Date().toISOString() })
      .where(eq(assessments.id, assessmentId))
      .run();
  }

  return NextResponse.json({ ok: true });
}
