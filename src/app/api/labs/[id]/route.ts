import { NextResponse } from "next/server";
import {
  getLabSession,
  updateLabSession,
  getRunners,
} from "@/lib/labs/store";
import type { RunnerStatusResponse } from "@/lib/labs/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = getLabSession(id);
  if (!session) {
    return NextResponse.json({ error: "Lab session not found" }, { status: 404 });
  }

  // Find the runner to fetch live status
  const allRunners = getRunners();
  const runner = allRunners.find((r) => r.id === session.runnerId);

  let liveStatus: RunnerStatusResponse | null = null;
  if (runner && (session.status === "running" || session.status === "starting")) {
    try {
      const res = await fetch(
        `http://${runner.tailscaleIp}:${runner.port}/status/${id}`,
        { signal: AbortSignal.timeout(5_000) },
      );
      if (res.ok) {
        liveStatus = (await res.json()) as RunnerStatusResponse;
        // Sync live status back to DB
        if (liveStatus.status !== session.status) {
          updateLabSession(id, {
            status: liveStatus.status,
            containersJson: JSON.stringify(liveStatus.containers),
            errorMessage: liveStatus.error ?? null,
          });
        }
      }
    } catch {
      // Runner unreachable — keep DB status as-is.
    }
  }

  return NextResponse.json({
    session,
    runner: runner
      ? { id: runner.id, hostname: runner.hostname, ip: runner.tailscaleIp }
      : null,
    liveStatus,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = getLabSession(id);
  if (!session) {
    return NextResponse.json({ error: "Lab session not found" }, { status: 404 });
  }

  const allRunners = getRunners();
  const runner = allRunners.find((r) => r.id === session.runnerId);

  // Tell the runner to stop the lab
  if (runner) {
    try {
      await fetch(`http://${runner.tailscaleIp}:${runner.port}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      console.warn(`[labs] Could not reach runner ${runner.id} to stop lab ${id}:`, err);
    }
  }

  updateLabSession(id, {
    status: "stopped",
    stoppedAt: new Date().toISOString(),
  });

  console.log(`[labs] Lab ${id} stopped`);
  return NextResponse.json({ ok: true, id });
}
