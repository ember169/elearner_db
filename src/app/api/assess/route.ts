import { db } from "@/lib/db";
import { assessments, assessmentQuestions } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { generateAssessment } from "@/lib/assess/generator";
import { readAssessLlmConfig } from "@/lib/assess/llm";
import { assessLog } from "@/lib/assess/log";
import { getCompetency } from "@/lib/mentor/competency-map";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { runGuidanceEngine } from "@/lib/guidance/engine";

export async function GET() {
  const rows = db
    .select()
    .from(assessments)
    .orderBy(desc(assessments.createdAt))
    .all();
  return NextResponse.json({ assessments: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const competencyId = body.competencyId as string;
  const triggerType = (body.triggerType as string) ?? "manual";

  const competency = getCompetency(competencyId);
  if (!competency) {
    return NextResponse.json({ error: "Unknown competency" }, { status: 400 });
  }

  const guidance = runGuidanceEngine();
  const signals = computeCompetencySignals(guidance.snapshot, guidance.ftProgress);
  const activityLevel = signals[competencyId]?.autoLevel ?? 1;

  // Check for previous assessments (for retake logic)
  const previous = db
    .select()
    .from(assessments)
    .where(eq(assessments.competencyId, competencyId))
    .orderBy(desc(assessments.createdAt))
    .limit(1)
    .all()[0];

  const attemptNumber = previous ? (previous.attemptNumber ?? 0) + 1 : 1;

  // Get exclude hashes and focus gaps from previous assessment
  const excludeHashes: string[] = [];
  const focusGaps: string[] = [];
  if (previous) {
    const prevQuestions = db
      .select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.assessmentId, previous.id))
      .all();
    for (const q of prevQuestions) {
      if (q.questionHash) excludeHashes.push(q.questionHash);
    }
    if (previous.gapsJson) {
      try {
        const gaps = JSON.parse(previous.gapsJson) as string[];
        focusGaps.push(...gaps);
      } catch {}
    }
  }

  // Create assessment record in "generating" status
  const inserted = db
    .insert(assessments)
    .values({
      competencyId,
      status: "generating",
      triggerType,
      activityLevel,
      attemptNumber,
      previousAssessmentId: previous?.id ?? null,
    })
    .returning()
    .get();

  const assessmentId = inserted.id;

  // Generate questions (async — don't await in the response for background generation)
  const config = readAssessLlmConfig();
  generateAssessment(competencyId, competency.description, activityLevel, {
    excludeHashes,
    focusGaps,
    pinDifficulty: body.pinDifficulty ?? undefined,
    config,
  })
    .then((result) => {
      for (const q of result.questions) {
        db.insert(assessmentQuestions)
          .values({ assessmentId, ...q })
          .run();
      }
      db.update(assessments)
        .set({ status: "ready", questionCount: result.questions.length })
        .where(eq(assessments.id, assessmentId))
        .run();
    })
    .catch((err) => {
      assessLog("error", `Generation failed for ${competencyId}: ${err}`);
      db.update(assessments)
        .set({ status: "pending" })
        .where(eq(assessments.id, assessmentId))
        .run();
    });

  return NextResponse.json({ assessmentId, status: "generating" });
}
