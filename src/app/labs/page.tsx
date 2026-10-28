import { getActiveLabSessions, getRunners } from "@/lib/labs/store";
import { LabsClient } from "@/components/labs/labs-client";

export const dynamic = "force-dynamic";

export default function LabsPage() {
  const sessions = getActiveLabSessions();
  const runners = getRunners();
  return <LabsClient initialSessions={sessions} initialRunners={runners} />;
}
