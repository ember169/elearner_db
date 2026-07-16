export type FtProject = {
  slug: string;
  name: string;
  circle: number; // 0-6 in the holy graph
  prerequisites: string[];
  skills: string[];
  description: string;
  estimatedHours: number;
  // Some circles have choices (e.g., circle 2 graphics: so_long OR FdF OR fract-ol)
  group?: string; // projects in the same group are alternatives
};

// 42 Paris Common Core project tree (Holy Graph)
// Circle 0-6 with dependencies
export const FT_COMMON_CORE: FtProject[] = [
  // --- Circle 0 ---
  {
    slug: "libft",
    name: "Libft",
    circle: 0,
    prerequisites: [],
    skills: ["c", "algorithms", "memory-management"],
    description:
      "Recode a set of libc functions plus utility functions for strings, memory, and linked lists.",
    estimatedHours: 70,
  },

  // --- Circle 1 ---
  {
    slug: "ft_printf",
    name: "ft_printf",
    circle: 1,
    prerequisites: ["libft"],
    skills: ["c", "variadic-functions", "parsing"],
    description: "Recode printf with support for common conversions.",
    estimatedHours: 50,
  },
  {
    slug: "get_next_line",
    name: "get_next_line",
    circle: 1,
    prerequisites: ["libft"],
    skills: ["c", "file-descriptors", "memory-management", "static-variables"],
    description:
      "Write a function that reads a line from a file descriptor.",
    estimatedHours: 30,
  },
  {
    slug: "born2beroot",
    name: "Born2beRoot",
    circle: 1,
    prerequisites: ["libft"],
    skills: [
      "system-administration",
      "virtualization",
      "networking",
      "security",
    ],
    description:
      "Set up a virtual machine with strict security rules, SSH, firewall, password policies.",
    estimatedHours: 40,
  },

  // --- Circle 2 ---
  {
    slug: "minitalk",
    name: "Minitalk",
    circle: 2,
    prerequisites: ["ft_printf", "get_next_line", "born2beroot"],
    skills: ["c", "unix-signals", "inter-process-communication"],
    description:
      "Create a communication program using UNIX signals (SIGUSR1/SIGUSR2).",
    estimatedHours: 30,
    group: "circle2-ipc",
  },
  {
    slug: "pipex",
    name: "Pipex",
    circle: 2,
    prerequisites: ["ft_printf", "get_next_line", "born2beroot"],
    skills: ["c", "unix-pipes", "process-management", "file-descriptors"],
    description:
      "Reproduce the behavior of shell pipe redirections (< infile cmd1 | cmd2 > outfile).",
    estimatedHours: 40,
    group: "circle2-ipc",
  },
  {
    slug: "so_long",
    name: "so_long",
    circle: 2,
    prerequisites: ["ft_printf", "get_next_line", "born2beroot"],
    skills: ["c", "graphics", "game-development", "event-handling"],
    description:
      "Create a small 2D game using MiniLibX to learn about textures, sprites, and basic gameplay.",
    estimatedHours: 50,
    group: "circle2-graphics",
  },
  {
    slug: "fdf",
    name: "FdF",
    circle: 2,
    prerequisites: ["ft_printf", "get_next_line", "born2beroot"],
    skills: ["c", "graphics", "3d-math", "projections"],
    description:
      "Create a wireframe 3D model viewer using isometric projection.",
    estimatedHours: 50,
    group: "circle2-graphics",
  },
  {
    slug: "fract-ol",
    name: "Fract-ol",
    circle: 2,
    prerequisites: ["ft_printf", "get_next_line", "born2beroot"],
    skills: ["c", "graphics", "mathematics", "fractals"],
    description:
      "Create a fractal explorer (Mandelbrot, Julia sets) with zoom and colors.",
    estimatedHours: 40,
    group: "circle2-graphics",
  },
  {
    slug: "push_swap",
    name: "Push_swap",
    circle: 2,
    prerequisites: ["ft_printf", "get_next_line", "born2beroot"],
    skills: ["c", "algorithms", "sorting", "complexity-analysis"],
    description:
      "Sort a stack of integers using a limited set of operations in the fewest moves.",
    estimatedHours: 60,
  },

  // --- Circle 3 ---
  {
    slug: "philosophers",
    name: "Philosophers",
    circle: 3,
    prerequisites: ["push_swap"],
    skills: ["c", "threading", "mutexes", "concurrency", "deadlock-prevention"],
    description:
      "Solve the dining philosophers problem using threads and mutexes.",
    estimatedHours: 50,
  },
  {
    slug: "minishell",
    name: "Minishell",
    circle: 3,
    prerequisites: ["push_swap"],
    skills: [
      "c",
      "shell",
      "parsing",
      "process-management",
      "file-descriptors",
      "signals",
    ],
    description:
      "Create a simple shell that handles pipes, redirections, environment variables, and builtins.",
    estimatedHours: 120,
  },

  // --- Circle 4 ---
  {
    slug: "cub3d",
    name: "Cub3D",
    circle: 4,
    prerequisites: ["philosophers", "minishell"],
    skills: ["c", "graphics", "raycasting", "3d-math", "game-development"],
    description:
      "Create a Wolfenstein3D-inspired raycasting engine with textured walls.",
    estimatedHours: 100,
    group: "circle4-graphics",
  },
  {
    slug: "minirt",
    name: "MiniRT",
    circle: 4,
    prerequisites: ["philosophers", "minishell"],
    skills: [
      "c",
      "graphics",
      "ray-tracing",
      "3d-math",
      "lighting",
      "geometry",
    ],
    description:
      "Build a basic ray tracer rendering spheres, planes, and cylinders with lighting.",
    estimatedHours: 120,
    group: "circle4-graphics",
  },
  {
    slug: "netpractice",
    name: "NetPractice",
    circle: 4,
    prerequisites: ["philosophers", "minishell"],
    skills: ["networking", "tcp-ip", "subnetting", "routing"],
    description:
      "Solve networking exercises: subnetting, routing tables, IP addressing.",
    estimatedHours: 15,
  },

  // --- Circle 5 ---
  {
    slug: "cpp00",
    name: "CPP Module 00",
    circle: 5,
    prerequisites: ["netpractice"],
    skills: ["cpp", "oop", "namespaces", "classes", "member-functions"],
    description:
      "Introduction to C++: namespaces, classes, member functions, stdio streams, initialization lists.",
    estimatedHours: 15,
  },
  {
    slug: "cpp01",
    name: "CPP Module 01",
    circle: 5,
    prerequisites: ["cpp00"],
    skills: ["cpp", "memory-allocation", "pointers", "references", "filestreams"],
    description:
      "Memory allocation, pointers to members, references, switch statement.",
    estimatedHours: 15,
  },
  {
    slug: "cpp02",
    name: "CPP Module 02",
    circle: 5,
    prerequisites: ["cpp01"],
    skills: ["cpp", "operator-overloading", "orthodox-canonical-form", "fixed-point"],
    description:
      "Ad-hoc polymorphism, operator overloading, orthodox canonical class form.",
    estimatedHours: 15,
  },
  {
    slug: "cpp03",
    name: "CPP Module 03",
    circle: 5,
    prerequisites: ["cpp02"],
    skills: ["cpp", "inheritance", "diamond-problem"],
    description: "Inheritance in C++.",
    estimatedHours: 10,
  },
  {
    slug: "cpp04",
    name: "CPP Module 04",
    circle: 5,
    prerequisites: ["cpp03"],
    skills: ["cpp", "polymorphism", "abstract-classes", "interfaces"],
    description:
      "Subtype polymorphism, abstract classes, interfaces.",
    estimatedHours: 15,
  },
  {
    slug: "cpp05",
    name: "CPP Module 05",
    circle: 5,
    prerequisites: ["cpp04"],
    skills: ["cpp", "exceptions", "error-handling"],
    description: "Repetition and Exceptions.",
    estimatedHours: 15,
  },
  {
    slug: "cpp06",
    name: "CPP Module 06",
    circle: 5,
    prerequisites: ["cpp05"],
    skills: ["cpp", "type-casting", "serialization"],
    description: "C++ type casting (static, dynamic, reinterpret, const).",
    estimatedHours: 10,
  },
  {
    slug: "cpp07",
    name: "CPP Module 07",
    circle: 5,
    prerequisites: ["cpp06"],
    skills: ["cpp", "templates"],
    description: "C++ templates.",
    estimatedHours: 10,
  },
  {
    slug: "cpp08",
    name: "CPP Module 08",
    circle: 5,
    prerequisites: ["cpp07"],
    skills: ["cpp", "stl", "containers", "iterators", "algorithms"],
    description:
      "Templated containers, iterators, algorithms.",
    estimatedHours: 15,
  },
  {
    slug: "cpp09",
    name: "CPP Module 09",
    circle: 5,
    prerequisites: ["cpp08"],
    skills: ["cpp", "stl", "containers"],
    description: "STL containers.",
    estimatedHours: 20,
  },

  // --- Circle 5 (continued) ---
  {
    slug: "webserv",
    name: "Webserv",
    circle: 5,
    prerequisites: ["cpp09"],
    skills: [
      "cpp",
      "networking",
      "http",
      "sockets",
      "multiplexing",
      "web-server",
    ],
    description:
      "Write an HTTP server in C++ that handles GET, POST, DELETE, CGI, and configuration files.",
    estimatedHours: 150,
    group: "circle5-server",
  },
  {
    slug: "ft_irc",
    name: "ft_irc",
    circle: 5,
    prerequisites: ["cpp09"],
    skills: ["cpp", "networking", "sockets", "irc-protocol", "multiplexing"],
    description:
      "Build an IRC server in C++ compliant with RFC 2812.",
    estimatedHours: 120,
    group: "circle5-server",
  },

  // --- Circle 6 ---
  {
    slug: "inception",
    name: "Inception",
    circle: 6,
    prerequisites: ["cpp09"],
    skills: [
      "docker",
      "docker-compose",
      "system-administration",
      "networking",
      "nginx",
      "wordpress",
      "mariadb",
    ],
    description:
      "Set up a multi-container Docker infrastructure with NGINX, WordPress, and MariaDB.",
    estimatedHours: 80,
  },
  {
    slug: "ft_transcendence",
    name: "ft_transcendence",
    circle: 6,
    prerequisites: ["inception"],
    skills: [
      "web-development",
      "typescript",
      "frontend",
      "backend",
      "databases",
      "authentication",
      "websockets",
      "real-time",
    ],
    description:
      "Build a full-stack web application with a Pong game, chat, user management, and matchmaking.",
    estimatedHours: 200,
  },
];

// Skill categories that map across platforms
export const SKILL_CATEGORIES = {
  programming: {
    label: "Programming",
    skills: ["c", "cpp", "typescript", "python"],
  },
  systems: {
    label: "Systems & OS",
    skills: [
      "system-administration",
      "process-management",
      "threading",
      "unix-signals",
      "unix-pipes",
      "file-descriptors",
    ],
  },
  networking: {
    label: "Networking",
    skills: [
      "networking",
      "tcp-ip",
      "subnetting",
      "routing",
      "http",
      "sockets",
      "multiplexing",
    ],
  },
  security: {
    label: "Security",
    skills: [
      "security",
      "cryptography",
      "reverse-engineering",
      "web-security",
      "forensics",
    ],
  },
  algorithms: {
    label: "Algorithms & Data Structures",
    skills: [
      "algorithms",
      "sorting",
      "complexity-analysis",
      "memory-management",
    ],
  },
  web: {
    label: "Web Development",
    skills: [
      "web-development",
      "frontend",
      "backend",
      "databases",
      "authentication",
      "websockets",
    ],
  },
  devops: {
    label: "DevOps & Infra",
    skills: [
      "docker",
      "docker-compose",
      "virtualization",
      "nginx",
    ],
  },
};

// Maps cybersec platform categories to skill categories
export const PLATFORM_SKILL_MAPPING: Record<string, string[]> = {
  // Root-me categories
  "App - Script": ["web-security", "scripting"],
  "App - System": ["reverse-engineering", "binary-exploitation"],
  "App - Système": ["reverse-engineering", "binary-exploitation"],
  "Cracking": ["reverse-engineering"],
  "Cryptanalyse": ["cryptography"],
  "Cryptanalysis": ["cryptography"],
  "Forensic": ["forensics"],
  "Forensique": ["forensics"],
  "Network": ["networking", "security"],
  "Réseau": ["networking", "security"],
  "Programmation": ["algorithms", "scripting"],
  "Programming": ["algorithms", "scripting"],
  "Réaliste": ["web-security", "security"],
  "Realistic": ["web-security", "security"],
  "Stéganographie": ["forensics", "cryptography"],
  "Steganography": ["forensics", "cryptography"],
  "Web - Client": ["web-security", "frontend"],
  "Web - Serveur": ["web-security", "backend"],
  "Web - Server": ["web-security", "backend"],

  // THM/HTB general categories
  "web": ["web-security", "frontend", "backend"],
  "crypto": ["cryptography"],
  "forensics": ["forensics"],
  "reverse": ["reverse-engineering"],
  "pwn": ["binary-exploitation"],
  "misc": ["security"],
  "osint": ["security"],
  "steganography": ["forensics"],
  "networking": ["networking", "security"],
  "malware": ["reverse-engineering", "security"],
};

export function getProjectBySlug(slug: string): FtProject | undefined {
  return FT_COMMON_CORE.find(
    (p) =>
      p.slug === slug ||
      p.name.toLowerCase().replace(/[^a-z0-9]/g, "") ===
        slug.toLowerCase().replace(/[^a-z0-9]/g, "")
  );
}

// Groups model "choose one from this pool" — once any member of a group is
// completed, the whole pool counts as satisfied and its siblings drop out.
function satisfiedGroups(completed: Set<string>): Set<string> {
  const groups = new Set<string>();
  for (const p of FT_COMMON_CORE) {
    if (p.group && completed.has(p.slug)) groups.add(p.group);
  }
  return groups;
}

export function getAvailableProjects(completedSlugs: string[]): FtProject[] {
  const completed = new Set(completedSlugs.map((s) => s.toLowerCase()));
  const doneGroups = satisfiedGroups(completed);
  return FT_COMMON_CORE.filter((p) => {
    if (completed.has(p.slug)) return false;
    // A sibling of an already-chosen pool project is no longer a real option.
    if (p.group && doneGroups.has(p.group)) return false;
    return p.prerequisites.every((prereq) => completed.has(prereq));
  });
}

export function getCircleProgress(completedSlugs: string[]) {
  const completed = new Set(completedSlugs.map((s) => s.toLowerCase()));
  const circles: Record<number, { total: number; done: number }> = {};
  // Count each choice-pool as a single unit (one project out of the pool is
  // all a student does), and every ungrouped project individually.
  const seenGroups: Record<number, Set<string>> = {};
  for (const p of FT_COMMON_CORE) {
    if (!circles[p.circle]) {
      circles[p.circle] = { total: 0, done: 0 };
      seenGroups[p.circle] = new Set();
    }
    if (p.group) {
      if (seenGroups[p.circle].has(p.group)) continue; // pool already counted
      seenGroups[p.circle].add(p.group);
      circles[p.circle].total++;
      const anyDone = FT_COMMON_CORE.some(
        (q) => q.group === p.group && completed.has(q.slug)
      );
      if (anyDone) circles[p.circle].done++;
    } else {
      circles[p.circle].total++;
      if (completed.has(p.slug)) circles[p.circle].done++;
    }
  }
  return circles;
}
