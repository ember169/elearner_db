import { NextResponse } from "next/server";
import { getActiveLabSessions, getRunners } from "@/lib/labs/store";

export async function GET() {
  const sessions = getActiveLabSessions();
  const allRunners = getRunners();
  return NextResponse.json({ sessions, runners: allRunners });
}
