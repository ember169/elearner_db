import { db } from "@/lib/db";
import { assessments, competencyValidations } from "@/lib/db/schema";
import { computeCompetencySignals } from "@/lib/mentor/competency-signals";
import { COMPETENCIES, COMPETENCY_AREAS } from "@/lib/mentor/competency-map";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { desc, eq } from "drizzle-orm";
import { AssessClient } from "@/components/assess/assess-client";

export const dynamic = "force-dynamic";

export default function AssessPage() {
  const guidance = runGuidanceEngine();
  const signals = computeCompetencySignals(guidance.snapshot, guidance.ftProgress);

  const validations = db.select().from(competencyValidations).all();
  const validationMap: Record<string, { validatedLevel: number; validatedAt: string; assessmentId: number | null; persistentGapsJson: string | null }> = {};
  for (const v of validations) {
    validationMap[v.competencyId] = {
      validatedLevel: v.validatedLevel,
      validatedAt: v.validatedAt,
      assessmentId: v.assessmentId,
      persistentGapsJson: v.persistentGapsJson,
    };
  }

  const allAssessments = db
    .select()
    .from(assessments)
    .orderBy(desc(assessments.createdAt))
    .all();

  const competencyData = COMPETENCIES.map((c) => ({
    id: c.id,
    label: c.label,
    area: c.area,
    description: c.description,
    activityLevel: signals[c.id]?.autoLevel ?? 0,
    validation: validationMap[c.id] ?? null,
    assessmentCount: allAssessments.filter((a) => a.competencyId === c.id && a.status === "completed").length,
    latestAssessment: allAssessments.find((a) => a.competencyId === c.id) ?? null,
  }));

  return (
    <AssessClient
      competencies={competencyData}
      areas={[...COMPETENCY_AREAS]}
    />
  );
}
