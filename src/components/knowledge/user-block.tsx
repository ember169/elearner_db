"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Trash2 } from "lucide-react";
import { MermaidBlock } from "./mermaid-block";

export type UserBlock = {
  id: number;
  articleId: number;
  afterSectionId: number | null;
  sortOrder: number | null;
  blockType: string;
  content: string;
};

/** A block the reader added themselves, rendered between article sections and
 *  marked as theirs so generated content and personal notes never blur. */
export function UserBlockView({
  block,
  onDelete,
  busy,
}: {
  block: UserBlock;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <figure className="group relative my-4 rounded-cb-card border border-cb-line bg-cb-raised/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <figcaption className="cb-label-mono text-[10px] text-cb-muted">
          your {block.blockType}
        </figcaption>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          aria-label="Delete block"
          className="cb-label-mono flex items-center gap-1 text-[10px] text-cb-muted opacity-0 transition-opacity hover:text-cb-danger focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
          delete
        </button>
      </div>

      {block.blockType === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.content}
          alt="User-added illustration"
          className="mx-auto max-h-[70vh] max-w-full rounded-cb-chip-sm"
        />
      ) : block.blockType === "mermaid" ? (
        <MermaidBlock chart={block.content} />
      ) : (
        <div className="font-cb-sans text-[15px] leading-[1.6] text-cb-second [&_table]:w-full [&_td]:border-b [&_td]:border-cb-line [&_td]:px-2 [&_td]:py-1.5 [&_th]:border-b [&_th]:border-cb-line [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
        </div>
      )}
    </figure>
  );
}
