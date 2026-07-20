import { NextRequest, NextResponse } from "next/server";
import { pickSideProject } from "@/lib/mentor/engine";
import { readMentorConfig } from "@/lib/mentor/store";
import { runRuleEngine } from "@/lib/planning/rule-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const excludeTitle: string | undefined = body.excludeTitle;

  const config = readMentorConfig();
  const ruleOutput = runRuleEngine(config.objective);
  const sideProject = pickSideProject(ruleOutput.focus, config.objective, excludeTitle);

  return NextResponse.json({ side_project: sideProject });
}
