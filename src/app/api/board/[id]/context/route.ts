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
import { difficultyToLevel, circleToLevel, LEVEL_LABEL } from "@/lib/levels";

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
  let matchedDifficulty: string | null | undefined;
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
      matchedDifficulty ??= r.difficulty;
      for (const cid of JSON.parse(r.competencyIds ?? "[]") as string[]) ids.add(cid);
    }
    competencyIds = [...ids];
  }

  // The item's required level, on the shared 0-5 scale. Related content is then
  // filtered to a window around it rather than showing every tier.
  const itemLevel =
    difficultyToLevel(matchedDifficulty) ??
    circleToLevel(project?.circle) ??
    2;

  const competencies = competencyIds
    .map((cid) => {
      const c = getCompetency(cid);
      return c ? { id: c.id, label: c.label } : null;
    })
    .filter((c): c is { id: string; label: string } => c !== null);

  // Related content, deduped across the item's competencies, filtered to the
  // item's level. Resources within two bands of it (a stretch above is allowed),
  // articles within one — so a task shows the course at its level, not L0-L5.
  const seenR = new Map<number, { id: number; title: string; platform: string; dist: number }>();
  const seenA = new Map<number, { id: number; title: string; depthTier: number; dist: number }>();
  for (const cid of competencyIds) {
    for (const r of listResources({ competencyId: cid })) {
      // A null-difficulty resource (a 42 peer) counts as the item's own level.
      const lvl = difficultyToLevel(r.difficulty) ?? itemLevel;
      const dist = Math.abs(lvl - itemLevel);
      if (dist > 2) continue;
      if (!seenR.has(r.id))
        seenR.set(r.id, { id: r.id, title: r.title, platform: r.platform, dist });
    }
    for (const a of listArticles(cid)) {
      const dist = Math.abs(a.recommendedLevel - itemLevel);
      if (dist > 1) continue;
      if (!seenA.has(a.id))
        seenA.set(a.id, { id: a.id, title: a.title, depthTier: a.depthTier, dist });
    }
  }
  const nearest = (a: { dist: number }, b: { dist: number }) => a.dist - b.dist;

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
    level: { value: itemLevel, label: LEVEL_LABEL[itemLevel] ?? null },
    relatedResources: [...seenR.values()]
      .sort(nearest)
      .slice(0, 10)
      .map(({ id, title, platform }) => ({ id, title, platform })),
    relatedArticles: [...seenA.values()]
      .sort((a, b) => nearest(a, b) || a.depthTier - b.depthTier)
      .slice(0, 4)
      .map(({ id, title, depthTier }) => ({ id, title, depthTier })),
    exam:
      exercises.length > 0
        ? { exercises, sources: EXAM_SOURCES }
        : null,
  });
}
