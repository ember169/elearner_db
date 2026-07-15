import { db } from "@/lib/db";
import {
  settings,
  syncLog,
  dailySnapshots,
  activityFeed,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { syncFortyTwo } from "./forty-two";
import { syncTryHackMe } from "./tryhackme";
import { syncHackTheBox } from "./hackthebox";
import { syncMaldev } from "./maldev";
import { syncRootMe } from "./rootme";

export type SyncResult = {
  platform: string;
  status: "success" | "error" | "skipped";
  error?: string;
  itemsSynced: number;
};

export async function runSync(): Promise<SyncResult[]> {
  const config = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (!config) return [];

  const results: SyncResult[] = [];
  const today = new Date().toISOString().split("T")[0];

  // 42
  if (config.ftClientId && config.ftClientSecret && config.ftUserId) {
    const logId = db
      .insert(syncLog)
      .values({ platform: "42", status: "running" })
      .returning()
      .get().id;
    try {
      const result = await syncFortyTwo(config);
      results.push({ platform: "42", status: "success", itemsSynced: result.itemsSynced });
      db.update(syncLog)
        .set({
          status: "success",
          itemsSynced: result.itemsSynced,
          completedAt: new Date().toISOString(),
        })
        .where(eq(syncLog.id, logId))
        .run();
      if (result.snapshot) {
        db.insert(dailySnapshots)
          .values({ platform: "42", date: today, data: JSON.stringify(result.snapshot) })
          .run();
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      results.push({ platform: "42", status: "error", error, itemsSynced: 0 });
      db.update(syncLog)
        .set({ status: "error", error, completedAt: new Date().toISOString() })
        .where(eq(syncLog.id, logId))
        .run();
    }
  } else {
    results.push({ platform: "42", status: "skipped", itemsSynced: 0 });
  }

  // TryHackMe
  if (config.thmUsername) {
    const logId = db
      .insert(syncLog)
      .values({ platform: "thm", status: "running" })
      .returning()
      .get().id;
    try {
      const result = await syncTryHackMe(config);
      results.push({ platform: "thm", status: "success", itemsSynced: result.itemsSynced });
      db.update(syncLog)
        .set({
          status: "success",
          itemsSynced: result.itemsSynced,
          completedAt: new Date().toISOString(),
        })
        .where(eq(syncLog.id, logId))
        .run();
      if (result.snapshot) {
        db.insert(dailySnapshots)
          .values({ platform: "thm", date: today, data: JSON.stringify(result.snapshot) })
          .run();
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      results.push({ platform: "thm", status: "error", error, itemsSynced: 0 });
      db.update(syncLog)
        .set({ status: "error", error, completedAt: new Date().toISOString() })
        .where(eq(syncLog.id, logId))
        .run();
    }
  } else {
    results.push({ platform: "thm", status: "skipped", itemsSynced: 0 });
  }

  // HackTheBox
  if (config.htbApiToken && config.htbUserId) {
    const logId = db
      .insert(syncLog)
      .values({ platform: "htb", status: "running" })
      .returning()
      .get().id;
    try {
      const result = await syncHackTheBox(config);
      results.push({ platform: "htb", status: "success", itemsSynced: result.itemsSynced });
      db.update(syncLog)
        .set({
          status: "success",
          itemsSynced: result.itemsSynced,
          completedAt: new Date().toISOString(),
        })
        .where(eq(syncLog.id, logId))
        .run();
      if (result.snapshot) {
        db.insert(dailySnapshots)
          .values({ platform: "htb", date: today, data: JSON.stringify(result.snapshot) })
          .run();
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      results.push({ platform: "htb", status: "error", error, itemsSynced: 0 });
      db.update(syncLog)
        .set({ status: "error", error, completedAt: new Date().toISOString() })
        .where(eq(syncLog.id, logId))
        .run();
    }
  } else {
    results.push({ platform: "htb", status: "skipped", itemsSynced: 0 });
  }

  // Maldev
  if (config.maldevDbPath) {
    const logId = db
      .insert(syncLog)
      .values({ platform: "maldev", status: "running" })
      .returning()
      .get().id;
    try {
      const result = await syncMaldev(config);
      results.push({ platform: "maldev", status: "success", itemsSynced: result.itemsSynced });
      db.update(syncLog)
        .set({
          status: "success",
          itemsSynced: result.itemsSynced,
          completedAt: new Date().toISOString(),
        })
        .where(eq(syncLog.id, logId))
        .run();
      if (result.snapshot) {
        db.insert(dailySnapshots)
          .values({ platform: "maldev", date: today, data: JSON.stringify(result.snapshot) })
          .run();
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      results.push({ platform: "maldev", status: "error", error, itemsSynced: 0 });
      db.update(syncLog)
        .set({ status: "error", error, completedAt: new Date().toISOString() })
        .where(eq(syncLog.id, logId))
        .run();
    }
  } else {
    results.push({ platform: "maldev", status: "skipped", itemsSynced: 0 });
  }

  // Root-me
  if (config.rootmeUserId && (config.rootmeApiKey || config.rootmeCookie)) {
    const logId = db
      .insert(syncLog)
      .values({ platform: "rootme", status: "running" })
      .returning()
      .get().id;
    try {
      const result = await syncRootMe(config);
      results.push({ platform: "rootme", status: "success", itemsSynced: result.itemsSynced });
      db.update(syncLog)
        .set({
          status: "success",
          itemsSynced: result.itemsSynced,
          completedAt: new Date().toISOString(),
        })
        .where(eq(syncLog.id, logId))
        .run();
      if (result.snapshot) {
        db.insert(dailySnapshots)
          .values({ platform: "rootme", date: today, data: JSON.stringify(result.snapshot) })
          .run();
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      results.push({ platform: "rootme", status: "error", error, itemsSynced: 0 });
      db.update(syncLog)
        .set({ status: "error", error, completedAt: new Date().toISOString() })
        .where(eq(syncLog.id, logId))
        .run();
    }
  } else {
    results.push({ platform: "rootme", status: "skipped", itemsSynced: 0 });
  }

  return results;
}
