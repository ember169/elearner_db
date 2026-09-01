import { db } from "@/lib/db";
import {
  knowledgeArticles,
  articleSections,
  sectionExercises,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { SeedExercise } from "./seed-data/exercises/types";
import { CPP_OOP_EXERCISES } from "./seed-data/exercises/cpp-oop";

const ALL_EXERCISES: SeedExercise[] = [
  ...CPP_OOP_EXERCISES,
];

function exerciseCount(): number {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(sectionExercises)
    .get();
  return row?.count ?? 0;
}

/**
 * Resolve each seed exercise to its section via (competencyId, depthTier,
 * heading) and insert it. Runs once (skips if any exercise already exists),
 * after articles are seeded. A missing article or heading is skipped silently
 * so a partially-seeded corpus never throws.
 */
export function seedSectionExercises() {
  if (exerciseCount() > 0) return;

  for (const ex of ALL_EXERCISES) {
    const article = db
      .select()
      .from(knowledgeArticles)
      .where(
        and(
          eq(knowledgeArticles.competencyId, ex.competencyId),
          eq(knowledgeArticles.depthTier, ex.depthTier)
        )
      )
      .get();
    if (!article) continue;

    const section = db
      .select()
      .from(articleSections)
      .where(
        and(
          eq(articleSections.articleId, article.id),
          eq(articleSections.heading, ex.sectionHeading)
        )
      )
      .get();
    if (!section) continue;

    db.insert(sectionExercises)
      .values({
        sectionId: section.id,
        sortOrder: section.sortOrder ?? 0,
        prompt: ex.prompt,
        optionsJson: JSON.stringify(ex.options),
        correctIndex: ex.correctIndex,
        explanation: ex.explanation,
      })
      .run();
  }
}
