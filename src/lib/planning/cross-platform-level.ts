import type { SignalResult } from "@/lib/mentor/competency-signals";

// Maps competency signal levels (0-5, aggregated from ALL platforms including
// 42 projects) to appropriate THM/HTB difficulty tiers. A student who completed
// Born2beroot shouldn't get "Intro to Linux" on THM — their linux-admin
// competency is already level 2+ from that project alone.

export type DifficultyFloor = "info" | "easy" | "medium" | "hard";

const LEVEL_TO_THM_FLOOR: DifficultyFloor[] = [
  "info",   // 0: no tracked activity
  "info",   // 1: just started
  "easy",   // 2: some evidence (e.g., 1-2 related 42 projects)
  "medium", // 3: solid evidence (multiple projects or cross-platform)
  "hard",   // 4: strong evidence
  "hard",   // 5: mastery
];

const HTB_TIER_ORDER = ["Fundamental", "Easy", "Medium", "Hard"] as const;

const LEVEL_TO_HTB_FLOOR_IDX: number[] = [
  0, // 0: Fundamental
  0, // 1: Fundamental
  1, // 2: Easy
  2, // 3: Medium
  3, // 4: Hard
  3, // 5: Hard
];

// Which competencies map to which THM categories
const COMPETENCY_TO_THM_CATEGORY: Record<string, string[]> = {
  "linux-admin": ["misc"],
  "c-systems": ["misc"],
  "net-fundamentals": ["networking"],
  "net-attacks": ["networking", "misc"],
  "web-fundamentals": ["web"],
  "web-security": ["web"],
  "crypto": ["crypto"],
  "forensics": ["forensics"],
  "reverse-engineering": ["reverse"],
  "binexp": ["pwn"],
  "recon-osint": ["osint"],
  "scripting": ["misc"],
  "ad-fundamentals": ["misc"],
};

// Which competencies map to which HTB areas
const COMPETENCY_TO_HTB_AREA: Record<string, string[]> = {
  "linux-admin": ["Linux & systems"],
  "containers-infra": ["Linux & systems"],
  "win-internals": ["Windows internals & maldev"],
  "maldev-techniques": ["Windows internals & maldev"],
  "evasion": ["Windows internals & maldev"],
  "net-fundamentals": ["Networking"],
  "net-attacks": ["Networking"],
  "web-fundamentals": ["Web"],
  "web-security": ["Web"],
  "crypto": ["Crypto"],
  "forensics": ["Forensics & incident response"],
  "reverse-engineering": ["Reverse engineering & binary"],
  "binexp": ["Reverse engineering & binary"],
  "recon-osint": ["Recon & OSINT"],
  "scripting": ["Scripting & automation"],
  "ad-fundamentals": ["Active Directory"],
};

// Given competency signals, compute the minimum THM difficulty floor per category.
// Rooms below this floor are too easy and should be skipped.
export function thmDifficultyFloors(
  signals: Record<string, SignalResult>
): Record<string, DifficultyFloor> {
  const floors: Record<string, DifficultyFloor> = {};

  for (const [compId, categories] of Object.entries(COMPETENCY_TO_THM_CATEGORY)) {
    const level = signals[compId]?.autoLevel ?? 0;
    const floor = LEVEL_TO_THM_FLOOR[Math.min(level, 5)];
    for (const cat of categories) {
      const current = floors[cat];
      if (!current || difficultyRank(floor) > difficultyRank(current)) {
        floors[cat] = floor;
      }
    }
  }

  return floors;
}

// Given competency signals, compute the minimum HTB tier floor per area.
export function htbTierFloors(
  signals: Record<string, SignalResult>
): Record<string, (typeof HTB_TIER_ORDER)[number]> {
  const floors: Record<string, (typeof HTB_TIER_ORDER)[number]> = {};

  for (const [compId, areas] of Object.entries(COMPETENCY_TO_HTB_AREA)) {
    const level = signals[compId]?.autoLevel ?? 0;
    const tierIdx = LEVEL_TO_HTB_FLOOR_IDX[Math.min(level, 5)];
    const tier = HTB_TIER_ORDER[tierIdx];
    for (const area of areas) {
      const current = floors[area];
      if (!current || HTB_TIER_ORDER.indexOf(tier) > HTB_TIER_ORDER.indexOf(current)) {
        floors[area] = tier;
      }
    }
  }

  return floors;
}

const DIFFICULTY_RANK: Record<string, number> = {
  info: 0,
  easy: 1,
  medium: 2,
  hard: 3,
};

function difficultyRank(d: DifficultyFloor): number {
  return DIFFICULTY_RANK[d] ?? 0;
}

export function isAboveFloor(
  difficulty: string,
  floor: DifficultyFloor
): boolean {
  return (DIFFICULTY_RANK[difficulty] ?? 0) >= (DIFFICULTY_RANK[floor] ?? 0);
}

export function isAboveHtbFloor(
  tier: string,
  floor: string
): boolean {
  const tierIdx = HTB_TIER_ORDER.indexOf(tier as (typeof HTB_TIER_ORDER)[number]);
  const floorIdx = HTB_TIER_ORDER.indexOf(floor as (typeof HTB_TIER_ORDER)[number]);
  if (tierIdx === -1 || floorIdx === -1) return true;
  return tierIdx >= floorIdx;
}

const HTB_MACHINE_DIFF_ORDER = ["Easy", "Medium", "Hard", "Insane"] as const;

const LEVEL_TO_HTB_MACHINE_FLOOR_IDX: number[] = [
  0, // 0: Easy
  0, // 1: Easy
  0, // 2: Easy
  1, // 3: Medium
  2, // 4: Hard
  3, // 5: Insane
];

const COMPETENCY_TO_HTB_MACHINE_AREA: Record<string, string[]> = {
  "linux-admin": ["Linux & systems"],
  "containers-infra": ["Linux & systems"],
  "win-internals": ["Windows internals & maldev"],
  "maldev-techniques": ["Windows internals & maldev"],
  "evasion": ["Windows internals & maldev"],
  "net-fundamentals": ["Networking"],
  "net-attacks": ["Networking"],
  "web-fundamentals": ["Web"],
  "web-security": ["Web"],
  "reverse-engineering": ["Reverse engineering & binary"],
  "binexp": ["Reverse engineering & binary"],
  "ad-fundamentals": ["Active Directory"],
  "crypto": ["Crypto & forensics basics"],
  "forensics": ["Crypto & forensics basics"],
};

export function htbMachineDifficultyFloors(
  signals: Record<string, SignalResult>
): Record<string, (typeof HTB_MACHINE_DIFF_ORDER)[number]> {
  const floors: Record<string, (typeof HTB_MACHINE_DIFF_ORDER)[number]> = {};

  for (const [compId, areas] of Object.entries(COMPETENCY_TO_HTB_MACHINE_AREA)) {
    const level = signals[compId]?.autoLevel ?? 0;
    const idx = LEVEL_TO_HTB_MACHINE_FLOOR_IDX[Math.min(level, 5)];
    const diff = HTB_MACHINE_DIFF_ORDER[idx];
    for (const area of areas) {
      const current = floors[area];
      if (!current || HTB_MACHINE_DIFF_ORDER.indexOf(diff) > HTB_MACHINE_DIFF_ORDER.indexOf(current)) {
        floors[area] = diff;
      }
    }
  }

  return floors;
}

export function isAboveHtbMachineDifficulty(
  difficulty: string,
  floor: string
): boolean {
  const diffIdx = HTB_MACHINE_DIFF_ORDER.indexOf(difficulty as (typeof HTB_MACHINE_DIFF_ORDER)[number]);
  const floorIdx = HTB_MACHINE_DIFF_ORDER.indexOf(floor as (typeof HTB_MACHINE_DIFF_ORDER)[number]);
  if (diffIdx === -1 || floorIdx === -1) return true;
  return diffIdx >= floorIdx;
}
