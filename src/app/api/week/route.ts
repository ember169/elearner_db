import { NextResponse } from "next/server";
import {
  getWeekStart,
  getOrCreateWeekPlan,
  updatePlanItem,
  rerollWeekPlan,
} from "@/lib/week/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week") ?? getWeekStart();
  const plan = getOrCreateWeekPlan(week);
  return NextResponse.json(plan);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body as {
    id: number;
    dayIndex?: number | null;
    status?: string;
    sortOrder?: number;
    deferredTo?: string | null;
    attemptCount?: number;
    blockedReason?: string | null;
    blockedSince?: string | null;
    description?: string | null;
  };
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const item = updatePlanItem(id, updates);
  return NextResponse.json(item);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.action === "reroll") {
    const week = body.week ?? getWeekStart();
    const plan = rerollWeekPlan(week);
    return NextResponse.json(plan);
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
