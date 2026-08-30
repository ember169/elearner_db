/**
 * A single 0-5 scale bridging the two level vocabularies in the app:
 * resource `difficulty` (beginner..expert) and article `recommendedLevel`/tier.
 *
 * It exists so a card's related content can be filtered to the item's own
 * level rather than dumping every tier of a competency. The bands are a
 * deliberate judgement, documented here so they are easy to tune:
 *
 *   L0 overview · L1 beginner · L2 intermediate · L3 advanced · L4 hard ·
 *   L5 expert reference
 */

const DIFFICULTY_LEVEL: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

export function difficultyToLevel(difficulty: string | null | undefined): number | null {
  if (!difficulty) return null;
  return DIFFICULTY_LEVEL[difficulty] ?? null;
}

/**
 * 42 projects carry a curriculum circle, not a difficulty. A later circle is
 * further along, not conceptually harder — the common core stays foundational —
 * so this maps conservatively into the L0-L3 band rather than reaching L4-L5.
 */
export function circleToLevel(circle: number | null | undefined): number | null {
  if (circle == null) return null;
  return Math.min(3, Math.max(0, Math.floor(circle / 2)));
}

export const LEVEL_LABEL = ["overview", "beginner", "intermediate", "advanced", "hard", "expert"];
