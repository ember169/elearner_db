/**
 * A small auto-graded multiple-choice comprehension check anchored to one
 * section of one article. Exercises are matched to their section by
 * (competencyId, depthTier, sectionHeading) — a stable key — because section
 * database ids are regenerated on every article re-seed.
 */
export type SeedExercise = {
  /** Stable, globally-unique id (upsert key). Never reuse or renumber. */
  slug: string;
  competencyId: string;
  depthTier: number;
  /** Must match the section's `heading` verbatim. */
  sectionHeading: string;
  prompt: string;
  /** 3–4 answer choices. */
  options: string[];
  /** 0-based index of the correct option. */
  correctIndex: number;
  /** Shown after answering — explains why, and reinforces the notion. */
  explanation: string;
};
