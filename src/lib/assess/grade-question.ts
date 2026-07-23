import { db } from "@/lib/db";
import { assessmentQuestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { gradeAnswer } from "./grader";
import { readAssessLlmConfig } from "./llm";
import { assessLog } from "./log";
import type { Rubric } from "./types";

export function gradeQuestionInBackground(questionId: number) {
  const q = db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.id, questionId))
    .get();

  if (!q || !q.studentAnswer) return;

  const config = readAssessLlmConfig();

  gradeAnswer(q.questionText, JSON.parse(q.rubricJson) as Rubric, q.studentAnswer, config)
    .then((result) => {
      db.update(assessmentQuestions)
        .set({
          scoreJson: JSON.stringify(result),
          score: (result.totalScore / result.maxScore) * 100,
          gradedAt: new Date().toISOString(),
        })
        .where(eq(assessmentQuestions.id, questionId))
        .run();
      assessLog("info", `Q${questionId} graded: ${result.totalScore}/${result.maxScore}`);
    })
    .catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      assessLog("error", `Q${questionId} grading failed: ${msg}`);
    });
}
