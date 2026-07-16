import { db } from "@/lib/db";
import {
  maldevProfile,
  maldevModules,
  maldevExercises,
  activityFeed,
} from "@/lib/db/schema";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

type Config = {
  maldevDbPath: string | null;
};

export async function syncMaldev(config: Config) {
  const dbPath = config.maldevDbPath;
  if (!dbPath) throw new Error("Maldev DB path not configured");

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    throw new Error(
      `Maldev: directory "${dir}" does not exist inside the container. Settings must point at the container path of the mounted volume (e.g. /maldev/elearning.db), not the host path.`
    );
  }
  if (!fs.existsSync(dbPath)) {
    let listing = "";
    try {
      listing = fs.readdirSync(dir).slice(0, 20).join(", ") || "(empty)";
    } catch {
      listing = "(unreadable)";
    }
    throw new Error(
      `Maldev: no file at "${dbPath}". Contents of ${dir}: ${listing}`
    );
  }
  if (fs.statSync(dbPath).isDirectory()) {
    throw new Error(
      `Maldev: "${dbPath}" is a directory, not a file. This usually means an earlier Docker bind mount ran while the host file was missing (Docker creates an empty directory in that case) — remove the stray directory on the host and check the host path in docker-compose.yml points at the real .db file.`
    );
  }

  const maldevDb = new Database(dbPath, { readonly: true });

  try {
    const rows = maldevDb
      .prepare("SELECT item_id, completed_at FROM progress")
      .all() as { item_id: string; completed_at: string }[];

    const moduleReads = new Map<number, string>();
    const objectivesByModule = new Map<number, Map<number, string>>();

    for (const row of rows) {
      const modMatch = row.item_id.match(/^module-(\d+)$/);
      if (modMatch) {
        moduleReads.set(parseInt(modMatch[1]), row.completed_at);
        continue;
      }
      const objMatch = row.item_id.match(/^objective-(\d+)-(\d+)$/);
      if (objMatch) {
        const modNum = parseInt(objMatch[1]);
        const objNum = parseInt(objMatch[2]);
        if (!objectivesByModule.has(modNum))
          objectivesByModule.set(modNum, new Map());
        objectivesByModule.get(modNum)!.set(objNum, row.completed_at);
      }
    }

    const maldevDir = path.dirname(dbPath);
    let totalModules = 0;
    const exercisesPerModule: Record<number, number> = {};

    // Discover total modules from Modules.htm (the Flask app parses it the same way)
    const modulesHtmlPath = path.join(
      maldevDir,
      "resources",
      "Maldev Modules",
      "Modules.htm"
    );
    if (fs.existsSync(modulesHtmlPath)) {
      const html = fs.readFileSync(modulesHtmlPath, "utf-8");
      totalModules = (html.match(/module-container/g) || []).length;
    }

    // Fallback: highest module number seen in progress data
    if (totalModules === 0) {
      const allNums = [...moduleReads.keys(), ...objectivesByModule.keys()];
      totalModules = allNums.length > 0 ? Math.max(...allNums) : 0;
    }

    // Discover exercises per module from exercises.py
    const exercisesPath = path.join(maldevDir, "exercises.py");
    if (fs.existsSync(exercisesPath)) {
      const content = fs.readFileSync(exercisesPath, "utf-8");
      const lines = content.split("\n");
      let currentModule: number | null = null;
      let currentCount = 0;

      for (const line of lines) {
        const keyMatch = line.match(/^\s+(\d+):\s*\[/);
        if (keyMatch) {
          if (currentModule !== null) {
            exercisesPerModule[currentModule] = currentCount;
          }
          currentModule = parseInt(keyMatch[1]);
          currentCount = 0;
          continue;
        }
        if (currentModule !== null && line.includes('"type"')) {
          currentCount++;
        }
      }
      if (currentModule !== null) {
        exercisesPerModule[currentModule] = currentCount;
      }
    }

    const totalExercises = Object.values(exercisesPerModule).reduce(
      (a, b) => a + b,
      0
    );
    const totalItems = totalModules + totalExercises;
    const completedObjectiveCount = [...objectivesByModule.values()].reduce(
      (a, m) => a + m.size,
      0
    );
    const completedItems = moduleReads.size + completedObjectiveCount;
    const overallProgress =
      totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    let modulesCompleted = 0;
    for (let i = 1; i <= totalModules; i++) {
      const isRead = moduleReads.has(i);
      const numExercises = exercisesPerModule[i] ?? 0;
      const doneExercises = objectivesByModule.get(i)?.size ?? 0;
      if (isRead && doneExercises >= numExercises) {
        modulesCompleted++;
      }
    }

    let itemsSynced = 0;

    db.delete(maldevProfile).run();
    db.insert(maldevProfile)
      .values({ overallProgress, modulesCompleted, totalModules })
      .run();
    itemsSynced++;

    db.delete(maldevModules).run();
    const touchedModules = new Set([
      ...moduleReads.keys(),
      ...objectivesByModule.keys(),
    ]);
    for (const modNum of touchedModules) {
      const isRead = moduleReads.has(modNum);
      const numExercises = exercisesPerModule[modNum] ?? 0;
      const doneExercises = objectivesByModule.get(modNum)?.size ?? 0;
      const parts = 1 + numExercises;
      const doneParts = (isRead ? 1 : 0) + doneExercises;
      const progress = parts > 0 ? (doneParts / parts) * 100 : 0;

      db.insert(maldevModules)
        .values({
          moduleId: String(modNum),
          name: `Module ${modNum}`,
          progress,
          exercisesCompleted: doneExercises,
          totalExercises: numExercises,
        })
        .run();
      itemsSynced++;
    }

    db.delete(maldevExercises).run();
    for (const [modNum, objs] of objectivesByModule) {
      for (const [objNum, completedAt] of objs) {
        db.insert(maldevExercises)
          .values({
            exerciseId: `objective-${modNum}-${objNum}`,
            moduleId: String(modNum),
            name: `Objective ${objNum + 1}`,
            status: "completed",
            completedAt,
          })
          .run();
        itemsSynced++;
      }
    }

    db.insert(activityFeed)
      .values({
        platform: "maldev",
        eventType: "sync",
        title: `Maldev synced (${overallProgress.toFixed(0)}% complete, ${modulesCompleted}/${totalModules} modules)`,
        details: JSON.stringify({
          totalModules,
          modulesCompleted,
          completedItems,
          totalItems,
        }),
      })
      .run();

    return {
      itemsSynced,
      snapshot: {
        overallProgress,
        modulesCompleted,
        totalModules,
        totalExercises,
        completedExercises: completedObjectiveCount,
      },
    };
  } finally {
    maldevDb.close();
  }
}
