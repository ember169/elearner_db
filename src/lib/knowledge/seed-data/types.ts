export type SeedSection = {
  heading: string;
  content: string;
  sortOrder: number;
};

export type SeedArticle = {
  competencyId: string;
  depthTier: number;
  title: string;
  recommendedLevel: number;
  sections: SeedSection[];
};
