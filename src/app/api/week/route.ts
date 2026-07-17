import { NextResponse } from "next/server";
import {
  getWeekStart,
  getOrCreateWeekPlan,
  getISOWeekNumber,
  getMonthWeekStarts,
  loadWeekPlan,
  updatePlanItem,
  rerollWeekPlan,
  movePlanItem,
  createMonthPlan,
} from "@/lib/week/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const month = searchParams.get("month");
  if (month) {
    const [yearStr, monthStr] = month.split("-");
    const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
    const weekStarts = getMonthWeekStarts(date);

    const existing = weekStarts.map((ws) => loadWeekPlan(ws));
    const allExist = existing.every((p) => p !== null);
    const monthPlans = allExist
      ? (existing as NonNullable<typeof existing[number]>[])
      : createMonthPlan(weekStarts);

    const plans = weekStarts.map((ws, i) => ({
      weekStart: ws,
      weekNum: getISOWeekNumber(ws),
      plan: monthPlans[i],
    }));
    return NextResponse.json({ plans });
  }

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

  if (body.action === "reroll-month") {
    const weekStarts = body.weekStarts as string[];
    const monthPlans = createMonthPlan(weekStarts);
    const plans = weekStarts.map((ws, i) => ({
      weekStart: ws,
      weekNum: getISOWeekNumber(ws),
      plan: monthPlans[i],
    }));
    return NextResponse.json({ plans });
  }

  if (body.action === "move-item") {
    const { itemId, targetWeek, targetDayIndex } = body;
    const item = movePlanItem(itemId, targetWeek, targetDayIndex);
    return NextResponse.json(item);
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
