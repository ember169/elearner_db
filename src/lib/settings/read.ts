import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

/** Mirrors the shape PlannerClient consumes; stored as a JSON blob in settings. */
export type SideProjectState = {
  title: string;
  goalId: number;
  status: "accepted" | "done" | "aborted";
} | null;

export type AppSettings = {
  objective: string;
  sideProjectState: SideProjectState;
};

/**
 * The objective and the side-project state, read once.
 *
 * Both the Dashboard and the Board need these; before the split they were read
 * inline in the single home page. Keeping the JSON parse in one place stops the
 * two from drifting on how they handle a malformed value.
 */
export function readAppSettings(): AppSettings {
  const cfg = db.select().from(settings).limit(1).all()[0] ?? null;

  let sideProjectState: SideProjectState = null;
  if (cfg?.sideProjectState) {
    try {
      sideProjectState = JSON.parse(cfg.sideProjectState) as SideProjectState;
    } catch {
      // A corrupt blob must not take the page down — it is a cache, not a source.
    }
  }

  return {
    objective: cfg?.objective ?? "Red team / malware dev",
    sideProjectState,
  };
}
