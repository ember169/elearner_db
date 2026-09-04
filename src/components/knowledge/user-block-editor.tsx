"use client";

import { useRef, useState } from "react";
import { Plus, Image as ImageIcon, Table, Type, Workflow, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const TEMPLATES: Record<string, string> = {
  table: "| Column | Column |\n|---|---|\n|  |  |",
  mermaid: "flowchart LR\n  A[Start] --> B[Next]",
  text: "",
};

type Kind = "text" | "table" | "mermaid";

/** Insertion point between two sections: a quiet affordance until used, then a
 *  small editor. Images arrive by drop, paste, or picker and are stored as data
 *  URIs, so an article stays self-contained with no upload path to maintain. */
export function UserBlockEditor({
  onAdd,
  busy,
}: {
  onAdd: (blockType: string, content: string) => Promise<void>;
  busy: boolean;
}) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [draft, setDraft] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function readImage(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("That file is not an image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`Image is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 2MB.`);
      return;
    }
    const dataUri = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(file);
    });
    await onAdd("image", dataUri);
  }

  async function save() {
    if (!kind || !draft.trim()) return;
    await onAdd(kind, draft);
    setDraft("");
    setKind(null);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void readImage(file);
      }}
      onPaste={(e) => {
        const file = e.clipboardData.files?.[0];
        if (file) void readImage(file);
      }}
      className={cn(
        "my-3 rounded-cb-card border border-dashed px-3 py-2 transition-colors",
        dragging ? "border-cb-or bg-cb-or-tint" : "border-cb-line",
      )}
    >
      {error && (
        <p className="mb-2 font-cb-sans text-cb-foot text-cb-danger">{error}</p>
      )}

      {kind === null ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="cb-label-mono mr-1 text-cb-caption text-cb-muted">
            <Plus className="mr-1 inline h-3 w-3" />
            add
          </span>
          {(
            [
              ["text", Type, "text"],
              ["table", Table, "table"],
              ["mermaid", Workflow, "diagram"],
            ] as const
          ).map(([k, Icon, label]) => (
            <button
              key={k}
              type="button"
              disabled={busy}
              onClick={() => {
                setKind(k);
                setDraft(TEMPLATES[k]);
              }}
              className="cb-label-mono flex items-center gap-1 rounded-cb-chip-sm bg-cb-raised px-2 py-1 text-cb-caption text-cb-second transition-colors hover:bg-cb-raised-hover hover:text-cb-text"
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="cb-label-mono flex items-center gap-1 rounded-cb-chip-sm bg-cb-raised px-2 py-1 text-cb-caption text-cb-second transition-colors hover:bg-cb-raised-hover hover:text-cb-text"
          >
            <ImageIcon className="h-3 w-3" />
            image
          </button>
          <span className="cb-label-mono text-cb-caption text-cb-muted">
            or drop an image here
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void readImage(file);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="cb-label-mono text-cb-caption text-cb-muted">{kind}</span>
            <button
              type="button"
              onClick={() => {
                setKind(null);
                setDraft("");
                setError(null);
              }}
              aria-label="Cancel"
              className="text-cb-muted hover:text-cb-text"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <textarea
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            rows={kind === "text" ? 4 : 5}
            placeholder={kind === "text" ? "Markdown supported" : undefined}
            className="w-full resize-y rounded-cb-chip-sm border border-cb-line bg-cb-bg px-3 py-2 font-cb-mono text-cb-foot text-cb-text placeholder:text-cb-muted focus-visible:border-cb-or focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || !draft.trim()}
            className="cb-label-mono rounded-cb-chip-sm bg-cb-or px-3 py-1.5 text-cb-caption text-cb-on-or disabled:opacity-50"
          >
            insert
          </button>
        </div>
      )}
    </div>
  );
}
