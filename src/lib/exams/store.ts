import examData from "./exam-subjects.json";

/**
 * 42 exam practice subjects and reference solutions, vendored offline from
 * github.com/terminal-42s/42_examshell for study. An exam rank draws its
 * exercises from this pool, so a card for "Exam Rank 04" surfaces the possible
 * subjects rather than one canonical text.
 *
 * Subjects are 42's intellectual property; solutions are the repo authors'.
 * Held here for personal, self-hosted use — not redistribution.
 */

export type ExamExercise = {
  name: string;
  assignmentName: string;
  expectedFiles: string | null;
  allowedFunctions: string | null;
  subject: string;
  solution: string | null;
  solutionLang: string | null;
  sourcePath: string;
};

const EXAMS = examData.exams as Record<string, ExamExercise[]>;
export const EXAM_SOURCES = examData._sources as { name: string; url: string }[];

/** Board items and 42 catalogue slugs both use `examNN`; normalise either. */
function examKey(ref: string): string | null {
  const m = ref.toLowerCase().match(/exam[-_ ]?(?:rank[-_ ]?)?(\d{1,2})/);
  if (!m) return null;
  return `exam${m[1].padStart(2, "0")}`;
}

/** The exercise pool for an exam, by its ref/slug/title (`exam04`, `Exam Rank 04`). */
export function examExercises(ref: string | null | undefined): ExamExercise[] {
  if (!ref) return [];
  const key = examKey(ref);
  return key ? (EXAMS[key] ?? []) : [];
}

/** One named exercise within an exam, e.g. exam04 / "picoshell". */
export function examExercise(
  ref: string | null | undefined,
  name: string,
): ExamExercise | undefined {
  return examExercises(ref).find((e) => e.name === name);
}

export function hasExamSubjects(ref: string | null | undefined): boolean {
  return examExercises(ref).length > 0;
}
