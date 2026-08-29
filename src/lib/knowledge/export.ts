import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import type { ArticleWithSections } from "./store";

export type ExportFormat = "md" | "slides" | "pdf";

/** Blocks the reader added sit after their anchor section, in insertion order. */
function blocksAfter(article: ArticleWithSections, sectionId: number) {
  return article.userBlocks
    .filter((b) => b.afterSectionId === sectionId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function blockToMarkdown(blockType: string, content: string): string {
  if (blockType === "image") return `![Added by you](${content})`;
  if (blockType === "mermaid") return "```mermaid\n" + content + "\n```";
  return content;
}

export function articleToMarkdown(
  article: ArticleWithSections,
  competencyLabel: string,
): string {
  const out: string[] = [
    `# ${article.title}`,
    "",
    `_${competencyLabel} · depth tier L${article.depthTier}_`,
    "",
  ];

  for (const section of article.sections) {
    out.push(`## ${section.heading}`, "", section.content, "");

    for (const block of blocksAfter(article, section.id)) {
      out.push(blockToMarkdown(block.blockType, block.content), "");
    }

    if (section.annotations.length) {
      out.push("### Your highlights", "");
      for (const a of section.annotations) {
        out.push(`> ${a.highlightText.replace(/\n+/g, " ")}`);
        if (a.noteText) out.push(`>`, `> — ${a.noteText.replace(/\n+/g, " ")}`);
        out.push("");
      }
    }
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** The same remark/rehype chain the reader runs, minus React: Next forbids
 *  react-dom/server in App Router code, and this keeps the export from drifting
 *  away from what was on screen. Mermaid keeps its fence rather than rendering
 *  — the diagram library is ~1MB and a downloaded file has nowhere to load it
 *  from. */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeHighlight, { detect: false, ignoreMissing: true })
  .use(rehypeStringify);

function mdToHtml(markdown: string): string {
  return String(processor.processSync(markdown));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function blockToHtml(blockType: string, content: string): string {
  if (blockType === "image") {
    return `<figure class="user"><figcaption>your image</figcaption><img src="${escapeHtml(content)}" alt="Added by you"></figure>`;
  }
  if (blockType === "mermaid") {
    return `<figure class="user"><figcaption>your diagram (Mermaid source)</figcaption><pre>${escapeHtml(content)}</pre></figure>`;
  }
  return `<figure class="user"><figcaption>your ${escapeHtml(blockType)}</figcaption>${mdToHtml(content)}</figure>`;
}

/* Family palette as literals: a downloaded file has no access to the app's
   stylesheet, and generic font stacks so it renders anywhere. */
const BASE_CSS = `
  :root {
    --bg:#131211; --card:#1d1c19; --raised:#242320; --line:#35342f;
    --text:#f7f3ea; --second:#c2c0b8; --muted:#98968d; --or:#d7c19c;
    --success:#57b37f; --warn:#e08a3c; --danger:#e67078;
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--second);
    font-family: Archivo, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    font-size:15px; line-height:1.6; }
  h1,h2,h3 { color:var(--text); font-family:"DM Serif Display", Georgia, serif;
    font-weight:400; line-height:1.15; letter-spacing:-0.01em; }
  h1 { font-size:34px; margin:0 0 6px; }
  h2 { font-size:26px; margin:32px 0 8px; }
  h3 { font-size:19px; margin:22px 0 6px; }
  strong { color:var(--text); }
  a { color:var(--or); }
  code, pre { font-family:"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
  code { background:var(--raised); color:var(--or); padding:2px 5px; border-radius:5px; font-size:.88em; }
  pre { background:#0f0e0d; border:1px solid var(--line); border-radius:8px;
    padding:12px; overflow-x:auto; font-size:13px; }
  pre code { background:none; color:var(--second); padding:0; }
  table { width:100%; border-collapse:collapse; font-size:13px; margin:14px 0; }
  th,td { border-bottom:1px solid var(--line); padding:8px 10px; text-align:left; vertical-align:top; }
  th { color:var(--muted); font-family:"JetBrains Mono", monospace; font-size:10px;
    text-transform:uppercase; letter-spacing:.1em; }
  blockquote { border-left:2px solid var(--or); margin:12px 0; padding-left:12px; color:var(--muted); }
  figure.user { border:1px solid var(--line); border-radius:14px; padding:12px; margin:16px 0;
    background:rgba(36,35,32,.4); }
  figure.user figcaption { font-family:"JetBrains Mono", monospace; font-size:10px;
    text-transform:uppercase; letter-spacing:.1em; color:var(--muted); margin-bottom:8px; }
  figure.user img { max-width:100%; border-radius:8px; display:block; margin:0 auto; }
  .eyebrow { font-family:"JetBrains Mono", monospace; font-size:10px; text-transform:uppercase;
    letter-spacing:.1em; color:var(--muted); }
  .hljs-comment,.hljs-quote{color:var(--muted);font-style:italic}
  .hljs-keyword,.hljs-selector-tag,.hljs-built_in,.hljs-name{color:var(--or)}
  .hljs-string,.hljs-attr,.hljs-symbol,.hljs-bullet,.hljs-addition{color:var(--success)}
  .hljs-number,.hljs-literal,.hljs-variable,.hljs-type,.hljs-params{color:var(--warn)}
  .hljs-title,.hljs-section{color:var(--text);font-weight:700}
  .hljs-deletion,.hljs-meta{color:var(--danger)}
`;

function sectionBody(article: ArticleWithSections, sectionId: number, content: string) {
  const parts = [mdToHtml(content)];
  for (const b of blocksAfter(article, sectionId)) {
    parts.push(blockToHtml(b.blockType, b.content));
  }
  return parts.join("\n");
}

/** Print view. The PDF comes from the browser's own engine — the alternative
 *  is a headless Chromium in the image, which is a ~300MB dependency for one
 *  button. Opening it triggers the print dialogue. */
export function articleToPrintHtml(
  article: ArticleWithSections,
  competencyLabel: string,
): string {
  const body = article.sections
    .map(
      (s) =>
        `<section><h2>${escapeHtml(s.heading)}</h2>${sectionBody(article, s.id, s.content)}</section>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${escapeHtml(article.title)}</title>
<style>${BASE_CSS}
  body { max-width: 46rem; margin: 0 auto; padding: 40px 24px 64px; }
  section { break-inside: auto; }
  h2 { break-after: avoid; }
  pre, table, figure.user { break-inside: avoid; }
  @media print {
    /* Ink on paper: a charcoal page would empty a cartridge and read worse. */
    :root { --bg:#fff; --card:#fff; --raised:#f4f1ea; --line:#d9d3c6;
      --text:#16150f; --second:#2f2d26; --muted:#6b675c; --or:#7a5c1f; }
    body { padding: 0; font-size: 11pt; }
    pre { background:#f7f4ec; }
    a { text-decoration: none; }
  }
</style></head>
<body>
  <p class="eyebrow">${escapeHtml(competencyLabel)} · L${article.depthTier}</p>
  <h1>${escapeHtml(article.title)}</h1>
  ${body}
  <script>window.addEventListener("load", () => window.print());</script>
</body></html>`;
}

/** One section, one slide — the plan's rule. Self-contained: arrow keys, space,
 *  and click all advance, with no library to load. */
export function articleToSlidesHtml(
  article: ArticleWithSections,
  competencyLabel: string,
): string {
  const slides = [
    `<section class="slide title"><p class="eyebrow">${escapeHtml(competencyLabel)} · L${article.depthTier}</p><h1>${escapeHtml(article.title)}</h1></section>`,
    ...article.sections.map(
      (s) =>
        `<section class="slide"><h2>${escapeHtml(s.heading)}</h2><div class="body">${sectionBody(article, s.id, s.content)}</div></section>`,
    ),
  ].join("\n");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(article.title)}</title>
<style>${BASE_CSS}
  body { height:100vh; overflow:hidden; }
  .slide { display:none; height:100vh; padding:6vh 8vw; overflow-y:auto; }
  .slide.on { display:block; }
  .slide.title { display:none; align-items:center; justify-content:center;
    flex-direction:column; text-align:center; }
  .slide.title.on { display:flex; }
  .slide h1 { font-size:clamp(32px,6vw,64px); }
  .slide h2 { font-size:clamp(24px,4vw,42px); margin-top:0; }
  .body { font-size:clamp(14px,1.6vw,19px); }
  nav { position:fixed; bottom:14px; right:18px; display:flex; gap:10px;
    align-items:center; font-family:"JetBrains Mono", monospace; font-size:11px; color:var(--muted); }
  nav button { background:var(--raised); color:var(--second); border:1px solid var(--line);
    border-radius:9px; padding:5px 10px; cursor:pointer; font:inherit; }
  nav button:hover { color:var(--text); }
  @media print { .slide { display:block; height:auto; page-break-after:always; } nav { display:none; } }
</style></head>
<body>
${slides}
<nav><button id="prev">&larr;</button><span id="at"></span><button id="next">&rarr;</button></nav>
<script>
  const slides = [...document.querySelectorAll(".slide")];
  let i = 0;
  function show(n) {
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => s.classList.toggle("on", k === i));
    document.getElementById("at").textContent = (i + 1) + " / " + slides.length;
    location.hash = String(i + 1);
  }
  document.getElementById("next").onclick = () => show(i + 1);
  document.getElementById("prev").onclick = () => show(i - 1);
  addEventListener("keydown", (e) => {
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); show(i + 1); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); show(i - 1); }
    if (e.key === "Home") show(0);
    if (e.key === "End") show(slides.length - 1);
  });
  show(Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1));
</script>
</body></html>`;
}
