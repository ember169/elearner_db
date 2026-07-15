import { db } from "@/lib/db";
import {
  maldevProfile,
  maldevModules,
  maldevExercises,
  activityFeed,
} from "@/lib/db/schema";
import Database from "better-sqlite3";

type Config = {
  maldevDbPath: string | null;
};

export async function syncMaldev(config: Config) {
  const dbPath = config.maldevDbPath;
  if (!dbPath) throw new Error("Maldev DB path not configured");

  let itemsSynced = 0;
  const maldevDb = new Database(dbPath, { readonly: true });

  try {
    // Read tables — adapt column names to what actually exists
    const tables = maldevDb
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      )
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);

    let modules: { id: string; name: string; exercises_total?: number }[] = [];
    let exercises: {
      id: string;
      module_id: string;
      name: string;
      completed?: boolean | number;
      completed_at?: string;
    }[] = [];

    // Try common table structures
    if (tableNames.includes("modules") || tableNames.includes("chapters")) {
      const modulesTable = tableNames.includes("modules")
        ? "modules"
        : "chapters";
      modules = maldevDb
        .prepare(`SELECT * FROM ${modulesTable}`)
        .all() as typeof modules;
    }

    if (tableNames.includes("exercises") || tableNames.includes("lessons")) {
      const exercisesTable = tableNames.includes("exercises")
        ? "exercises"
        : "lessons";
      exercises = maldevDb
        .prepare(`SELECT * FROM ${exercisesTable}`)
        .all() as typeof exercises;
    }

    // Calculate progress
    const totalExercises = exercises.length;
    const completedExercises = exercises.filter(
      (e) => e.completed === true || e.completed === 1
    ).length;
    const overallProgress =
      totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

    // Upsert profile
    db.delete(maldevProfile).run();
    db.insert(maldevProfile)
      .values({
        overallProgress,
        modulesCompleted: modules.filter((m) => {
          const modExercises = exercises.filter(
            (e) => String(e.module_id) === String(m.id)
          );
          return (
            modExercises.length > 0 &&
            modExercises.every(
              (e) => e.completed === true || e.completed === 1
            )
          );
        }).length,
        totalModules: modules.length,
      })
      .run();
    itemsSynced++;

    // Upsert modules
    db.delete(maldevModules).run();
    for (const mod of modules) {
      const modExercises = exercises.filter(
        (e) => String(e.module_id) === String(mod.id)
      );
      const modCompleted = modExercises.filter(
        (e) => e.completed === true || e.completed === 1
      ).length;
      db.insert(maldevModules)
        .values({
          moduleId: String(mod.id),
          name: mod.name ?? `Module ${mod.id}`,
          progress:
            modExercises.length > 0
              ? (modCompleted / modExercises.length) * 100
              : 0,
          exercisesCompleted: modCompleted,
          totalExercises: modExercises.length,
        })
        .run();
      itemsSynced++;
    }

    // Upsert exercises
    db.delete(maldevExercises).run();
    for (const ex of exercises) {
      db.insert(maldevExercises)
        .values({
          exerciseId: String(ex.id),
          moduleId: String(ex.module_id),
          name: ex.name ?? `Exercise ${ex.id}`,
          status:
            ex.completed === true || ex.completed === 1
              ? "completed"
              : "pending",
          completedAt: ex.completed_at ?? null,
        })
        .run();
      itemsSynced++;
    }

    db.insert(activityFeed)
      .values({
        platform: "maldev",
        eventType: "sync",
        title: `Maldev synced (${overallProgress.toFixed(0)}% complete)`,
        details: JSON.stringify({
          modules: modules.length,
          exercises: totalExercises,
          completed: completedExercises,
        }),
      })
      .run();

    return {
      itemsSynced,
      snapshot: {
        overallProgress,
        modulesCompleted: modules.length,
        totalModules: modules.length,
        totalExercises,
        completedExercises,
      },
    };
  } finally {
    maldevDb.close();
  }
}
