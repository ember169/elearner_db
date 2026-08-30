"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X, Loader2, BookOpen, Notebook, ExternalLink, ChevronDown, ChevronRight,
  Eye, EyeOff,
} from "lucide-react";
import { assertOk } from "@/lib/utils";
import { PLATFORM_LABELS } from "@/lib/platform-colors";

type Exercise = {
  name: string;
  assignmentName: string;
  expectedFiles: string | null;
  allowedFunctions: string | null;
  subject: string;
  solution: string | null;
  solutionLang: string | null;
};

type Context = {
  item: { title: string; type: string; why: string | null; link: string | null };
  goal: { id: number; title: string } | null;
  summary: string | null;
  skills: string[];
  competencies: { id: string; label: string }[];
  relatedResources: { id: number; title: string; platform: string }[];
  relatedArticles: { id: number; title: string; depthTier: number }[];
  exam: { exercises: Exercise[]; sources: { name: string; url: string }[] } | null;
};

function ExerciseBlock({ ex }: { ex: Exercise }) {
  const [open, setOpen] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  return (
    <div className="rounded-cb-card border border-cb-line bg-cb-bg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-cb-muted" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-cb-muted" />
        )}
        <span className="font-cb-sans text-[14px] font-bold text-cb-text">
          {ex.assignmentName}
        </span>
        {ex.expectedFiles && (
          <span className="cb-label-mono ml-auto text-[10px] text-cb-muted">
            {ex.expectedFiles}
          </span>
        )}
      </button>

      {open && (
        <div className="space-y-3 border-t border-cb-line px-3 py-3">
          {ex.allowedFunctions && (
            <p className="font-cb-mono text-[11px] text-cb-second">
              <span className="text-cb-muted">allowed: </span>
              {ex.allowedFunctions}
            </p>
          )}
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-cb-chip-sm bg-cb-card p-3 font-cb-mono text-[12px] leading-relaxed text-cb-second">
            {ex.subject}
          </pre>

          {ex.solution && (
            <div>
              <button
                type="button"
                onClick={() => setShowSolution((v) => !v)}
                className="cb-label-mono flex items-center gap-1 text-[10px] text-cb-or"
              >
                {showSolution ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showSolution ? "hide solution" : "show solution"}
              </button>
              {showSolution && (
                <pre className="mt-2 overflow-x-auto rounded-cb-chip-sm border border-cb-line bg-cb-card p-3 font-cb-mono text-[12px] leading-relaxed text-cb-second">
                  {ex.solution}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CardDetail({ itemId, onClose }: { itemId: number; onClose: () => void }) {
  const [ctx, setCtx] = useState<Context | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/board/${itemId}/context`);
        await assertOk(res);
        const data = (await res.json()) as Context;
        if (!cancelled) setCtx(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-[var(--cb-scrim)]" onClick={onClose} />
      <div className="relative z-10 max-h-[85dvh] w-full overflow-y-auto rounded-t-[22px] border border-cb-line bg-cb-card p-5 sm:max-w-2xl sm:rounded-[16px]">
        {!ctx && !error && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-cb-muted" />
          </div>
        )}
        {error && <p className="py-8 text-center font-cb-sans text-[14px] text-cb-danger">{error}</p>}

        {ctx && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="cb-label-mono rounded-cb-chip-sm bg-cb-raised px-2 py-1 text-[10px] text-cb-second">
                  {PLATFORM_LABELS[ctx.item.type] ?? ctx.item.type}
                </span>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="text-cb-muted hover:text-cb-text">
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="font-cb-sans text-[20px] font-bold leading-snug text-cb-text">
              {ctx.item.title}
            </h2>

            {ctx.summary && (
              <p className="font-cb-sans text-[14px] leading-relaxed text-cb-second">{ctx.summary}</p>
            )}
            {ctx.item.why && (
              <p className="font-cb-sans text-[13px] italic leading-relaxed text-cb-muted">
                {ctx.item.why}
              </p>
            )}

            {ctx.goal && (
              <Link
                href={`/goals?goal=${ctx.goal.id}`}
                className="cb-label-mono inline-flex items-center gap-1 text-[10px] text-cb-or"
              >
                goal · {ctx.goal.title}
              </Link>
            )}

            {ctx.competencies.length > 0 && (
              <div className="space-y-1.5">
                <p className="cb-label-mono text-[10px] text-cb-muted">requires</p>
                <div className="flex flex-wrap gap-1.5">
                  {ctx.competencies.map((c) => (
                    <Link
                      key={c.id}
                      href={`/knowledge/${c.id}`}
                      className="cb-label-mono rounded-cb-chip-sm bg-cb-or-tint px-2 py-1 text-[10px] text-cb-or hover:bg-cb-or/25"
                    >
                      {c.label}
                    </Link>
                  ))}
                  {ctx.skills.map((sk) => (
                    <span key={sk} className="cb-label-mono rounded-cb-chip-sm bg-cb-raised px-2 py-1 text-[10px] text-cb-second">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ctx.exam && (
              <div className="space-y-2">
                <p className="cb-label-mono text-[10px] text-cb-muted">
                  possible subjects · {ctx.exam.exercises.length}
                </p>
                <div className="space-y-1.5">
                  {ctx.exam.exercises.map((ex) => (
                    <ExerciseBlock key={ex.name} ex={ex} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {ctx.exam.sources.map((src) => (
                    <a
                      key={src.url}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cb-label-mono inline-flex items-center gap-1 text-[10px] text-cb-muted hover:text-cb-text"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {src.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {ctx.relatedArticles.length > 0 && (
              <div className="space-y-1.5">
                <p className="cb-label-mono flex items-center gap-1 text-[10px] text-cb-muted">
                  <Notebook className="h-3 w-3" /> read in Knowledge
                </p>
                <div className="space-y-1">
                  {ctx.relatedArticles.map((a) => (
                    <a
                      key={a.id}
                      href={`/knowledge?article=${a.id}`}
                      className="flex items-center gap-2 rounded-cb-chip-sm px-2 py-1.5 transition-colors hover:bg-cb-raised"
                    >
                      <span className="cb-label-mono shrink-0 text-[10px] text-cb-second">L{a.depthTier}</span>
                      <span className="truncate font-cb-sans text-[13px] text-cb-second">{a.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {ctx.relatedResources.length > 0 && (
              <div className="space-y-1.5">
                <p className="cb-label-mono flex items-center gap-1 text-[10px] text-cb-muted">
                  <BookOpen className="h-3 w-3" /> practise in Learn · {ctx.relatedResources.length}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ctx.relatedResources.map((r) => (
                    <a
                      key={r.id}
                      href={`/learn?resource=${r.id}`}
                      className="flex items-center gap-1.5 rounded-cb-chip-sm bg-cb-raised px-2 py-1 transition-colors hover:bg-cb-raised-hover"
                    >
                      <span className="cb-label-mono text-[10px] text-cb-muted">
                        {PLATFORM_LABELS[r.platform] ?? r.platform}
                      </span>
                      <span className="max-w-[180px] truncate font-cb-sans text-[12px] text-cb-second">{r.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {ctx.item.link && (
              <a
                href={ctx.item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-cb-line py-3 font-cb-sans text-[14px] font-bold text-cb-second transition-colors hover:border-cb-or hover:text-cb-or"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open externally
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
