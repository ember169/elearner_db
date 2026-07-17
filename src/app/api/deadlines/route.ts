import { NextResponse } from "next/server";
import {
  getDeadlines,
  upsertCommonCoreDeadline,
  deleteDeadline,
  computeBackwardPlan,
} from "@/lib/planning/backward-planner";
import { buildMentorContext } from "@/lib/mentor/engine";
import { readMentorConfig } from "@/lib/mentor/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const deadlineRows = getDeadlines();
  const config = readMentorConfig();
  const ctx = buildMentorContext(config.objective);
  const completedSlugs = ctx.guidance.ftProgress.completedProjects;

  const mainDeadline = deadlineRows.find((d) => d.type === "common_core");
  let backwardPlan = null;
  if (mainDeadline) {
    backwardPlan = computeBackwardPlan(mainDeadline.targetDate, completedSlugs);
  }

  return NextResponse.json({ deadlines: deadlineRows, backwardPlan });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { targetDate, weeklyBudget42 } = body as {
    targetDate: string;
    weeklyBudget42?: number;
  };

  if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return NextResponse.json(
      { error: "targetDate required in YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  const config = readMentorConfig();
  const ctx = buildMentorContext(config.objective);
  const completedSlugs = ctx.guidance.ftProgress.completedProjects;

  const { deadline, plan } = upsertCommonCoreDeadline(
    targetDate,
    completedSlugs,
    weeklyBudget42 ?? 15
  );

  return NextResponse.json({ deadline, plan });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required." }, { status: 400 });
  }
  deleteDeadline(parseInt(id, 10));
  return NextResponse.json({ ok: true });
}
