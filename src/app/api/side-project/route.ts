import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings, goals, planItems, weeklyPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type SideProject = {
  title: string;
  description: string;
  skills?: string[];
  steps?: { title: string; description: string; estimatedHours: number }[];
};

type SideProjectState = {
  title: string;
  goalId: number;
  status: "accepted" | "done" | "aborted";
  acceptedAt: string;
  projectJson: string;
};

const MALDEV_SKILLS = ["maldev", "C", "threading", "linux internals", "assembly", "shellcode", "binary exploitation", "reverse engineering", "process injection"];

function sideProjectCategory(skills?: string[]): string {
  if (!skills?.length) return "cybersec";
  if (skills.some((s) => MALDEV_SKILLS.some((ms) => s.toLowerCase().includes(ms.toLowerCase())))) return "maldev";
  return "cybersec";
}

function readState(): SideProjectState | null {
  const row = db.select({ sideProjectState: settings.sideProjectState }).from(settings).get();
  if (!row?.sideProjectState) return null;
  try { return JSON.parse(row.sideProjectState); } catch { return null; }
}

function writeState(state: SideProjectState | null) {
  db.update(settings)
    .set({ sideProjectState: state ? JSON.stringify(state) : null })
    .where(eq(settings.id, 1))
    .run();
}

function getSentinelPlanId(): number {
  let plan = db.select().from(weeklyPlans).where(eq(weeklyPlans.weekStart, "board")).get();
  if (!plan) {
    const r = db.insert(weeklyPlans).values({ weekStart: "board", status: "active" }).run();
    return Number(r.lastInsertRowid);
  }
  return plan.id;
}

export async function GET() {
  const state = readState();
  return NextResponse.json({ state });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const action = body.action as string;

  if (action === "accept") {
    const project = body.project as SideProject;
    if (!project?.title) {
      return NextResponse.json({ error: "Missing project" }, { status: 400 });
    }

    const category = sideProjectCategory(project.skills);
    const totalHours = (project.steps ?? []).reduce((s, step) => s + (step.estimatedHours ?? 1), 0);

    const result = db.transaction(() => {
      const epicResult = db.insert(goals).values({
        title: project.title,
        category,
        goalType: "cumulative",
        targetValue: project.steps?.length ?? 1,
        currentValue: 0,
      }).run();
      const epicId = Number(epicResult.lastInsertRowid);

      if (project.steps) {
        for (const [i, step] of project.steps.entries()) {
          db.insert(goals).values({
            title: step.title,
            description: step.description,
            category,
            goalType: "cumulative",
            parentGoalId: epicId,
            sortOrder: i,
            estimatedHours: step.estimatedHours,
            currentValue: 0,
          }).run();
        }
      }

      const sentinelId = getSentinelPlanId();
      db.insert(planItems).values({
        weeklyPlanId: sentinelId,
        title: project.title,
        type: category === "maldev" ? "maldev" : "htb",
        why: project.description,
        estimatedHours: totalHours || 4,
        priority: "medium",
        goalId: epicId,
        category,
        boardStatus: "todo",
        sortOrder: 0,
      }).run();

      return { epicId };
    });

    const state: SideProjectState = {
      title: project.title,
      goalId: result.epicId,
      status: "accepted",
      acceptedAt: new Date().toISOString(),
      projectJson: JSON.stringify(project),
    };
    writeState(state);

    return NextResponse.json({ ok: true, epicId: result.epicId, state });
  }

  if (action === "done") {
    const current = readState();
    if (!current) return NextResponse.json({ error: "No active side project" }, { status: 400 });

    if (current.goalId) {
      db.update(goals)
        .set({ status: "completed" })
        .where(eq(goals.id, current.goalId))
        .run();
    }

    writeState(null);
    return NextResponse.json({ ok: true });
  }

  if (action === "abort") {
    const current = readState();
    if (!current) return NextResponse.json({ error: "No active side project" }, { status: 400 });

    if (current.goalId) {
      db.update(goals)
        .set({ status: "cancelled" })
        .where(eq(goals.id, current.goalId))
        .run();
    }

    writeState(null);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
