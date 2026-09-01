import { upsertArticle } from "./store";
import type { SeedArticle } from "./seed-data/types";

import { LOW_LEVEL_C_ARTICLES } from "./seed-data/low-level-c";
import { WINDOWS_MALDEV_ARTICLES } from "./seed-data/windows-maldev";
import { LINUX_SYSTEMS_ARTICLES } from "./seed-data/linux-systems";
import { NETWORKING_ARTICLES } from "./seed-data/networking";
import { WEB_ARTICLES } from "./seed-data/web";
import { AD_ARTICLES } from "./seed-data/ad";
import { RECON_OSINT_ARTICLES } from "./seed-data/recon-osint";
import { CRYPTO_FORENSICS_ARTICLES } from "./seed-data/crypto-forensics";
import { SCRIPTING_BINEXP_ARTICLES } from "./seed-data/scripting-binexp";

const ALL_ARTICLES: SeedArticle[] = [
  ...LOW_LEVEL_C_ARTICLES,
  ...WINDOWS_MALDEV_ARTICLES,
  ...LINUX_SYSTEMS_ARTICLES,
  ...NETWORKING_ARTICLES,
  ...WEB_ARTICLES,
  ...AD_ARTICLES,
  ...RECON_OSINT_ARTICLES,
  ...CRYPTO_FORENSICS_ARTICLES,
  ...SCRIPTING_BINEXP_ARTICLES,
];

/**
 * Sync the article corpus from seed-data on every init. `upsertArticle`
 * reconciles sections by heading, so this is safe to re-run: it adds new
 * sections, updates changed prose, and removes deleted ones while preserving
 * section ids (and thus annotations, exercises, and user expansions). This is
 * how content edits reach an already-seeded database.
 */
export function seedKnowledgeArticles() {
  for (const article of ALL_ARTICLES) {
    upsertArticle(article);
  }
}
