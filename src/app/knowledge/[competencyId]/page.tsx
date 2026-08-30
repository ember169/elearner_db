import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { competencyValidations } from "@/lib/db/schema";
import { listArticles } from "@/lib/knowledge/store";
import { listResources } from "@/lib/learn/store";
import { getCompetency } from "@/lib/mentor/competency-map";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { CompetencyHub } from "@/components/knowledge/competency-hub";

export const dynamic = "force-dynamic";

export default async function CompetencyHubPage({
  params,
}: {
  params: Promise<{ competencyId: string }>;
}) {
  const { competencyId } = await params;
  const competency = getCompetency(competencyId);
  if (!competency) notFound();

  const guidance = runGuidanceEngine();
  const signals = computeCompetencySignals(guidance.snapshot, guidance.ftProgress);
  const validation = db
    .select()
    .from(competencyValidations)
    .all()
    .find((v) => v.competencyId === competencyId);

  const level = validation?.validatedLevel ?? signals[competencyId]?.autoLevel ?? 0;

  const articles = listArticles(competencyId)
    .map((a) => ({ id: a.id, title: a.title, depthTier: a.depthTier }))
    .sort((a, b) => a.depthTier - b.depthTier);

  const resources = listResources({ competencyId }).map((r) => ({
    id: r.id,
    title: r.title,
    platform: r.platform,
    difficulty: r.difficulty,
    status: r.status,
  }));

  return (
    <CompetencyHub
      label={competency.label}
      area={competency.area}
      description={competency.description}
      level={level}
      isValidated={validation != null}
      articles={articles}
      resources={resources}
    />
  );
}
