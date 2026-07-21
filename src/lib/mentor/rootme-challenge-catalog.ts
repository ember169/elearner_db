// Curated catalog of Root-me challenges the mentor can recommend.
// Organized by category with difficulty progression (score-ascending).
// Titles and scores verified against root-me.org (July 2026).
// IDs are synthetic (catalog-local); matching to user's solved list is by title.

export type RootmeChallenge = {
  id: number;
  title: string;
  category: string;
  score: number;
  skills: string[];
  description: string;
};

export const ROOTME_CHALLENGE_CATALOG: RootmeChallenge[] = [
  // ── Cracking ────────────────────────────────────────────────────────────
  { id: 1, title: "ELF x86 - 0 protection", category: "Cracking", score: 5, skills: ["elf", "strings", "x86"], description: "Find the hardcoded password in an unprotected ELF binary using strings." },
  { id: 2, title: "ELF x86 - Basic", category: "Cracking", score: 5, skills: ["elf", "strings", "x86", "strcmp"], description: "Reverse a basic ELF binary with string comparison." },
  { id: 3, title: "PE x86 - 0 protection", category: "Cracking", score: 5, skills: ["pe", "strings", "x86"], description: "Analyse a Windows PE executable with no protection." },
  { id: 4, title: "ELF C++ - 0 protection", category: "Cracking", score: 10, skills: ["elf", "cpp", "ghidra", "xor"], description: "Reverse a C++ binary that decodes the password with XOR." },
  { id: 5, title: "PE DotNet - 0 protection", category: "Cracking", score: 10, skills: ["pe", "dotnet", "dnspy"], description: "Decompile a .NET assembly with dnSpy or ILSpy." },
  { id: 6, title: "ELF x86 - Fake Instructions", category: "Cracking", score: 15, skills: ["elf", "x86", "anti-analysis", "gdb"], description: "Navigate past misleading fake jumps to find the real validation." },
  { id: 7, title: "ELF x86 - Ptrace", category: "Cracking", score: 15, skills: ["elf", "x86", "anti-debug", "ptrace"], description: "Bypass ptrace-based anti-debugging to reach the password check." },
  { id: 8, title: "ELF MIPS - Basic Crackme", category: "Cracking", score: 15, skills: ["elf", "mips", "ghidra", "cross-arch"], description: "Reverse a MIPS binary — introduction to non-x86 reversing." },
  { id: 9, title: "PYC - ByteCode", category: "Cracking", score: 20, skills: ["python", "bytecode", "decompilation"], description: "Decompile Python bytecode (.pyc) to recover the validation logic." },
  { id: 10, title: "ELF ARM - Basic Crackme", category: "Cracking", score: 20, skills: ["elf", "arm", "ghidra", "cross-arch"], description: "Analyse an ARM binary crackme — cross-architecture reversing." },
  { id: 11, title: "ELF x64 - Basic KeygenMe", category: "Cracking", score: 20, skills: ["elf", "x64", "keygen", "ghidra"], description: "Understand the key validation algorithm and write a keygen." },
  { id: 12, title: "ELF x86 - No software breakpoints", category: "Cracking", score: 25, skills: ["elf", "x86", "anti-debug", "hardware-bp"], description: "Crack a binary that detects software breakpoints." },
  { id: 13, title: "ELF x86 - CrackPass", category: "Cracking", score: 30, skills: ["elf", "x86", "algorithm", "ghidra"], description: "Reverse an algorithmic password check that transforms input." },
  { id: 14, title: "PE x86 - SEHVEH", category: "Cracking", score: 35, skills: ["pe", "x86", "seh", "veh", "anti-debug"], description: "Reverse a PE using Structured/Vectored Exception Handlers for control flow." },

  // ── App - Système ───────────────────────────────────────────────────────
  { id: 101, title: "ELF x86 - Stack buffer overflow basic 1", category: "App - Système", score: 5, skills: ["buffer-overflow", "stack", "gdb"], description: "Overwrite a stack variable to control program flow." },
  { id: 102, title: "ELF x86 - Stack buffer overflow basic 2", category: "App - Système", score: 10, skills: ["buffer-overflow", "function-pointer"], description: "Overflow a buffer to overwrite a function pointer." },
  { id: 103, title: "ELF x64 - Stack buffer overflow - basic", category: "App - Système", score: 10, skills: ["buffer-overflow", "x64", "gdb"], description: "Basic 64-bit stack buffer overflow with register control." },
  { id: 104, title: "ELF x86 - Format string bug basic 1", category: "App - Système", score: 15, skills: ["format-string", "printf"], description: "Read stack memory with a format string vulnerability." },
  { id: 105, title: "ELF x86 - Format string bug basic 2", category: "App - Système", score: 15, skills: ["format-string", "arbitrary-write"], description: "Write to arbitrary memory using format string %n." },
  { id: 106, title: "ELF x86 - Stack buffer overflow basic 3", category: "App - Système", score: 15, skills: ["buffer-overflow", "environment", "shellcode"], description: "Exploit buffer overflow using environment variables." },
  { id: 107, title: "ELF x86 - Race condition", category: "App - Système", score: 20, skills: ["race-condition", "toctou", "symlink"], description: "Win a TOCTOU race to read a privileged file." },
  { id: 108, title: "ELF x86 - Stack buffer overflow basic 4", category: "App - Système", score: 20, skills: ["buffer-overflow", "shellcode", "nop-sled"], description: "Inject and execute shellcode via stack overflow." },
  { id: 109, title: "ELF x86 - Stack buffer overflow basic 6", category: "App - Système", score: 25, skills: ["buffer-overflow", "ret2libc", "nx-bypass"], description: "Bypass non-executable stack with return-to-libc." },
  { id: 110, title: "ELF x86 - Stack buffer overflow - C++ vtables", category: "App - Système", score: 30, skills: ["buffer-overflow", "vtable-hijack", "cpp"], description: "Corrupt a C++ vtable pointer to hijack virtual method dispatch." },
  { id: 111, title: "ELF x64 - Stack buffer overflow - advanced", category: "App - Système", score: 30, skills: ["buffer-overflow", "rop", "nx-bypass", "x64"], description: "64-bit ROP chain to bypass NX and ASLR protections." },

  // ── Web - Client ────────────────────────────────────────────────────────
  { id: 201, title: "HTML - disabled buttons", category: "Web - Client", score: 5, skills: ["html", "devtools"], description: "Re-enable disabled form buttons to reveal hidden content." },
  { id: 202, title: "Javascript - Authentication", category: "Web - Client", score: 10, skills: ["javascript", "view-source"], description: "Bypass a client-side JavaScript login check." },
  { id: 203, title: "Javascript - Source", category: "Web - Client", score: 10, skills: ["javascript", "view-source"], description: "Analyze JavaScript source to find the password." },
  { id: 204, title: "Javascript - Obfuscation 1", category: "Web - Client", score: 10, skills: ["javascript", "deobfuscation"], description: "Deobfuscate JavaScript to find the password." },
  { id: 205, title: "Javascript - Obfuscation 2", category: "Web - Client", score: 15, skills: ["javascript", "deobfuscation"], description: "Decode a more heavily obfuscated script." },
  { id: 206, title: "Javascript - Authentication 2", category: "Web - Client", score: 20, skills: ["javascript", "logic"], description: "Bypass a more complex JS authentication scheme." },
  { id: 207, title: "XSS - Stored 1", category: "Web - Client", score: 30, skills: ["xss", "stored-xss", "cookie-theft"], description: "Exploit a stored XSS to steal admin cookies." },
  { id: 208, title: "XSS DOM Based - Introduction", category: "Web - Client", score: 35, skills: ["xss", "dom", "javascript"], description: "Exploit a DOM-based XSS via JavaScript sink manipulation." },

  // ── Web - Serveur ───────────────────────────────────────────────────────
  { id: 301, title: "HTML - Source code", category: "Web - Serveur", score: 5, skills: ["html", "view-source"], description: "Find the password hidden in HTML comments." },
  { id: 302, title: "HTTP - User-agent", category: "Web - Serveur", score: 10, skills: ["http", "headers"], description: "Spoof the User-Agent header to gain access." },
  { id: 303, title: "HTTP - Directory indexing", category: "Web - Serveur", score: 15, skills: ["http", "enumeration"], description: "Explore directory listings to find hidden files." },
  { id: 304, title: "HTTP - Cookies", category: "Web - Serveur", score: 15, skills: ["http", "cookies", "tampering"], description: "Modify cookie values to bypass authentication." },
  { id: 305, title: "SQL injection - Authentication", category: "Web - Serveur", score: 25, skills: ["sqli", "authentication-bypass"], description: "Bypass login with a basic SQL injection." },
  { id: 306, title: "PHP - Command injection", category: "Web - Serveur", score: 25, skills: ["command-injection", "php"], description: "Inject OS commands through a PHP application." },
  { id: 307, title: "Local File Inclusion", category: "Web - Serveur", score: 25, skills: ["lfi", "path-traversal"], description: "Read server files via Local File Inclusion." },
  { id: 308, title: "SQL injection - String", category: "Web - Serveur", score: 30, skills: ["sqli", "union", "data-extraction"], description: "Extract data with UNION-based SQL injection." },

  // ── Cryptanalyse ───────────────────────────────────────────────────────
  { id: 401, title: "Encoding - ASCII", category: "Cryptanalyse", score: 5, skills: ["encoding", "ascii"], description: "Decode an ASCII-encoded message." },
  { id: 402, title: "Encoding - UU", category: "Cryptanalyse", score: 5, skills: ["encoding", "uuencode"], description: "Decode a UU-encoded message." },
  { id: 403, title: "Hash - Message Digest 5", category: "Cryptanalyse", score: 10, skills: ["hash", "md5", "cracking"], description: "Crack an MD5 hash to recover the password." },
  { id: 404, title: "Shift cipher", category: "Cryptanalyse", score: 10, skills: ["cipher", "caesar", "frequency-analysis"], description: "Break a shift cipher using frequency analysis." },
  { id: 405, title: "File - PKZIP", category: "Cryptanalyse", score: 15, skills: ["archive", "known-plaintext"], description: "Crack a password-protected ZIP archive." },
  { id: 406, title: "Transposition - Rail Fence", category: "Cryptanalyse", score: 20, skills: ["cipher", "transposition"], description: "Decode a rail fence transposition cipher." },

  // ── Réseau ─────────────────────────────────────────────────────────────
  { id: 501, title: "FTP - authentication", category: "Réseau", score: 5, skills: ["ftp", "pcap", "wireshark"], description: "Extract FTP credentials from a network capture." },
  { id: 502, title: "TELNET - authentication", category: "Réseau", score: 5, skills: ["telnet", "pcap", "wireshark"], description: "Extract Telnet credentials from a network capture." },
  { id: 503, title: "Ethernet - frame", category: "Réseau", score: 10, skills: ["ethernet", "hex", "protocol-analysis"], description: "Decode raw Ethernet frame data." },
  { id: 504, title: "DNS - zone transfer", category: "Réseau", score: 15, skills: ["dns", "axfr", "enumeration"], description: "Perform a DNS zone transfer to discover records." },
  { id: 505, title: "Bluetooth - Unknown file", category: "Réseau", score: 15, skills: ["bluetooth", "obex", "protocol-analysis"], description: "Analyze a Bluetooth protocol capture." },

  // ── Forensique ─────────────────────────────────────────────────────────
  { id: 601, title: "Command & Control - level 2", category: "Forensique", score: 10, skills: ["c2", "pcap", "malware-analysis"], description: "Identify C2 communication in a network capture." },
  { id: 602, title: "Find the cat", category: "Forensique", score: 15, skills: ["steganography", "metadata", "forensics"], description: "Find hidden data in an image file." },
  { id: 603, title: "Docker layers", category: "Forensique", score: 20, skills: ["docker", "forensics", "layers"], description: "Analyze Docker image layers for hidden secrets." },
  { id: 604, title: "Logs analysis - web attack", category: "Forensique", score: 25, skills: ["log-analysis", "web", "forensics"], description: "Analyze web server logs to identify an attack." },
];

const RM_TITLE_ALIASES: Record<string, string[]> = {
  "elf x86 - basic": ["elf x86 - basique"],
  "ftp - authentication": ["ftp - authentification"],
  "telnet - authentication": ["telnet - authentification"],
  "sql injection - authentication": ["sql injection - authentification"],
  "javascript - authentication": ["javascript - authentification"],
  "javascript - authentication 2": ["javascript - authentification 2"],
};

export function isRmTitleSolved(catalogTitle: string, solvedTitles: Set<string>): boolean {
  const lower = catalogTitle.toLowerCase();
  if (solvedTitles.has(lower)) return true;
  const aliases = RM_TITLE_ALIASES[lower];
  if (aliases) {
    for (const alias of aliases) {
      if (solvedTitles.has(alias)) return true;
    }
  }
  return false;
}

export function getRootmeChallengesByCategory(category: string): RootmeChallenge[] {
  return ROOTME_CHALLENGE_CATALOG.filter((c) => c.category === category)
    .sort((a, b) => a.score - b.score);
}

export function getUnsolvedRootmeChallenges(
  category: string,
  solvedTitles: Set<string>
): RootmeChallenge[] {
  return getRootmeChallengesByCategory(category)
    .filter((c) => !isRmTitleSolved(c.title, solvedTitles));
}

export function pickRootmeChallenges(
  category: string,
  solvedTitles: Set<string>,
  count: number = 3
): RootmeChallenge[] {
  return getUnsolvedRootmeChallenges(category, solvedTitles).slice(0, count);
}

const SKILL_TO_CHALLENGE_TAGS: Record<string, string[]> = {
  threading: ["race-condition", "toctou"],
  concurrency: ["race-condition", "toctou"],
  "process-management": ["shellcode", "environment"],
  shell: ["command-injection"],
  http: ["http", "headers", "cookies"],
  cryptography: ["cipher", "hash", "encoding"],
  "reverse-engineering": ["elf", "ghidra", "x86", "x64"],
  networking: ["ftp", "dns", "pcap", "wireshark"],
  docker: ["docker", "layers"],
  forensics: ["forensics", "log-analysis", "steganography"],
};

export function pickRootmeChallengeForSkill(
  category: string,
  skill: string,
  solvedTitles: Set<string>,
): RootmeChallenge | undefined {
  const unsolved = getUnsolvedRootmeChallenges(category, solvedTitles);
  const tags = SKILL_TO_CHALLENGE_TAGS[skill];
  if (tags) {
    const match = unsolved.find((c) =>
      c.skills.some((s) => tags.includes(s))
    );
    if (match) return match;
  }
  return unsolved[0];
}
