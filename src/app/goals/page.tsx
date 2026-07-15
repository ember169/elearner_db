import { runGuidanceEngine } from "@/lib/guidance/engine";
import { GoalsClient } from "@/components/goals/goals-client";

export const dynamic = "force-dynamic";

export default function GoalsPage() {
  const guidance = runGuidanceEngine();

  return <GoalsClient goals={guidance.goals} />;
}
