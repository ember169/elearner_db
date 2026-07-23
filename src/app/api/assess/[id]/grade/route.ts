import { db } from "@/lib/db";
import { assessments, assessmentQuestions, competencyValidations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { scoreToLevel } from "@/lib/assess/grader";
import { assessLog } from "@/lib/assess/log";
import { gradeQuestionInBackground } from "@/lib/assess/grade-question";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function gradeInBackground(assessmentId: number) {
  const assessment = db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .get();

  if (!assessment) return;

  assessLog("info", `Finalizing grading for assessment #${assessmentId} (${assessment.competencyId})`);

  // Enqueue any ungraded questions through the serial queue
  const questions = db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, assessmentId))
    .all();

  for (const q of questions) {
    if (!q.scoreJson && q.studentAnswer) {
      gradeQuestionInBackground(q.id);
    }
  }

  // Wait for all questions to be graded (poll up to 10 minutes)
  const deadline = Date.now() + 600_000;
  while (Date.now() < deadline) {
    const fresh = db
      .select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.assessmentId, assessmentId))
      .all();
    if (fresh.every((q) => q.scoreJson || !q.studentAnswer)) break;
    await sleep(5000);
  }

  // Collect final results
  const final = db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, assessmentId))
    .all();

  const allGaps: string[] = [];
  const errors: string[] = [];
  let totalScore = 0;
  let totalMax = 0;
  let gradedCount = 0;

  for (const q of final) {
    if (q.scoreJson) {
      try {
        const result = JSON.parse(q.scoreJson);
        totalScore += result.totalScore ?? 0;
        totalMax += result.maxScore ?? 0;
        gradedCount++;
        if (result.identifiedGaps) allGaps.push(...result.identifiedGaps);
      } catch {}
    } else if (q.studentAnswer) {
      errors.push(`Q${q.id}: not graded`);
    }
  }

  if (gradedCount === 0) {
    assessLog("error", `Assessment #${assessmentId} grading failed — no questions graded`);
    db.update(assessments)
      .set({
        status: "grading_failed",
        gapsJson: JSON.stringify(errors),
        completedAt: new Date().toISOString(),
      })
      .where(eq(assessments.id, assessmentId))
      .run();
    return;
  }

  const overallPercent = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
  const validatedLevel = scoreToLevel(overallPercent, assessment.activityLevel);
  const uniqueGaps = [...new Set(allGaps)];

  assessLog("info", `Assessment #${assessmentId} completed: ${Math.round(overallPercent)}% — validated level ${validatedLevel}/${assessment.activityLevel} (${gradedCount}/${questions.length} graded)`);

  db.update(assessments)
    .set({
      status: "completed",
      overallScore: Math.round(overallPercent * 10) / 10,
      validatedLevel,
      gapsJson: JSON.stringify(uniqueGaps),
      completedAt: new Date().toISOString(),
    })
    .where(eq(assessments.id, assessmentId))
    .run();

  const existing = db
    .select()
    .from(competencyValidations)
    .where(eq(competencyValidations.competencyId, assessment.competencyId))
    .get();

  let persistentGaps: string[] = uniqueGaps;
  if (existing?.persistentGapsJson) {
    try {
      const prev = JSON.parse(existing.persistentGapsJson) as string[];
      const still = prev.filter((g) => uniqueGaps.includes(g));
      persistentGaps = [...still, ...uniqueGaps.filter((g) => !still.includes(g))];
    } catch {}
  }

  if (existing) {
    db.update(competencyValidations)
      .set({
        validatedLevel,
        assessmentId,
        persistentGapsJson: JSON.stringify(persistentGaps),
        validatedAt: new Date().toISOString(),
      })
      .where(eq(competencyValidations.competencyId, assessment.competencyId))
      .run();
  } else {
    db.insert(competencyValidations)
      .values({
        competencyId: assessment.competencyId,
        validatedLevel,
        assessmentId,
        persistentGapsJson: JSON.stringify(persistentGaps),
      })
      .run();
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const assessmentId = parseInt(id, 10);

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
    .all();

  const unanswered = questions.filter((q) => !q.studentAnswer);
  if (unanswered.length > 0) {
    return NextResponse.json(
      { error: `${unanswered.length} question(s) not yet answered` },
      { status: 400 },
    );
  }

  // Set status to grading and return immediately
  db.update(assessments)
    .set({ status: "grading" })
    .where(eq(assessments.id, assessmentId))
    .run();

  // Fire and forget — grading happens in the background
  gradeInBackground(assessmentId).catch((err) => {
    assessLog("error", `Background grading crashed: ${err}`);
    db.update(assessments)
      .set({
        status: "grading_failed",
        gapsJson: JSON.stringify([String(err)]),
        completedAt: new Date().toISOString(),
      })
      .where(eq(assessments.id, assessmentId))
      .run();
  });

  return NextResponse.json({ assessmentId, status: "grading" });
}
