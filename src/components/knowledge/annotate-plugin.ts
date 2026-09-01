/**
 * Wraps annotated phrases in <mark> inside a rendered article section.
 *
 * Annotations are offset ranges into the Markdown source. The rendered tree
 * doesn't preserve those offsets, so the plugin matches on the stored
 * `highlightText` instead. It flattens all text leaves, finds the annotation
 * in the concatenated string, then splices <mark> elements into the tree —
 * spanning across node boundaries when needed (bold → plain, code tokens, etc.).
 */

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

export type AnnotationMark = { id: number; highlightText: string; hasNote: boolean };

const SKIP = new Set(["script", "style"]);

type TextLeaf = {
  node: HastNode;
  parent: HastNode;
  index: number;
  start: number;
  end: number;
};

function collectLeaves(node: HastNode, out: TextLeaf[], offset: { v: number }) {
  if (!node.children) return;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === "text" && typeof child.value === "string") {
      const s = offset.v;
      offset.v += child.value.length;
      out.push({ node: child, parent: node, index: i, start: s, end: offset.v });
    } else if (child.children) {
      if (child.tagName && SKIP.has(child.tagName)) continue;
      collectLeaves(child, out, offset);
    }
  }
}

function markNode(text: string, mark: AnnotationMark): HastNode {
  return {
    type: "element",
    tagName: "mark",
    properties: {
      className: ["cb-annotation", mark.hasNote ? "cb-annotation-note" : ""],
      "data-annotation-id": String(mark.id),
    },
    children: [{ type: "text", value: text }],
  };
}

export function rehypeAnnotations(marks: AnnotationMark[]) {
  return function attacher() {
    return function transform(tree: HastNode) {
      if (!marks.length) return;

      const sorted = [...marks].sort(
        (a, b) => b.highlightText.length - a.highlightText.length,
      );

      for (const mark of sorted) {
        if (!mark.highlightText) continue;

        const leaves: TextLeaf[] = [];
        collectLeaves(tree, leaves, { v: 0 });
        const flat = leaves.map((l) => l.node.value!).join("");
        const at = flat.indexOf(mark.highlightText);
        if (at === -1) continue;

        const mEnd = at + mark.highlightText.length;
        const hits = leaves.filter((l) => l.end > at && l.start < mEnd);

        for (let i = hits.length - 1; i >= 0; i--) {
          const leaf = hits[i];
          const text = leaf.node.value!;
          const lo = Math.max(0, at - leaf.start);
          const hi = Math.min(text.length, mEnd - leaf.start);

          const before = text.slice(0, lo);
          const inside = text.slice(lo, hi);
          const after = text.slice(hi);

          const parts: HastNode[] = [];
          if (before) parts.push({ type: "text", value: before });
          parts.push(markNode(inside, mark));
          if (after) parts.push({ type: "text", value: after });

          leaf.parent.children!.splice(leaf.index, 1, ...parts);
        }
      }
    };
  };
}
