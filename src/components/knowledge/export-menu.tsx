"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Presentation, Printer, ChevronDown } from "lucide-react";

/** Markdown and the slide deck download; PDF opens a print view that calls
 *  window.print() on load, so the browser's own engine makes the file. */
export function ExportMenu({ articleId }: { articleId: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Plain links, not scripted navigation: Markdown and the deck are served with
  // Content-Disposition: attachment, so the browser downloads them without
  // leaving the page, and the print view opens in its own tab.
  const items = [
    { key: "md", label: "Markdown", icon: FileText, newTab: false },
    { key: "slides", label: "Slide deck", icon: Presentation, newTab: false },
    { key: "pdf", label: "PDF (print)", icon: Printer, newTab: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="cb-label-mono flex items-center gap-1 rounded-cb-chip-sm bg-cb-raised px-2 py-1.5 text-[10px] text-cb-second transition-colors hover:bg-cb-raised-hover hover:text-cb-text"
      >
        <Download className="h-3 w-3" />
        export
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-cb-card border border-cb-line bg-cb-card py-1 shadow-lg"
        >
          {items.map((item) => (
            <a
              key={item.key}
              role="menuitem"
              href={`/api/knowledge/${articleId}/export?format=${item.key}`}
              {...(item.newTab
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-cb-sans text-[14px] text-cb-second transition-colors hover:bg-cb-raised hover:text-cb-text"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
