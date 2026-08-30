import { COMPETENCIES } from "./competency-map";
import { matchProjectSlug } from "@/lib/guidance/engine";
import { THM_ROOM_CATEGORIES } from "@/lib/guidance/thm-room-categories";

/**
 * The inverse of competency-signals.
 *
 * `computeCompetencySignals` is competency-major: it asks, for each competency,
 * which of its signals fired. Cataloguing needs the other direction — given a
 * resource, which competencies does it feed. That index does not exist, so it
 * is derived here from `COMPETENCIES[].signals` at module load rather than
 * hand-written, which is what stops it drifting from the signal graph the way
 * seed.ts's own tables did.
 */

function buildIndex(prefix: string): Record<string, string[]> {
  const index: Record<string, string[]> = {};
  for (const comp of COMPETENCIES) {
    for (const signal of comp.signals) {
      if (!signal.startsWith(prefix)) continue;
      const key = signal.slice(prefix.length);
      (index[key] ??= []).push(comp.id);
    }
  }
  return index;
}

/** ft:<slug> → competency ids */
const FT_INDEX = buildIndex("ft:");
/** thm:<category> → competency ids */
const THM_INDEX = buildIndex("thm:");

/** Competencies claiming the bare `ft-cpp` token, i.e. any C++ module. */
const CPP_COMPETENCIES = COMPETENCIES.filter((c) =>
  c.signals.includes("ft-cpp"),
).map((c) => c.id);

/**
 * Projects the signal graph does not claim.
 *
 * The graph covers the common core's named projects, but 42's catalogue also
 * carries the piscine and the exams, which are most of a beginner's validated
 * history — 23 of 33 rows here, and 16 of them already validated. Leaving them
 * unmapped would hide the bulk of real progress from every competency view, so
 * they are placed by rule rather than by signal.
 *
 * Deliberately no new competency: so_long and cub3d are raycasting and
 * geometry, filed under algorithms as the closest existing home. A 21st
 * competency would ship with zero Knowledge articles against every other one's
 * six.
 */
const FALLBACK_RULES: { test: RegExp; competencies: string[] }[] = [
  // The shell piscine days are systems work, not C.
  { test: /^c-piscine-shell-/, competencies: ["linux-admin"] },
  // Everything else in the piscine, plus its exams, is C fundamentals.
  { test: /^c-piscine-/, competencies: ["c-core"] },
  // Common-core exams test the C the cursus has covered so far. Two slug forms
  // are in play: exam-rank-04 (the 42 API / DB) and exam04 (the catalogue and
  // board refs).
  { test: /^exam-rank-\d/, competencies: ["c-core"] },
  { test: /^exam\d/, competencies: ["c-core"] },
  { test: /^(so_long|cub3d)$/, competencies: ["algorithms"] },
];

/** Competencies fed by a 42 project, from its slug and name. */
export function competenciesForFtProject(
  slug: string | null | undefined,
  name?: string | null,
): string[] {
  const raw = (slug ?? name ?? "").trim();
  if (!raw) return [];

  // Canonicalise first: the DB carries "42cursus-libft" and "cpp-module-00"
  // while the signals carry "libft" and "cpp00".
  const canonical = matchProjectSlug(raw);
  const byName = name ? matchProjectSlug(name) : canonical;

  for (const key of new Set([canonical, byName])) {
    if (FT_INDEX[key]) return [...FT_INDEX[key]];
    if (/^cpp\d+$/.test(key) && CPP_COMPETENCIES.length) {
      return [...CPP_COMPETENCIES];
    }
  }

  const lowered = raw.toLowerCase();
  for (const rule of FALLBACK_RULES) {
    if (rule.test.test(lowered) || rule.test.test(canonical)) {
      return [...rule.competencies];
    }
  }

  return [];
}

/** Competencies fed by a TryHackMe room, via its catalogued category. */
export function competenciesForThmRoom(roomCode: string | null | undefined): string[] {
  if (!roomCode) return [];
  const category = THM_ROOM_CATEGORIES[roomCode.toLowerCase()];
  if (!category) return [];
  return THM_INDEX[category] ? [...THM_INDEX[category]] : [];
}
