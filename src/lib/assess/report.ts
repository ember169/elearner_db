import type { GradingResult } from "./types";

type ReportQuestion = {
  questionType: string;
  difficulty: number;
  questionText: string;
  studentAnswer: string | null;
  scoreJson: string | null;
  score: number | null;
  difficultyFlag: string | null;
  sortOrder: number;
};

type ReportAssessment = {
  competencyId: string;
  competencyLabel: string;
  overallScore: number | null;
  validatedLevel: number | null;
  activityLevel: number;
  attemptNumber: number;
  completedAt: string | null;
  questions: ReportQuestion[];
  gapsJson: string | null;
};

export function buildMarkdownReport(a: ReportAssessment): string {
  const date = a.completedAt
    ? new Date(a.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "In progress";

  const pct = a.overallScore != null ? `${Math.round(a.overallScore)}%` : "N/A";
  const level = a.validatedLevel != null ? `${a.validatedLevel}/5` : "N/A";

  const lines: string[] = [
    `# Assessment Report: ${a.competencyLabel} (${a.competencyId})`,
    `Date: ${date} | Score: ${pct} | Validated Level: ${level} | Attempt: #${a.attemptNumber}`,
    "",
  ];

  const sorted = [...a.questions].sort((x, y) => x.sortOrder - y.sortOrder);
  for (let i = 0; i < sorted.length; i++) {
    const q = sorted[i];
    const typeLabel = q.questionType.replace(/_/g, "-");
    lines.push(`## Question ${i + 1} — ${typeLabel} (Difficulty: ${q.difficulty})`);
    if (q.difficultyFlag) {
      lines.push(`*Flagged as: ${q.difficultyFlag.replace(/_/g, " ")}*`);
    }
    lines.push(q.questionText);
    lines.push("");
    lines.push("### My Answer");
    lines.push(q.studentAnswer ?? "*No answer submitted*");
    lines.push("");

    if (q.scoreJson) {
      let grading: GradingResult;
      try {
        grading = JSON.parse(q.scoreJson);
      } catch {
        lines.push(`### Grading\nScore: ${q.score ?? "?"}\n(Raw data could not be parsed)\n`);
        continue;
      }

      lines.push("### Grading");
      const met = grading.criteriaScores.filter((c) => c.awarded > 0).length;
      const total = grading.criteriaScores.length;
      lines.push(`Score: ${grading.totalScore}/${grading.maxScore} | Criteria met: ${met}/${total}`);

      for (const cs of grading.criteriaScores) {
        const icon = cs.awarded > 0 ? "✓" : "✗";
        const maxForCriterion = grading.maxScore; // individual max isn't stored, use rationale
        lines.push(`- ${icon} ${cs.id} (${cs.awarded}): "${cs.rationale}"`);
      }

      if (grading.identifiedGaps.length > 0) {
        lines.push("");
        lines.push("### Gaps Identified");
        for (const gap of grading.identifiedGaps) {
          lines.push(`- ${gap}`);
        }
      }

      if (grading.feedback) {
        lines.push("");
        lines.push(`### Feedback`);
        lines.push(grading.feedback);
      }
    } else {
      lines.push("### Grading\n*Not yet graded*");
    }
    lines.push("");
  }

  // Summary
  if (a.gapsJson) {
    try {
      const gaps = JSON.parse(a.gapsJson) as string[];
      if (gaps.length > 0) {
        lines.push("## Summary");
        lines.push(`Overall: ${pct} | Gaps: ${gaps.join(", ")}`);
      }
    } catch {}
  }

  return lines.join("\n");
}
