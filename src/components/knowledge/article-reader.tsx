"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";
import { MermaidBlock } from "./mermaid-block";

export type ReaderSection = {
  id: number;
  heading: string;
  content: string;
  sortOrder: number;
  isExpanded: boolean | null;
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
        className="my-3 overflow-x-auto rounded-cb-chip-sm border border-cb-line bg-cb-bg p-3 text-[13px] leading-relaxed"
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
    <h3 className="cb-display mt-6 mb-2 text-[22px] text-cb-text">{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 className="mt-5 mb-2 font-cb-sans text-[17px] font-bold text-cb-text">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="mt-4 mb-1.5 font-cb-sans text-[15px] font-bold text-cb-text">{children}</h5>
  ),
  p: ({ children }) => (
    <p className="my-2.5 font-cb-sans text-[15px] leading-[1.6] text-cb-second">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-2.5 list-disc space-y-1 pl-5 font-cb-sans text-[15px] leading-[1.6] text-cb-second">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2.5 list-decimal space-y-1 pl-5 font-cb-sans text-[15px] leading-[1.6] text-cb-second">
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
    <blockquote className="my-3 border-l-2 border-cb-or pl-3 font-cb-sans text-[15px] italic text-cb-muted">
      {children}
    </blockquote>
  ),
  // Wide tables scroll inside their own container rather than widening the page.
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-cb-chip-sm border border-cb-line">
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-cb-raised">{children}</thead>,
  th: ({ children }) => (
    <th className="cb-label-mono border-b border-cb-line px-3 py-2 text-left text-[10px] text-cb-muted">
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

export function ArticleReader({ sections }: { sections: ReaderSection[] }) {
  const ordered = useMemo(
    () => [...sections].sort((a, b) => a.sortOrder - b.sortOrder),
    [sections]
  );

  return (
    <div className="space-y-7">
      {ordered.map((section) => (
        <section key={section.id} id={`section-${section.id}`}>
          {/* Plain text headings — the family reserves icons for UI chrome. */}
          <h2 className="cb-display mb-2 text-[26px] text-cb-text">{section.heading}</h2>
          {section.isExpanded && (
            <span className="cb-label-mono mb-2 inline-block rounded-cb-chip-sm bg-cb-or-tint px-2 py-1 text-[10px] text-cb-or">
              expanded
            </span>
          )}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeHighlight, { detect: false, ignoreMissing: true }]]}
            components={components}
          >
            {section.content}
          </ReactMarkdown>
        </section>
      ))}
    </div>
  );
}
