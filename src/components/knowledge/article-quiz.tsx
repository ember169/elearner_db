"use client";

import { useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check, X, RotateCcw, GraduationCap } from "lucide-react";

export type QuizExercise = {
  id: number;
  sectionHeading: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  attempt: { selectedIndex: number; isCorrect: boolean } | null;
};

const LETTERS = ["A", "B", "C", "D", "E"];

function seededPermutation(n: number, seed: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  let s = Math.abs(seed);
  for (let i = n - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function ArticleQuiz({
  articleId,
  exercises,
}: {
  articleId: number;
  exercises: QuizExercise[];
}) {
  // perm[exerciseId] = mapping where perm[displayPos] = originalIndex
  const perms = useMemo(() => {
    const m: Record<number, number[]> = {};
    for (const ex of exercises) {
      m[ex.id] = seededPermutation(ex.options.length, ex.id);
    }
    return m;
  }, [exercises]);

  // exerciseId -> selected ORIGINAL option index (present only once answered)
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    for (const ex of exercises) {
      if (ex.attempt) initial[ex.id] = ex.attempt.selectedIndex;
    }
    return initial;
  });

  const answer = useCallback(
    (ex: QuizExercise, displayIndex: number) => {
      if (answers[ex.id] !== undefined) return; // locked once answered
      const originalIndex = perms[ex.id][displayIndex];
      setAnswers((prev) => ({ ...prev, [ex.id]: originalIndex }));
      void fetch(`/api/knowledge/${articleId}/exercise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: ex.id, selectedIndex: originalIndex }),
      }).catch(() => {});
    },
    [answers, articleId, perms]
  );

  const reset = useCallback((exId: number) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[exId];
      return next;
    });
  }, []);

  const { answered, correct } = useMemo(() => {
    let a = 0;
    let c = 0;
    for (const ex of exercises) {
      const sel = answers[ex.id];
      if (sel === undefined) continue;
      a += 1;
      if (sel === ex.correctIndex) c += 1;
    }
    return { answered: a, correct: c };
  }, [answers, exercises]);

  if (exercises.length === 0) return null;

  const allDone = answered === exercises.length;

  return (
    <section className="mt-8" aria-label="Comprehension quiz">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-cb-or" />
          <h2 className="text-cb-foot font-semibold text-cb-text">
            Check your understanding
          </h2>
          <span className="text-cb-foot text-cb-muted">
            {exercises.length} question{exercises.length > 1 ? "s" : ""}
          </span>
        </div>
        {answered > 0 && (
          <span
            className={cn(
              "rounded-cb-chip-sm px-2 py-0.5 text-cb-foot font-medium tabular-nums",
              allDone && correct === exercises.length
                ? "bg-cb-success-tint text-cb-success"
                : "bg-cb-raised text-cb-second"
            )}
          >
            {correct}/{exercises.length} correct
          </span>
        )}
      </div>

      <ol className="flex flex-col gap-3">
        {exercises.map((ex, qi) => {
          const perm = perms[ex.id];
          const selectedOriginal = answers[ex.id];
          const isAnswered = selectedOriginal !== undefined;
          const gotIt = isAnswered && selectedOriginal === ex.correctIndex;

          return (
            <li
              key={ex.id}
              className="rounded-cb-card border border-cb-line bg-cb-card p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="cb-label-mono text-cb-caption uppercase tracking-wide text-cb-muted">
                  {ex.sectionHeading}
                </span>
              </div>
              <p className="mb-3 text-cb-foot font-medium leading-relaxed text-cb-text">
                <span className="mr-1.5 text-cb-muted">{qi + 1}.</span>
                {ex.prompt}
              </p>

              <div className="flex flex-col gap-1.5" role="group">
                {perm.map((originalIdx, displayIdx) => {
                  const opt = ex.options[originalIdx];
                  const isCorrectOpt = originalIdx === ex.correctIndex;
                  const isPicked = selectedOriginal === originalIdx;

                  let tone =
                    "border-cb-line bg-cb-raised text-cb-second hover:bg-cb-raised-hover hover:text-cb-text";
                  if (isAnswered) {
                    if (isCorrectOpt) {
                      tone =
                        "border-cb-success bg-cb-success-tint text-cb-text";
                    } else if (isPicked) {
                      tone = "border-cb-danger bg-cb-danger-tint text-cb-text";
                    } else {
                      tone =
                        "border-cb-line bg-cb-card text-cb-muted opacity-70";
                    }
                  }

                  return (
                    <button
                      key={originalIdx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => answer(ex, displayIdx)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-cb-chip-sm border px-3 py-2 text-left text-cb-foot leading-snug transition-colors",
                        tone,
                        !isAnswered && "cursor-pointer"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-cb-caption font-semibold",
                          isAnswered && isCorrectOpt
                            ? "bg-cb-success text-cb-card"
                            : isAnswered && isPicked
                              ? "bg-cb-danger text-cb-card"
                              : "bg-cb-raised-hover text-cb-second"
                        )}
                      >
                        {isAnswered && isCorrectOpt ? (
                          <Check className="h-3 w-3" />
                        ) : isAnswered && isPicked ? (
                          <X className="h-3 w-3" />
                        ) : (
                          LETTERS[displayIdx]
                        )}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div className="mt-3 rounded-cb-chip-sm border border-cb-line bg-cb-bg p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-cb-foot font-semibold">
                    {gotIt ? (
                      <span className="text-cb-success">Correct</span>
                    ) : (
                      <span className="text-cb-danger">Not quite</span>
                    )}
                    {!gotIt && (
                      <span className="font-normal text-cb-muted">
                        — review “{ex.sectionHeading}”
                      </span>
                    )}
                  </p>
                  <p className="text-cb-foot leading-relaxed text-cb-second">
                    {ex.explanation}
                  </p>
                  <button
                    type="button"
                    onClick={() => reset(ex.id)}
                    className="mt-2 flex items-center gap-1 text-cb-foot text-cb-muted transition-colors hover:text-cb-text"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Try again
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
