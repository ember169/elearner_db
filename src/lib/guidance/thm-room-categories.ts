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
// steganography, networking, malware.
//
// Rooms are grouped by THM learning path where applicable.  Standalone rooms
// (not tied to a specific path) are grouped by category at the end.

export type ThmRoom = {
  code: string;
  name: string;
  category: string;
  difficulty: "info" | "easy" | "medium" | "hard";
  path?: string;
};

export const THM_ROOM_CATALOG: ThmRoom[] = [
  // ── Pre Security path ──────────────────────────────────────────────────
  { code: "introtolan", name: "Intro to LAN", category: "networking", difficulty: "info", path: "Pre Security" },
  { code: "howwebsiteswork", name: "How Websites Work", category: "web", difficulty: "info", path: "Pre Security" },

  // ── Complete Beginner path ─────────────────────────────────────────────
  { code: "tutorial", name: "Tutorial", category: "misc", difficulty: "info", path: "Complete Beginner" },
  { code: "startingout", name: "Starting Out In Cyber Sec", category: "misc", difficulty: "info", path: "Complete Beginner" },
  { code: "introtoresearch", name: "Intro to Research", category: "misc", difficulty: "info", path: "Complete Beginner" },
  { code: "linuxfundamentalspart1", name: "Linux Fundamentals Part 1", category: "misc", difficulty: "easy", path: "Complete Beginner" },
  { code: "linuxfundamentalspart2", name: "Linux Fundamentals Part 2", category: "misc", difficulty: "easy", path: "Complete Beginner" },
  { code: "linuxfundamentalspart3", name: "Linux Fundamentals Part 3", category: "misc", difficulty: "easy", path: "Complete Beginner" },
  { code: "introductorynetworking", name: "Introductory Networking", category: "networking", difficulty: "easy", path: "Complete Beginner" },
  { code: "httpindetail", name: "HTTP in Detail", category: "web", difficulty: "info", path: "Complete Beginner" },
  { code: "dnsindetail", name: "DNS in Detail", category: "networking", difficulty: "info", path: "Complete Beginner" },
  { code: "introtoshells", name: "What the Shell?", category: "misc", difficulty: "easy", path: "Complete Beginner" },
  { code: "burpsuitebasics", name: "Burp Suite: The Basics", category: "web", difficulty: "info", path: "Complete Beginner" },
  { code: "vulnversity", name: "Vulnversity", category: "misc", difficulty: "easy", path: "Complete Beginner" },
  { code: "kenobi", name: "Kenobi", category: "misc", difficulty: "easy", path: "Complete Beginner" },

  // ── Offensive Pentesting path ──────────────────────────────────────────
  { code: "blue", name: "Blue", category: "misc", difficulty: "easy", path: "Offensive Pentesting" },
  { code: "steelmountain", name: "Steel Mountain", category: "misc", difficulty: "easy", path: "Offensive Pentesting" },
  { code: "alfred", name: "Alfred", category: "misc", difficulty: "easy", path: "Offensive Pentesting" },
  { code: "skynet", name: "Skynet", category: "misc", difficulty: "easy", path: "Offensive Pentesting" },
  { code: "gamezone", name: "Game Zone", category: "web", difficulty: "easy", path: "Offensive Pentesting" },
  { code: "hackpark", name: "HackPark", category: "web", difficulty: "medium", path: "Offensive Pentesting" },
  { code: "dailybugle", name: "Daily Bugle", category: "web", difficulty: "hard", path: "Offensive Pentesting" },
  { code: "overpass", name: "Overpass", category: "misc", difficulty: "easy", path: "Offensive Pentesting" },
  { code: "relevant", name: "Relevant", category: "misc", difficulty: "medium", path: "Offensive Pentesting" },
  { code: "internal", name: "Internal", category: "misc", difficulty: "hard", path: "Offensive Pentesting" },

  // ── Standalone: Web ────────────────────────────────────────────────────
  { code: "mrrobot", name: "Mr Robot CTF", category: "web", difficulty: "medium" },
  { code: "picklerick", name: "Pickle Rick", category: "web", difficulty: "easy" },
  { code: "owasptop10", name: "OWASP Top 10", category: "web", difficulty: "easy" },
  { code: "owaspjuiceshop", name: "OWASP Juice Shop", category: "web", difficulty: "easy" },
  { code: "juniorpentester", name: "Junior Penetration Tester", category: "web", difficulty: "easy" },
  { code: "rrootme", name: "RootMe", category: "web", difficulty: "easy" },
  { code: "dvwa", name: "DVWA", category: "web", difficulty: "easy" },
  { code: "tomghost", name: "TomGhost", category: "web", difficulty: "easy" },

  // ── Standalone: General exploitation / privesc ("misc") ────────────────
  { code: "ice", name: "Ice", category: "misc", difficulty: "easy" },
  { code: "linuxprivesc", name: "Linux PrivEsc", category: "misc", difficulty: "easy" },
  { code: "windowsprivesc20", name: "Windows PrivEsc", category: "misc", difficulty: "medium" },
  { code: "activedirectorybasics", name: "Active Directory Basics", category: "misc", difficulty: "easy" },
  { code: "attacktivedirectory", name: "Attacktive Directory", category: "misc", difficulty: "medium" },
  { code: "lazyadmin", name: "LazyAdmin", category: "misc", difficulty: "easy" },
  { code: "basicpentestingjt", name: "Basic Pentesting", category: "misc", difficulty: "easy" },
  { code: "bountyhacker", name: "Bounty Hacker", category: "misc", difficulty: "easy" },
  { code: "lianyu", name: "Lian Yu", category: "misc", difficulty: "easy" },
  { code: "anonymous", name: "Anonymous", category: "misc", difficulty: "medium" },
  { code: "yearoftherabbit", name: "Year of the Rabbit", category: "misc", difficulty: "easy" },
  { code: "brooklynninenine", name: "Brooklyn Nine Nine", category: "misc", difficulty: "easy" },
  { code: "rpmetasploit", name: "Metasploit", category: "misc", difficulty: "info" },
  { code: "blaster", name: "Blaster", category: "misc", difficulty: "easy" },

  // ── Standalone: Networking ─────────────────────────────────────────────
  { code: "furthernmap", name: "Nmap", category: "networking", difficulty: "easy" },
  { code: "wireshark", name: "Wireshark: The Basics", category: "networking", difficulty: "easy" },
  { code: "wreath", name: "Wreath", category: "networking", difficulty: "hard" },

  // ── Standalone: Crypto ─────────────────────────────────────────────────
  { code: "crackthehash", name: "Crack the Hash", category: "crypto", difficulty: "easy" },
  { code: "encryptioncrypto101", name: "Encryption - Crypto 101", category: "crypto", difficulty: "medium" },
  { code: "johntheripper", name: "John The Ripper", category: "crypto", difficulty: "easy" },

  // ── Standalone: Reverse engineering ────────────────────────────────────
  { code: "reverseengineering", name: "Reverse Engineering", category: "reverse", difficulty: "medium" },
  { code: "windowsinternals", name: "Windows Internals", category: "reverse", difficulty: "medium" },

  // ── Standalone: Binary exploitation ────────────────────────────────────
  { code: "bufferoverflowprep", name: "Buffer Overflow Prep", category: "pwn", difficulty: "easy" },
  { code: "pwntools", name: "Intro to Pwntools", category: "pwn", difficulty: "medium" },

  // ── Standalone: Forensics ──────────────────────────────────────────────
  { code: "autopsy", name: "Autopsy", category: "forensics", difficulty: "medium" },
  { code: "memoryforensics", name: "Memory Forensics", category: "forensics", difficulty: "medium" },

  // ── Standalone: OSINT ──────────────────────────────────────────────────
  { code: "silverplatter", name: "Silver Platter", category: "osint", difficulty: "easy" },
  { code: "ohsint", name: "OhSINT", category: "osint", difficulty: "easy" },
  { code: "sakura", name: "Sakura Room", category: "osint", difficulty: "easy" },
];

// Backward-compatible map: completed room code → category (unchanged shape,
// derived from the catalog so there's a single source of truth).
export const THM_ROOM_CATEGORIES: Record<string, string> = Object.fromEntries(
  THM_ROOM_CATALOG.map((r) => [r.code, r.category])
);
