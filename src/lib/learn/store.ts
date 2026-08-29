import { db } from "@/lib/db";
import {
  learningResources,
  learningPaths,
  learningPathItems,
} from "@/lib/db/schema";
import { eq, like, and, inArray, sql } from "drizzle-orm";

export type LearningResource = typeof learningResources.$inferSelect;
export type NewLearningResource = typeof learningResources.$inferInsert;

export type ResourceFilters = {
  platform?: string;
  difficulty?: string;
  status?: string;
  competencyId?: string;
  search?: string;
};

export function listResources(filters: ResourceFilters = {}): LearningResource[] {
  const conditions = [];
  if (filters.platform) conditions.push(eq(learningResources.platform, filters.platform));
  if (filters.difficulty) conditions.push(eq(learningResources.difficulty, filters.difficulty));
  if (filters.status) conditions.push(eq(learningResources.status, filters.status));
  if (filters.search) conditions.push(like(learningResources.title, `%${filters.search}%`));
  if (filters.competencyId) {
    conditions.push(like(learningResources.competencyIds, `%"${filters.competencyId}"%`));
  }

  return db
    .select()
    .from(learningResources)
    .where(conditions.length ? and(...conditions) : undefined)
    .all();
}

export function getResource(id: number): LearningResource | undefined {
  return db.select().from(learningResources).where(eq(learningResources.id, id)).get();
}

export function upsertResource(data: NewLearningResource): LearningResource {
  if (data.externalId && data.platform) {
    const existing = db
      .select()
      .from(learningResources)
      .where(
        and(
          eq(learningResources.platform, data.platform),
          eq(learningResources.externalId, data.externalId)
        )
      )
      .get();
    if (existing) {
      db.update(learningResources)
        .set({ ...data, id: undefined })
        .where(eq(learningResources.id, existing.id))
        .run();
      return { ...existing, ...data, id: existing.id };
    }
  }
  return db.insert(learningResources).values(data).returning().get();
}

export function updateResourceStatus(
  id: number,
  status: string,
  completedAt?: string
) {
  const updates: Record<string, unknown> = { status };
  if (status === "in_progress" && !completedAt) updates.startedAt = new Date().toISOString();
  if (status === "completed") updates.completedAt = completedAt || new Date().toISOString();
  db.update(learningResources).set(updates).where(eq(learningResources.id, id)).run();
}

export function deleteResource(id: number) {
  db.delete(learningResources).where(eq(learningResources.id, id)).run();
}

export function resourceCount(): number {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(learningResources)
    .get();
  return row?.count ?? 0;
}
