import { NextResponse } from "next/server";
import {
  buildMentorContext,
  buildFallbackPlan,
  generateMentorPlan,
} from "@/lib/mentor/engine";
import {
  loadCurrentPlan,
  readMentorConfig,
  savePlan,
} from "@/lib/mentor/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(loadCurrentPlan());
}

export async function POST() {
  const { objective, apiKey, model } = readMentorConfig();
  const hasKey = !!apiKey;
  const ctx = buildMentorContext(objective);

  if (!hasKey) {
    return NextResponse.json({
      plan: buildFallbackPlan(ctx),
      stale: false,
      hasKey,
    });
  }

  try {
    const plan = await generateMentorPlan(ctx, apiKey, model);
    savePlan(plan, objective);
    return NextResponse.json({ plan, stale: false, hasKey });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Mentor generation failed." },
      { status: 500 }
    );
  }
}
