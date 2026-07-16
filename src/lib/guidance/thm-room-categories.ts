// Curated catalog of well-known TryHackMe rooms with a topic category and
// difficulty. Serves two jobs:
//   1. THM_ROOM_CATEGORIES (derived below) — maps a *completed* room code to a
//      category, feeding buildSkillProfile / competency signals.
//   2. THM_ROOM_CATALOG — a candidate list the mentor recommends FROM, so the
//      LLM prescribes real rooms by code rather than inventing them.
//
// TryHackMe exposes no clean per-room skill tags anywhere reachable (not the
// completed-rooms API, not room pages), only title/description/difficulty — so
// these are hand-classified, the same way FT_COMMON_CORE's skills were.
//
// Categories match the THM/HTB keys wired into PLATFORM_SKILL_MAPPING in
// ft-project-tree.ts: web, crypto, forensics, reverse, pwn, misc, osint,
// steganography. Intentionally a starter set, not exhaustive — extend freely.

export type ThmRoom = {
  code: string;
  name: string;
  category: string;
  difficulty: "info" | "easy" | "medium" | "hard";
};

export const THM_ROOM_CATALOG: ThmRoom[] = [
  // Web
  { code: "mrrobot", name: "Mr Robot CTF", category: "web", difficulty: "medium" },
  { code: "picklerick", name: "Pickle Rick", category: "web", difficulty: "easy" },
  { code: "owasptop10", name: "OWASP Top 10", category: "web", difficulty: "easy" },
  { code: "owaspjuiceshop", name: "OWASP Juice Shop", category: "web", difficulty: "easy" },
  { code: "juniorpentester", name: "Junior Penetration Tester", category: "web", difficulty: "easy" },
  { code: "rrootme", name: "RootMe", category: "web", difficulty: "easy" },

  // General exploitation / enumeration + privesc ("misc")
  { code: "vulnversity", name: "Vulnversity", category: "misc", difficulty: "easy" },
  { code: "kenobi", name: "Kenobi", category: "misc", difficulty: "easy" },
  { code: "blue", name: "Blue", category: "misc", difficulty: "easy" },
  { code: "ice", name: "Ice", category: "misc", difficulty: "easy" },
  { code: "steelmountain", name: "Steel Mountain", category: "misc", difficulty: "easy" },
  { code: "linuxprivesc", name: "Linux PrivEsc", category: "misc", difficulty: "easy" },
  { code: "windowsprivesc20", name: "Windows PrivEsc", category: "misc", difficulty: "medium" },
  { code: "activedirectorybasics", name: "Active Directory Basics", category: "misc", difficulty: "easy" },
  { code: "attacktivedirectory", name: "Attacktive Directory", category: "misc", difficulty: "medium" },

  // Crypto
  { code: "crackthehash", name: "Crack the Hash", category: "crypto", difficulty: "easy" },
  { code: "encryptioncrypto101", name: "Encryption - Crypto 101", category: "crypto", difficulty: "medium" },

  // Reverse engineering
  { code: "reverseengineering", name: "Reverse Engineering", category: "reverse", difficulty: "medium" },
  { code: "windowsinternals", name: "Windows Internals", category: "reverse", difficulty: "medium" },

  // Binary exploitation
  { code: "bufferoverflowprep", name: "Buffer Overflow Prep", category: "pwn", difficulty: "easy" },
  { code: "pwntools", name: "Intro to Pwntools", category: "pwn", difficulty: "medium" },

  // Forensics
  { code: "autopsy", name: "Autopsy", category: "forensics", difficulty: "medium" },
  { code: "memoryforensics", name: "Memory Forensics", category: "forensics", difficulty: "medium" },

  // OSINT
  { code: "silverplatter", name: "Silver Platter", category: "osint", difficulty: "easy" },
  { code: "ohsint", name: "OhSINT", category: "osint", difficulty: "easy" },
  { code: "sakura", name: "Sakura Room", category: "osint", difficulty: "easy" },
];

// Backward-compatible map: completed room code → category (unchanged shape,
// derived from the catalog so there's a single source of truth).
export const THM_ROOM_CATEGORIES: Record<string, string> = Object.fromEntries(
  THM_ROOM_CATALOG.map((r) => [r.code, r.category])
);
