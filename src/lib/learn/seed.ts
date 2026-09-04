import { db } from "@/lib/db";
import {
  learningResources,
  ftProjects,
  thmRooms,
} from "@/lib/db/schema";
import { eq, or, isNull, sql } from "drizzle-orm";
import { upsertResource, resourceCount } from "./store";
import { HTB_ACADEMY_MODULES } from "@/lib/mentor/htb-academy-catalog";
import { HTB_MACHINES } from "@/lib/mentor/htb-machine-catalog";
import { ROOTME_CHALLENGE_CATALOG } from "@/lib/mentor/rootme-challenge-catalog";
import {
  competenciesForFtProject,
  competenciesForThmRoom,
} from "@/lib/mentor/competency-resolver";
import { getProjectBySlug, FT_COMMON_CORE } from "@/lib/guidance/ft-project-tree";

const AREA_TO_COMPETENCIES: Record<string, string[]> = {
  "Low-level & C": ["c-core", "c-systems", "algorithms", "cpp-oop"],
  "Windows internals & maldev": ["win-internals", "maldev-techniques", "evasion"],
  "Windows exploitation": ["win-internals"],
  "Linux & systems": ["linux-admin", "containers-infra"],
  "Networking": ["net-fundamentals", "net-attacks"],
  "Web": ["web-fundamentals", "web-security"],
  "Active Directory": ["ad-fundamentals"],
  "Recon & OSINT": ["recon-osint"],
  "Crypto & forensics": ["crypto", "forensics"],
  "Crypto & forensics basics": ["crypto", "forensics"],
  "Scripting & automation": ["scripting"],
  "Reverse engineering & binary": ["reverse-engineering", "binexp"],
};

const HTB_TIER_TO_DIFFICULTY: Record<string, string> = {
  Fundamental: "beginner",
  Easy: "beginner",
  Medium: "intermediate",
  Hard: "advanced",
};

const HTB_MACHINE_DIFFICULTY: Record<string, string> = {
  Easy: "beginner",
  Medium: "intermediate",
  Hard: "advanced",
  Insane: "expert",
};

const ROOTME_SCORE_TO_DIFFICULTY = (score: number): string => {
  if (score <= 10) return "beginner";
  if (score <= 20) return "intermediate";
  if (score <= 30) return "advanced";
  return "expert";
};

const ROOTME_CATEGORY_TO_COMPETENCIES: Record<string, string[]> = {
  "Cracking": ["reverse-engineering"],
  "App - Système": ["binexp", "c-systems"],
  "Web - Client": ["web-security"],
  "Web - Serveur": ["web-security"],
  "Réaliste": ["web-security", "recon-osint"],
  "Cryptanalyse": ["crypto"],
  "Réseau": ["net-fundamentals", "net-attacks"],
  "Forensique": ["forensics"],
  "Stéganographie": ["forensics"],
  "Programmation": ["scripting", "algorithms"],
  "App - Script": ["scripting"],
};

function seedHtbAcademy() {
  for (const mod of HTB_ACADEMY_MODULES) {
    upsertResource({
      platform: "htb",
      externalId: `academy-${mod.id}`,
      title: mod.name,
      url: `https://academy.hackthebox.com/course/preview/${mod.id}`,
      difficulty: HTB_TIER_TO_DIFFICULTY[mod.tier] ?? "intermediate",
      contentType: "module",
      tagsJson: JSON.stringify(mod.path ? [mod.path] : []),
      competencyIds: JSON.stringify(AREA_TO_COMPETENCIES[mod.area] ?? []),
      status: "not_started",
    });
  }
}

function seedHtbMachines() {
  for (const machine of HTB_MACHINES) {
    upsertResource({
      platform: "htb",
      externalId: `machine-${machine.id}`,
      title: machine.name,
      description: `${machine.os} · ${machine.difficulty}`,
      url: `https://app.hackthebox.com/machines/${machine.name}`,
      difficulty: HTB_MACHINE_DIFFICULTY[machine.difficulty] ?? "intermediate",
      contentType: "machine",
      tagsJson: JSON.stringify(machine.tags ?? []),
      competencyIds: JSON.stringify(AREA_TO_COMPETENCIES[machine.area] ?? []),
      status: "not_started",
    });
  }
}

function seedRootMe() {
  for (const ch of ROOTME_CHALLENGE_CATALOG) {
    upsertResource({
      platform: "rootme",
      externalId: `rm-${ch.id}`,
      title: ch.title,
      description: ch.description,
      url: `https://www.root-me.org/`,
      difficulty: ROOTME_SCORE_TO_DIFFICULTY(ch.score),
      contentType: "challenge",
      tagsJson: JSON.stringify(ch.skills),
      competencyIds: JSON.stringify(
        ROOTME_CATEGORY_TO_COMPETENCIES[ch.category] ?? []
      ),
      status: "not_started",
    });
  }
}

function seedFromSyncedThmRooms() {
  const rooms = db.select().from(thmRooms).all();
  for (const room of rooms) {
    upsertResource({
      platform: "thm",
      externalId: room.roomCode,
      title: room.roomName,
      url: `https://tryhackme.com/room/${room.roomCode}`,
      difficulty: room.difficulty ?? "beginner",
      contentType: "room",
      competencyIds: JSON.stringify(competenciesForThmRoom(room.roomCode)),
      status: room.completedAt ? "completed" : "not_started",
      completedAt: room.completedAt ?? undefined,
    });
  }
}

function seedFromSynced42Projects() {
  const projects = db.select().from(ftProjects).all();
  for (const proj of projects) {
    upsertResource({
      platform: "42",
      externalId: proj.slug ?? `ft-${proj.projectId}`,
      title: proj.name,
      url: `https://projects.intra.42.fr/projects/${proj.slug ?? proj.name.toLowerCase()}`,
      contentType: "project",
      tagsJson: JSON.stringify(
        getProjectBySlug(proj.slug ?? proj.name)?.skills ?? [],
      ),
      competencyIds: JSON.stringify(
        competenciesForFtProject(proj.slug, proj.name),
      ),
      status: proj.validated ? "completed" : proj.status === "in_progress" ? "in_progress" : "not_started",
      completedAt: proj.markedAt ?? undefined,
    });
  }
}

export function seedLearningResources() {
  const existing = resourceCount();
  if (existing > 0) return;

  seedHtbAcademy();
  seedHtbMachines();
  seedRootMe();
  seedFromSyncedThmRooms();
  seedFromSynced42Projects();
}


export function ensureCppModuleResources() {
  const cppModules = FT_COMMON_CORE.filter((p) => /^cpp\d{2}$/.test(p.slug));
  const existing = new Set(
    db
      .select({ eid: learningResources.externalId })
      .from(learningResources)
      .where(eq(learningResources.platform, "42"))
      .all()
      .map((r) => r.eid),
  );

  for (const mod of cppModules) {
    const eid = `cpp-module-${mod.slug.slice(3)}`;
    if (existing.has(eid)) continue;
    db.insert(learningResources)
      .values({
        platform: "42",
        externalId: eid,
        title: mod.name,
        url: `https://projects.intra.42.fr/projects/${mod.slug}`,
        contentType: "project",
        difficulty: "intermediate",
        tagsJson: JSON.stringify(mod.skills),
        competencyIds: JSON.stringify(["cpp-oop"]),
        description: mod.description,
        status: "not_started",
      })
      .run();
  }
}

export function backfillCompetencyIds(): number {
  const orphans = db
    .select()
    .from(learningResources)
    .where(
      or(
        eq(learningResources.competencyIds, "[]"),
        isNull(learningResources.competencyIds),
      ),
    )
    .all();

  if (orphans.length === 0) return 0;

  const ftRows = db.select().from(ftProjects).all();
  const bySlug = new Map(
    ftRows.map((p) => [p.slug ?? `ft-${p.projectId}`, p]),
  );

  let fixed = 0;
  for (const row of orphans) {
    let competencies: string[] = [];
    const updates: Record<string, unknown> = {};

    if (row.platform === "42") {
      const proj = bySlug.get(row.externalId ?? "");
      competencies = competenciesForFtProject(
        proj?.slug ?? row.externalId,
        proj?.name ?? row.title,
      );
      const skills = getProjectBySlug(proj?.slug ?? row.title)?.skills;
      if (skills?.length) updates.tagsJson = JSON.stringify(skills);
    } else if (row.platform === "thm") {
      competencies = competenciesForThmRoom(row.externalId);
    }

    if (competencies.length === 0 && !updates.tagsJson) continue;
    if (competencies.length) updates.competencyIds = JSON.stringify(competencies);

    db.update(learningResources)
      .set(updates)
      .where(eq(learningResources.id, row.id))
      .run();
    fixed += 1;
  }

  return fixed;
}
