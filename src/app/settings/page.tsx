import { db } from "@/lib/db";
import { settings, syncLog } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SettingsClient } from "@/components/settings/settings-client";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  let config = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (!config) {
    db.insert(settings).values({ id: 1 }).run();
    config = db.select().from(settings).where(eq(settings.id, 1)).get()!;
  }

  const recentSyncs = db
    .select()
    .from(syncLog)
    .orderBy(desc(syncLog.startedAt))
    .limit(20)
    .all();

  return <SettingsClient config={config} recentSyncs={recentSyncs} />;
}
