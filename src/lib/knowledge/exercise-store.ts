import { db } from "@/lib/db";
import {
  articleSections,
  sectionExercises,
  exerciseAttempts,
} from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";

export type ExerciseAttemptState = {
  selectedIndex: number;
  isCorrect: boolean;
};

export type ArticleExercise = {
  id: number;
  sectionId: number;
  sectionHeading: string;
  sectionSortOrder: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** The learner's most recent answer, if any. */
  attempt: ExerciseAttemptState | null;
};

/**
 * Every exercise for an article, ordered by section then within-section, each
 * carrying the learner's most recent attempt so the quiz can restore state.
 */
export function listExercisesForArticle(articleId: number): ArticleExercise[] {
  const rows = db
    .select({
      id: sectionExercises.id,
      sectionId: sectionExercises.sectionId,
      sectionHeading: articleSections.heading,
      sectionSortOrder: articleSections.sortOrder,
      sortOrder: sectionExercises.sortOrder,
      prompt: sectionExercises.prompt,
      optionsJson: sectionExercises.optionsJson,
      correctIndex: sectionExercises.correctIndex,
      explanation: sectionExercises.explanation,
    })
    .from(sectionExercises)
    .innerJoin(articleSections, eq(sectionExercises.sectionId, articleSections.id))
    .where(eq(articleSections.articleId, articleId))
    .all();

  if (rows.length === 0) return [];

  // Most-recent attempt per exercise, in one pass.
  const ids = rows.map((r) => r.id);
  const attempts = db
    .select()
    .from(exerciseAttempts)
    .where(inArray(exerciseAttempts.exerciseId, ids))
    .orderBy(desc(exerciseAttempts.id))
    .all();
  const latest = new Map<number, ExerciseAttemptState>();
  for (const a of attempts) {
    if (!latest.has(a.exerciseId)) {
      latest.set(a.exerciseId, {
        selectedIndex: a.selectedIndex,
        isCorrect: !!a.isCorrect,
      });
    }
  }

  return rows
    .map((r) => ({
      id: r.id,
      sectionId: r.sectionId,
      sectionHeading: r.sectionHeading,
      sectionSortOrder: r.sectionSortOrder ?? 0,
      prompt: r.prompt,
      options: JSON.parse(r.optionsJson) as string[],
      correctIndex: r.correctIndex,
      explanation: r.explanation,
      attempt: latest.get(r.id) ?? null,
    }))
    .sort(
      (a, b) =>
        a.sectionSortOrder - b.sectionSortOrder || a.id - b.id
    );
}

export type RecordedAttempt = {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
};

/**
 * Persist an answer and return the grade. Grading is authoritative here (the
 * answer key lives server-side); the client also grades instantly for feedback.
 */
export function recordExerciseAttempt(
  exerciseId: number,
  selectedIndex: number
): RecordedAttempt | null {
  const ex = db
    .select()
    .from(sectionExercises)
    .where(eq(sectionExercises.id, exerciseId))
    .get();
  if (!ex) return null;

  const isCorrect = selectedIndex === ex.correctIndex;
  db.insert(exerciseAttempts)
    .values({ exerciseId, selectedIndex, isCorrect })
    .run();

  return { isCorrect, correctIndex: ex.correctIndex, explanation: ex.explanation };
}
