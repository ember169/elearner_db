import {
  runGuidanceEngine,
  type Recommendation,
  type PlatformSnapshot,
  type GoalWithPacing,
} from "@/lib/guidance/engine";
import { computeCompetencySignals, type SignalResult } from "@/lib/mentor/competency-signals";
import { COMPETENCIES } from "@/lib/mentor/competency-map";
import { deadline42Pressure } from "./backward-planner";
import { getMainDeadline, computeBackwardPlan, type BackwardPlan } from "./backward-planner";
import type { MentorFocus, MentorCompetency, SideProject } from "@/lib/mentor/engine";

export const WEEKLY_HOURS_BUDGET = 35;

// Time allocation rules (percentage of weekly budget)
const ALLOCATION_RULES = {
  ft42_baseline: 0.40,       // 40% to 42 by default
  ft42_deadline_max: 0.70,   // up to 70% under deadline pressure
  cybersec_platforms: 0.30,  // 30% to THM/HTB/RM
  maldev: 0.10,              // 10% to maldev elearning
  side_project: 0.15,        // 15% to side project
  buffer: 0.05,              // 5% buffer for overflow/review
} as const;

export type RuleEngineOutput = {
  focus: MentorFocus[];
  competencies: MentorCompetency[];
  weeklyBudget: {
    total: number;
    ft42: number;
    cybersec: number;
    maldev: number;
    sideProject: number;
  };
  deadlinePressure: {
    urgency: "normal" | "elevated" | "critical";
    reason: string;
    backwardPlan: BackwardPlan | null;
  };
  warnings: string[];
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
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

export function runRuleEngine(objective: string): RuleEngineOutput {
  const guidance = runGuidanceEngine();
  const { snapshot, ftProgress, recommendations, goals } = guidance;
  const signals = computeCompetencySignals(snapshot, ftProgress);
  const warnings: string[] = [];

  // 1. Check deadline pressure for 42
  const { hoursThisWeek: ft42Hours, urgency, reason } =
    deadline42Pressure(ftProgress.completedProjects);

  // Compute backward plan if deadline exists
  let backwardPlan: BackwardPlan | null = null;
  const mainDeadline = getMainDeadline();
  if (mainDeadline) {
    backwardPlan = computeBackwardPlan(
      mainDeadline.targetDate,
      ftProgress.completedProjects
    );
    warnings.push(...backwardPlan.warnings);
  }

  // 2. Allocate time budget
  const ft42Budget = Math.min(
    urgency === "critical"
      ? WEEKLY_HOURS_BUDGET * ALLOCATION_RULES.ft42_deadline_max
      : urgency === "elevated"
        ? ft42Hours
        : WEEKLY_HOURS_BUDGET * ALLOCATION_RULES.ft42_baseline,
    WEEKLY_HOURS_BUDGET * ALLOCATION_RULES.ft42_deadline_max
  );

  const remaining = WEEKLY_HOURS_BUDGET - ft42Budget;
  const cybersecBudget = remaining * 0.55;
  const maldevBudget = remaining * 0.20;
  const sideProjectBudget = remaining * 0.25;

  // 3. Select focus items from recommendations (already sorted by priority)
  const focus: MentorFocus[] = [];
  let totalAllocated = 0;

  // Sort recommendations by priority, with deadline-sensitive items first
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const platformBudgets: Record<string, number> = {
    "42": ft42Budget,
    thm: cybersecBudget * 0.4,
    htb: cybersecBudget * 0.35,
    rootme: cybersecBudget * 0.25,
    maldev: maldevBudget,
  };

  const platformUsed: Record<string, number> = {};

  for (const rec of sorted) {
    const type = rec.platform as MentorFocus["type"];
    const hours = rec.estimatedHours ?? 2;
    const budgetKey = rec.platform;
    const budget = platformBudgets[budgetKey] ?? 5;
    const used = platformUsed[budgetKey] ?? 0;

    if (used + hours > budget && focus.length > 0) continue;
    if (totalAllocated + hours > WEEKLY_HOURS_BUDGET) continue;

    const weeklyHours = allocateWeeklyHours(hours, rec.priority, type);

    focus.push({
      type,
      title: rec.title,
      why: rec.reason,
      estimatedTime: `~${weeklyHours}h`,
      priority: rec.priority,
      ref: rec.ref,
      link: rec.link ?? resolveLink(type, rec.ref),
    });

    platformUsed[budgetKey] = used + weeklyHours;
    totalAllocated += weeklyHours;
  }

  // If no 42 items from recommendations, add available projects
  if (!focus.some((f) => f.type === "42") && ftProgress.availableProjects.length > 0) {
    const proj = ftProgress.availableProjects[0];
    const hours = clamp(ft42Budget, 3, 20);
    focus.unshift({
      type: "42",
      title: `Work on ${proj.name}`,
      why: `Next available project in Circle ${proj.circle}.`,
      estimatedTime: `~${hours}h`,
      priority: urgency === "critical" ? "high" : "medium",
      ref: proj.slug,
    });
  }

  // Ensure minimum platform diversity — add THM/HTB if missing and budget allows
  if (!focus.some((f) => f.type === "thm" || f.type === "htb") && totalAllocated < WEEKLY_HOURS_BUDGET - 2) {
    const cybersecRec = sorted.find(
      (r) => (r.platform === "thm" || r.platform === "htb") && !focus.some((f) => f.ref === r.ref)
    );
    if (cybersecRec) {
      focus.push({
        type: cybersecRec.platform as MentorFocus["type"],
        title: cybersecRec.title,
        why: cybersecRec.reason,
        estimatedTime: `~${cybersecRec.estimatedHours ?? 3}h`,
        priority: cybersecRec.priority,
        ref: cybersecRec.ref,
        link: cybersecRec.link ?? resolveLink(cybersecRec.platform, cybersecRec.ref),
      });
    }
  }

  // 4. Build competency assessment (deterministic)
  const competencies: MentorCompetency[] = COMPETENCIES.map((c) => {
    const s = signals[c.id];
    return {
      id: c.id,
      level: s.autoLevel,
      evidence: s.evidence,
      nextStep: computeNextStep(c.id, s, goals),
    };
  });

  // 5. Generate warnings for schedule conflicts
  if (urgency !== "normal" && focus.filter((f) => f.type !== "42").length > 3) {
    warnings.push(
      "Deadline pressure is high but schedule has many non-42 items. Consider focusing more on 42 this week."
    );
  }

  return {
    focus,
    competencies,
    weeklyBudget: {
      total: WEEKLY_HOURS_BUDGET,
      ft42: Math.round(ft42Budget),
      cybersec: Math.round(cybersecBudget),
      maldev: Math.round(maldevBudget),
      sideProject: Math.round(sideProjectBudget),
    },
    deadlinePressure: {
      urgency,
      reason,
      backwardPlan,
    },
    warnings,
  };
}

function allocateWeeklyHours(totalHours: number, priority: string, type: string): number {
  if (!totalHours || totalHours <= 5) return totalHours ?? 2;
  if (type === "42") {
    if (priority === "high") return clamp(totalHours * 0.15, 3, 20);
    return clamp(totalHours * 0.1, 2, 10);
  }
  if (["thm", "htb", "rootme"].includes(type)) return clamp(totalHours, 2, 4);
  if (priority === "low") return clamp(totalHours, 1, 3);
  return clamp(totalHours, 2, 5);
}

function computeNextStep(
  compId: string,
  signal: SignalResult,
  goals: GoalWithPacing[]
): string {
  if (signal.autoLevel === 0) return "Start building experience in this area.";
  if (signal.autoLevel < 3) return "Continue practicing — aim for more hands-on exercises.";
  if (signal.autoLevel < 5) return "Deepen with harder challenges and real-world scenarios.";
  return "Maintain mastery — mentor others or tackle edge cases.";
}
