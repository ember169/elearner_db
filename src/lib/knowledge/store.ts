import { db } from "@/lib/db";
import {
  knowledgeArticles,
  articleSections,
  articleAnnotations,
  userContentBlocks,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type ArticleSection = typeof articleSections.$inferSelect;
export type ArticleAnnotation = typeof articleAnnotations.$inferSelect;
export type UserContentBlock = typeof userContentBlocks.$inferSelect;

export type ArticleWithSections = KnowledgeArticle & {
  sections: (ArticleSection & {
    annotations: ArticleAnnotation[];
  })[];
  userBlocks: UserContentBlock[];
};

export function listArticles(competencyId?: string): KnowledgeArticle[] {
  if (competencyId) {
    return db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.competencyId, competencyId))
      .all();
  }
  return db.select().from(knowledgeArticles).all();
}

export function getArticle(id: number): ArticleWithSections | undefined {
  const article = db
    .select()
    .from(knowledgeArticles)
    .where(eq(knowledgeArticles.id, id))
    .get();
  if (!article) return undefined;

  const sections = db
    .select()
    .from(articleSections)
    .where(eq(articleSections.articleId, id))
    .orderBy(articleSections.sortOrder)
    .all();

  const sectionIds = sections.map((s) => s.id);
  const allAnnotations = sectionIds.length
    ? db.select().from(articleAnnotations).all().filter((a) => sectionIds.includes(a.sectionId))
    : [];

  const userBlocks = db
    .select()
    .from(userContentBlocks)
    .where(eq(userContentBlocks.articleId, id))
    .orderBy(userContentBlocks.sortOrder)
    .all();

  return {
    ...article,
    sections: sections.map((s) => ({
      ...s,
      annotations: allAnnotations.filter((a) => a.sectionId === s.id),
    })),
    userBlocks,
  };
}

export function upsertArticle(data: {
  competencyId: string;
  depthTier: number;
  title: string;
  recommendedLevel: number;
  sections: { heading: string; content: string; sortOrder: number }[];
}): KnowledgeArticle {
  const existing = db
    .select()
    .from(knowledgeArticles)
    .where(
      and(
        eq(knowledgeArticles.competencyId, data.competencyId),
        eq(knowledgeArticles.depthTier, data.depthTier)
      )
    )
    .get();

  const now = new Date().toISOString();

  if (existing) {
    db.update(knowledgeArticles)
      .set({ title: data.title, recommendedLevel: data.recommendedLevel, updatedAt: now })
      .where(eq(knowledgeArticles.id, existing.id))
      .run();
    db.delete(articleSections).where(eq(articleSections.articleId, existing.id)).run();
    for (const section of data.sections) {
      db.insert(articleSections)
        .values({ articleId: existing.id, ...section })
        .run();
    }
    return { ...existing, title: data.title, recommendedLevel: data.recommendedLevel, updatedAt: now };
  }

  const article = db
    .insert(knowledgeArticles)
    .values({
      competencyId: data.competencyId,
      depthTier: data.depthTier,
      title: data.title,
      recommendedLevel: data.recommendedLevel,
      status: "ready",
      generatedAt: now,
    })
    .returning()
    .get();

  for (const section of data.sections) {
    db.insert(articleSections)
      .values({ articleId: article.id, ...section })
      .run();
  }

  return article;
}

export function expandSection(
  sectionId: number,
  expandedContent: string,
  prompt: string
) {
  const section = db
    .select()
    .from(articleSections)
    .where(eq(articleSections.id, sectionId))
    .get();
  if (!section) return;

  db.update(articleSections)
    .set({
      content: section.content + "\n\n" + expandedContent,
      isExpanded: true,
      expansionPrompt: prompt,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(articleSections.id, sectionId))
    .run();
}

export function addAnnotation(data: {
  sectionId: number;
  startOffset: number;
  endOffset: number;
  highlightText: string;
  noteText?: string;
}): ArticleAnnotation {
  return db.insert(articleAnnotations).values(data).returning().get();
}

export function updateAnnotation(id: number, noteText: string) {
  db.update(articleAnnotations)
    .set({ noteText })
    .where(eq(articleAnnotations.id, id))
    .run();
}

export function deleteAnnotation(id: number) {
  db.delete(articleAnnotations).where(eq(articleAnnotations.id, id)).run();
}

export function addUserBlock(data: {
  articleId: number;
  afterSectionId?: number;
  sortOrder?: number;
  blockType: string;
  content: string;
}): UserContentBlock {
  return db.insert(userContentBlocks).values(data).returning().get();
}

export function updateUserBlock(id: number, content: string) {
  db.update(userContentBlocks)
    .set({ content, updatedAt: new Date().toISOString() })
    .where(eq(userContentBlocks.id, id))
    .run();
}

export function deleteUserBlock(id: number) {
  db.delete(userContentBlocks).where(eq(userContentBlocks.id, id)).run();
}

export function articleCount(): number {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(knowledgeArticles)
    .get();
  return row?.count ?? 0;
}
