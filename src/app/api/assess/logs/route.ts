import { NextResponse } from "next/server";
import { getAssessLogs, clearAssessLogs } from "@/lib/assess/log";

export async function GET() {
  return NextResponse.json({ logs: getAssessLogs() });
}

export async function DELETE() {
  clearAssessLogs();
  return NextResponse.json({ ok: true });
}
