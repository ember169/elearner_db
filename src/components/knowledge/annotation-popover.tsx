"use client";

import { useEffect, useState } from "react";
import { Highlighter, Trash2, X } from "lucide-react";
import type { ReaderAnnotation } from "./article-reader";

export type PendingSelection = {
  sectionId: number;
  text: string;
  start: number;
  end: number;
};

/** One panel serving both moments: confirming a fresh highlight, and editing
 *  the note on an existing one. Docked rather than floating — a popover pinned
 *  to a text range fights every scroll and reflow, and this reads the same on a
 *  phone as on a desktop. */
export function AnnotationPopover({
  pending,
  annotation,
  busy,
  onClose,
  onCreate,
  onSaveNote,
  onDelete,
}: {
  pending: PendingSelection | null;
  annotation: ReaderAnnotation | null;
  busy: boolean;
  onClose: () => void;
  onCreate: (note: string) => Promise<void>;
  onSaveNote: (note: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [shownFor, setShownFor] = useState<string | null>(null);

  // Adjusting state during render rather than in an effect: this is derived
  // from props, and an effect here would cascade an extra render every time
  // the panel opens (React's own "you might not need an effect" case).
  const identity = annotation
    ? `a${annotation.id}`
    : pending
      ? `p${pending.sectionId}:${pending.start}`
      : null;
  if (identity !== shownFor) {
    setShownFor(identity);
    setNote(annotation?.noteText ?? "");
  }

  useEffect(() => {
    if (!pending && !annotation) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, annotation, onClose]);

  if (!pending && !annotation) return null;

  const quote = pending?.text ?? annotation?.highlightText ?? "";

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg rounded-cb-card-lg border border-cb-line bg-cb-card p-4 shadow-lg md:bottom-6">
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="cb-label-mono flex items-center gap-1 text-cb-caption text-cb-or">
          <Highlighter className="h-3 w-3" />
          {pending ? "new highlight" : "highlight"}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-cb-muted hover:text-cb-text"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <blockquote className="mb-3 border-l-2 border-cb-or pl-2.5 font-cb-sans text-cb-foot leading-[1.5] text-cb-second">
        {quote.length > 220 ? `${quote.slice(0, 220)}…` : quote}
      </blockquote>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Margin note (optional)"
        className="w-full resize-y rounded-cb-chip-sm border border-cb-line bg-cb-bg px-3 py-2 font-cb-sans text-cb-foot text-cb-text placeholder:text-cb-muted focus-visible:border-cb-or focus-visible:outline-none"
      />

      <div className="mt-3 flex items-center justify-between">
        {annotation ? (
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={busy}
            className="cb-label-mono flex items-center gap-1 text-cb-caption text-cb-muted transition-colors hover:text-cb-danger disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            remove
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void (pending ? onCreate(note) : onSaveNote(note))}
          className="cb-label-mono rounded-cb-chip-sm bg-cb-or px-3 py-1.5 text-cb-caption text-cb-on-or disabled:opacity-50"
        >
          {pending ? "highlight" : "save note"}
        </button>
      </div>
    </div>
  );
}
