"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";
import { MermaidBlock } from "./mermaid-block";
import { rehypeAnnotations, type AnnotationMark } from "./annotate-plugin";
import { UserBlockView, type UserBlock } from "./user-block";
import { UserBlockEditor } from "./user-block-editor";
import { AnnotationPopover, type PendingSelection } from "./annotation-popover";

export type ReaderAnnotation = {
  id: number;
  sectionId: number;
  highlightText: string;
  noteText: string | null;
};

export type ReaderSection = {
  id: number;
  heading: string;
  content: string;
  sortOrder: number;
  isExpanded: boolean | null;
  annotations: ReaderAnnotation[];
};

/** Mermaid arrives as a fenced block, so it is intercepted before the
 *  highlighter sees it — otherwise the diagram source renders as tinted code. */
function extractMermaid(children: React.ReactNode): string | null {
  const el = Array.isArray(children) ? children[0] : children;
  if (!el || typeof el !== "object" || !("props" in el)) return null;
  const props = (el as { props?: { className?: string; children?: unknown } }).props;
  if (!props?.className?.includes("language-mermaid")) return null;
  return String(props.children ?? "").replace(/\n$/, "");
}

const components: Components = {
  pre({ children, ...props }) {
    const chart = extractMermaid(children);
    if (chart) return <MermaidBlock chart={chart} />;
    return (
      <pre
        className="my-3 overflow-x-auto rounded-cb-chip-sm border border-cb-line bg-cb-bg p-3 text-cb-foot leading-relaxed"
        {...props}
      >
        {children}
      </pre>
    );
  },
  code({ className, children, ...props }) {
    // Inline code only — fenced blocks arrive wrapped in <pre> above.
    if (!className) {
      return (
        <code
          className="rounded-[5px] bg-cb-raised px-1.5 py-0.5 font-cb-mono text-[0.88em] text-cb-or"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={`${className} font-cb-mono`} {...props}>
        {children}
      </code>
    );
  },
  h1: ({ children }) => (
    <h3 className="mt-6 mb-2 font-cb-sans text-cb-head text-cb-text">{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 className="mt-5 mb-2 font-cb-sans text-cb-card text-cb-text">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="mt-4 mb-1.5 font-cb-sans text-cb-body font-bold text-cb-text">{children}</h5>
  ),
  p: ({ children }) => (
    <p className="my-2.5 font-cb-sans text-cb-body leading-[1.6] text-cb-second">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-2.5 list-disc space-y-1 pl-5 font-cb-sans text-cb-body leading-[1.6] text-cb-second">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2.5 list-decimal space-y-1 pl-5 font-cb-sans text-cb-body leading-[1.6] text-cb-second">
      {children}
    </ol>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-cb-text">{children}</strong>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cb-or underline underline-offset-2 hover:text-cb-or-pressed"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-cb-or pl-3 font-cb-sans text-cb-body italic text-cb-muted">
      {children}
    </blockquote>
  ),
  // Wide tables scroll inside their own container rather than widening the page.
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-cb-chip-sm border border-cb-line">
      <table className="w-full border-collapse text-cb-foot">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-cb-raised">{children}</thead>,
  th: ({ children }) => (
    <th className="cb-label-mono border-b border-cb-line px-3 py-2 text-left text-cb-caption text-cb-muted">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-cb-line px-3 py-2 align-top font-cb-sans text-cb-second">
      {children}
    </td>
  ),
  hr: () => <hr className="my-5 border-cb-line" />,
};

export function ArticleReader({
  sections,
  userBlocks,
  busy,
  onAnnotate,
  onUpdateNote,
  onDeleteAnnotation,
  onAddBlock,
  onDeleteBlock,
}: {
  sections: ReaderSection[];
  userBlocks: UserBlock[];
  busy: boolean;
  onAnnotate: (sectionId: number, text: string, start: number, end: number, note?: string) => Promise<void>;
  onUpdateNote: (annotationId: number, note: string) => Promise<void>;
  onDeleteAnnotation: (annotationId: number) => Promise<void>;
  onAddBlock: (afterSectionId: number, blockType: string, content: string) => Promise<void>;
  onDeleteBlock: (blockId: number) => Promise<void>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [openAnnotation, setOpenAnnotation] = useState<ReaderAnnotation | null>(null);

  const ordered = useMemo(
    () => [...sections].sort((a, b) => a.sortOrder - b.sortOrder),
    [sections]
  );

  const blocksAfter = useMemo(() => {
    const map = new Map<number, UserBlock[]>();
    for (const b of userBlocks) {
      if (b.afterSectionId == null) continue;
      const list = map.get(b.afterSectionId) ?? [];
      list.push(b);
      map.set(b.afterSectionId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return map;
  }, [userBlocks]);

  const annotationById = useMemo(() => {
    const map = new Map<number, ReaderAnnotation>();
    for (const s of sections) for (const a of s.annotations) map.set(a.id, a);
    return map;
  }, [sections]);

  /** A selection becomes an offset range into the section's Markdown source,
   *  which is the durable record. The rendered text can differ from the source,
   *  so a phrase that is not found verbatim is stored at offset 0 rather than
   *  refused — the highlight still paints, by text match. */
  const captureSelection = useCallback(
    (section: ReaderSection) => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (!sel || sel.isCollapsed || text.length < 2) {
        setPending(null);
        return;
      }
      let start = section.content.indexOf(text);
      if (start === -1) {
        start = section.content.indexOf(text.replace(/\n/g, "\n\n"));
      }
      setPending({
        sectionId: section.id,
        text,
        start: start === -1 ? 0 : start,
        end: start === -1 ? text.length : start + text.length,
      });
      setOpenAnnotation(null);
    },
    []
  );

  // Clicking an existing highlight opens its note rather than starting a new one.
  const onReaderClick = useCallback(
    (e: React.MouseEvent) => {
      const target = (e.target as HTMLElement).closest("mark[data-annotation-id]");
      if (!target) return;
      const id = Number(target.getAttribute("data-annotation-id"));
      const found = annotationById.get(id);
      if (found) {
        setOpenAnnotation(found);
        setPending(null);
      }
    },
    [annotationById]
  );

  return (
    <div ref={rootRef} className="space-y-7" onClick={onReaderClick}>
      {ordered.map((section) => {
        const marks: AnnotationMark[] = section.annotations.map((a) => ({
          id: a.id,
          highlightText: a.highlightText,
          hasNote: Boolean(a.noteText),
        }));

        return (
          <section key={section.id} id={`section-${section.id}`}>
            {/* Plain text headings — the family reserves icons for UI chrome. */}
            <h2 className="mb-2 font-cb-sans text-cb-head leading-snug text-cb-text">{section.heading}</h2>
            {section.isExpanded && (
              <span className="cb-label-mono mb-2 inline-block rounded-cb-chip-sm bg-cb-or-tint px-2 py-1 text-cb-caption text-cb-or">
                expanded
              </span>
            )}

            <div onMouseUp={() => captureSelection(section)}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[
                  [rehypeHighlight, { detect: false, ignoreMissing: true }],
                  rehypeAnnotations(marks),
                ]}
                components={components}
              >
                {section.content}
              </ReactMarkdown>
            </div>

            {blocksAfter.get(section.id)?.map((block) => (
              <UserBlockView
                key={block.id}
                block={block}
                busy={busy}
                onDelete={() => void onDeleteBlock(block.id)}
              />
            ))}

            <UserBlockEditor
              busy={busy}
              onAdd={(type, content) => onAddBlock(section.id, type, content)}
            />
          </section>
        );
      })}

      <AnnotationPopover
        pending={pending}
        annotation={openAnnotation}
        busy={busy}
        onClose={() => {
          setPending(null);
          setOpenAnnotation(null);
        }}
        onCreate={async (note) => {
          if (!pending) return;
          await onAnnotate(
            pending.sectionId,
            pending.text,
            pending.start,
            pending.end,
            note || undefined
          );
          setPending(null);
          window.getSelection()?.removeAllRanges();
        }}
        onSaveNote={async (note) => {
          if (!openAnnotation) return;
          await onUpdateNote(openAnnotation.id, note);
          setOpenAnnotation(null);
        }}
        onDelete={async () => {
          if (!openAnnotation) return;
          await onDeleteAnnotation(openAnnotation.id);
          setOpenAnnotation(null);
        }}
      />
    </div>
  );
}
