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
type ExamSource = { name: string; url: string; match: string };
const SOURCES = examData._sources as ExamSource[];

/** Only the sources an exam's exercises actually come from, matched on the
 *  exercise sourcePath prefix — so exam04 (microshell, llefranc) does not cite
 *  the terminal-42s repo, and vice versa. */
export function examSources(ref: string | null | undefined): { name: string; url: string }[] {
  const paths = examExercises(ref).map((e) => e.sourcePath);
  return SOURCES.filter((src) => paths.some((p) => p.startsWith(src.match)))
    .map(({ name, url }) => ({ name, url }));
}

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

/**
 * What an exercise tests, derived from its allowed functions. The subject names
 * the task; the allowed set reveals the mechanisms — an exercise that permits
 * fork/execve is testing process control whether or not the prose says so.
 */
const CONCEPT_GROUPS: { concept: string; fns: string[] }[] = [
  { concept: "processes", fns: ["fork", "execve", "execvp", "wait", "waitpid", "exit"] },
  { concept: "pipes & fds", fns: ["pipe", "dup", "dup2", "close"] },
  { concept: "signals", fns: ["signal", "kill", "sigaction"] },
  { concept: "memory", fns: ["malloc", "free", "calloc", "realloc"] },
  { concept: "file I/O", fns: ["open", "read", "write", "opendir", "readdir"] },
  { concept: "strings", fns: ["strcmp", "strncmp", "strlen", "strdup", "strcpy"] },
  { concept: "filesystem", fns: ["chdir", "getcwd", "stat", "access"] },
];

export function examTestedConcepts(allowedFunctions: string | null): string[] {
  if (!allowedFunctions) return [];
  const fns = new Set(
    allowedFunctions.toLowerCase().split(/[,\s]+/).map((f) => f.trim()).filter(Boolean),
  );
  return CONCEPT_GROUPS.filter((g) => g.fns.some((f) => fns.has(f))).map(
    (g) => g.concept,
  );
}
