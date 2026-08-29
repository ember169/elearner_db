import { listResources } from "@/lib/learn/store";
import { COMPETENCIES, COMPETENCY_AREAS } from "@/lib/mentor/competency-map";
import { LearnClient } from "@/components/learn/learn-client";

export const dynamic = "force-dynamic";

export default function LearnPage() {
  const resources = listResources();

  const competencies = COMPETENCIES.map((c) => ({
    id: c.id,
    label: c.label,
    area: c.area as string,
    description: c.description,
  }));

  return (
    <LearnClient
      resources={resources}
      competencies={competencies}
      areas={[...COMPETENCY_AREAS]}
    />
  );
}
