import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { planItems, goals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getProjectBySlug } from "@/lib/guidance/ft-project-tree";
import { getCompetency } from "@/lib/mentor/competency-map";
import { competenciesForFtProject } from "@/lib/mentor/competency-resolver";
import { listResources } from "@/lib/learn/store";
import { listArticles } from "@/lib/knowledge/store";
import { examExercises, EXAM_SOURCES } from "@/lib/exams/store";

/**
 * The context behind a Today/Board card: what the app knows about the task,
 * the competencies it needs, the content that feeds them, and — for 42 exams —
 * the actual subjects and reference solutions.
 *
 * Assembled on demand so the dashboard payload stays light.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await params;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const item = db.select().from(planItems).where(eq(planItems.id, id)).get();
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const refOrTitle = item.ref ?? item.title;

  // 42 projects carry a catalogue entry (summary + skills) and resolve to
  // competencies through the signal graph. Every other platform resolves by
  // matching the card to its learning_resource(s), which the backfill already
  // tagged with competencies — so the linking works on every card, not just 42.
  const project =
    item.type === "42" ? getProjectBySlug(refOrTitle) : undefined;

  let competencyIds: string[];
  if (item.type === "42") {
    competencyIds = competenciesForFtProject(item.ref, item.title);
  } else {
    // Board titles carry a platform prefix ("HTB: ", "RM: ", "THM: ") the
    // resource titles do not; strip it before matching.
    const cleaned = item.title.replace(/^(HTB|RM|THM|42):\s*/i, "").trim().toLowerCase();
    const ids = new Set<string>();
    for (const r of listResources({ platform: item.type })) {
      const rt = r.title.toLowerCase();
      const match =
        rt === cleaned ||
        rt.includes(cleaned) ||
        cleaned.includes(rt) ||
        (item.ref != null && (r.externalId ?? "").includes(item.ref));
      if (!match) continue;
      for (const cid of JSON.parse(r.competencyIds ?? "[]") as string[]) ids.add(cid);
    }
    competencyIds = [...ids];
  }

  const competencies = competencyIds
    .map((cid) => {
      const c = getCompetency(cid);
      return c ? { id: c.id, label: c.label } : null;
    })
    .filter((c): c is { id: string; label: string } => c !== null);

  // Related content, deduped across the item's competencies, capped for the panel.
  const seenR = new Map<number, { id: number; title: string; platform: string }>();
  const seenA = new Map<number, { id: number; title: string; depthTier: number }>();
  for (const cid of competencyIds) {
    for (const r of listResources({ competencyId: cid })) {
      if (!seenR.has(r.id))
        seenR.set(r.id, { id: r.id, title: r.title, platform: r.platform });
    }
    for (const a of listArticles(cid)) {
      if (!seenA.has(a.id))
        seenA.set(a.id, { id: a.id, title: a.title, depthTier: a.depthTier });
    }
  }

  const exercises = examExercises(item.ref ?? item.title);

  const goal = item.goalId
    ? db.select().from(goals).where(eq(goals.id, item.goalId)).get()
    : undefined;

  return NextResponse.json({
    item: {
      id: item.id,
      title: item.title,
      type: item.type,
      why: item.why,
      description: item.description,
      priority: item.priority,
      estimatedHours: item.estimatedHours,
      link: item.link,
      boardStatus: item.boardStatus,
    },
    goal: goal ? { id: goal.id, title: goal.title } : null,
    summary: project?.description ?? item.description ?? null,
    skills: project?.skills ?? [],
    circle: project?.circle ?? null,
    competencies,
    relatedResources: [...seenR.values()].slice(0, 12),
    relatedArticles: [...seenA.values()]
      .sort((a, b) => a.depthTier - b.depthTier)
      .slice(0, 6),
    exam:
      exercises.length > 0
        ? { exercises, sources: EXAM_SOURCES }
        : null,
  });
}
