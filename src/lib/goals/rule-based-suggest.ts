import { COMPETENCIES } from "@/lib/mentor/competency-map";
import type { SignalResult } from "@/lib/mentor/competency-signals";
import { getRootmeChallengesByCategory } from "@/lib/mentor/rootme-challenge-catalog";

type SuggestedTask = { title: string; ftSlug?: string; description?: string };
type SuggestedIssue = {
  title: string;
  deadline?: string;
  description?: string;
  tasks: SuggestedTask[];
};
export type GoalSuggestionTree = {
  epic: {
    title: string;
    platform: string;
    metricSource?: string;
    targetValue?: number;
    deadline?: string;
  };
  issues: SuggestedIssue[];
  reasoning: string;
};

function addMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

type Template = {
  epic: { title: string; platform: string };
  issues: { title: string; monthOffset: number; tasks: SuggestedTask[] }[];
  reasoning: string;
  requires?: string[];
};

function catalogTasks(category: string, count: number): SuggestedTask[] {
  const challenges = getRootmeChallengesByCategory(category).slice(0, count);
  if (challenges.length === 0) {
    return [{ title: `Solve ${count} Root-me '${category}' challenges` }];
  }
  return challenges.map((ch) => ({
    title: `RM: ${ch.title} (${ch.score}pts)`,
    description: ch.description,
  }));
}

function crackingTasks(): SuggestedTask[] {
  return [
    ...catalogTasks("Cracking", 3),
    ...catalogTasks("App - Système", 2),
  ];
}

function webTasks(): SuggestedTask[] {
  return [
    ...catalogTasks("Web - Serveur", 3),
    ...catalogTasks("Web - Client", 2),
  ];
}

function binexpTasks(): SuggestedTask[] {
  return catalogTasks("App - Système", 4);
}

const TEMPLATES: Record<string, Template> = {
  "c-core": {
    epic: { title: "C Fundamentals Mastery", platform: "42" },
    issues: [
      {
        title: "Core 42 C projects",
        monthOffset: 2,
        tasks: [
          { title: "Complete libft with all bonus functions", ftSlug: "libft" },
          {
            title: "Implement ft_printf with all format specifiers",
            ftSlug: "ft_printf",
          },
          {
            title: "Build get_next_line with bonus (multiple FDs)",
            ftSlug: "get_next_line",
          },
        ],
      },
      {
        title: "Deepen memory management",
        monthOffset: 3,
        tasks: [
          { title: "Solve 3 Root-me 'Programmation' challenges in C", description: "https://www.root-me.org/en/Challenges/Programming/" },
          { title: "Write a custom memory allocator (malloc clone)" },
        ],
      },
    ],
    reasoning:
      "C fundamentals underpin everything in systems programming and maldev — solidify these first.",
  },
  "c-systems": {
    requires: ["c-core"],
    epic: { title: "Unix Systems Programming", platform: "42" },
    issues: [
      {
        title: "Process and thread management",
        monthOffset: 2,
        tasks: [
          {
            title: "Complete Philosophers (threading, mutexes)",
            ftSlug: "philosophers",
          },
          { title: "Complete Pipex (pipes, fork, exec)", ftSlug: "pipex" },
        ],
      },
      {
        title: "Build Minishell",
        monthOffset: 3,
        tasks: [
          {
            title: "Implement command parsing and execution",
            ftSlug: "minishell",
          },
          { title: "Add pipes, redirections, and signal handling" },
          { title: "Pass all mandatory test cases" },
        ],
      },
    ],
    reasoning:
      "Systems programming in C is essential for malware development — processes, IPC, and signals are the building blocks.",
  },
  algorithms: {
    epic: { title: "Algorithm Skills for CTF", platform: "42" },
    issues: [
      {
        title: "42 algorithm project",
        monthOffset: 1,
        tasks: [
          {
            title: "Complete Push_swap with optimal move count",
            ftSlug: "push_swap",
          },
          {
            title: "Implement and benchmark different sorting strategies",
          },
        ],
      },
      {
        title: "Competitive problem solving",
        monthOffset: 3,
        tasks: [
          { title: "Solve 5 Root-me 'Programmation' challenges", description: "https://www.root-me.org/en/Challenges/Programming/" },
          {
            title: "Practice 10 algorithmic CTF challenges on HackTheBox",
          },
        ],
      },
    ],
    reasoning:
      "Algorithmic problem-solving speeds up CTF performance and exploit development.",
  },
  "cpp-oop": {
    epic: { title: "C++ Module Progression", platform: "42" },
    issues: [
      {
        title: "Core C++ modules (00-04)",
        monthOffset: 2,
        tasks: [
          {
            title: "Complete CPP Module 00-01 (classes, references)",
            ftSlug: "cpp00",
          },
          { title: "Complete CPP Module 02-04 (polymorphism, inheritance)" },
        ],
      },
      {
        title: "Advanced C++ modules (05-09)",
        monthOffset: 3,
        tasks: [
          { title: "Complete CPP Module 05-06 (exceptions, casts)" },
          { title: "Complete CPP Module 07-09 (templates, STL, iterators)" },
        ],
      },
    ],
    reasoning:
      "C++ OOP skills expand your tooling capabilities — many security tools and implants use C++.",
    requires: ["c-core"],
  },
  "win-internals": {
    requires: ["c-core"],
    epic: { title: "Windows Internals Deep Dive", platform: "maldev" },
    issues: [
      {
        title: "PE format and process internals",
        monthOffset: 1,
        tasks: [
          {
            title: "Study PE structure: headers, sections, imports/exports",
          },
          { title: "Write a PE parser that extracts the import table" },
          { title: "Map the PEB/TEB structures in a debugger" },
        ],
      },
      {
        title: "Win32 API for offensive use",
        monthOffset: 2,
        tasks: [
          {
            title:
              "Practice VirtualAlloc / WriteProcessMemory / CreateRemoteThread",
          },
          { title: "Enumerate running processes and modules via API" },
          { title: "Root an HTB Windows machine using API knowledge" },
        ],
      },
    ],
    reasoning:
      "Windows internals are the foundation of malware development — PE format and Win32 API unlock injection techniques.",
  },
  "maldev-techniques": {
    requires: ["c-core", "win-internals"],
    epic: { title: "Malware Development Fundamentals", platform: "maldev" },
    issues: [
      {
        title: "Shellcode and injection basics",
        monthOffset: 1,
        tasks: [
          { title: "Write position-independent shellcode for Windows" },
          {
            title: "Implement classic DLL injection via CreateRemoteThread",
          },
          { title: "Build a reflective DLL loader" },
        ],
      },
      {
        title: "Payload staging and C2 basics",
        monthOffset: 2,
        tasks: [
          { title: "Build a basic HTTP stager in C" },
          { title: "Implement a simple callback mechanism" },
          { title: "Add basic XOR encryption for payload delivery" },
        ],
      },
      {
        title: "Progress through maldev elearning",
        monthOffset: 3,
        tasks: [
          { title: "Complete next 3 modules in the maldev course" },
          { title: "Reproduce each technique in a lab environment" },
        ],
      },
    ],
    reasoning:
      "Malware development is your core objective — structured practice with real techniques builds the skills you need.",
  },
  evasion: {
    epic: { title: "AV/EDR Evasion Techniques", platform: "maldev" },
    issues: [
      {
        title: "Static evasion fundamentals",
        monthOffset: 1,
        tasks: [
          {
            title: "Implement string encryption (XOR, AES) in a payload",
          },
          { title: "Use API hashing to hide import calls" },
          { title: "Test detection rate on an isolated Windows VM" },
        ],
      },
      {
        title: "Runtime evasion",
        monthOffset: 2,
        tasks: [
          {
            title: "Implement direct syscalls to bypass userland hooks",
          },
          { title: "Build a payload that unhooks ntdll.dll" },
          { title: "Root an HTB Windows machine with AV enabled" },
        ],
      },
    ],
    reasoning:
      "Evasion is where maldev meets real-world impact — static and runtime techniques are essential for red team ops.",
    requires: ["win-internals", "maldev-techniques"],
  },
  "reverse-engineering": {
    epic: { title: "Reverse Engineering Proficiency", platform: "rootme" },
    issues: [
      {
        title: "Root-me cracking challenges",
        monthOffset: 1,
        tasks: crackingTasks(),
      },
      {
        title: "Binary analysis with Ghidra",
        monthOffset: 2,
        tasks: [
          { title: "Reverse 3 CTF binaries using Ghidra decompiler" },
          { title: "Analyze a real malware sample in a sandbox" },
        ],
      },
      {
        title: "HTB reversing practice",
        monthOffset: 3,
        tasks: [
          { title: "Solve 3 HackTheBox Reversing challenges", description: "https://app.hackthebox.com/challenges?category=reversing" },
          { title: "Root an HTB machine requiring binary analysis", description: "https://app.hackthebox.com/machines" },
        ],
      },
    ],
    reasoning:
      "Reverse engineering is critical for malware analysis and exploit development — Root-me and HTB provide structured practice.",
  },
  "linux-admin": {
    epic: { title: "Linux Administration and Hardening", platform: "42" },
    issues: [
      {
        title: "42 Linux projects",
        monthOffset: 2,
        tasks: [
          {
            title: "Complete Born2beRoot (system administration)",
            ftSlug: "born2beroot",
          },
          { title: "Set up SSH, sudo, UFW, and password policies" },
        ],
      },
      {
        title: "Offensive Linux skills on HTB",
        monthOffset: 3,
        tasks: [
          { title: "Root 3 easy HTB Linux machines" },
          { title: "Practice Linux privilege escalation techniques" },
          {
            title:
              "Document privesc methodology (SUID, cron, capabilities)",
          },
        ],
      },
    ],
    reasoning:
      "Linux admin skills are essential for both red and blue team — master the fundamentals before attacking them.",
  },
  "containers-infra": {
    epic: {
      title: "Container Security and Infrastructure",
      platform: "42",
    },
    issues: [
      {
        title: "Docker and container fundamentals",
        monthOffset: 1,
        tasks: [
          {
            title: "Complete Inception project (Docker, compose)",
            ftSlug: "inception",
          },
          { title: "Build a multi-container lab environment" },
        ],
      },
      {
        title: "Container security",
        monthOffset: 3,
        tasks: [
          { title: "Practice Docker escape techniques on HTB" },
          {
            title: "Audit a Dockerfile for security misconfigurations",
          },
        ],
      },
    ],
    reasoning:
      "Containers are everywhere in modern infrastructure — understanding them unlocks new attack surfaces.",
    requires: ["linux-admin"],
  },
  "net-fundamentals": {
    epic: { title: "Networking Foundations for Pentesting", platform: "42" },
    issues: [
      {
        title: "Core networking concepts",
        monthOffset: 1,
        tasks: [
          {
            title: "Complete NetPractice (subnetting, routing)",
            ftSlug: "netpractice",
          },
          { title: "Solve 3 Root-me 'Réseau' challenges", description: "https://www.root-me.org/en/Challenges/Network/" },
        ],
      },
      {
        title: "Packet analysis and protocols",
        monthOffset: 2,
        tasks: [
          {
            title: "Analyze 5 PCAPs with Wireshark (HTTP, DNS, TCP)",
          },
          { title: "Write a Python packet sniffer using scapy" },
        ],
      },
    ],
    reasoning:
      "Solid networking fundamentals accelerate every other area — scanning, pivoting, and protocol attacks all depend on them.",
  },
  "net-attacks": {
    epic: {
      title: "Network Enumeration and Exploitation",
      platform: "htb",
    },
    issues: [
      {
        title: "HackTheBox machine practice",
        monthOffset: 2,
        tasks: [
          {
            title: "Root 5 easy HTB machines (focus on enumeration)",
          },
          {
            title:
              "Document your methodology: Nmap → service enum → exploit",
          },
          {
            title:
              "Practice pivoting on an HTB machine with multiple interfaces",
          },
        ],
      },
      {
        title: "Advanced network attacks",
        monthOffset: 3,
        tasks: [
          {
            title: "Complete HTB Academy 'Network Enumeration with Nmap'",
          },
          { title: "Practice MITM attacks in a lab environment" },
          { title: "Write an automated service enumeration script" },
        ],
      },
    ],
    reasoning:
      "Network enumeration is the entry point to every engagement — HTB machines provide realistic practice.",
    requires: ["net-fundamentals"],
  },
  "web-fundamentals": {
    epic: { title: "Web Development for Security", platform: "42" },
    issues: [
      {
        title: "42 web projects",
        monthOffset: 2,
        tasks: [
          {
            title: "Complete Webserv (HTTP server in C++)",
            ftSlug: "webserv",
          },
          {
            title: "Understand HTTP methods, headers, and status codes",
          },
        ],
      },
      {
        title: "Backend security patterns",
        monthOffset: 3,
        tasks: [
          { title: "Build a simple web app with auth and sessions" },
          {
            title:
              "Identify and fix 3 OWASP vulnerabilities in your own code",
          },
        ],
      },
    ],
    reasoning:
      "Understanding how web apps are built makes you better at breaking them — build one to learn the attack surface.",
  },
  "web-security": {
    epic: { title: "Web Application Exploitation", platform: "htb" },
    issues: [
      {
        title: "HackTheBox web challenges",
        monthOffset: 1,
        tasks: [
          { title: "Solve 5 HTB web challenges (SQLi, XSS, SSRF)" },
          { title: "Root 2 HTB machines with web attack vectors" },
        ],
      },
      {
        title: "Root-me web exploitation",
        monthOffset: 2,
        tasks: webTasks(),
      },
      {
        title: "Web exploit development",
        monthOffset: 3,
        tasks: [
          {
            title:
              "Write a Python script to automate blind SQL injection",
          },
          {
            title:
              "Chain 2 vulnerabilities on an HTB machine for RCE",
          },
        ],
      },
    ],
    reasoning:
      "Web security is a critical attack surface — practical HTB and Root-me challenges build real exploitation skills.",
    requires: ["web-fundamentals"],
  },
  "ad-fundamentals": {
    epic: { title: "Active Directory Attack Path", platform: "htb" },
    issues: [
      {
        title: "AD fundamentals on HackTheBox",
        monthOffset: 2,
        tasks: [
          {
            title:
              "Complete HTB Academy 'Introduction to Active Directory'",
          },
          { title: "Root 2 HTB machines with AD attack vectors" },
          { title: "Practice Kerberoasting and AS-REP Roasting" },
        ],
      },
      {
        title: "Lateral movement and persistence",
        monthOffset: 3,
        tasks: [
          {
            title: "Practice Pass-the-Hash and Pass-the-Ticket attacks",
          },
          { title: "Use BloodHound to map AD attack paths" },
          {
            title: "Root an HTB machine requiring AD exploitation",
          },
        ],
      },
    ],
    reasoning:
      "Active Directory is in nearly every enterprise — mastering AD attacks is essential for internal pentests.",
    requires: ["net-fundamentals"],
  },
  "recon-osint": {
    epic: { title: "Reconnaissance and OSINT Skills", platform: "htb" },
    issues: [
      {
        title: "OSINT fundamentals",
        monthOffset: 1,
        tasks: [
          {
            title: "Complete HTB Academy 'OSINT: Corporate Recon'",
          },
          {
            title: "Practice subdomain enumeration on bug bounty targets",
          },
          {
            title:
              "Build an automated recon script (amass + httpx + nuclei)",
          },
        ],
      },
      {
        title: "Advanced reconnaissance",
        monthOffset: 3,
        tasks: [
          {
            title:
              "Map an organization's attack surface from public data only",
          },
          { title: "Use Shodan/Censys to find exposed services" },
        ],
      },
    ],
    reasoning:
      "Good recon wins engagements before exploitation starts — build systematic enumeration skills.",
    requires: ["net-fundamentals"],
  },
  crypto: {
    epic: {
      title: "Applied Cryptography and Cryptanalysis",
      platform: "rootme",
    },
    issues: [
      {
        title: "Root-me crypto challenges",
        monthOffset: 2,
        tasks: [
          {
            title:
              "Solve 5 Root-me 'Cryptanalyse' challenges (classical ciphers)",
            description: "https://www.root-me.org/en/Challenges/Cryptanalysis/",
          },
          {
            title:
              "Solve 3 Root-me 'Cryptanalyse' challenges (modern crypto)",
            description: "https://www.root-me.org/en/Challenges/Cryptanalysis/",
          },
        ],
      },
      {
        title: "CTF crypto practice",
        monthOffset: 3,
        tasks: [
          { title: "Solve 3 HackTheBox crypto challenges" },
          {
            title:
              "Break a weak RSA implementation (small e, shared factors)",
          },
          { title: "Implement a padding oracle attack" },
        ],
      },
    ],
    reasoning:
      "Crypto weaknesses appear in CTFs and real targets — Root-me provides excellent structured challenges.",
  },
  forensics: {
    epic: {
      title: "Digital Forensics and Incident Response",
      platform: "htb",
    },
    issues: [
      {
        title: "Memory and disk forensics",
        monthOffset: 2,
        tasks: [
          { title: "Analyze 3 memory dumps with Volatility3" },
          { title: "Solve 3 HackTheBox forensics challenges" },
          { title: "Solve 3 Root-me 'Forensique' challenges", description: "https://www.root-me.org/en/Challenges/Forensic/" },
        ],
      },
      {
        title: "Steganography and data recovery",
        monthOffset: 3,
        tasks: [
          { title: "Solve 3 Root-me 'Stéganographie' challenges", description: "https://www.root-me.org/en/Challenges/Steganography/" },
          { title: "Practice file carving and metadata analysis" },
        ],
      },
    ],
    reasoning:
      "Forensics skills complement red team work — understanding evidence helps you avoid leaving traces.",
  },
  scripting: {
    epic: {
      title: "Security Scripting and Automation",
      platform: "rootme",
    },
    issues: [
      {
        title: "Python for security",
        monthOffset: 1,
        tasks: [
          {
            title: "Solve 5 Root-me 'Programmation' challenges in Python",
          },
          { title: "Write a port scanner with banner grabbing" },
          { title: "Build a reverse shell handler in Python" },
        ],
      },
      {
        title: "Bash and automation",
        monthOffset: 2,
        tasks: [
          { title: "Solve 3 Root-me 'App - Script' challenges", description: "https://www.root-me.org/en/Challenges/App-Script/" },
          { title: "Automate Nmap → Gobuster → Nuclei workflow" },
        ],
      },
    ],
    reasoning:
      "Automation multiplies your effectiveness — script the boring stuff so you can focus on exploitation.",
  },
  binexp: {
    epic: {
      title: "Binary Exploitation Fundamentals",
      platform: "rootme",
    },
    issues: [
      {
        title: "Stack-based exploitation",
        monthOffset: 2,
        tasks: [
          ...binexpTasks(),
          { title: "Exploit a binary with NX enabled (ROP chain)" },
        ],
      },
      {
        title: "Heap and advanced exploitation",
        monthOffset: 3,
        tasks: [
          { title: "Solve 3 HackTheBox pwn challenges" },
          {
            title:
              "Practice heap exploitation (use-after-free, double-free)",
          },
          { title: "Build a pwntools template for CTF exploits" },
        ],
      },
    ],
    reasoning:
      "Binary exploitation is a high-value skill for red team — Root-me and HTB offer progressive difficulty.",
    requires: ["c-core"],
  },
};

const ADVANCED_TEMPLATE: Template = {
  epic: { title: "Red Team Capstone Project", platform: "htb" },
  issues: [
    {
      title: "Build a custom C2 framework",
      monthOffset: 2,
      tasks: [
        { title: "Design a modular implant architecture in C" },
        { title: "Implement HTTP/S C2 communication channel" },
        { title: "Add basic tasking: shell, upload, download" },
      ],
    },
    {
      title: "HTB ProLabs or Endgame",
      monthOffset: 3,
      tasks: [
        { title: "Complete an HTB Pro Lab (e.g., RastaLabs, Offshore)" },
        { title: "Document the full attack chain from recon to DA" },
      ],
    },
  ],
  reasoning:
    "Your fundamentals are solid — time to put it all together with a capstone project that simulates real engagements.",
};

export function suggestRuleBased(
  signals: Record<string, SignalResult>,
  existingGoalTitles: string[],
): GoalSuggestionTree {
  const ranked = COMPETENCIES.map((c) => ({
    id: c.id,
    label: c.label,
    level: signals[c.id]?.autoLevel ?? 0,
  })).sort((a, b) => a.level - b.level);

  const existingLower = existingGoalTitles.map((t) => t.toLowerCase());

  const candidates: { id: string; tmpl: Template }[] = [];
  const minLevel = ranked[0]?.level ?? 0;

  for (const comp of ranked) {
    if (comp.level > minLevel + 1) break;
    const tmpl = TEMPLATES[comp.id];
    if (!tmpl) continue;
    if (tmpl.requires?.some((reqId) => (signals[reqId]?.autoLevel ?? 0) < 1)) continue;
    const epicLower = tmpl.epic.title.toLowerCase();
    const duplicate = existingLower.some(
      (t) => t.includes(epicLower) || epicLower.includes(t),
    );
    if (duplicate) continue;
    candidates.push({ id: comp.id, tmpl });
  }

  let chosen: Template;
  let chosenId: string;

  if (candidates.length > 0) {
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    chosen = pick.tmpl;
    chosenId = pick.id;
  } else {
    chosen = ADVANCED_TEMPLATE;
    chosenId = "advanced";
  }

  const epicDeadline = addMonths(3);

  return {
    epic: {
      title: chosen.epic.title,
      platform: chosen.epic.platform,
      deadline: epicDeadline,
    },
    issues: chosen.issues.map((iss) => ({
      title: iss.title,
      deadline: addMonths(iss.monthOffset),
      tasks: iss.tasks,
    })),
    reasoning: `[Targeting weakest area: ${chosenId}] ${chosen.reasoning}`,
  };
}
