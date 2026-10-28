import { NextResponse } from "next/server";
import { pickRunner } from "@/lib/labs/scheduler";
import { createLabSession, updateLabSession } from "@/lib/labs/store";
import type { LabManifest, RunnerStartResponse } from "@/lib/labs/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { manifest: LabManifest };
  const manifest = body.manifest;

  if (!manifest?.labId || !manifest?.containers?.length) {
    return NextResponse.json(
      { error: "manifest with labId and containers is required" },
      { status: 400 },
    );
  }

  // Pick a runner
  const runner = pickRunner(manifest.requirements);
  if (!runner) {
    return NextResponse.json(
      { error: "No runner available. Register a runner first." },
      { status: 503 },
    );
  }

  const sessionId = `${manifest.labId}-${Date.now()}`;
  const ttl = manifest.ttlMinutes ?? 120;
  const expiresAt = new Date(Date.now() + ttl * 60_000).toISOString();

  // Create session in DB as "starting"
  createLabSession({
    id: sessionId,
    runnerId: runner.id,
    labManifest: JSON.stringify(manifest),
    status: "starting",
    subnet: manifest.network?.subnet ?? null,
    containersJson: null,
    ttlMinutes: ttl,
    expiresAt,
  });

  console.log(`[labs] Starting lab ${sessionId} on runner ${runner.id}`);

  // Call the runner's HTTP API to start the lab
  try {
    const runnerUrl = `http://${runner.tailscaleIp}:${runner.port}/start`;
    const res = await fetch(runnerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, manifest }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const err = await res.text();
      updateLabSession(sessionId, {
        status: "error",
        errorMessage: `Runner responded ${res.status}: ${err}`,
      });
      return NextResponse.json(
        { error: `Runner error: ${err}`, sessionId },
        { status: 502 },
      );
    }

    const data = (await res.json()) as RunnerStartResponse;

    updateLabSession(sessionId, {
      status: "running",
      containersJson: JSON.stringify(data.containers),
      subnet: data.subnet || manifest.network?.subnet || null,
    });

    console.log(`[labs] Lab ${sessionId} running on ${runner.id}`);

    return NextResponse.json({
      sessionId,
      runner: { id: runner.id, hostname: runner.hostname, ip: runner.tailscaleIp },
      containers: data.containers,
      subnet: data.subnet,
      expiresAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    updateLabSession(sessionId, {
      status: "error",
      errorMessage: message,
    });
    console.error(`[labs] Failed to start lab ${sessionId}:`, message);
    return NextResponse.json(
      { error: `Failed to contact runner: ${message}`, sessionId },
      { status: 502 },
    );
  }
}
