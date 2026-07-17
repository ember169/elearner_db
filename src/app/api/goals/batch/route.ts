import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

type BatchTask = { title: string; ftSlug?: string | null; estimatedHours?: number | null; sortOrder?: number; description?: string | null };
type BatchIssue = {
  title: string;
  deadline?: string | null;
  description?: string | null;
  tasks: BatchTask[];
  sortOrder?: number;
};
type BatchPayload = {
  epic: {
    title: string;
    platform: string;
    metricSource?: string | null;
    targetValue?: number | null;
    deadline?: string | null;
  };
  issues: BatchIssue[];
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as BatchPayload;

  if (!body.epic?.title || !Array.isArray(body.issues)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const created = db.transaction(() => {
    const epicResult = db
      .insert(goals)
      .values({
        title: body.epic.title,
        category: body.epic.platform || "general",
        goalType: "cumulative",
        targetValue: body.epic.targetValue ?? null,
        metricSource: body.epic.metricSource ?? null,
        deadline: body.epic.deadline ?? null,
        currentValue: 0,
      })
      .run();

    const epicId = Number(epicResult.lastInsertRowid);

    for (const [iIdx, issue] of body.issues.entries()) {
      const issueResult = db
        .insert(goals)
        .values({
          title: issue.title,
          description: issue.description ?? null,
          category: body.epic.platform || "general",
          goalType: "cumulative",
          deadline: issue.deadline ?? null,
          parentGoalId: epicId,
          sortOrder: issue.sortOrder ?? iIdx,
          currentValue: 0,
        })
        .run();

      const issueId = Number(issueResult.lastInsertRowid);

      for (const [tIdx, task] of issue.tasks.entries()) {
        db.insert(goals)
          .values({
            title: task.title,
            description: task.description ?? null,
            category: body.epic.platform || "general",
            goalType: "cumulative",
            ftSlug: task.ftSlug ?? null,
            estimatedHours: task.estimatedHours ?? null,
            parentGoalId: issueId,
            sortOrder: task.sortOrder ?? tIdx,
            currentValue: 0,
          })
          .run();
      }
    }

    return { epicId };
  });

  return NextResponse.json({ ok: true, epicId: created.epicId });
}
