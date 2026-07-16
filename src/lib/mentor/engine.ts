import {
  runGuidanceEngine,
  type GuidanceResult,
} from "../guidance/engine";
import {
  computeCompetencySignals,
  type SignalResult,
} from "./competency-signals";
import { COMPETENCIES } from "./competency-map";
import { THM_ROOM_CATALOG } from "../guidance/thm-room-categories";
import { HTB_ACADEMY_MODULES, getHtbModule } from "./htb-academy-catalog";
import { getProjectBySlug } from "../guidance/ft-project-tree";

export const DEFAULT_OBJECTIVE =
  "Red team / malware development, with solid generalist foundations (networking, web, Linux).";

export const PLAN_VERSION = 1;
export const WEEKLY_HOURS_BUDGET = 35;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function weeklyAllocation(totalHours: number | undefined, priority: string, type: string): number {
  if (!totalHours || totalHours <= 5) return totalHours ?? 2;
  if (type === "42") {
    if (priority === "high") return clamp(totalHours * 0.15, 3, 20);
    return clamp(totalHours * 0.1, 2, 10);
  }
  if (["thm", "htb", "rootme"].includes(type)) return clamp(totalHours, 2, 4);
  if (priority === "low") return clamp(totalHours, 1, 3);
  return clamp(totalHours, 2, 5);
}

function parseHoursFromString(est: string): number {
  const match = est.match(/(\d+(?:\.\d+)?)\s*h/i);
  if (match) return parseFloat(match[1]);
  if (/evening/i.test(est)) return 3 * (parseInt(est) || 1);
  if (/session/i.test(est)) return 2 * (parseInt(est) || 1);
  return 2;
}

function resolveLink(type: string, ref?: string): string | undefined {
  if (!ref) return undefined;
  switch (type) {
    case "thm": return `https://tryhackme.com/room/${ref}`;
    case "htb": return `https://academy.hackthebox.com/module/details/${ref}`;
    case "rootme": return `https://www.root-me.org/en/Challenges/${encodeURIComponent(ref)}/`;
    default: return undefined;
  }
}

export type MentorFocusType =
  | "42"
  | "maldev"
  | "thm"
  | "rootme"
  | "htb"
  | "side-project"
  | "skill";

export type MentorFocus = {
  type: MentorFocusType;
  title: string;
  why: string;
  estimatedTime: string;
  priority: "high" | "medium" | "low";
  ref?: string;
  link?: string;
};

export type MentorCompetency = {
  id: string;
  level: number;
  evidence: string;
  nextStep: string;
};

export type SideProject = {
  title: string;
  description: string;
  skills?: string[];
  prerequisites?: { label: string; status: string }[];
  steps?: { title: string; description: string; estimatedHours: number }[];
  bonus_extensions?: string[];
  capstone_connection?: string;
};

export type MentorPlan = {
  version: number;
  generatedAt: string;
  objectiveEcho: string;
  headline: string;
  focus: MentorFocus[];
  competencies: MentorCompetency[];
  side_project?: SideProject;
  fallback?: boolean;
};

export type MentorContext = {
  objective: string;
  guidance: GuidanceResult;
  signals: Record<string, SignalResult>;
};

export function buildMentorContext(objective: string): MentorContext {
  const guidance = runGuidanceEngine();
  const signals = computeCompetencySignals(
    guidance.snapshot,
    guidance.ftProgress
  );
  return { objective: objective.trim() || DEFAULT_OBJECTIVE, guidance, signals };
}

// ---------------------------------------------------------------------------
// Prompt + tool schema
// ---------------------------------------------------------------------------

function maldevNextModule(ctx: MentorContext): string | null {
  const modules = ctx.guidance.snapshot.maldev.modules;
  const incomplete = modules
    .filter((m) => (m.progress ?? 0) < 100)
    .sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0)); // furthest-along first
  return incomplete[0]?.name ?? null;
}

function buildPrompt(ctx: MentorContext): string {
  const { objective, guidance, signals } = ctx;
  const { snapshot, ftProgress, goals } = guidance;
  const completedRooms = new Set(snapshot.thm.rooms.map((r) => r.roomCode));

  const L: string[] = [];
  L.push(
    "You are a senior cybersecurity mentor for a 42 Paris student. Produce a concrete, personalized weekly plan that moves them toward their objective, grounded ONLY in the data below."
  );
  L.push(`\n## Objective\n${objective}`);

  L.push("\n## 42 Paris");
  L.push(`Current circle: ${ftProgress.currentCircle}`);
  L.push(`Validated projects: ${ftProgress.completedProjects.join(", ") || "none"}`);
  L.push(`In progress: ${ftProgress.inProgressProjects.join(", ") || "none"}`);
  L.push(
    `Available next (choose refs from these slugs): ${
      ftProgress.availableProjects.map((p) => `${p.slug} (${p.name}, ~${p.estimatedHours}h)`).join(", ") || "none"
    }`
  );

  const maldevNext = maldevNextModule(ctx);
  L.push("\n## Maldev elearning");
  L.push(
    snapshot.maldev.profile
      ? `Overall progress: ${(snapshot.maldev.profile.overallProgress ?? 0).toFixed(0)}%. Next module: ${maldevNext ?? "unknown"}`
      : "Not synced."
  );

  L.push("\n## TryHackMe candidate rooms (recommend by these room codes as `ref`)");
  for (const r of THM_ROOM_CATALOG) {
    if (completedRooms.has(r.code)) continue;
    L.push(`- ${r.code} — ${r.name} [${r.category}, ${r.difficulty}]`);
  }

  L.push("\n## HackTheBox Academy modules (recommend by these ids as `ref`)");
  for (const m of HTB_ACADEMY_MODULES) {
    L.push(`- ${m.id} — ${m.name} [${m.area}, ${m.tier}]`);
  }
  if (snapshot.htb.profile) {
    L.push(
      `HTB machine owns so far: ${(snapshot.htb.profile.systemOwns ?? 0) + (snapshot.htb.profile.userOwns ?? 0)}`
    );
  }

  L.push("\n## Root-me (prescribe a category + difficulty; use the category name as `ref`, do not invent challenge names)");
  const rmCats = Object.entries(snapshot.rootme.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} (${v} solved)`);
  L.push(rmCats.length ? rmCats.join(", ") : "No Root-me data.");

  if (goals.length) {
    L.push("\n## Goals");
    for (const g of goals) {
      let line = `- ${g.title}`;
      if (g.pacing) {
        line += ` — ${g.pacing.percentComplete.toFixed(0)}%, ${g.pacing.daysRemaining}d left${g.pacing.onTrack ? " (on track)" : " (BEHIND)"}`;
      }
      L.push(line);
    }
  }

  L.push("\n## Competency signals (deterministic floor — refine these levels; keep 0-5)");
  for (const comp of COMPETENCIES) {
    const s = signals[comp.id];
    L.push(`- ${comp.id} (${comp.label}, ${comp.area}): floor ${s.autoLevel}/5 — ${s.evidence}`);
  }

  L.push(
    "\n## Instructions\n" +
      "- Emit 4-7 focus items ordered by priority for THIS week. Tie each 'why' to the objective and the current 42/maldev state.\n" +
      "- Prefer reinforcing the CURRENT 42 milestone and maldev module. Use THM room codes / HTB module ids / Root-me categories from the lists above for `ref` — never invent names.\n" +
      "- Include at least one small side-project brief (type 'side-project', no ref) that leverages what they're learning now.\n" +
      "- Assess every competency id: set level 0-5 (start from the floor, raise only with evidence), one-line evidence, and a concrete nextStep.\n" +
      "- Call emit_mentor_plan exactly once."
  );

  return L.join("\n");
}

function toolSchema() {
  return {
    name: "emit_mentor_plan",
    description: "Emit the structured weekly mentor plan and competency assessment.",
    input_schema: {
      type: "object",
      properties: {
        headline: {
          type: "string",
          description: "One-line summary of this week's focus.",
        },
        focus: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["42", "maldev", "thm", "rootme", "htb", "side-project", "skill"],
              },
              title: { type: "string" },
              why: { type: "string", description: "Why now, tied to objective + current state." },
              estimatedTime: { type: "string", description: 'e.g. "~4h", "2 evenings".' },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              ref: {
                type: "string",
                description:
                  "42 project slug / THM room code / HTB module id / Root-me category, from the provided lists. Omit for side-project/skill.",
              },
            },
            required: ["type", "title", "why", "estimatedTime", "priority"],
          },
        },
        competencies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", enum: COMPETENCIES.map((c) => c.id) },
              level: { type: "integer", minimum: 0, maximum: 5 },
              evidence: { type: "string" },
              nextStep: { type: "string" },
            },
            required: ["id", "level", "evidence", "nextStep"],
          },
        },
        side_project: {
          type: "object",
          description: "A small hands-on project that leverages this week's learning. Always include one.",
          properties: {
            title: { type: "string" },
            description: { type: "string", description: "2-3 sentence description of the project." },
            skills: { type: "array", items: { type: "string" }, description: "Skills practiced." },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  estimatedHours: { type: "number" },
                },
                required: ["title", "description", "estimatedHours"],
              },
            },
            capstone_connection: { type: "string", description: "How this feeds into the student's long-term objective." },
          },
          required: ["title", "description", "skills", "steps"],
        },
      },
      required: ["headline", "focus", "competencies", "side_project"],
    },
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// Drop refs the model invented that don't resolve to a real catalog entry,
// rather than trusting them blindly. The focus item survives; only a bad ref
// is cleared.
function validateRef(f: MentorFocus): MentorFocus {
  if (!f.ref) return f;
  const ok =
    (f.type === "42" && !!getProjectBySlug(f.ref)) ||
    (f.type === "thm" && THM_ROOM_CATALOG.some((r) => r.code === f.ref)) ||
    (f.type === "htb" && !!getHtbModule(f.ref)) ||
    // Root-me refs are category prescriptions, not catalog ids — accept as-is.
    f.type === "rootme";
  return ok ? f : { ...f, ref: undefined };
}

function finalizePlan(
  raw: { headline: string; focus: MentorFocus[]; competencies: MentorCompetency[]; side_project?: SideProject },
  objective: string,
  fallback = false
): MentorPlan {
  const validated = raw.focus.map(validateRef);

  // Auto-populate links from ref + type
  const withLinks = validated.map((f) => {
    if (f.link || !f.ref) return f;
    const link = resolveLink(f.type, f.ref);
    return link ? { ...f, link } : f;
  });

  // Cap total hours to weekly budget
  const capped: MentorFocus[] = [];
  let total = 0;
  for (const f of withLinks) {
    const h = parseHoursFromString(f.estimatedTime);
    if (total + h > WEEKLY_HOURS_BUDGET && capped.length > 0) break;
    capped.push(f);
    total += h;
  }

  return {
    version: PLAN_VERSION,
    generatedAt: new Date().toISOString(),
    objectiveEcho: objective,
    headline: raw.headline,
    focus: capped,
    competencies: raw.competencies,
    ...(raw.side_project ? { side_project: raw.side_project } : {}),
    ...(fallback ? { fallback: true } : {}),
  };
}

// ---------------------------------------------------------------------------
// LLM path
// ---------------------------------------------------------------------------

type LLMConfig = {
  provider: string;
  apiKey: string | null;
  model: string;
  baseUrl: string | null;
};

async function generateViaAnthropic(
  prompt: string,
  apiKey: string,
  model: string
): Promise<{ headline: string; focus: MentorFocus[]; competencies: MentorCompetency[]; side_project?: SideProject }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      tools: [toolSchema()],
      tool_choice: { type: "tool", name: "emit_mentor_plan" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = await res.json();
  const block = Array.isArray(data.content)
    ? data.content.find((b: { type?: string }) => b.type === "tool_use")
    : null;
  if (!block?.input) {
    throw new Error("Mentor: model did not return a tool_use plan.");
  }
  return block.input;
}

function openAIToolSchema() {
  const schema = toolSchema();
  return {
    type: "function" as const,
    function: {
      name: schema.name,
      description: schema.description,
      parameters: schema.input_schema,
    },
  };
}

async function generateViaOpenAI(
  prompt: string,
  model: string,
  baseUrl: string,
  apiKey?: string | null
): Promise<{ headline: string; focus: MentorFocus[]; competencies: MentorCompetency[]; side_project?: SideProject }> {
  const url = `${baseUrl.replace(/\/+$/, "")}/v1/chat/completions`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      tools: [openAIToolSchema()],
      tool_choice: { type: "function", function: { name: "emit_mentor_plan" } },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Local LLM error ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message;

  if (msg?.tool_calls?.[0]?.function?.arguments) {
    return JSON.parse(msg.tool_calls[0].function.arguments);
  }

  if (msg?.content) {
    const jsonMatch = msg.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  }

  throw new Error("Local LLM did not return a structured plan.");
}

export async function generateMentorPlan(
  ctx: MentorContext,
  config: LLMConfig
): Promise<MentorPlan> {
  const prompt = buildPrompt(ctx);
  let input: { headline?: string; focus?: MentorFocus[]; competencies?: MentorCompetency[]; side_project?: SideProject };

  if (config.provider === "local" && config.baseUrl) {
    input = await generateViaOpenAI(prompt, config.model, config.baseUrl, config.apiKey);
  } else if (config.apiKey) {
    input = await generateViaAnthropic(prompt, config.apiKey, config.model);
  } else {
    throw new Error("No LLM configured.");
  }

  return finalizePlan(
    {
      headline: input.headline ?? "This week's focus",
      focus: Array.isArray(input.focus) ? input.focus : [],
      competencies: Array.isArray(input.competencies) ? input.competencies : [],
      side_project: input.side_project,
    },
    ctx.objective
  );
}

// ---------------------------------------------------------------------------
// Fallback path (no API key) — reuse the rule engine's recommendations and the
// deterministic competency floor so the UI is identical and always renders.
// ---------------------------------------------------------------------------

const PLATFORM_TO_TYPE: Record<string, MentorFocusType> = {
  "42": "42",
  thm: "thm",
  htb: "htb",
  rootme: "rootme",
  maldev: "maldev",
};

export function buildFallbackPlan(ctx: MentorContext): MentorPlan {
  const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...ctx.guidance.recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const focus: MentorFocus[] = sorted.map((r) => {
    const type = PLATFORM_TO_TYPE[r.platform] ?? "skill";
    const weekly = weeklyAllocation(r.estimatedHours, r.priority, type);
    return {
      type,
      title: r.title,
      why: r.reason,
      estimatedTime: `~${weekly}h`,
      priority: r.priority,
      ref: r.ref,
    };
  });

  const competencies: MentorCompetency[] = COMPETENCIES.map((c) => {
    const s = ctx.signals[c.id];
    return {
      id: c.id,
      level: s.autoLevel,
      evidence: s.evidence,
      nextStep: "",
    };
  });

  const sideProjectFocus = focus.find((f) => f.type === "side-project");
  const side_project: SideProject | undefined = sideProjectFocus
    ? {
        title: sideProjectFocus.title,
        description: sideProjectFocus.why,
        skills: ["scripting", ctx.objective.split(",")[0]?.trim().split("/")[0]?.trim() ?? "security"].filter(Boolean),
        steps: [
          { title: "Set up project scaffold", description: "Create the project structure and dependencies.", estimatedHours: 1 },
          { title: "Implement core logic", description: sideProjectFocus.why, estimatedHours: 2 },
          { title: "Test and document", description: "Verify it works and write a short README.", estimatedHours: 1 },
        ],
      }
    : undefined;

  return finalizePlan(
    {
      headline: "Rule-based plan (add an Anthropic API key in Settings for full mentor guidance)",
      focus,
      competencies,
      side_project,
    },
    ctx.objective,
    true
  );
}
