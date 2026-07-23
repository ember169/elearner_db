import { db } from "@/lib/db";
import { assessmentQuestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { gradeAnswer } from "./grader";
import { readAssessLlmConfig } from "./llm";
import { assessLog } from "./log";
import type { Rubric } from "./types";

// Serial queue — only one LLM grading call at a time
const queue: (() => Promise<void>)[] = [];
let running = false;

async function drain() {
  if (running) return;
  running = true;
  while (queue.length > 0) {
    const job = queue.shift()!;
    await job();
  }
  running = false;
}

function enqueue(job: () => Promise<void>) {
  queue.push(job);
  drain();
}

export function gradeQuestionInBackground(questionId: number) {
  enqueue(async () => {
    const q = db
      .select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.id, questionId))
      .get();

    if (!q || !q.studentAnswer || q.scoreJson) return;

    const config = readAssessLlmConfig();
    try {
      const result = await gradeAnswer(
        q.questionText,
        JSON.parse(q.rubricJson) as Rubric,
        q.studentAnswer,
        config,
      );
      db.update(assessmentQuestions)
        .set({
          scoreJson: JSON.stringify(result),
          score: (result.totalScore / result.maxScore) * 100,
          gradedAt: new Date().toISOString(),
        })
        .where(eq(assessmentQuestions.id, questionId))
        .run();
      assessLog("info", `Q${questionId} graded: ${result.totalScore}/${result.maxScore}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      assessLog("error", `Q${questionId} grading failed: ${msg}`);
    }
  });
}

export function gradeQueueSize(): number {
  return queue.length + (running ? 1 : 0);
}
