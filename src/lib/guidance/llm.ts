import { db } from "@/lib/db";
import { settings, guidanceCache } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { GuidanceResult } from "./engine";

function buildPrompt(guidance: GuidanceResult): string {
  const { snapshot, goals, ftProgress, skillProfile, recommendations } =
    guidance;

  const lines: string[] = [];
  lines.push("You are a learning path advisor for a 42 Paris cybersecurity student.");
  lines.push("Based on their current progress across platforms, give concise, actionable advice.");
  lines.push("Be direct and specific. No generic motivation — focus on what to do next and why.");
  lines.push("");

  // 42 progress
  lines.push("## 42 Paris Progress");
  lines.push(`Current circle: ${ftProgress.currentCircle}`);
  lines.push(`Completed projects: ${ftProgress.completedProjects.join(", ") || "none"}`);
  lines.push(`In progress: ${ftProgress.inProgressProjects.join(", ") || "none"}`);
  lines.push(
    `Available next: ${ftProgress.availableProjects.map((p) => `${p.name} (Circle ${p.circle}, ~${p.estimatedHours}h)`).join(", ") || "none"}`
  );
  if (snapshot.ft.profile) {
    lines.push(`Level: ${snapshot.ft.profile.level}`);
  }
  lines.push("");

  // Platform stats
  lines.push("## Other Platforms");
  if (snapshot.thm.profile) {
    lines.push(
      `TryHackMe: ${snapshot.thm.roomsCompleted} rooms, top ${snapshot.thm.profile.rank ?? "?"}% of users, streak ${snapshot.thm.profile.streak ?? 0}d`
    );
  }
  if (snapshot.htb.profile) {
    lines.push(
      `HackTheBox: ${snapshot.htb.profile.rank ?? "?"} rank, ${(snapshot.htb.profile.systemOwns ?? 0) + (snapshot.htb.profile.userOwns ?? 0)} owns`
    );
  }
  if (snapshot.rootme.profile) {
    lines.push(
      `Root-me: ${snapshot.rootme.challengesSolved} challenges, score ${snapshot.rootme.profile.score ?? 0}, rank #${snapshot.rootme.profile.position ?? "?"}`
    );
    const cats = Object.entries(snapshot.rootme.categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k}(${v})`)
      .join(", ");
    if (cats) lines.push(`  Top categories: ${cats}`);
  }
  if (snapshot.maldev.profile) {
    lines.push(
      `Maldev elearning: ${(snapshot.maldev.profile.overallProgress ?? 0).toFixed(0)}% complete`
    );
  }
  lines.push("");

  // Goals
  if (goals.length > 0) {
    lines.push("## Active Goals");
    for (const g of goals) {
      let line = `- ${g.title}`;
      if (g.pacing) {
        line += ` — ${g.pacing.percentComplete.toFixed(0)}% done, ${g.pacing.daysRemaining}d left`;
        line += g.pacing.onTrack ? " (on track)" : " (BEHIND)";
        if (g.pacing.requiredPace !== "Complete!") {
          line += `, need ${g.pacing.requiredPace}`;
        }
      }
      lines.push(line);
    }
    lines.push("");
  }

  // Top skills
  const sortedSkills = Object.entries(skillProfile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  if (sortedSkills.length > 0) {
    lines.push("## Skill Profile (top)");
    for (const [name, level] of sortedSkills) {
      lines.push(`- ${name}: ${level.toFixed(1)}`);
    }
    lines.push("");
  }

  // Rule-based recs
  if (recommendations.length > 0) {
    lines.push("## Rule-based recommendations (for reference)");
    for (const r of recommendations) {
      lines.push(
        `- [${r.priority}] ${r.platform}: ${r.title} — ${r.reason}`
      );
    }
    lines.push("");
  }

  lines.push("## Instructions");
  lines.push("Give 3-5 prioritized recommendations.");
  lines.push("For each: what to do, which platform, why now, and how it connects to their goals.");
  lines.push("If they're behind on a goal, flag it and suggest catch-up strategies.");
  lines.push("For skill gaps, prefer HackTheBox machines, challenges, and Academy modules as the primary resource.");
  lines.push("Only suggest TryHackMe rooms as a fallback: when HTB has no matching content for a topic, or when the learner is struggling on a subject even after completing HTB modules and needs a more guided approach.");
  lines.push("Root-me challenges are good for specific technical drills (crypto, web, forensics).");
  lines.push("Keep it under 500 words. Use markdown formatting.");

  return lines.join("\n");
}

export async function getLlmGuidance(
  guidance: GuidanceResult
): Promise<string | null> {
  const config = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (!config?.llmApiKey) return null;

  const prompt = buildPrompt(guidance);

  // Check cache (reuse if less than 6 hours old)
  const cached = db
    .select()
    .from(guidanceCache)
    .orderBy(desc(guidanceCache.createdAt))
    .limit(1)
    .all()[0];

  if (cached) {
    const cacheAge =
      Date.now() - new Date(cached.createdAt).getTime();
    if (cacheAge < 6 * 60 * 60 * 1000 && cached.prompt === prompt) {
      return cached.response;
    }
  }

  const model = config.llmModel ?? "claude-sonnet-5";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.llmApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const response =
    data.content?.[0]?.text ?? "No response generated.";

  db.insert(guidanceCache)
    .values({ prompt, response })
    .run();

  return response;
}
