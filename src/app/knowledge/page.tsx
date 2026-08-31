import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { competencyValidations } from "@/lib/db/schema";
import { listArticles } from "@/lib/knowledge/store";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES, COMPETENCY_AREAS } from "@/lib/mentor/competency-map";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { KnowledgeClient } from "@/components/knowledge/knowledge-client";

export const dynamic = "force-dynamic";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ article?: string }>;
}) {
  // Knowledge is merged into Learn. The grid lives there now; this route
  // survives only as the article reader (opened via ?article=N from the hub and
  // Learn cross-links). Without an article, send the visitor to Learn.
  const { article } = await searchParams;
  if (!article) redirect("/learn");

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
