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
  const config = readMentorConfig();
  const canGenerate = config.provider === "local" ? !!config.baseUrl : !!config.apiKey;
  const ctx = buildMentorContext(config.objective);

  if (!canGenerate) {
    return NextResponse.json({
      plan: buildFallbackPlan(ctx),
      stale: false,
      hasKey: canGenerate,
    });
  }

  try {
    const plan = await generateMentorPlan(ctx, config);
    savePlan(plan, config.objective);
    return NextResponse.json({ plan, stale: false, hasKey: canGenerate });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Mentor generation failed." },
      { status: 500 }
    );
  }
}
