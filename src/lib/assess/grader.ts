import { callAssessLlm, parseJsonFromLlm } from "./llm";
import type { Rubric, GradingResult, AssessLlmConfig } from "./types";

const GRADING_SYSTEM = `You are an automated exam grader for a cybersecurity student. You evaluate answers against a structured rubric.

For each criterion in the rubric, decide if the student's answer meets it. Award full points if met, 0 if not.
Be strict but fair: the answer must demonstrate understanding, not just contain keywords.

Respond with ONLY a JSON object (no markdown fences), matching this schema:
{
  "criteriaScores": [{ "id": "criterion_id", "awarded": <points or 0>, "rationale": "<1 sentence>" }],
  "totalScore": <sum of awarded>,
  "maxScore": <rubric maxScore>,
  "identifiedGaps": ["<gap description from rubric gaps array, only for missed criteria>"],
  "feedback": "<2-3 sentences of constructive feedback>"
}`;

export async function gradeAnswer(
  questionText: string,
  rubric: Rubric,
  studentAnswer: string,
  config?: AssessLlmConfig,
): Promise<GradingResult> {
  const userPrompt = `## Question
${questionText}

## Rubric
${JSON.stringify(rubric, null, 2)}

## Student Answer
${studentAnswer}

Grade this answer against each rubric criterion. Return ONLY the JSON object.`;

  const raw = await callAssessLlm(GRADING_SYSTEM, userPrompt, config);
  return parseJsonFromLlm<GradingResult>(raw);
}

export function scoreToLevel(overallPercent: number, activityLevel: number): number {
  if (overallPercent >= 83) return activityLevel;
  if (overallPercent >= 60) return Math.max(activityLevel - 1, 0);
  return Math.max(activityLevel - 2, 0);
}
