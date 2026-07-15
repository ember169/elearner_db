import { db } from "@/lib/db";
import { htbProfile, htbActivity, activityFeed } from "@/lib/db/schema";

const API_BASE = "https://labs.hackthebox.com/api/v4";

type Config = {
  htbApiToken: string | null;
  htbUserId: string | null;
};

async function htbFetch(token: string, path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTB API ${path}: ${res.status}`);
  return res.json();
}

export async function syncHackTheBox(config: Config) {
  const token = config.htbApiToken!;
  const userId = config.htbUserId!;
  let itemsSynced = 0;

  // Profile
  const profileData = await htbFetch(
    token,
    `/user/profile/basic/${userId}`
  );
  const profile = profileData.profile ?? profileData;

  db.delete(htbProfile).run();
  db.insert(htbProfile)
    .values({
      username: profile.name ?? "Unknown",
      rank: profile.rank ?? null,
      rankId: profile.rank_id ?? null,
      points: profile.points ?? 0,
      ranking: profile.ranking ?? null,
      systemOwns: profile.system_owns ?? 0,
      userOwns: profile.user_owns ?? 0,
      systemBloods: profile.system_bloods ?? 0,
      userBloods: profile.user_bloods ?? 0,
      currentRankProgress: profile.current_rank_progress ?? 0,
      nextRank: profile.next_rank ?? null,
    })
    .run();
  itemsSynced++;

  // Activity
  try {
    const activityData = await htbFetch(
      token,
      `/user/profile/activity/${userId}`
    );
    const activities = activityData.profile?.activity ?? activityData.activity ?? [];

    if (Array.isArray(activities)) {
      db.delete(htbActivity).run();
      for (const a of activities.slice(0, 50)) {
        db.insert(htbActivity)
          .values({
            activityType: a.type ?? "unknown",
            objectType: a.object_type ?? null,
            name: a.name ?? null,
            date: a.date ?? a.created_at ?? null,
          })
          .run();
        itemsSynced++;
      }
    }
  } catch {}

  db.insert(activityFeed)
    .values({
      platform: "htb",
      eventType: "sync",
      title: `HackTheBox synced (${profile.rank ?? "Unranked"}, ${profile.points ?? 0} pts)`,
      details: JSON.stringify({
        rank: profile.rank,
        points: profile.points,
        owns: (profile.system_owns ?? 0) + (profile.user_owns ?? 0),
      }),
    })
    .run();

  return {
    itemsSynced,
    snapshot: {
      rank: profile.rank,
      points: profile.points,
      systemOwns: profile.system_owns,
      userOwns: profile.user_owns,
      ranking: profile.ranking,
    },
  };
}
