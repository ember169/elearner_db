/**
 * Wraps annotated phrases in <mark> inside a rendered article section.
 *
 * The plan stores annotations as offset ranges into the Markdown source rather
 * than as DOM positions, so they survive re-renders and stay portable. Those
 * offsets do not map onto the rendered tree, though — `**bold**` is six
 * characters shorter once rendered — so the rendered pass matches on the stored
 * `highlightText` instead. Offsets remain the durable record; the text is what
 * paints.
 */

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

export type AnnotationMark = { id: number; highlightText: string; hasNote: boolean };

// Code is left alone: a highlight spanning a token would break the
// highlighter's own markup, and prose is what gets annotated anyway.
const SKIP = new Set(["code", "pre", "script", "style"]);

function splitOn(text: string, mark: AnnotationMark): HastNode[] {
  const needle = mark.highlightText;
  if (!needle) return [{ type: "text", value: text }];

  const out: HastNode[] = [];
  let from = 0;
  for (;;) {
    const at = text.indexOf(needle, from);
    if (at === -1) break;
    if (at > from) out.push({ type: "text", value: text.slice(from, at) });
    out.push({
      type: "element",
      tagName: "mark",
      properties: {
        className: ["cb-annotation", mark.hasNote ? "cb-annotation-note" : ""],
        "data-annotation-id": String(mark.id),
      },
      children: [{ type: "text", value: needle }],
    });
    from = at + needle.length;
  }
  if (!out.length) return [{ type: "text", value: text }];
  if (from < text.length) out.push({ type: "text", value: text.slice(from) });
  return out;
}

/** Returns a unified *attacher*, which is what the plugin list expects: unified
 *  calls the plugin to obtain the transformer, so the tree arrives one level
 *  down from here. */
export function rehypeAnnotations(marks: AnnotationMark[]) {
  return function attacher() {
    return function transform(tree: HastNode) {
      if (!marks.length) return;

      const walk = (node: HastNode) => {
        if (!node.children?.length) return;
        if (node.tagName && SKIP.has(node.tagName)) return;

        const next: HastNode[] = [];
        for (const child of node.children) {
          if (child.type === "text" && typeof child.value === "string") {
            // Longest first, so a phrase wins over a word nested inside it.
            let pieces: HastNode[] = [child];
            for (const mark of [...marks].sort(
              (a, b) => b.highlightText.length - a.highlightText.length,
            )) {
              pieces = pieces.flatMap((p) =>
                p.type === "text" && typeof p.value === "string"
                  ? splitOn(p.value, mark)
                  : [p],
              );
            }
            next.push(...pieces);
          } else {
            walk(child);
            next.push(child);
          }
        }
        node.children = next;
      };

      walk(tree);
    };
  };
}
