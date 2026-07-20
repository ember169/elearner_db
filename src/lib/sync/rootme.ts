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

  // Root-me's API authenticates via cookies, not Authorization headers:
  // the account API key goes in an `api_key` cookie, and a browser session
  // can be used via `spip_session`. Send whichever we have (both is fine).
  const cookies: string[] = [];
  if (config.rootmeApiKey) cookies.push(`api_key=${config.rootmeApiKey}`);
  if (config.rootmeCookie) cookies.push(`spip_session=${config.rootmeCookie}`);
  if (cookies.length > 0) headers["Cookie"] = cookies.join("; ");

  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`Root-me API ${path}: ${res.status}`);
  return res.json();
}

// Root-me's author endpoints need the numeric author id, but users know their
// username. /auteurs?nom=<name> searches; the response shape is quirky
// (SPIP-style nested arrays), so walk it defensively for id_auteur/nom pairs.
function findAuteurId(data: unknown, username: string): string | null {
  const results: { id: string; nom: string }[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const rec = node as Record<string, unknown>;
    if (rec.id_auteur != null && rec.nom != null) {
      results.push({ id: String(rec.id_auteur), nom: String(rec.nom) });
    }
    for (const v of Object.values(rec)) walk(v);
  };
  walk(data);
  const exact = results.find(
    (r) => r.nom.toLowerCase() === username.toLowerCase()
  );
  return exact?.id ?? results[0]?.id ?? null;
}

export async function syncRootMe(config: Config) {
  let userId = config.rootmeUserId;
  if (!userId) throw new Error("Root-me user ID not configured");
  let itemsSynced = 0;

  // Accept a username in the "user id" field: resolve it to the numeric
  // author id the /auteurs/{id} endpoint actually requires.
  if (!/^\d+$/.test(userId)) {
    let search: unknown;
    try {
      search = await rootmeFetch(
        config,
        `/auteurs?nom=${encodeURIComponent(userId)}`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // The SPIP-based API answers 404 for an empty result set, not an
      // invalid route — translate that into something actionable.
      if (msg.includes(": 404")) {
        throw new Error(
          `Root-me: no author matches "${userId}". The search needs your exact Root-me display name — or skip it entirely by putting your numeric author id in the User ID field (it's the id_auteur number in your profile URLs on root-me.org).`
        );
      }
      throw e;
    }
    const resolved = findAuteurId(search, userId);
    if (!resolved) {
      throw new Error(
        `Root-me: no author found matching "${userId}" — check the username, or enter your numeric author id.`
      );
    }
    userId = resolved;
  }

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

      // Fetch challenge details if category or score is missing
      if ((!category || !score) && challengeId) {
        try {
          const raw = await rootmeFetch(
            config,
            `/challenges/${challengeId}`
          );
          const challenge = Array.isArray(raw) ? raw[0] : raw;
          if (challenge) {
            title = challenge.titre ?? title;
            category = challenge.rubrique ?? category;
            score = Number(challenge.score) || score;
          }
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
