export type QuestionType =
  | "predict_output"
  | "spot_vuln"
  | "trace_explain"
  | "fix_code"
  | "design_solution"
  | "compare_contrast";

export type AssessmentStatus = "pending" | "generating" | "ready" | "in_progress" | "completed" | "abandoned";

export type DifficultyFlag = "too_easy" | "too_hard" | null;

export type RubricCriterion = {
  id: string;
  description: string;
  points: number;
  keywords: string[];
  check: string;
};

export type RubricGap = {
  if_missing: string;
  gap: string;
};

export type Rubric = {
  maxScore: number;
  criteria: RubricCriterion[];
  gaps: RubricGap[];
};

export type CriterionScore = {
  id: string;
  awarded: number;
  rationale: string;
};

export type GradingResult = {
  criteriaScores: CriterionScore[];
  totalScore: number;
  maxScore: number;
  identifiedGaps: string[];
  feedback: string;
};

export type QuestionTemplate = {
  competencyId: string;
  subTopic: string;
  questionType: QuestionType;
  difficulty: number;
  questionText: string;
  rubric: Rubric;
};

export type AssessmentQuestion = {
  id: number;
  assessmentId: number;
  questionType: QuestionType;
  difficulty: number;
  questionText: string;
  rubricJson: string;
  questionHash: string | null;
  studentAnswer: string | null;
  scoreJson: string | null;
  score: number | null;
  difficultyFlag: DifficultyFlag;
  sortOrder: number;
  answeredAt: string | null;
  gradedAt: string | null;
};

export type Assessment = {
  id: number;
  competencyId: string;
  status: AssessmentStatus;
  triggerType: string;
  activityLevel: number;
  validatedLevel: number | null;
  overallScore: number | null;
  attemptNumber: number;
  previousAssessmentId: number | null;
  questionCount: number;
  gapsJson: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type CompetencyValidation = {
  competencyId: string;
  validatedLevel: number;
  assessmentId: number | null;
  persistentGapsJson: string | null;
  validatedAt: string;
};

export type AssessLlmConfig = {
  provider: string;
  apiKey: string | null;
  model: string | null;
  baseUrl: string | null;
};
