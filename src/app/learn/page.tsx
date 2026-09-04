import { db } from "@/lib/db";
import { competencyValidations } from "@/lib/db/schema";
import { listResources } from "@/lib/learn/store";
import { listArticles } from "@/lib/knowledge/store";
import { COMPETENCIES, COMPETENCY_AREAS } from "@/lib/mentor/competency-map";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { LearnClient } from "@/components/learn/learn-client";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const guidance = runGuidanceEngine();
  const signals = computeCompetencySignals(guidance.snapshot, guidance.ftProgress);
  const validations = db.select().from(competencyValidations).all();
  const validatedLevel: Record<string, number> = {};
  for (const v of validations) validatedLevel[v.competencyId] = v.validatedLevel;

  // Group resources by competency once, from the JSON competencyIds column.
  const resources = listResources();
  const resByComp = new Map<string, typeof resources>();
  for (const r of resources) {
    let ids: string[] = [];
    try {
      ids = JSON.parse(r.competencyIds ?? "[]");
    } catch {}
    for (const id of ids) {
      const list = resByComp.get(id) ?? [];
      list.push(r);
      resByComp.set(id, list);
    }
  }

  const competencies = COMPETENCIES.map((c) => ({
    id: c.id,
    label: c.label,
    area: c.area as string,
    description: c.description,
  }));

  const progress = COMPETENCIES.map((c) => {
    const level = validatedLevel[c.id] ?? signals[c.id]?.autoLevel ?? 0;
    const articles = listArticles(c.id);
    const articleCount = articles.length;
    const readCount = articles.filter((a) => a.readAt != null).length;
    const res = resByComp.get(c.id) ?? [];
    return {
      id: c.id,
      label: c.label,
      area: c.area as string,
      level,
      isValidated: validatedLevel[c.id] != null,
      articleCount: articleCount || 6,
      readDone: readCount,
      resTotal: res.length,
      resDone: res.filter((r) => r.status === "completed").length,
    };
  });

  return (
    <LearnClient
      competencies={competencies}
      progress={progress}
      areas={[...COMPETENCY_AREAS]}
    />
  );
}
