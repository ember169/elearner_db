import { db } from "@/lib/db";
import {
  thmProfile,
  thmRooms,
  thmBadges,
  activityFeed,
} from "@/lib/db/schema";

type Config = {
  thmUsername: string | null;
};

export async function syncTryHackMe(config: Config) {
  const username = config.thmUsername;
  if (!username) throw new Error("TryHackMe username not configured");
  let itemsSynced = 0;

  // Fetch public profile data
  const profileRes = await fetch(
    `https://tryhackme.com/api/v2/public-profile?username=${encodeURIComponent(username)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      },
    }
  );

  const contentType = profileRes.headers.get("content-type") ?? "";
  if (!profileRes.ok || !contentType.includes("application/json")) {
    throw new Error(
      `TryHackMe blocked this request (HTTP ${profileRes.status}). TryHackMe now fronts this endpoint with a JS bot-check that a server-side sync cannot pass — this is not a rate limit or a config issue here, it needs a different fetch strategy.`
    );
  }

  const json = await profileRes.json();
  if (json.status !== "success" || !json.data) {
    throw new Error("TryHackMe returned an unexpected response shape — their API may have changed.");
  }
  const profileData = json.data as Record<string, unknown>;

  // Upsert profile
  db.delete(thmProfile).run();
  db.insert(thmProfile)
    .values({
      username,
      rank: (profileData.topPercentage as number) ?? null,
      rankTitle: (profileData.rank as string) ?? null,
      points: (profileData.totalPoints as number) ?? 0,
      roomsCompleted: (profileData.completedRoomsNumber as number) ?? 0,
      badgesCount: (profileData.badgesNumber as number) ?? 0,
      streak: (profileData.streak as number) ?? 0,
      level: (profileData.level as number) ?? 0,
    })
    .run();
  itemsSynced++;

  // Fetch completed rooms
  try {
    const roomsRes = await fetch(
      `https://tryhackme.com/api/v2/public-profile/completed-rooms?username=${encodeURIComponent(username)}&limit=100&page=1`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        },
      }
    );
    if (roomsRes.ok) {
      const roomsJson = await roomsRes.json();
      const rooms = roomsJson.data ?? roomsJson ?? [];
      if (Array.isArray(rooms)) {
        db.delete(thmRooms).run();
        for (const room of rooms) {
          db.insert(thmRooms)
            .values({
              roomCode: room.code ?? room.roomCode ?? "unknown",
              roomName: room.name ?? room.title ?? "Unknown",
              completedAt: room.completedAt ?? room.completed_at ?? null,
            })
            .run();
          itemsSynced++;
        }
      }
    }
  } catch {}

  // Fetch badges
  try {
    const badgesRes = await fetch(
      `https://tryhackme.com/api/v2/badges/public-profile?username=${encodeURIComponent(username)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        },
      }
    );
    if (badgesRes.ok) {
      const badgesJson = await badgesRes.json();
      const badges = badgesJson.data ?? badgesJson ?? [];
      if (Array.isArray(badges)) {
        db.delete(thmBadges).run();
        for (const badge of badges) {
          db.insert(thmBadges)
            .values({
              badgeId: String(badge.id ?? badge.badgeId ?? ""),
              name: badge.name ?? "Unknown",
              description: badge.description ?? null,
              imageUrl: badge.image ?? badge.imageUrl ?? null,
            })
            .run();
          itemsSynced++;
        }
      }
    }
  } catch {}

  db.insert(activityFeed)
    .values({
      platform: "thm",
      eventType: "sync",
      title: `TryHackMe profile synced (${profileData.completedRoomsNumber ?? 0} rooms)`,
      details: JSON.stringify(profileData),
    })
    .run();

  return {
    itemsSynced,
    snapshot: {
      rank: profileData.topPercentage,
      points: profileData.totalPoints,
      roomsCompleted: profileData.completedRoomsNumber,
      streak: profileData.streak,
    },
  };
}
