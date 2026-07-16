import { db } from "@/lib/db";
import { settings, syncLog } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
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

  const platformSyncs: Record<string, string | null> = {};
  for (const p of ["42", "thm", "htb", "rootme", "maldev"]) {
    const row = db
      .select()
      .from(syncLog)
      .where(and(eq(syncLog.platform, p), eq(syncLog.status, "success")))
      .orderBy(desc(syncLog.startedAt))
      .limit(1)
      .all()[0];
    platformSyncs[p] = row?.startedAt ?? null;
  }

  return (
    <SettingsClient
      config={config}
      recentSyncs={recentSyncs}
      platformSyncs={platformSyncs}
    />
  );
}
