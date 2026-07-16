// Role competency map for the user's objective: red-team / malware development
// with solid generalist foundations (networking, web, Linux). This is the
// "bigger picture" skill tree the mentor tracks and fills — both from
// deterministic synced signals (see competency-signals.ts) and from the LLM's
// periodic assessment. It replaces v1's flat, mixed-vocabulary skill profile.
//
// Each competency's `signals` are tokens interpreted by competency-signals.ts
// AND shown to the LLM as evidence hints. Signal grammar:
//   ft:<slug>       a specific validated 42 common-core project
//   ft-cpp          any validated 42 C++ module project (cpp00..cpp09)
//   maldev          maldev elearning overall progress
//   rm:<Category>   Root-me solves in a category (exact API category string)
//   htb-owns        HackTheBox machine owns (offensive practice signal)
//   thm:<category>  TryHackMe rooms mapped to a category (see thm-room-categories)

export const COMPETENCY_AREAS = [
  "Low-level & C",
  "Windows internals & maldev",
  "Linux & systems",
  "Networking",
  "Web",
  "Active Directory",
  "Recon & OSINT",
  "Crypto & forensics",
  "Scripting & automation",
] as const;

export type CompetencyArea = (typeof COMPETENCY_AREAS)[number];

export type Competency = {
  id: string;
  label: string;
  area: CompetencyArea;
  description: string;
  signals: string[];
};

export const COMPETENCIES: Competency[] = [
  // --- Low-level & C ---
  {
    id: "c-core",
    label: "C fundamentals",
    area: "Low-level & C",
    description:
      "Pointers, memory, the standard library, and reimplementing it from scratch.",
    signals: ["ft:libft", "ft:ft_printf", "ft:get_next_line"],
  },
  {
    id: "c-systems",
    label: "Systems programming in C",
    area: "Low-level & C",
    description:
      "Processes, threads, IPC, signals, pipes, and file descriptors in C.",
    signals: ["ft:minitalk", "ft:pipex", "ft:philosophers", "ft:minishell"],
  },
  {
    id: "algorithms",
    label: "Algorithms & problem solving",
    area: "Low-level & C",
    description:
      "Sorting, complexity, and algorithmic reasoning under constraints.",
    signals: ["ft:push_swap", "rm:Programmation"],
  },
  {
    id: "cpp-oop",
    label: "C++ & OOP",
    area: "Low-level & C",
    description: "Object orientation, RAII, templates, and the STL.",
    signals: ["ft-cpp"],
  },

  // --- Windows internals & maldev ---
  {
    id: "win-internals",
    label: "Windows internals",
    area: "Windows internals & maldev",
    description:
      "PE format, the loader, processes/threads, and the Win32/NT API surface.",
    signals: ["maldev"],
  },
  {
    id: "maldev-techniques",
    label: "Malware development techniques",
    area: "Windows internals & maldev",
    description:
      "Shellcode, process injection, persistence, and payload staging.",
    signals: ["maldev"],
  },
  {
    id: "evasion",
    label: "AV/EDR evasion",
    area: "Windows internals & maldev",
    description:
      "Obfuscation, unhooking, and defeating static/dynamic detection.",
    signals: ["maldev"],
  },
  {
    id: "reverse-engineering",
    label: "Reverse engineering",
    area: "Windows internals & maldev",
    description:
      "Static/dynamic binary analysis, disassembly, and debugging.",
    signals: ["rm:Cracking", "rm:App - Système", "thm:reverse"],
  },

  // --- Linux & systems ---
  {
    id: "linux-admin",
    label: "Linux administration & hardening",
    area: "Linux & systems",
    description:
      "Services, users, permissions, systemd, and baseline hardening.",
    signals: ["ft:born2beroot", "ft:inception"],
  },
  {
    id: "containers-infra",
    label: "Containers & infrastructure",
    area: "Linux & systems",
    description: "Docker, compose, virtualization, and reverse proxies.",
    signals: ["ft:inception"],
  },

  // --- Networking ---
  {
    id: "net-fundamentals",
    label: "Networking fundamentals",
    area: "Networking",
    description: "TCP/IP, subnetting, routing, and the OSI model.",
    signals: ["ft:netpractice", "rm:Réseau"],
  },
  {
    id: "net-attacks",
    label: "Network enumeration & services",
    area: "Networking",
    description:
      "Scanning, service enumeration, pivoting, and protocol attacks.",
    signals: ["htb-owns", "thm:misc"],
  },

  // --- Web ---
  {
    id: "web-fundamentals",
    label: "Web development",
    area: "Web",
    description: "HTTP, servers, frontend/backend, auth, and databases.",
    signals: ["ft:webserv", "ft:ft_transcendence"],
  },
  {
    id: "web-security",
    label: "Web application security",
    area: "Web",
    description:
      "OWASP Top 10: injection, XSS, auth flaws, and access control.",
    signals: ["rm:Web - Serveur", "rm:Web - Client", "rm:Réaliste", "thm:web"],
  },

  // --- Active Directory ---
  {
    id: "ad-fundamentals",
    label: "Active Directory attacks",
    area: "Active Directory",
    description:
      "AD structure, Kerberos, credential attacks, and lateral movement.",
    signals: ["htb-owns"],
  },

  // --- Recon & OSINT ---
  {
    id: "recon-osint",
    label: "Reconnaissance & OSINT",
    area: "Recon & OSINT",
    description: "Footprinting, information gathering, and open-source intel.",
    signals: ["thm:osint"],
  },

  // --- Crypto & forensics ---
  {
    id: "crypto",
    label: "Cryptography & cryptanalysis",
    area: "Crypto & forensics",
    description: "Primitives, common weaknesses, and breaking weak crypto.",
    signals: ["rm:Cryptanalyse", "thm:crypto"],
  },
  {
    id: "forensics",
    label: "Forensics & steganography",
    area: "Crypto & forensics",
    description: "Disk/memory forensics, artifact analysis, and hidden data.",
    signals: ["rm:Forensique", "rm:Stéganographie", "thm:forensics"],
  },

  // --- Scripting & automation ---
  {
    id: "scripting",
    label: "Scripting & automation",
    area: "Scripting & automation",
    description: "Python and Bash for tooling, glue, and exploit automation.",
    signals: ["rm:Programmation", "rm:App - Script"],
  },
  {
    id: "binexp",
    label: "Binary exploitation",
    area: "Scripting & automation",
    description: "Stack/heap overflows, shellcoding, and memory-corruption bugs.",
    signals: ["rm:App - Système", "thm:pwn"],
  },
];

export function getCompetency(id: string): Competency | undefined {
  return COMPETENCIES.find((c) => c.id === id);
}
