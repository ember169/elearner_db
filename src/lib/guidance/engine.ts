import { db } from "@/lib/db";
import {
  ftProfile,
  ftProjects,
  ftSkills,
  thmProfile,
  thmRooms,
  htbProfile,
  rootmeProfile,
  rootmeChallenges,
  maldevProfile,
  maldevModules,
  goals,
  goalMilestones,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  FT_COMMON_CORE,
  getAvailableProjects,
  getCircleProgress,
  SKILL_CATEGORIES,
  PLATFORM_SKILL_MAPPING,
  type FtProject,
} from "./ft-project-tree";
import { syncGoalValues } from "@/lib/goals/metrics";

export type PlatformSnapshot = {
  ft: {
    profile: typeof ftProfile.$inferSelect | null;
    projects: (typeof ftProjects.$inferSelect)[];
    skills: (typeof ftSkills.$inferSelect)[];
  };
  thm: {
    profile: typeof thmProfile.$inferSelect | null;
    roomsCompleted: number;
  };
  htb: {
    profile: typeof htbProfile.$inferSelect | null;
  };
  rootme: {
    profile: typeof rootmeProfile.$inferSelect | null;
    challengesSolved: number;
    categoryCounts: Record<string, number>;
  };
  maldev: {
    profile: typeof maldevProfile.$inferSelect | null;
    modules: (typeof maldevModules.$inferSelect)[];
  };
};

export type GoalWithPacing = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  targetValue: number | null;
  currentValue: number | null;
  metricSource: string | null;
  deadline: string | null;
  status: string | null;
  createdAt: string;
  milestones: (typeof goalMilestones.$inferSelect)[];
  pacing: {
    daysRemaining: number;
    percentComplete: number;
    onTrack: boolean;
    requiredPace: string;
    currentPace: string;
  } | null;
};

export type Recommendation = {
  priority: "high" | "medium" | "low";
  platform: string;
  title: string;
  reason: string;
  estimatedHours?: number;
  skills?: string[];
};

export type GuidanceResult = {
  snapshot: PlatformSnapshot;
  goals: GoalWithPacing[];
  ftProgress: {
    currentCircle: number;
    circleBreakdown: Record<number, { total: number; done: number }>;
    completedProjects: string[];
    inProgressProjects: string[];
    availableProjects: FtProject[];
  };
  skillProfile: Record<string, number>;
  recommendations: Recommendation[];
};

export function gatherSnapshot(): PlatformSnapshot {
  const ft = {
    profile: db.select().from(ftProfile).limit(1).all()[0] ?? null,
    projects: db.select().from(ftProjects).all(),
    skills: db.select().from(ftSkills).all(),
  };

  const thm = {
    profile: db.select().from(thmProfile).limit(1).all()[0] ?? null,
    roomsCompleted:
      db.select().from(thmRooms).all().length,
  };

  const htb = {
    profile: db.select().from(htbProfile).limit(1).all()[0] ?? null,
  };

  const rmProfile = db.select().from(rootmeProfile).limit(1).all()[0] ?? null;
  const rmChallenges = db.select().from(rootmeChallenges).all();
  const categoryCounts: Record<string, number> = {};
  for (const ch of rmChallenges) {
    const cat = ch.category ?? "Other";
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }

  const rootme = {
    profile: rmProfile,
    challengesSolved: rmChallenges.length,
    categoryCounts,
  };

  const maldev = {
    profile: db.select().from(maldevProfile).limit(1).all()[0] ?? null,
    modules: db.select().from(maldevModules).all(),
  };

  return { ft, thm, htb, rootme, maldev };
}

export function analyzeGoals(): GoalWithPacing[] {
  const allGoals = db.select().from(goals).where(eq(goals.status, "active")).all();
  const allMilestones = db.select().from(goalMilestones).all();
  const now = new Date();

  return allGoals.map((g) => {
    const ms = allMilestones.filter((m) => m.goalId === g.id);
    let pacing: GoalWithPacing["pacing"] = null;

    if (g.deadline && g.targetValue) {
      const deadlineDate = new Date(g.deadline);
      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      const percentComplete =
        g.targetValue > 0
          ? Math.min(100, ((g.currentValue ?? 0) / g.targetValue) * 100)
          : 0;
      const remaining = (g.targetValue ?? 0) - (g.currentValue ?? 0);
      const onTrack =
        daysRemaining > 0
          ? percentComplete >= ((1 - daysRemaining / daysSinceCreation(g.createdAt, g.deadline)) * 100)
          : percentComplete >= 100;

      let requiredPace = "";
      if (remaining > 0 && daysRemaining > 0) {
        const perDay = remaining / daysRemaining;
        const perWeek = perDay * 7;
        if (perWeek < 1) {
          requiredPace = `~${perDay.toFixed(1)}/day`;
        } else {
          requiredPace = `~${perWeek.toFixed(1)}/week`;
        }
      } else if (remaining <= 0) {
        requiredPace = "Complete!";
      } else {
        requiredPace = "Overdue";
      }

      const elapsedDays = Math.max(
        1,
        Math.ceil((now.getTime() - new Date(g.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      );
      const currentVal = g.currentValue ?? 0;
      let currentPace = "";
      if (currentVal > 0) {
        const perWeek = (currentVal / elapsedDays) * 7;
        if (perWeek < 1) {
          currentPace = `~${(currentVal / elapsedDays).toFixed(1)}/day`;
        } else {
          currentPace = `~${perWeek.toFixed(1)}/week`;
        }
      } else {
        currentPace = "No progress yet";
      }

      pacing = { daysRemaining, percentComplete, onTrack, requiredPace, currentPace };
    }

    return {
      id: g.id,
      title: g.title,
      description: g.description,
      category: g.category,
      targetValue: g.targetValue,
      currentValue: g.currentValue,
      metricSource: g.metricSource,
      deadline: g.deadline,
      status: g.status,
      createdAt: g.createdAt,
      milestones: ms,
      pacing,
    };
  });
}

function daysSinceCreation(createdAt: string, deadline: string): number {
  const start = new Date(createdAt);
  const end = new Date(deadline);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export function analyzeFtProgress(snapshot: PlatformSnapshot) {
  const completedSlugs: string[] = [];
  const inProgressSlugs: string[] = [];

  for (const p of snapshot.ft.projects) {
    const slug = (p.slug ?? p.name).toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (p.validated) {
      completedSlugs.push(slug);
    } else if (p.status === "in_progress") {
      inProgressSlugs.push(slug);
    }
  }

  const normalizedCompleted = completedSlugs.map((s) => matchProjectSlug(s));
  const circleBreakdown = getCircleProgress(normalizedCompleted);
  const availableProjects = getAvailableProjects(normalizedCompleted);

  let currentCircle = 0;
  for (let c = 6; c >= 0; c--) {
    if (circleBreakdown[c] && circleBreakdown[c].done > 0) {
      currentCircle = c;
      break;
    }
  }

  return {
    currentCircle,
    circleBreakdown,
    completedProjects: normalizedCompleted,
    inProgressProjects: inProgressSlugs.map(matchProjectSlug),
    availableProjects,
  };
}

function matchProjectSlug(rawSlug: string): string {
  const normalized = rawSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = FT_COMMON_CORE.find(
    (p) =>
      p.slug === rawSlug ||
      p.slug.replace(/[^a-z0-9]/g, "") === normalized ||
      p.name.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
  );
  return match?.slug ?? rawSlug;
}

export function buildSkillProfile(snapshot: PlatformSnapshot): Record<string, number> {
  const profile: Record<string, number> = {};

  for (const skill of snapshot.ft.skills) {
    const name = skill.name.toLowerCase();
    profile[name] = Math.max(profile[name] ?? 0, skill.level ?? 0);
  }

  for (const [cat, count] of Object.entries(snapshot.rootme.categoryCounts)) {
    const mapped = PLATFORM_SKILL_MAPPING[cat];
    if (mapped) {
      for (const skill of mapped) {
        profile[skill] = (profile[skill] ?? 0) + count * 0.5;
      }
    }
  }

  if (snapshot.htb.profile) {
    const owns = (snapshot.htb.profile.systemOwns ?? 0) + (snapshot.htb.profile.userOwns ?? 0);
    profile["security"] = (profile["security"] ?? 0) + owns * 0.3;
    profile["networking"] = (profile["networking"] ?? 0) + owns * 0.2;
  }

  if (snapshot.thm.roomsCompleted > 0) {
    profile["security"] = (profile["security"] ?? 0) + snapshot.thm.roomsCompleted * 0.2;
  }

  if (snapshot.maldev.profile) {
    const progress = snapshot.maldev.profile.overallProgress ?? 0;
    profile["security"] = (profile["security"] ?? 0) + progress * 0.1;
    profile["reverse-engineering"] = (profile["reverse-engineering"] ?? 0) + progress * 0.05;
  }

  return profile;
}

export function generateRecommendations(
  snapshot: PlatformSnapshot,
  ftProgress: ReturnType<typeof analyzeFtProgress>,
  goalsWithPacing: GoalWithPacing[],
  skillProfile: Record<string, number>
): Recommendation[] {
  const recs: Recommendation[] = [];

  // 1. In-progress 42 projects should be finished first
  for (const slug of ftProgress.inProgressProjects) {
    const project = FT_COMMON_CORE.find((p) => p.slug === slug);
    if (project) {
      recs.push({
        priority: "high",
        platform: "42",
        title: `Finish ${project.name}`,
        reason: "Currently in progress — completing this unblocks the next circle.",
        estimatedHours: project.estimatedHours,
        skills: project.skills,
      });
    }
  }

  // 2. Next available 42 projects (prioritize by goal deadlines)
  const ft42Goals = goalsWithPacing.filter((g) => g.category === "42");
  const hasUrgent42Goal = ft42Goals.some((g) => g.pacing && g.pacing.daysRemaining < 60 && !g.pacing.onTrack);

  for (const project of ftProgress.availableProjects.slice(0, 3)) {
    if (ftProgress.inProgressProjects.includes(project.slug)) continue;
    recs.push({
      priority: hasUrgent42Goal ? "high" : "medium",
      platform: "42",
      title: `Start ${project.name}`,
      reason: project.group
        ? `Available in Circle ${project.circle} (choose one from group).`
        : `Next available project in Circle ${project.circle}.`,
      estimatedHours: project.estimatedHours,
      skills: project.skills,
    });
  }

  // 3. Goal-driven recommendations for cybersec platforms
  for (const goal of goalsWithPacing) {
    if (!goal.pacing || goal.pacing.percentComplete >= 100) continue;

    if (goal.category === "rootme" && goal.pacing.daysRemaining < 90) {
      const weakCategories = findWeakRootmeCategories(snapshot.rootme.categoryCounts);
      if (weakCategories.length > 0) {
        recs.push({
          priority: goal.pacing.onTrack ? "medium" : "high",
          platform: "rootme",
          title: `Focus on Root-me: ${weakCategories[0]}`,
          reason: `${goal.pacing.requiredPace} needed for "${goal.title}". ${weakCategories[0]} has few solves — good for quick points.`,
        });
      }
    }

    if (goal.category === "thm" && goal.pacing.daysRemaining < 90) {
      recs.push({
        priority: goal.pacing.onTrack ? "medium" : "high",
        platform: "thm",
        title: "Complete TryHackMe rooms",
        reason: `${goal.pacing.requiredPace} needed for "${goal.title}".`,
      });
    }

    if (goal.category === "htb" && goal.pacing.daysRemaining < 90) {
      recs.push({
        priority: goal.pacing.onTrack ? "medium" : "high",
        platform: "htb",
        title: "Solve HackTheBox machines",
        reason: `${goal.pacing.requiredPace} needed for "${goal.title}".`,
      });
    }

    if (goal.category === "maldev") {
      recs.push({
        priority: goal.pacing.onTrack ? "low" : "medium",
        platform: "maldev",
        title: "Continue maldev elearning",
        reason: `${goal.pacing.requiredPace} needed. Currently at ${(goal.currentValue ?? 0).toFixed(0)}%.`,
      });
    }
  }

  // 4. Skill-gap based: if upcoming 42 projects need skills the user is weak in
  for (const project of ftProgress.availableProjects.slice(0, 5)) {
    for (const skill of project.skills) {
      const level = skillProfile[skill] ?? 0;
      if (level < 1 && isSecurityRelated(skill)) {
        const platformSuggestion = suggestPlatformForSkill(skill);
        if (platformSuggestion) {
          recs.push({
            priority: "low",
            platform: platformSuggestion,
            title: `Build ${skill} skills`,
            reason: `Helpful for upcoming 42 project "${project.name}". Try challenges in this category.`,
            skills: [skill],
          });
        }
      }
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return recs.filter((r) => {
    if (seen.has(r.title)) return false;
    seen.add(r.title);
    return true;
  });
}

function findWeakRootmeCategories(categoryCounts: Record<string, number>): string[] {
  const allCategories = [
    "Web - Client",
    "Web - Serveur",
    "App - Script",
    "App - Système",
    "Cryptanalyse",
    "Stéganographie",
    "Réseau",
    "Forensique",
    "Programmation",
    "Cracking",
    "Réaliste",
  ];

  return allCategories
    .filter((cat) => (categoryCounts[cat] ?? 0) < 3)
    .slice(0, 3);
}

function isSecurityRelated(skill: string): boolean {
  return [
    "security",
    "networking",
    "cryptography",
    "reverse-engineering",
    "web-security",
    "forensics",
  ].includes(skill);
}

function suggestPlatformForSkill(skill: string): string | null {
  const mapping: Record<string, string> = {
    security: "thm",
    networking: "thm",
    cryptography: "rootme",
    "reverse-engineering": "rootme",
    "web-security": "rootme",
    forensics: "rootme",
  };
  return mapping[skill] ?? null;
}

export function runGuidanceEngine(): GuidanceResult {
  syncGoalValues();
  const snapshot = gatherSnapshot();
  const goalsWithPacing = analyzeGoals();
  const ftProgress = analyzeFtProgress(snapshot);
  const skillProfile = buildSkillProfile(snapshot);
  const recommendations = generateRecommendations(
    snapshot,
    ftProgress,
    goalsWithPacing,
    skillProfile
  );

  return {
    snapshot,
    goals: goalsWithPacing,
    ftProgress,
    skillProfile,
    recommendations,
  };
}
