import { db } from "@/lib/db";
import { competencyValidations } from "@/lib/db/schema";
import { listArticles } from "@/lib/knowledge/store";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES, COMPETENCY_AREAS } from "@/lib/mentor/competency-map";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { KnowledgeClient } from "@/components/knowledge/knowledge-client";

export const dynamic = "force-dynamic";

export default function KnowledgePage() {
  const guidance = runGuidanceEngine();
  const signals = computeCompetencySignals(guidance.snapshot, guidance.ftProgress);

  const validations = db.select().from(competencyValidations).all();
  const validatedLevel: Record<string, number> = {};
  for (const v of validations) validatedLevel[v.competencyId] = v.validatedLevel;

  const articles = listArticles();

  // A tier reads as "at level" when the user has reached it. A validated level
  // outranks the activity signal — it was earned against an assessment, not
  // inferred from platform activity.
  const competencies = COMPETENCIES.map((c) => ({
    id: c.id,
    label: c.label,
    area: c.area as string,
    description: c.description,
    level: validatedLevel[c.id] ?? signals[c.id]?.autoLevel ?? 0,
    isValidated: validatedLevel[c.id] != null,
    articles: articles
      .filter((a) => a.competencyId === c.id)
      .map((a) => ({
        id: a.id,
        depthTier: a.depthTier,
        title: a.title,
        recommendedLevel: a.recommendedLevel,
        status: a.status,
      }))
      .sort((a, b) => a.depthTier - b.depthTier),
  }));

  return (
    <KnowledgeClient
      competencies={competencies}
      areas={[...COMPETENCY_AREAS]}
    />
  );
}
