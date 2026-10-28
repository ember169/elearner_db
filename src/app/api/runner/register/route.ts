import { NextResponse } from "next/server";
import { upsertRunner } from "@/lib/labs/store";
import type { RunnerRegistration } from "@/lib/labs/types";

const RUNNER_TOKEN =
  process.env.RUNNER_TOKEN || "test-runner-token-change-me";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth || auth !== `Bearer ${RUNNER_TOKEN}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as RunnerRegistration;

  if (!body.id || !body.tailscaleIp || !body.arch || !body.os) {
    return NextResponse.json(
      { error: "id, tailscaleIp, arch, and os are required" },
      { status: 400 },
    );
  }

  upsertRunner(body);
  console.log(`[labs] Runner registered: ${body.id} (${body.arch}/${body.os}) at ${body.tailscaleIp}:${body.port}`);
  return NextResponse.json({ ok: true });
}
