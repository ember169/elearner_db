import { db } from "@/lib/db";
import {
  settings,
  ftProfile,
  ftSkills,
  ftProjects,
  ftAchievements,
  activityFeed,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const API_BASE = "https://api.intra.42.fr";

type Config = {
  ftClientId: string | null;
  ftClientSecret: string | null;
  ftUserId: string | null;
  ftAccessToken: string | null;
  ftTokenExpiresAt: number | null;
};

async function getToken(config: Config): Promise<string> {
  if (
    config.ftAccessToken &&
    config.ftTokenExpiresAt &&
    Date.now() / 1000 < config.ftTokenExpiresAt - 60
  ) {
    return config.ftAccessToken;
  }

  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.ftClientId!,
      client_secret: config.ftClientSecret!,
    }),
  });

  if (!res.ok) throw new Error(`42 OAuth failed: ${res.status}`);
  const data = await res.json();

  db.update(settings)
    .set({
      ftAccessToken: data.access_token,
      ftTokenExpiresAt: data.created_at + data.expires_in,
    })
    .where(eq(settings.id, 1))
    .run();

  return data.access_token;
}

async function apiFetch(token: string, path: string) {
  await new Promise((r) => setTimeout(r, 500));
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`42 API ${path}: ${res.status}`);
  return res.json();
}

export async function syncFortyTwo(config: Config) {
  const token = await getToken(config);
  const userId = config.ftUserId;
  let itemsSynced = 0;

  // Profile
  const me = await apiFetch(token, `/v2/users/${userId}`);
  const cursusUser = me.cursus_users?.find(
    (c: { cursus_id: number }) => c.cursus_id === 21
  ) ?? me.cursus_users?.[0];

  db.delete(ftProfile).run();
  db.insert(ftProfile)
    .values({
      login: me.login,
      level: cursusUser?.level ?? 0,
      correctionPoints: me.correction_point ?? 0,
      wallet: me.wallet ?? 0,
      coalition: null,
      imageUrl: me.image?.link ?? null,
      campus: me.campus?.[0]?.name ?? null,
    })
    .run();
  itemsSynced++;

  // Skills
  if (cursusUser?.skills) {
    db.delete(ftSkills).run();
    for (const skill of cursusUser.skills) {
      db.insert(ftSkills)
        .values({
          skillId: skill.id,
          name: skill.name,
          level: skill.level,
          cursusId: cursusUser.cursus_id,
        })
        .run();
      itemsSynced++;
    }
  }

  // Projects
  const projects = await apiFetch(
    token,
    `/v2/users/${userId}/projects_users?page[size]=100`
  );
  db.delete(ftProjects).run();
  for (const p of projects) {
    db.insert(ftProjects)
      .values({
        projectId: p.project?.id ?? 0,
        name: p.project?.name ?? "Unknown",
        slug: p.project?.slug ?? null,
        status: p.status ?? null,
        finalMark: p["final_mark"] ?? null,
        validated: p["validated?"] ?? null,
        markedAt: p.marked_at ?? null,
      })
      .run();
    itemsSynced++;
  }

  // Achievements — non-essential. This endpoint 404s for some accounts, so a
  // failure here must not abort the whole sync after profile/skills/projects
  // (the data that actually matters) have already been written.
  try {
    const achievements = await apiFetch(
      token,
      `/v2/users/${userId}/achievements`
    );
    db.delete(ftAchievements).run();
    for (const a of achievements) {
      db.insert(ftAchievements)
        .values({
          achievementId: a.id,
          name: a.name,
          description: a.description ?? null,
          tier: a.tier ?? null,
          kind: a.kind ?? null,
        })
        .run();
      itemsSynced++;
    }
  } catch {
    // achievements unavailable for this account — skip, keep the rest of the sync
  }

  db.insert(activityFeed)
    .values({
      platform: "42",
      eventType: "sync",
      title: `42 profile synced (level ${cursusUser?.level?.toFixed(2) ?? "?"})`,
      details: JSON.stringify({
        level: cursusUser?.level,
        projects: projects.length,
      }),
    })
    .run();

  return {
    itemsSynced,
    snapshot: {
      level: cursusUser?.level,
      correctionPoints: me.correction_point,
      wallet: me.wallet,
      projectsCount: projects.length,
      skillsCount: cursusUser?.skills?.length ?? 0,
    },
  };
}
