import { db } from "@/lib/db";
import {
  knowledgeArticles,
  articleSections,
  sectionExercises,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { SeedExercise } from "./seed-data/exercises/types";
import { CPP_OOP_EXERCISES } from "./seed-data/exercises/cpp-oop";
import { C_CORE_EXERCISES } from "./seed-data/exercises/c-core";
import { C_SYSTEMS_EXERCISES } from "./seed-data/exercises/c-systems";
import { ALGORITHMS_EXERCISES } from "./seed-data/exercises/algorithms";
import { CRYPTO_FORENSICS_EXERCISES } from "./seed-data/exercises/crypto-forensics";
import { WEB_EXERCISES } from "./seed-data/exercises/web";
import { AD_EXERCISES } from "./seed-data/exercises/ad";
import { RECON_OSINT_EXERCISES } from "./seed-data/exercises/recon-osint";
import { NETWORKING_EXERCISES } from "./seed-data/exercises/networking";

const ALL_EXERCISES: SeedExercise[] = [
  ...CPP_OOP_EXERCISES,
  ...C_CORE_EXERCISES,
  ...C_SYSTEMS_EXERCISES,
  ...ALGORITHMS_EXERCISES,
  ...CRYPTO_FORENSICS_EXERCISES,
  ...WEB_EXERCISES,
  ...AD_EXERCISES,
  ...RECON_OSINT_EXERCISES,
  ...NETWORKING_EXERCISES,
];

/**
 * Sync comprehension MCQs from seed-data on every init, keyed by `slug`:
 * insert new ones, update changed ones in place (so attempts, which reference
 * the row id, survive), and remove seed-managed exercises that were deleted.
 * Runs after article sync so newly-added sections can be resolved by heading.
 * A missing article or heading is skipped silently.
 */
export function seedSectionExercises() {
  const existingBySlug = new Map(
    db
      .select()
      .from(sectionExercises)
      .all()
      .filter((e) => e.slug != null)
      .map((e) => [e.slug as string, e])
  );

  const seenSlugs = new Set<string>();

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

    seenSlugs.add(ex.slug);
    const values = {
      slug: ex.slug,
      sectionId: section.id,
      sortOrder: section.sortOrder ?? 0,
      prompt: ex.prompt,
      optionsJson: JSON.stringify(ex.options),
      correctIndex: ex.correctIndex,
      explanation: ex.explanation,
    };

    const current = existingBySlug.get(ex.slug);
    if (current) {
      db.update(sectionExercises)
        .set(values)
        .where(eq(sectionExercises.id, current.id))
        .run();
    } else {
      db.insert(sectionExercises).values(values).run();
    }
  }

  // Remove seed-managed exercises (those carrying a slug) that are no longer
  // in the seed set. Rows without a slug are left untouched.
  const staleIds = [...existingBySlug.values()]
    .filter((e) => !seenSlugs.has(e.slug as string))
    .map((e) => e.id);
  if (staleIds.length) {
    db.delete(sectionExercises).where(inArray(sectionExercises.id, staleIds)).run();
  }
}
