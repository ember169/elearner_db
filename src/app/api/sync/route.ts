import { runSync } from "@/lib/sync/engine";
import { NextResponse } from "next/server";

export async function POST() {
  const results = await runSync();
  return NextResponse.json(results);
}
