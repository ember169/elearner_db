import { db } from "@/lib/db";
import { rootmeProfile, rootmeChallenges, activityFeed } from "@/lib/db/schema";

const API_BASE = "https://api.www.root-me.org";

type Config = {
  rootmeApiKey: string | null;
  rootmeCookie: string | null;
  rootmeUserId: string | null;
};

async function rootmeFetch(config: Config, path: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (config.rootmeApiKey) {
    headers["Authorization"] = `Bearer ${config.rootmeApiKey}`;
  } else if (config.rootmeCookie) {
    headers["Cookie"] = `spip_session=${config.rootmeCookie}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`Root-me API ${path}: ${res.status}`);
  return res.json();
}

export async function syncRootMe(config: Config) {
  const userId = config.rootmeUserId;
  if (!userId) throw new Error("Root-me user ID not configured");
  let itemsSynced = 0;

  const userData = await rootmeFetch(config, `/auteurs/${userId}`);

  db.delete(rootmeProfile).run();
  db.insert(rootmeProfile)
    .values({
      username: userData.nom ?? "Unknown",
      score: userData.score ?? 0,
      position: userData.position ?? null,
      challengesSolved: Array.isArray(userData.validations)
        ? userData.validations.length
        : 0,
    })
    .run();
  itemsSynced++;

  // Fetch solved challenges
  if (Array.isArray(userData.validations)) {
    db.delete(rootmeChallenges).run();
    for (const v of userData.validations) {
      const challengeId =
        v.id_challenge ?? (v.url_challenge?.match(/(\d+)$/)?.[1] ?? null);
      if (!challengeId) continue;

      let title = v.titre ?? `Challenge ${challengeId}`;
      let category = v.rubrique ?? v.category ?? null;
      let score = v.score ?? 0;

      // Fetch challenge details if title is missing
      if (!v.titre && challengeId) {
        try {
          const challenge = await rootmeFetch(
            config,
            `/challenges/${challengeId}`
          );
          title = challenge.titre ?? title;
          category = challenge.rubrique ?? category;
          score = challenge.score ?? score;
        } catch {}
      }

      db.insert(rootmeChallenges)
        .values({
          challengeId: Number(challengeId),
          title,
          category,
          score,
          solvedAt: v.date ?? null,
        })
        .run();
      itemsSynced++;
    }
  }

  db.insert(activityFeed)
    .values({
      platform: "rootme",
      eventType: "sync",
      title: `Root-me synced (${userData.score ?? 0} pts, rank #${userData.position ?? "?"})`,
      details: JSON.stringify({
        score: userData.score,
        position: userData.position,
        challenges: Array.isArray(userData.validations)
          ? userData.validations.length
          : 0,
      }),
    })
    .run();

  return {
    itemsSynced,
    snapshot: {
      score: userData.score,
      position: userData.position,
      challengesSolved: Array.isArray(userData.validations)
        ? userData.validations.length
        : 0,
    },
  };
}
