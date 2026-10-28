import { db } from "@/lib/db";
import { runners, labSessions } from "@/lib/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import type {
  RunnerRegistration,
  Runner,
  NewLabSession,
  LabSession,
} from "./types";

// ---- Runner management ----

export function upsertRunner(reg: RunnerRegistration): void {
  const existing = db.select().from(runners).where(eq(runners.id, reg.id)).get();
  if (existing) {
    db.update(runners)
      .set({
        hostname: reg.hostname,
        tailscaleIp: reg.tailscaleIp,
        port: reg.port,
        arch: reg.arch,
        os: reg.os,
        dockerAvailable: reg.dockerAvailable,
        hypervAvailable: reg.hypervAvailable,
        maxRamMb: reg.maxRamMb,
        maxDiskGb: reg.maxDiskGb,
        subnetRange: reg.subnetRange,
        lastHeartbeat: new Date().toISOString(),
        status: "online",
      })
      .where(eq(runners.id, reg.id))
      .run();
  } else {
    db.insert(runners)
      .values({
        id: reg.id,
        hostname: reg.hostname,
        tailscaleIp: reg.tailscaleIp,
        port: reg.port,
        arch: reg.arch,
        os: reg.os,
        dockerAvailable: reg.dockerAvailable,
        hypervAvailable: reg.hypervAvailable,
        maxRamMb: reg.maxRamMb,
        maxDiskGb: reg.maxDiskGb,
        subnetRange: reg.subnetRange,
        lastHeartbeat: new Date().toISOString(),
        status: "online",
      })
      .run();
  }
}

export function getRunners(): Runner[] {
  return db.select().from(runners).all() as Runner[];
}

/**
 * Returns runners whose last heartbeat was within the last 90 seconds.
 */
export function getOnlineRunners(): Runner[] {
  const cutoff = new Date(Date.now() - 90_000).toISOString();
  return db
    .select()
    .from(runners)
    .where(sql`${runners.lastHeartbeat} > ${cutoff}`)
    .all() as Runner[];
}

export function markRunnerOffline(runnerId: string): void {
  db.update(runners)
    .set({ status: "offline" })
    .where(eq(runners.id, runnerId))
    .run();
}

// ---- Lab session management ----

export function createLabSession(session: NewLabSession): void {
  db.insert(labSessions)
    .values({
      id: session.id,
      runnerId: session.runnerId,
      labManifest: session.labManifest,
      status: session.status,
      subnet: session.subnet,
      containersJson: session.containersJson,
      ttlMinutes: session.ttlMinutes,
      startedAt: new Date().toISOString(),
      expiresAt: session.expiresAt,
    })
    .run();
}

export function updateLabSession(
  id: string,
  updates: Partial<Pick<LabSession, "status" | "containersJson" | "errorMessage" | "stoppedAt" | "subnet" | "expiresAt">>,
): void {
  db.update(labSessions).set(updates).where(eq(labSessions.id, id)).run();
}

export function getLabSession(id: string): LabSession | null {
  return (
    (db.select().from(labSessions).where(eq(labSessions.id, id)).get() as LabSession | undefined) ??
    null
  );
}

export function getActiveLabSessions(): LabSession[] {
  return db
    .select()
    .from(labSessions)
    .where(
      and(ne(labSessions.status, "stopped"), ne(labSessions.status, "error")),
    )
    .all() as LabSession[];
}

export function getLabSessionsByRunner(runnerId: string): LabSession[] {
  return db
    .select()
    .from(labSessions)
    .where(eq(labSessions.runnerId, runnerId))
    .all() as LabSession[];
}
