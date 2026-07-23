import { callAssessLlm, parseJsonFromLlm } from "./llm";
import { assessLog } from "./log";
import type { QuestionTemplate, Rubric, AssessLlmConfig } from "./types";
import { TEMPLATES } from "./rubric-templates";
import { createHash } from "crypto";

function hashQuestion(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function pickAnchors(
  competencyId: string,
  count: number,
  excludeHashes: string[],
  focusGaps: string[],
  targetDifficulty?: number,
): QuestionTemplate[] {
  let pool = TEMPLATES.filter((t) => t.competencyId === competencyId);
  if (excludeHashes.length > 0) {
    const excluded = new Set(excludeHashes);
    pool = pool.filter((t) => !excluded.has(hashQuestion(t.questionText)));
  }
  if (targetDifficulty) {
    const nearby = pool.filter((t) => Math.abs(t.difficulty - targetDifficulty) <= 1);
    if (nearby.length >= count) pool = nearby;
  }

  // Weight toward focus gaps if any
  if (focusGaps.length > 0) {
    const gapSet = new Set(focusGaps.map((g) => g.toLowerCase()));
    const gapPool = pool.filter((t) => gapSet.has(t.subTopic.toLowerCase()));
    if (gapPool.length > 0) {
      const gapPick = gapPool[Math.floor(Math.random() * gapPool.length)];
      pool = pool.filter((t) => t !== gapPick);
      const rest = shuffleAndPick(pool, count - 1);
      return [gapPick, ...rest];
    }
  }

  return shuffleAndPick(pool, count);
}

function shuffleAndPick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const GENERATION_SYSTEM = `You are a cybersecurity exam question generator. Create questions that test understanding, not memorization.

Respond with ONLY a JSON object (no markdown fences):
{
  "questionText": "<the full question with code if applicable>",
  "questionType": "<predict_output|spot_vuln|trace_explain|fix_code|design_solution|compare_contrast>",
  "difficulty": <1-5>,
  "rubric": {
    "maxScore": <6-10>,
    "criteria": [{ "id": "<snake_case>", "description": "<what to check>", "points": <1-3>, "keywords": ["<evidence words>"], "check": "<grading instruction>" }],
    "gaps": [{ "if_missing": "<criterion id>", "gap": "<knowledge gap description>" }]
  }
}`;

type GeneratedQuestion = {
  questionText: string;
  questionType: string;
  difficulty: number;
  rubric: Rubric;
};

async function generateLlmQuestion(
  competencyId: string,
  competencyDescription: string,
  anchorExamples: QuestionTemplate[],
  targetDifficulty: number,
  focusGaps: string[],
  config?: AssessLlmConfig,
): Promise<GeneratedQuestion> {
  const examples = anchorExamples
    .slice(0, 2)
    .map((a, i) => `Example ${i + 1} (${a.questionType}, difficulty ${a.difficulty}):\n${a.questionText.slice(0, 400)}`)
    .join("\n\n");

  const gapHint = focusGaps.length > 0
    ? `\nFocus on these identified weak areas: ${focusGaps.join(", ")}`
    : "";

  const userPrompt = `Generate a NEW cybersecurity exam question for the "${competencyId}" competency.
Description: ${competencyDescription}
Target difficulty: ${targetDifficulty}/5${gapHint}

Here are example questions for reference (create something DIFFERENT):
${examples}

The question must:
- Require free-text reasoning (not multiple choice)
- Include code snippets if applicable
- Be at difficulty ${targetDifficulty}
- Have a rubric with 3-4 criteria and corresponding gaps`;

  const raw = await callAssessLlm(GENERATION_SYSTEM, userPrompt, config);
  return parseJsonFromLlm<GeneratedQuestion>(raw);
}

export type GeneratedAssessment = {
  questions: {
    questionType: string;
    difficulty: number;
    questionText: string;
    rubricJson: string;
    questionHash: string;
    sortOrder: number;
  }[];
};

export async function generateAssessment(
  competencyId: string,
  competencyDescription: string,
  activityLevel: number,
  opts: {
    excludeHashes?: string[];
    focusGaps?: string[];
    pinDifficulty?: number;
    config?: AssessLlmConfig;
  } = {},
): Promise<GeneratedAssessment> {
  const excludeHashes = opts.excludeHashes ?? [];
  const focusGaps = opts.focusGaps ?? [];
  const targetDifficulty = opts.pinDifficulty ?? Math.min(activityLevel, 5);

  assessLog("info", `Generating assessment for ${competencyId} (level ${activityLevel}, difficulty ${targetDifficulty})`);

  // 2 anchor questions from template bank
  const anchors = pickAnchors(competencyId, 2, excludeHashes, focusGaps, targetDifficulty);

  // 3 LLM-generated questions
  const llmQuestions: GeneratedQuestion[] = [];
  for (let i = 0; i < 3; i++) {
    try {
      const q = await generateLlmQuestion(
        competencyId,
        competencyDescription,
        anchors,
        targetDifficulty + (i === 2 ? 1 : 0), // last question slightly harder
        i === 0 ? focusGaps : [],
        opts.config,
      );
      llmQuestions.push(q);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      assessLog("error", `LLM question generation ${i + 1}/3 failed: ${msg}`);
      // Fall back to an extra anchor
      const extra = pickAnchors(competencyId, 1, [
        ...excludeHashes,
        ...anchors.map((a) => hashQuestion(a.questionText)),
        ...llmQuestions.map((q) => hashQuestion(q.questionText)),
      ], focusGaps, targetDifficulty);
      if (extra[0]) {
        llmQuestions.push({
          questionText: extra[0].questionText,
          questionType: extra[0].questionType,
          difficulty: extra[0].difficulty,
          rubric: extra[0].rubric,
        });
      }
    }
  }

  const allQuestions = [
    ...anchors.map((a) => ({
      questionType: a.questionType,
      difficulty: a.difficulty,
      questionText: a.questionText,
      rubric: a.rubric,
    })),
    ...llmQuestions,
  ];

  // Shuffle order so anchors aren't always first
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }

  return {
    questions: allQuestions.map((q, i) => ({
      questionType: q.questionType,
      difficulty: q.difficulty,
      questionText: q.questionText,
      rubricJson: JSON.stringify(q.rubric),
      questionHash: hashQuestion(q.questionText),
      sortOrder: i,
    })),
  };
}
