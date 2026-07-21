import type { PlatformSnapshot } from "../guidance/engine";
import { THM_ROOM_CATEGORIES } from "../guidance/thm-room-categories";
import { COMPETENCIES } from "./competency-map";

// Deterministic, no-LLM competency assessment derived purely from synced data.
// Produces a rough 0-5 floor per competency (evidence string included) that:
//   - renders the Progress competency map even without an API key, and
//   - is handed to the LLM as grounding it can refine.
// Heuristic by design — see competency-map.ts for the signal grammar.

export type SignalResult = { autoLevel: number; evidence: string };

const CPP_SLUGS = new Set([
  "cpp00", "cpp01", "cpp02", "cpp03", "cpp04",
  "cpp05", "cpp06", "cpp07", "cpp08", "cpp09",
]);

function bucket(n: number, thresholds: number[]): number {
  // thresholds ascending; returns index+1 of the highest crossed, else 0
  let level = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (n >= thresholds[i]) level = i + 1;
  }
  return level;
}

export function computeCompetencySignals(
  snapshot: PlatformSnapshot,
  ftProgress: { completedProjects: string[] }
): Record<string, SignalResult> {
  const completed = new Set(ftProgress.completedProjects.map((s) => s.toLowerCase()));

  // THM completed rooms grouped by category
  const thmByCategory: Record<string, number> = {};
  for (const room of snapshot.thm.rooms) {
    const cat = THM_ROOM_CATEGORIES[room.roomCode];
    if (cat) thmByCategory[cat] = (thmByCategory[cat] ?? 0) + 1;
  }

  const maldevProgress = snapshot.maldev.profile?.overallProgress ?? 0;
  const htbOwns =
    (snapshot.htb.profile?.systemOwns ?? 0) + (snapshot.htb.profile?.userOwns ?? 0);
  const rmCounts = snapshot.rootme.categoryCounts;
  const rmWeighted = snapshot.rootme.categoryWeightedCounts;

  const out: Record<string, SignalResult> = {};

  for (const comp of COMPETENCIES) {
    let level = 0;
    const evidence: string[] = [];

    // 42 project signals evaluated as a group (fraction completed)
    const ftSlugs = comp.signals
      .filter((s) => s.startsWith("ft:"))
      .map((s) => s.slice(3));
    if (ftSlugs.length > 0) {
      const done = ftSlugs.filter((slug) => completed.has(slug));
      if (done.length > 0) {
        const frac = done.length / ftSlugs.length;
        let ftLevel = frac >= 1 ? 4 : frac >= 0.5 ? 3 : 2;
        if (ftSlugs.length === 1 && ftLevel > 2) ftLevel = 2;
        level = Math.max(level, ftLevel);
        evidence.push(`42: ${done.join(", ")}`);
      }
    }

    for (const signal of comp.signals) {
      if (signal === "ft-cpp") {
        const cpp = [...completed].filter((s) => CPP_SLUGS.has(s));
        if (cpp.length > 0) {
          level = Math.max(level, cpp.length >= 6 ? 4 : 3);
          evidence.push(`42 C++ modules (${cpp.length}/10)`);
        }
      } else if (signal === "maldev") {
        if (maldevProgress > 0) {
          level = Math.max(level, Math.min(4, Math.round((maldevProgress / 100) * 4) || 1));
          evidence.push(`Maldev ${Math.round(maldevProgress)}%`);
        }
      } else if (signal === "htb-owns") {
        if (htbOwns > 0) {
          level = Math.max(level, bucket(htbOwns, [1, 3, 10]));
          evidence.push(`${htbOwns} HTB owns`);
        }
      } else if (signal.startsWith("rm:")) {
        const cat = signal.slice(3);
        const c = rmCounts[cat] ?? 0;
        const w = rmWeighted[cat] ?? 0;
        if (c > 0) {
          level = Math.max(level, bucket(w, [1, 5, 12, 25]));
          evidence.push(`${c} Root-me ${cat} (weight ${w.toFixed(1)})`);
        }
      } else if (signal.startsWith("thm:")) {
        const cat = signal.slice(4);
        const t = thmByCategory[cat] ?? 0;
        if (t > 0) {
          level = Math.max(level, bucket(t, [1, 2, 4]));
          evidence.push(`${t} THM ${cat} room${t > 1 ? "s" : ""}`);
        }
      }
    }

    out[comp.id] = {
      autoLevel: Math.min(5, level),
      evidence: evidence.join("; ") || "No tracked activity yet",
    };
  }

  return out;
}
