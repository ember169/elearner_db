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
import { eq, or, and, isNotNull } from "drizzle-orm";
import {
  FT_COMMON_CORE,
  getAvailableProjects,
  getCircleProgress,
  SKILL_CATEGORIES,
  PLATFORM_SKILL_MAPPING,
  type FtProject,
} from "./ft-project-tree";
import { THM_ROOM_CATEGORIES, THM_ROOM_CATALOG } from "./thm-room-categories";
import { HTB_ACADEMY_MODULES, type HtbModule } from "@/lib/mentor/htb-academy-catalog";
import { HTB_MACHINES, type HtbMachine, htbMachineLink } from "@/lib/mentor/htb-machine-catalog";
import { pickRootmeChallenges, pickRootmeChallengeForSkill, isRmTitleSolved } from "@/lib/mentor/rootme-challenge-catalog";
import { syncGoalValues, computeCadencePacing } from "@/lib/goals/metrics";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import {
  thmDifficultyFloors,
  htbTierFloors,
  isAboveFloor,
  isAboveHtbFloor,
  htbMachineDifficultyFloors,
  isAboveHtbMachineDifficulty,
} from "@/lib/planning/cross-platform-level";

export type PlatformSnapshot = {
  ft: {
    profile: typeof ftProfile.$inferSelect | null;
    projects: (typeof ftProjects.$inferSelect)[];
    skills: (typeof ftSkills.$inferSelect)[];
  };
  thm: {
    profile: typeof thmProfile.$inferSelect | null;
    roomsCompleted: number;
    rooms: (typeof thmRooms.$inferSelect)[];
  };
  htb: {
    profile: typeof htbProfile.$inferSelect | null;
  };
  rootme: {
    profile: typeof rootmeProfile.$inferSelect | null;
    challengesSolved: number;
    categoryCounts: Record<string, number>;
    categoryWeightedCounts: Record<string, number>;
    solvedTitles: Set<string>;
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
  goalType: string;
  targetValue: number | null;
  currentValue: number | null;
  cadenceValue: number | null;
  cadenceUnit: string | null;
  metricSource: string | null;
  deadline: string | null;
  parentGoalId: number | null;
  sortOrder: number | null;
  ftSlug: string | null;
  estimatedHours: number | null;
  originalTarget: number | null;
  status: string | null;
  customFields: string | null;
  createdAt: string;
  milestones: (typeof goalMilestones.$inferSelect)[];
  children: GoalWithPacing[];
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
  ref?: string;
  link?: string;
  goalId?: number;
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
  const rmScoreWeight = (score: number): number => {
    if (score >= 100) return 2.0;
    if (score >= 70) return 1.5;
    if (score >= 40) return 1.0;
    if (score >= 20) return 0.6;
    return 0.3;
  };
  const ft = {
    profile: db.select().from(ftProfile).limit(1).all()[0] ?? null,
    projects: db.select().from(ftProjects).all(),
    skills: db.select().from(ftSkills).all(),
  };

  const thmRoomRows = db.select().from(thmRooms).all();
  const thm = {
    profile: db.select().from(thmProfile).limit(1).all()[0] ?? null,
    roomsCompleted: thmRoomRows.length,
    rooms: thmRoomRows,
  };

  const htb = {
    profile: db.select().from(htbProfile).limit(1).all()[0] ?? null,
  };

  const rmProfile = db.select().from(rootmeProfile).limit(1).all()[0] ?? null;
  const rmChallenges = db.select().from(rootmeChallenges).all();
  const categoryCounts: Record<string, number> = {};
  const categoryWeightedCounts: Record<string, number> = {};
  const solvedTitles = new Set<string>();
  for (const ch of rmChallenges) {
    const cat = ch.category ?? "Other";
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    const weight = rmScoreWeight(ch.score ?? 0);
    categoryWeightedCounts[cat] = (categoryWeightedCounts[cat] ?? 0) + weight;
    solvedTitles.add(ch.title.toLowerCase());
  }

  const rootme = {
    profile: rmProfile,
    challengesSolved: rmChallenges.length,
    categoryCounts,
    categoryWeightedCounts,
    solvedTitles,
  };

  const maldev = {
    profile: db.select().from(maldevProfile).limit(1).all()[0] ?? null,
    modules: db.select().from(maldevModules).all(),
  };

  return { ft, thm, htb, rootme, maldev };
}

export function analyzeGoals(): GoalWithPacing[] {
  const allGoals = db.select().from(goals).where(
    or(eq(goals.status, "active"), and(eq(goals.status, "completed"), isNotNull(goals.parentGoalId)))
  ).all();
  const allMilestones = db.select().from(goalMilestones).all();
  const now = new Date();

  const parentIds = new Set(allGoals.filter((g) => g.parentGoalId).map((g) => g.parentGoalId));

  const mapped = allGoals.map((g) => {
    const ms = allMilestones.filter((m) => m.goalId === g.id);
    let pacing: GoalWithPacing["pacing"] = null;
    const isParent = parentIds.has(g.id);

    if (g.status === "completed") {
      // no pacing needed
    } else if (!isParent && g.goalType === "cadence" && g.cadenceValue && g.cadenceUnit && g.metricSource) {
      const cp = computeCadencePacing(
        g.metricSource,
        g.cadenceValue,
        g.cadenceUnit as "per_week" | "per_month",
        g.currentValue ?? 0
      );
      pacing = {
        daysRemaining: cp.daysLeftInPeriod,
        percentComplete: cp.target > 0 ? Math.min(100, (cp.achieved / cp.target) * 100) : 0,
        onTrack: cp.onTrack,
        requiredPace: cp.requiredPace,
        currentPace: cp.currentPace,
      };
    } else if (g.deadline && g.targetValue) {
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
        if (perWeek >= 1) {
          requiredPace = `~${perWeek.toFixed(1)}/week`;
        } else if (perDay >= 0.1) {
          requiredPace = `~${perDay.toFixed(1)}/day`;
        } else {
          requiredPace = `${remaining} more in ${Math.ceil(daysRemaining / 7)} weeks`;
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
      goalType: g.goalType,
      targetValue: g.targetValue,
      currentValue: g.currentValue,
      cadenceValue: g.cadenceValue,
      cadenceUnit: g.cadenceUnit,
      metricSource: g.metricSource,
      deadline: g.deadline,
      parentGoalId: g.parentGoalId,
      sortOrder: g.sortOrder,
      ftSlug: g.ftSlug,
      estimatedHours: g.estimatedHours,
      originalTarget: g.originalTarget,
      status: g.status,
      customFields: g.customFields ?? null,
      createdAt: g.createdAt,
      milestones: ms,
      children: [] as GoalWithPacing[],
      pacing,
    };
  });

  const byId = new Map(mapped.map((g) => [g.id, g]));
  for (const g of mapped) {
    if (g.parentGoalId && byId.has(g.parentGoalId)) {
      byId.get(g.parentGoalId)!.children.push(g);
    }
  }
  for (const g of mapped) {
    if (g.children.length > 1) {
      g.children.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
  }

  computeAggregatePacing(mapped.filter((g) => !g.parentGoalId));
  return mapped.filter((g) => !g.parentGoalId);
}

function computeAggregatePacing(roots: GoalWithPacing[]) {
  const now = new Date();
  function walk(g: GoalWithPacing) {
    for (const child of g.children) walk(child);
    if (g.children.length === 0 || g.status === "completed") return;

    let totalWeight = 0;
    let weightedSum = 0;
    let allOnTrack = true;
    let latestDeadline: Date | null = null;

    for (const child of g.children) {
      const pct = child.pacing?.percentComplete ??
        (child.status === "completed" ? 100 : 0);
      const weight = child.targetValue ?? 1;
      weightedSum += pct * weight;
      totalWeight += weight;
      if (child.pacing && !child.pacing.onTrack) allOnTrack = false;
      if (child.deadline) {
        const d = new Date(child.deadline);
        if (!latestDeadline || d > latestDeadline) latestDeadline = d;
      }
    }

    const aggregatePercent = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const effectiveDeadline = g.deadline ? new Date(g.deadline) : latestDeadline;
    const daysRemaining = effectiveDeadline
      ? Math.max(0, Math.ceil((effectiveDeadline.getTime() - now.getTime()) / 86400000))
      : 0;

    const completedCount = g.children.filter((c) => c.status === "completed").length;
    const milestonePct = (completedCount / g.children.length) * 100;

    g.pacing = {
      daysRemaining,
      percentComplete: Math.round(aggregatePercent * 10) / 10,
      onTrack: allOnTrack && (daysRemaining > 0 || aggregatePercent >= 100),
      requiredPace: `${completedCount}/${g.children.length} milestones`,
      currentPace: `${Math.round(aggregatePercent)}% aggregate`,
    };
  }
  for (const root of roots) walk(root);
}

export function flattenGoals(tree: GoalWithPacing[]): GoalWithPacing[] {
  const result: GoalWithPacing[] = [];
  function walk(g: GoalWithPacing) {
    result.push(g);
    for (const child of g.children) walk(child);
  }
  tree.forEach(walk);
  return result;
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
  const match = FT_COMMON_CORE.find((p) => {
    const canonical = p.slug.replace(/[^a-z0-9]/g, "");
    const name = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      normalized === canonical ||
      normalized === name ||
      // 42's API prefixes common-core slugs, e.g. "42cursus-libft" — which
      // normalizes to "42cursuslibft". Match on the canonical name as a suffix
      // so prefixed and bare slugs both resolve to the same project.
      normalized.endsWith(canonical) ||
      normalized.endsWith(name)
    );
  });
  return match?.slug ?? rawSlug;
}

export function buildSkillProfile(snapshot: PlatformSnapshot): Record<string, number> {
  const profile: Record<string, number> = {};

  for (const skill of snapshot.ft.skills) {
    const name = skill.name.toLowerCase();
    profile[name] = Math.max(profile[name] ?? 0, skill.level ?? 0);
  }

  // Derive skills from validated 42 projects (ft_skills table may be empty)
  const completedSlugs = new Set(
    snapshot.ft.projects
      .filter((p) => p.validated)
      .map((p) => (p.slug ?? p.name).toLowerCase().replace(/^42cursus-?/, "").replace(/[^a-z0-9_]/g, ""))
  );
  for (const project of FT_COMMON_CORE) {
    if (!completedSlugs.has(project.slug)) continue;
    for (const skill of project.skills) {
      profile[skill] = (profile[skill] ?? 0) + 1;
    }
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

  for (const room of snapshot.thm.rooms) {
    const category = THM_ROOM_CATEGORIES[room.roomCode];
    if (!category) continue;
    const mapped = PLATFORM_SKILL_MAPPING[category];
    if (!mapped) continue;
    for (const skill of mapped) {
      profile[skill] = (profile[skill] ?? 0) + 0.5;
    }
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

  // Compute cross-platform skill floors so THM/HTB recommendations
  // match the student's ACTUAL level, not their platform-specific rank.
  const signals = computeCompetencySignals(snapshot, ftProgress);
  const thmFloors = thmDifficultyFloors(signals);
  const htbFloors = htbTierFloors(signals);
  const machineFloors = htbMachineDifficultyFloors(signals);

  // 1. In-progress 42 projects should be finished first
  for (const slug of ftProgress.inProgressProjects) {
    // A project can be both validated and in-progress (e.g. a redo) — don't
    // nag to "finish" something already passed.
    if (ftProgress.completedProjects.includes(slug)) continue;
    const project = FT_COMMON_CORE.find((p) => p.slug === slug);
    if (project) {
      recs.push({
        priority: "high",
        platform: "42",
        title: project.name,
        reason: "Currently in progress — completing this unblocks the next circle.",
        estimatedHours: project.estimatedHours,
        skills: project.skills,
        ref: project.slug,
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
      title: project.name,
      reason: project.group
        ? (() => {
            const siblings = FT_COMMON_CORE
              .filter((p) => p.group === project.group && p.slug !== project.slug)
              .map((p) => p.name);
            return `Available in Circle ${project.circle} — or pick ${siblings.join(" / ")} instead.`;
          })()
        : `Next available project in Circle ${project.circle}.`,
      estimatedHours: project.estimatedHours,
      skills: project.skills,
      ref: project.slug,
    });
  }

  // 2.5. Project-completion alignment: challenges that exercise what you just learned
  {
    const completedSet = new Set(ftProgress.completedProjects.map((s) => s.toLowerCase()));
    const alignmentRecs: Recommendation[] = [];
    const completedByCircle = FT_COMMON_CORE
      .filter((p) => completedSet.has(p.slug))
      .sort((a, b) => b.circle - a.circle);
    for (const project of completedByCircle) {
      const aligned = PROJECT_CHALLENGE_ALIGNMENT[project.slug];
      if (!aligned) continue;
      for (const ch of aligned) {
        if (alignmentRecs.length >= 5) break;
        if (ch.rmTitle && isRmTitleSolved(ch.rmTitle, snapshot.rootme.solvedTitles)) continue;
        alignmentRecs.push({
          priority: "medium",
          platform: ch.platform,
          title: ch.title,
          reason: ch.reason,
          estimatedHours: ch.hours,
          ref: ch.ref,
          link: ch.link,
        });
      }
      if (alignmentRecs.length >= 5) break;
    }
    recs.push(...alignmentRecs);
  }

  // 3. Goal-driven recommendations for cybersec platforms
  const goalTitleById = new Map(goalsWithPacing.map((g) => [g.id, g.title]));
  const recommendedHtbModuleIds = new Set<string>();
  for (const goal of goalsWithPacing) {
    if (!goal.pacing || goal.pacing.percentComplete >= 100) continue;

    if (goal.category === "rootme" && goal.pacing.daysRemaining < 90) {
      let relevantCats = goalToRootmeCategories(goal.title);
      if (relevantCats.length === 0 && goal.parentGoalId) {
        const parentTitle = goalTitleById.get(goal.parentGoalId);
        if (parentTitle) relevantCats = goalToRootmeCategories(parentTitle);
      }
      const weakCategories = findWeakRootmeCategories(
        snapshot.rootme.categoryCounts,
        relevantCats.length > 0 ? relevantCats : undefined,
      );
      let found = false;
      for (const cat of weakCategories) {
        const picks = pickRootmeChallenges(cat, snapshot.rootme.solvedTitles, 2);
        if (picks.length > 0) {
          for (const ch of picks) {
            recs.push({
              priority: goal.pacing.onTrack ? "medium" : "high",
              platform: "rootme",
              title: `RM: ${ch.title}`,
              reason: `${ch.category} (${ch.score}pts) — ${ch.description}`,
              estimatedHours: ch.score >= 40 ? 3 : ch.score >= 20 ? 2 : 1,
              ref: ch.category,
              link: `https://www.root-me.org/en/Challenges/${encodeURIComponent(ch.category)}/`,
              goalId: goal.id,
            });
          }
          found = true;
          break;
        }
      }
      if (!found && weakCategories.length > 0) {
        recs.push({
          priority: goal.pacing.onTrack ? "medium" : "high",
          platform: "rootme",
          title: `Root-me: ${weakCategories[0]} challenges`,
          reason: `${goal.pacing.requiredPace} for "${goal.title}". ${weakCategories[0]} has few solves.`,
          estimatedHours: 3,
          ref: weakCategories[0],
          goalId: goal.id,
        });
      }
    }

    if (goal.category === "thm" && goal.pacing.daysRemaining < 90) {
      const htbPicks = pickHtbModules(skillProfile, 2, htbFloors)
        .filter((m) => !recommendedHtbModuleIds.has(m.id));
      if (htbPicks.length > 0) {
        for (const mod of htbPicks) {
          const tierHours = { Fundamental: 6, Easy: 8, Medium: 12, Hard: 16 };
          recs.push({
            priority: goal.pacing.onTrack ? "medium" : "high",
            platform: "htb",
            title: `HTB: ${mod.name}`,
            reason: `${mod.area} — deeper alternative to THM rooms.`,
            estimatedHours: tierHours[mod.tier],
            ref: mod.id,
            link: `https://academy.hackthebox.com/module/details/${mod.id}`,
            goalId: goal.id,
          });
          recommendedHtbModuleIds.add(mod.id);
        }
      } else {
        const thmPicks = pickThmRooms(snapshot, skillProfile, 2, thmFloors);
        for (const room of thmPicks) {
          recs.push({
            priority: goal.pacing.onTrack ? "medium" : "high",
            platform: "thm",
            title: `THM: ${room.name}`,
            reason: `${goal.pacing.requiredPace} for "${goal.title}".`,
            estimatedHours: room.difficulty === "hard" ? 4 : room.difficulty === "medium" ? 3 : 2,
            ref: room.code,
            link: `https://tryhackme.com/room/${room.code}`,
            goalId: goal.id,
          });
        }
      }
    }

    if (goal.category === "htb" && goal.pacing.daysRemaining < 90) {
      const htbPicks = pickHtbModules(skillProfile, 2, htbFloors)
        .filter((m) => !recommendedHtbModuleIds.has(m.id));
      for (const mod of htbPicks) {
        recs.push({
          priority: goal.pacing.onTrack ? "medium" : "high",
          platform: "htb",
          title: `HTB: ${mod.name}`,
          reason: `${goal.pacing.requiredPace} for "${goal.title}".`,
          estimatedHours: ({ Fundamental: 6, Easy: 8, Medium: 12, Hard: 16 })[mod.tier],
          ref: mod.id,
          link: `https://academy.hackthebox.com/module/details/${mod.id}`,
          goalId: goal.id,
        });
        recommendedHtbModuleIds.add(mod.id);
      }
    }

    if (goal.category === "maldev") {
      recs.push({
        priority: goal.pacing.onTrack ? "low" : "medium",
        platform: "maldev",
        title: "Maldev elearning",
        reason: `${goal.pacing.requiredPace}. Currently at ${(goal.currentValue ?? 0).toFixed(0)}%.`,
        goalId: goal.id,
      });
    }

    if (goal.category === "general" && goal.pacing.daysRemaining < 120) {
      const rmCats = goalToRootmeCategories(goal.title);
      if (rmCats.length > 0) {
        for (const cat of rmCats) {
          const picks = pickRootmeChallenges(cat, snapshot.rootme.solvedTitles, 1);
          if (picks.length > 0) {
            const ch = picks[0];
            recs.push({
              priority: goal.pacing.onTrack ? "low" : "medium",
              platform: "rootme",
              title: `RM: ${ch.title}`,
              reason: `${ch.category} (${ch.score}pts) — supports "${goal.title}" goal.`,
              estimatedHours: ch.score >= 40 ? 3 : ch.score >= 20 ? 2 : 1,
              ref: ch.category,
              link: `https://www.root-me.org/en/Challenges/${encodeURIComponent(ch.category)}/`,
              goalId: goal.id,
            });
            break;
          }
        }
      }
      const htbAreas = goalToHtbAreas(goal.title);
      if (htbAreas.length > 0) {
        const htbPick = HTB_ACADEMY_MODULES
          .filter((m) => htbAreas.includes(m.area) && !recommendedHtbModuleIds.has(m.id))
          .filter((m) => { const f = htbFloors[m.area]; return !f || isAboveHtbFloor(m.tier, f); })
          .sort((a, b) => ({ Fundamental: 0, Easy: 1, Medium: 2, Hard: 3 })[a.tier] - ({ Fundamental: 0, Easy: 1, Medium: 2, Hard: 3 })[b.tier])[0];
        if (htbPick) {
          recs.push({
            priority: goal.pacing.onTrack ? "low" : "medium",
            platform: "htb",
            title: `HTB: ${htbPick.name}`,
            reason: `Supports "${goal.title}" goal — ${htbPick.area} module.`,
            estimatedHours: ({ Fundamental: 6, Easy: 8, Medium: 12, Hard: 16 })[htbPick.tier],
            ref: htbPick.id,
            link: `https://academy.hackthebox.com/module/details/${htbPick.id}`,
            goalId: goal.id,
          });
          recommendedHtbModuleIds.add(htbPick.id);
        }
      }
    }
  }

  // 4. Skill-gap based: if upcoming 42 projects need skills the user is weak in
  const alreadyRecTitles = new Set(recs.filter((r) => r.platform === "rootme").map((r) => r.title.replace(/^RM: /, "").toLowerCase()));
  for (const project of ftProgress.availableProjects.slice(0, 5)) {
    for (const skill of project.skills) {
      const level = skillProfile[skill] ?? 0;
      if (level < 2 && isSecurityRelated(skill)) {
        const platformSuggestion = suggestPlatformForSkill(skill, level);
        if (platformSuggestion === "htb") {
          const mod = pickHtbModuleForSkill(snapshot, skill, htbFloors);
          if (mod) {
            const tierHours = { Fundamental: 6, Easy: 8, Medium: 12, Hard: 16 };
            recs.push({
              priority: "low",
              platform: "htb",
              title: `HTB: ${mod.name}`,
              reason: `Build ${skill} skills for upcoming "${project.name}".`,
              estimatedHours: tierHours[mod.tier],
              skills: [skill],
              ref: mod.id,
              link: `https://academy.hackthebox.com/module/details/${mod.id}`,
            });
          } else {
            const room = pickThmRoomForSkill(snapshot, skill, thmFloors);
            if (room) {
              recs.push({
                priority: "low",
                platform: "thm",
                title: `THM: ${room.name}`,
                reason: `Build ${skill} skills for upcoming "${project.name}".`,
                estimatedHours: room.difficulty === "hard" ? 4 : room.difficulty === "medium" ? 3 : 2,
                skills: [skill],
                ref: room.code,
                link: `https://tryhackme.com/room/${room.code}`,
              });
            }
          }
        } else if (platformSuggestion === "thm") {
          const room = pickThmRoomForSkill(snapshot, skill, thmFloors);
          if (room) {
            recs.push({
              priority: "low",
              platform: "thm",
              title: `THM: ${room.name}`,
              reason: `Build ${skill} skills for upcoming "${project.name}".`,
              estimatedHours: room.difficulty === "hard" ? 4 : room.difficulty === "medium" ? 3 : 2,
              skills: [skill],
              ref: room.code,
              link: `https://tryhackme.com/room/${room.code}`,
            });
          }
        } else if (platformSuggestion === "rootme") {
          const cat = skillToRootmeCategory(skill);
          const ch = pickRootmeChallengeForSkill(cat, skill, snapshot.rootme.solvedTitles, alreadyRecTitles);
          if (ch) {
            recs.push({
              priority: "low",
              platform: "rootme",
              title: `RM: ${ch.title}`,
              reason: `${ch.category} (${ch.score}pts) — builds ${skill} for upcoming "${project.name}".`,
              estimatedHours: ch.score >= 40 ? 3 : ch.score >= 20 ? 2 : 1,
              skills: [skill],
              ref: ch.category,
              link: `https://www.root-me.org/en/Challenges/${encodeURIComponent(ch.category)}/`,
            });
            alreadyRecTitles.add(ch.title.toLowerCase());
          } else {
            const hasRelatedRec = recs.some(
              (r) => r.platform === "rootme" && r.ref === cat &&
                r.reason?.includes(project.name)
            );
            if (!hasRelatedRec) {
              recs.push({
                priority: "low",
                platform: "rootme",
                title: `Root-me: ${cat} challenges`,
                reason: `Build ${skill} skills for upcoming "${project.name}".`,
                estimatedHours: 3,
                skills: [skill],
                ref: cat,
              });
            }
          }
        }
      }
    }
  }

  // 5. HTB Machine recommendations — 1-2 retired boxes matching weak areas
  // Gate: skip if the user hasn't completed any HTB boxes yet (Academy first)
  const htbOwns = (snapshot.htb.profile?.systemOwns ?? 0) + (snapshot.htb.profile?.userOwns ?? 0);
  const areaToSkills: Record<string, string[]> = {};
  for (const [skill, area] of Object.entries(SKILL_TO_HTB_MACHINE_AREA)) {
    (areaToSkills[area] ??= []).push(skill);
  }
  const machinePicks = htbOwns > 0 ? pickHtbMachines(skillProfile, 2, machineFloors) : [];
  for (const machine of machinePicks) {
    const hours = machine.difficulty === "Hard" ? 8 : machine.difficulty === "Medium" ? 5 : 3;
    const matchedSkills = (areaToSkills[machine.area] ?? []).filter((s) => (skillProfile[s] ?? 0) < 2);
    const relatedProject = ftProgress.availableProjects.find((p) =>
      p.skills.some((s) => matchedSkills.includes(s))
    );
    const reason = relatedProject
      ? `Retired ${machine.difficulty} box — strengthen ${matchedSkills[0] ?? machine.area} for upcoming "${relatedProject.name}".`
      : matchedSkills.length > 0
        ? `Retired ${machine.difficulty} box — strengthen ${matchedSkills[0]} (current gap).`
        : `Retired ${machine.difficulty} box — practice ${machine.area} skills.`;
    recs.push({
      priority: "medium",
      platform: "htb",
      title: `HTB Machine: ${machine.name}`,
      reason,
      estimatedHours: hours,
      skills: matchedSkills,
      ref: machine.name,
      link: htbMachineLink(machine.name),
    });
  }

  // Deduplicate by normalized title (collapse Start/Finish/Continue/Work on variants)
  const normalizeRec = (t: string) => t.replace(/^(Start|Finish|Continue|Work on)\s+/i, "");
  const seen = new Set<string>();
  const deduped = recs.filter((r) => {
    const key = `${normalizeRec(r.title)}::${r.platform}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  deduped.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));
  return deduped;
}

const SKILL_TO_THM_CATEGORY: Record<string, string> = {
  security: "misc",
  networking: "misc",
  cryptography: "crypto",
  "reverse-engineering": "reverse",
  "web-security": "web",
  forensics: "forensics",
  shell: "misc",
};

const SKILL_TO_HTB_AREA: Record<string, string> = {
  security: "Networking",
  networking: "Networking",
  cryptography: "Crypto & forensics basics",
  "reverse-engineering": "Low-level & C",
  "web-security": "Web",
  forensics: "Crypto & forensics basics",
  docker: "Linux & systems",
  sockets: "Networking",
  shell: "Linux & systems",
  "system-administration": "Linux & systems",
};

const SKILL_TO_HTB_MACHINE_AREA: Record<string, string> = {
  security: "Linux & systems",
  networking: "Networking",
  "reverse-engineering": "Reverse engineering & binary",
  "web-security": "Web",
  "win-internals": "Windows exploitation",
  forensics: "Crypto & forensics basics",
  cryptography: "Crypto & forensics basics",
};

const SKILL_TO_ROOTME_CATEGORY: Record<string, string> = {
  cryptography: "Cryptanalyse",
  "reverse-engineering": "Cracking",
  "web-security": "Web - Serveur",
  forensics: "Forensique",
  security: "App - Système",
  networking: "Réseau",
  http: "Web - Serveur",
  sockets: "Réseau",
  threading: "App - Système",
  concurrency: "App - Système",
  "process-management": "App - Système",
  shell: "Web - Serveur",
};

function pickThmRooms(
  snapshot: PlatformSnapshot,
  skillProfile: Record<string, number>,
  count: number,
  competencyFloors?: Record<string, string>
): typeof THM_ROOM_CATALOG {
  const completedCodes = new Set(snapshot.thm.rooms.map((r) => r.roomCode));
  const floors = competencyFloors ?? {};

  // Filter out completed rooms AND rooms below the student's cross-platform
  // skill floor (e.g., skip "Intro to Linux" if they've done Born2beroot at 42)
  const available = THM_ROOM_CATALOG.filter((r) => {
    if (completedCodes.has(r.code)) return false;
    const floor = floors[r.category];
    if (floor && !isAboveFloor(r.difficulty, floor as "info" | "easy" | "medium" | "hard")) return false;
    return true;
  });

  const weakSkills = Object.entries(skillProfile)
    .filter(([, v]) => v < 2)
    .map(([k]) => SKILL_TO_THM_CATEGORY[k])
    .filter(Boolean);

  const diffWeight = { info: 0, easy: 1, medium: 2, hard: 3 };
  return available
    .sort((a, b) => {
      const aMatch = weakSkills.includes(a.category) ? 0 : 1;
      const bMatch = weakSkills.includes(b.category) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return diffWeight[a.difficulty] - diffWeight[b.difficulty];
    })
    .slice(0, count);
}

function pickHtbModules(
  skillProfile: Record<string, number>,
  count: number,
  competencyFloors?: Record<string, string>
): typeof HTB_ACADEMY_MODULES {
  const floors = competencyFloors ?? {};

  // Filter out modules below the student's cross-platform skill floor
  const available = HTB_ACADEMY_MODULES.filter((m) => {
    const floor = floors[m.area];
    if (floor && !isAboveHtbFloor(m.tier, floor)) return false;
    return true;
  });

  const weakAreas = Object.entries(skillProfile)
    .filter(([, v]) => v < 2)
    .map(([k]) => SKILL_TO_HTB_AREA[k])
    .filter(Boolean);

  const tierWeight = { Fundamental: 0, Easy: 1, Medium: 2, Hard: 3 };
  return [...available]
    .sort((a, b) => {
      const aMatch = weakAreas.includes(a.area) ? 0 : 1;
      const bMatch = weakAreas.includes(b.area) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return tierWeight[a.tier] - tierWeight[b.tier];
    })
    .slice(0, count);
}

function pickHtbMachines(
  skillProfile: Record<string, number>,
  count: number,
  competencyFloors?: Record<string, string>
): HtbMachine[] {
  const floors = competencyFloors ?? {};

  const available = HTB_MACHINES.filter((m) => {
    if (!m.retired) return false;
    const floor = floors[m.area];
    if (floor && !isAboveHtbMachineDifficulty(m.difficulty, floor)) return false;
    return true;
  });

  const weakAreas = Object.entries(skillProfile)
    .filter(([, v]) => v < 2)
    .map(([k]) => SKILL_TO_HTB_MACHINE_AREA[k])
    .filter(Boolean);

  const diffWeight = { Easy: 0, Medium: 1, Hard: 2, Insane: 3 };
  return [...available]
    .sort((a, b) => {
      const aMatch = weakAreas.includes(a.area) ? 0 : 1;
      const bMatch = weakAreas.includes(b.area) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return diffWeight[a.difficulty] - diffWeight[b.difficulty];
    })
    .slice(0, count);
}

function pickThmRoomForSkill(
  snapshot: PlatformSnapshot,
  skill: string,
  competencyFloors?: Record<string, string>
): (typeof THM_ROOM_CATALOG)[number] | undefined {
  const completedCodes = new Set(snapshot.thm.rooms.map((r) => r.roomCode));
  const floors = competencyFloors ?? {};
  const category = SKILL_TO_THM_CATEGORY[skill];
  if (!category) return undefined;
  return THM_ROOM_CATALOG.find((r) => {
    if (r.category !== category || completedCodes.has(r.code)) return false;
    const floor = floors[r.category];
    if (floor && !isAboveFloor(r.difficulty, floor as "info" | "easy" | "medium" | "hard")) return false;
    return true;
  });
}

function pickHtbModuleForSkill(
  snapshot: PlatformSnapshot,
  skill: string,
  competencyFloors?: Record<string, string>
): HtbModule | undefined {
  const area = SKILL_TO_HTB_AREA[skill];
  if (!area) return undefined;
  const floors = competencyFloors ?? {};
  const tierWeight = { Fundamental: 0, Easy: 1, Medium: 2, Hard: 3 };
  return HTB_ACADEMY_MODULES.filter((m) => {
    if (m.area !== area) return false;
    const floor = floors[m.area];
    if (floor && !isAboveHtbFloor(m.tier, floor)) return false;
    return true;
  }).sort((a, b) => tierWeight[a.tier] - tierWeight[b.tier])[0];
}

function skillToRootmeCategory(skill: string): string {
  return SKILL_TO_ROOTME_CATEGORY[skill] ?? "App - Système";
}

const GOAL_TITLE_TO_ROOTME: Record<string, string[]> = {
  "reverse": ["Cracking", "App - Système"],
  "cracking": ["Cracking"],
  "web": ["Web - Client", "Web - Serveur"],
  "crypto": ["Cryptanalyse"],
  "forensic": ["Forensique"],
  "network": ["Réseau"],
  "stegano": ["Stéganographie"],
  "script": ["App - Script"],
  "malware": ["Cracking", "App - Système"],
  "binary": ["App - Système", "Cracking"],
  "c++": ["Cracking"],
  "oop": ["Cracking"],
  "low-level": ["App - Système", "Cracking"],
};

const GOAL_TITLE_TO_HTB_AREA: Record<string, string[]> = {
  "reverse": ["Low-level & C"],
  "binary": ["Low-level & C"],
  "c++": ["Low-level & C"],
  "oop": ["Low-level & C"],
  "low-level": ["Low-level & C"],
  "web": ["Web"],
  "network": ["Networking"],
  "crypto": ["Crypto & forensics basics"],
  "forensic": ["Crypto & forensics basics"],
  "linux": ["Linux & systems"],
  "windows": ["Windows internals & maldev"],
  "active directory": ["Active Directory"],
  "malware": ["Windows internals & maldev"],
  "scripting": ["Scripting & automation"],
};

function goalToHtbAreas(goalTitle: string): string[] {
  const lower = goalTitle.toLowerCase();
  const areas = new Set<string>();
  for (const [keyword, areaList] of Object.entries(GOAL_TITLE_TO_HTB_AREA)) {
    if (lower.includes(keyword)) {
      for (const a of areaList) areas.add(a);
    }
  }
  return areas.size > 0 ? [...areas] : [];
}

function goalToRootmeCategories(goalTitle: string): string[] {
  const lower = goalTitle.toLowerCase();
  const cats = new Set<string>();
  for (const [keyword, categories] of Object.entries(GOAL_TITLE_TO_ROOTME)) {
    if (lower.includes(keyword)) {
      for (const c of categories) cats.add(c);
    }
  }
  return cats.size > 0 ? [...cats] : [];
}

function findWeakRootmeCategories(
  categoryCounts: Record<string, number>,
  relevantCategories?: string[]
): string[] {
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

  const candidates = relevantCategories && relevantCategories.length > 0
    ? allCategories.filter((cat) => relevantCategories.includes(cat))
    : allCategories;

  return candidates
    .filter((cat) => (categoryCounts[cat] ?? 0) < 3)
    .slice(0, 3);
}

// ── Project-completion challenge alignment ──────────────────────────────
// Maps completed 42 projects to challenges that directly exercise the
// same techniques offensively. Ordered by alignment strength per project.
type AlignedChallenge = {
  platform: string;
  title: string;
  reason: string;
  hours: number;
  ref?: string;
  link?: string;
  rmTitle?: string;
};

const PROJECT_CHALLENGE_ALIGNMENT: Record<string, AlignedChallenge[]> = {
  libft: [
    { platform: "rootme", title: "RM: ELF x86 - Stack buffer overflow basic 1", reason: "Stack variable overwrite — uses C memory model from libft", hours: 1, ref: "App - Système", link: "https://www.root-me.org/en/Challenges/App%20-%20Syst%C3%A8me/", rmTitle: "elf x86 - stack buffer overflow basic 1" },
  ],
  ft_printf: [
    { platform: "rootme", title: "RM: ELF x86 - Format string bug basic 1", reason: "You implemented printf — format string exploitation is the offensive mirror", hours: 2, ref: "App - Système", link: "https://www.root-me.org/en/Challenges/App%20-%20Syst%C3%A8me/", rmTitle: "elf x86 - format string bug basic 1" },
    { platform: "rootme", title: "RM: ELF x86 - Format string bug basic 2", reason: "Arbitrary write via %n — extends your printf internals to memory corruption", hours: 2, ref: "App - Système", link: "https://www.root-me.org/en/Challenges/App%20-%20Syst%C3%A8me/", rmTitle: "elf x86 - format string bug basic 2" },
  ],
  born2beroot: [
    { platform: "htb", title: "HTB: Linux Privilege Escalation", reason: "Break the security policies you configured in born2beroot", hours: 8, ref: "linux-privesc", link: "https://academy.hackthebox.com/module/details/linux-privesc" },
  ],
  pipex: [
    { platform: "htb", title: "HTB: Command Injections", reason: "Pipex executes commands via pipes — command injection is the offensive version", hours: 12, ref: "command-injections", link: "https://academy.hackthebox.com/module/details/command-injections" },
  ],
  push_swap: [
    { platform: "rootme", title: "RM: ELF x64 - Basic KeygenMe", reason: "Reverse an algorithm to write a keygen — same analytical skill as designing a sort", hours: 2, ref: "Cracking", link: "https://www.root-me.org/en/Challenges/Cracking/", rmTitle: "elf x64 - basic keygenme" },
  ],
  philosophers: [
    { platform: "rootme", title: "RM: ELF x86 - Race condition", reason: "TOCTOU race — directly applies your threading and synchronization knowledge", hours: 2, ref: "App - Système", link: "https://www.root-me.org/en/Challenges/App%20-%20Syst%C3%A8me/", rmTitle: "elf x86 - race condition" },
  ],
  minishell: [
    { platform: "rootme", title: "RM: PHP - Command injection", reason: "You built a shell — command injection exploits exactly what you implemented", hours: 2, ref: "Web - Serveur", link: "https://www.root-me.org/en/Challenges/Web%20-%20Serveur/", rmTitle: "php - command injection" },
    { platform: "htb", title: "HTB: Command Injections", reason: "You built a shell — this module teaches attacking the mechanism you coded", hours: 12, ref: "command-injections", link: "https://academy.hackthebox.com/module/details/command-injections" },
  ],
  netpractice: [
    { platform: "htb", title: "HTB: Network Enumeration with Nmap", reason: "Extend your subnetting knowledge into active network reconnaissance", hours: 8, ref: "nmap-enumeration", link: "https://academy.hackthebox.com/module/details/nmap-enumeration" },
  ],
  cpp04: [
    { platform: "rootme", title: "RM: ELF C++ - 0 protection", reason: "Reverse a C++ binary — applies your OOP knowledge to binary analysis", hours: 1, ref: "Cracking", link: "https://www.root-me.org/en/Challenges/Cracking/", rmTitle: "elf c++ - 0 protection" },
    { platform: "rootme", title: "RM: ELF x86 - Stack buffer overflow - C++ vtables", reason: "Vtable pointer corruption — exploits the polymorphism mechanism from cpp04", hours: 3, ref: "App - Système", link: "https://www.root-me.org/en/Challenges/App%20-%20Syst%C3%A8me/", rmTitle: "elf x86 - stack buffer overflow - c++ vtables" },
  ],
  webserv: [
    { platform: "rootme", title: "RM: HTTP - User-agent", reason: "HTTP header spoofing — you implemented header parsing in webserv", hours: 1, ref: "Web - Serveur", link: "https://www.root-me.org/en/Challenges/Web%20-%20Serveur/", rmTitle: "http - user-agent" },
    { platform: "rootme", title: "RM: Local File Inclusion", reason: "Path traversal — you implemented file serving and path resolution", hours: 2, ref: "Web - Serveur", link: "https://www.root-me.org/en/Challenges/Web%20-%20Serveur/", rmTitle: "local file inclusion" },
    { platform: "htb", title: "HTB: Using Web Proxies", reason: "HTTP interception — you understand request/response from building the server", hours: 8, ref: "using-web-proxies", link: "https://academy.hackthebox.com/module/details/using-web-proxies" },
  ],
  inception: [
    { platform: "htb", title: "HTB: Linux Privilege Escalation", reason: "Container escape scenarios — extends your Docker infrastructure knowledge", hours: 8, ref: "linux-privesc", link: "https://academy.hackthebox.com/module/details/linux-privesc" },
  ],
  get_next_line: [
    { platform: "rootme", title: "RM: ELF x86 - Stack buffer overflow basic 2", reason: "Buffer overflow to overwrite a function pointer — applies your fd/buffer management skills", hours: 1, ref: "App - Système", link: "https://www.root-me.org/en/Challenges/App%20-%20Syst%C3%A8me/", rmTitle: "elf x86 - stack buffer overflow basic 2" },
  ],
  minitalk: [
    { platform: "rootme", title: "RM: ELF x86 - Stack buffer overflow basic 3", reason: "Shellcode via environment variables — extends your signal handling and IPC knowledge", hours: 2, ref: "App - Système", link: "https://www.root-me.org/en/Challenges/App%20-%20Syst%C3%A8me/", rmTitle: "elf x86 - stack buffer overflow basic 3" },
  ],
  cpp00: [
    { platform: "rootme", title: "RM: ELF C++ - 0 protection", reason: "Reverse a C++ binary — apply your new OOP knowledge to binary analysis", hours: 1, ref: "Cracking", link: "https://www.root-me.org/en/Challenges/Cracking/", rmTitle: "elf c++ - 0 protection" },
  ],
  ft_irc: [
    { platform: "rootme", title: "RM: FTP - authentication", reason: "Extract protocol credentials from captures — you implemented a similar text protocol", hours: 1, ref: "Réseau", link: "https://www.root-me.org/en/Challenges/R%C3%A9seau/", rmTitle: "ftp - authentication" },
    { platform: "htb", title: "HTB: Network Enumeration with Nmap", reason: "Network reconnaissance — you understand server-side networking from building ft_irc", hours: 8, ref: "nmap-enumeration", link: "https://academy.hackthebox.com/module/details/nmap-enumeration" },
  ],
  ft_transcendence: [
    { platform: "rootme", title: "RM: SQL injection - Authentication", reason: "SQLi on login — your project has database-backed authentication", hours: 2, ref: "Web - Serveur", link: "https://www.root-me.org/en/Challenges/Web%20-%20Serveur/", rmTitle: "sql injection - authentication" },
    { platform: "htb", title: "HTB: SQL Injection Fundamentals", reason: "Learn to attack the database queries you write in ft_transcendence", hours: 8, ref: "sql-injection-fundamentals", link: "https://academy.hackthebox.com/module/details/sql-injection-fundamentals" },
    { platform: "htb", title: "HTB: Cross-Site Scripting (XSS)", reason: "Your project has user-facing frontend — understanding XSS prevents shipping it", hours: 8, ref: "xss", link: "https://academy.hackthebox.com/module/details/xss" },
  ],
};

function isSecurityRelated(skill: string): boolean {
  return [
    "security",
    "networking",
    "cryptography",
    "reverse-engineering",
    "web-security",
    "forensics",
    "http",
    "sockets",
    "threading",
    "concurrency",
    "process-management",
    "shell",
    "docker",
    "system-administration",
  ].includes(skill);
}

function suggestPlatformForSkill(
  skill: string,
  level: number
): string | null {
  const mapping: Record<string, string> = {
    security: "htb",
    networking: "htb",
    cryptography: "rootme",
    "reverse-engineering": "rootme",
    "web-security": level >= 2 ? "rootme" : "htb",
    forensics: "rootme",
    http: level >= 2 ? "rootme" : "htb",
    sockets: "htb",
    threading: "rootme",
    concurrency: "rootme",
    "process-management": "rootme",
    shell: level >= 2 ? "rootme" : "htb",
    docker: "htb",
    "system-administration": "htb",
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
    flattenGoals(goalsWithPacing),
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
