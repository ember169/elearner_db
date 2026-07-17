"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, RefreshCw, ArrowRight } from "lucide-react";

type CircleInfo = {
  circle: number;
  deadline: string | null;
  totalTasks: number;
  completedTasks: number;
  isComplete: boolean;
};

type GeneratePreview = {
  existingEpicId: number | null;
  targetDate: string | null;
  circles: CircleInfo[];
  totalTasks: number;
  preCompleted: number;
};

type SyncDiff = {
  autoCompleted: { id: number; title: string; ftSlug: string }[];
  newTasks: { slug: string; name: string; circle: number; estimatedHours: number }[];
  deadlineShifts: { circle: number; issueId: number; oldDate: string; newDate: string }[];
};

export function Generate42Dialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [preview, setPreview] = useState<GeneratePreview | null>(null);
  const [syncDiff, setSyncDiff] = useState<SyncDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [selectedNewTasks, setSelectedNewTasks] = useState<Set<string>>(new Set());
  const [applyDeadlines, setApplyDeadlines] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/goals/generate-42")
      .then((r) => r.json())
      .then((data: GeneratePreview) => {
        setPreview(data);
        if (data.existingEpicId) {
          fetch("/api/goals/sync-42", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ epicId: data.existingEpicId }),
          })
            .then((r) => r.json())
            .then((diff: SyncDiff) => {
              setSyncDiff(diff);
              setSelectedNewTasks(new Set(diff.newTasks.map((t) => t.slug)));
            });
        }
      })
      .finally(() => setLoading(false));
  }, [open]);

  async function handleGenerate() {
    if (!preview) return;
    setApplying(true);
    try {
      await fetch("/api/goals/generate-42", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDate: preview.targetDate }),
      });
      onDone();
    } catch {
      alert("Failed to generate goals.");
    } finally {
      setApplying(false);
    }
  }

  async function handleSync() {
    if (!preview?.existingEpicId || !syncDiff) return;
    setApplying(true);
    try {
      await fetch("/api/goals/sync-42", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          epicId: preview.existingEpicId,
          applyAutoComplete: syncDiff.autoCompleted.length > 0,
          newTaskSlugs: Array.from(selectedNewTasks),
          applyDeadlineShifts: applyDeadlines && syncDiff.deadlineShifts.length > 0,
        }),
      });
      onDone();
    } catch {
      alert("Failed to sync.");
    } finally {
      setApplying(false);
    }
  }

  const isSync = preview?.existingEpicId != null;
  const totalChanges = syncDiff
    ? syncDiff.autoCompleted.length + selectedNewTasks.size + (applyDeadlines ? syncDiff.deadlineShifts.length : 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L4 6.5V13C4 19.5 8.2 25.4 14 27C19.8 25.4 24 19.5 24 13V6.5L14 2Z"
                fill="oklch(0.82 0.055 80)" stroke="oklch(0.82 0.055 80)" strokeWidth="0.5" />
              <path d="M10 12L13 14.5L10 17" stroke="#1a1916" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" />
              <line x1="14.5" y1="17" x2="18" y2="17" stroke="#1a1916" strokeWidth="1.6"
                strokeLinecap="round" />
            </svg>
            {isSync ? "Sync with 42 plan" : "Generate from 42 plan"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-[12px] text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
            Loading 42 plan data...
          </div>
        ) : !preview ? (
          <p className="text-[12px] text-muted-foreground py-4">Failed to load data.</p>
        ) : !isSync ? (
          /* GENERATE VIEW */
          <div className="space-y-3">
            <p className="text-[12px] text-muted-foreground">
              Creates an Epic with one Issue per remaining circle and Tasks for each project,
              using deadlines from your backward planner.
            </p>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[12px] font-semibold">
                <Badge variant="outline" className="text-[8px] px-1 py-0"
                  style={{ borderColor: "oklch(0.82 0.055 80)", color: "oklch(0.82 0.055 80)" }}>
                  EPIC
                </Badge>
                Complete 42 Common-Core
                {preview.targetDate && (
                  <span className="text-muted-foreground font-normal">(by {preview.targetDate.slice(0, 7)})</span>
                )}
              </div>

              {preview.circles.map((c) => (
                <div
                  key={c.circle}
                  className={`flex items-center gap-2 text-[11px] pl-4 py-0.5 ${c.isComplete ? "opacity-40" : ""}`}
                >
                  {c.isComplete ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Checkbox checked disabled className="h-3 w-3" />
                  )}
                  <span>Circle {c.circle}</span>
                  {c.deadline && (
                    <span className="text-muted-foreground">
                      by {c.deadline.slice(0, 7).replace("-", " '")}
                    </span>
                  )}
                  <span className="text-muted-foreground">· {c.totalTasks} tasks</span>
                  {c.isComplete && <span className="text-green-500 text-[10px]">completed</span>}
                </div>
              ))}

              <p className="text-[10px] text-muted-foreground pt-1 pl-4">
                {preview.totalTasks} tasks total ({preview.preCompleted} pre-completed) · Auto-track: ft:projects_validated
              </p>
            </div>

            {!preview.targetDate && (
              <p className="text-[11px] text-red-400">
                No backward planner deadline set. Go to Settings to set a target date first.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={applying || !preview.targetDate}
              >
                {applying ? "Generating..." : `Generate (1 epic + ${preview.circles.length} issues + ${preview.totalTasks} tasks)`}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* SYNC VIEW */
          <div className="space-y-3">
            {syncDiff && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-sm border border-green-500/20 p-2 text-center">
                    <span className="text-[18px] font-bold text-green-400">{syncDiff.autoCompleted.length}</span>
                    <p className="text-[10px] text-muted-foreground">Auto-completed</p>
                  </div>
                  <div className="rounded-sm border border-border p-2 text-center"
                    style={{ borderColor: "oklch(0.82 0.055 80 / 0.3)" }}>
                    <span className="text-[18px] font-bold" style={{ color: "oklch(0.82 0.055 80)" }}>
                      {syncDiff.newTasks.length}
                    </span>
                    <p className="text-[10px] text-muted-foreground">New tasks</p>
                  </div>
                  <div className="rounded-sm border border-amber-500/20 p-2 text-center">
                    <span className="text-[18px] font-bold text-amber-400">{syncDiff.deadlineShifts.length}</span>
                    <p className="text-[10px] text-muted-foreground">Deadline shifts</p>
                  </div>
                </div>

                {syncDiff.autoCompleted.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Auto-completed from sync
                    </p>
                    {syncDiff.autoCompleted.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-[11px] py-0.5">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>{t.title}</span>
                        <span className="text-[9px] font-mono text-muted-foreground">{t.ftSlug}</span>
                      </div>
                    ))}
                  </div>
                )}

                {syncDiff.newTasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Newly available
                    </p>
                    {syncDiff.newTasks.map((t) => (
                      <label key={t.slug} className="flex items-center gap-2 text-[11px] py-0.5 cursor-pointer">
                        <Checkbox
                          checked={selectedNewTasks.has(t.slug)}
                          onCheckedChange={(checked) => {
                            const next = new Set(selectedNewTasks);
                            checked ? next.add(t.slug) : next.delete(t.slug);
                            setSelectedNewTasks(next);
                          }}
                          className="h-3 w-3"
                        />
                        <span>{t.name}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0">C{t.circle}</Badge>
                      </label>
                    ))}
                  </div>
                )}

                {syncDiff.deadlineShifts.length > 0 && (
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 cursor-pointer">
                      <Checkbox
                        checked={applyDeadlines}
                        onCheckedChange={(v) => setApplyDeadlines(!!v)}
                        className="h-3 w-3"
                      />
                      Deadline changes
                    </label>
                    {syncDiff.deadlineShifts.map((s) => (
                      <div key={s.issueId} className="flex items-center gap-2 text-[11px] py-0.5 pl-5">
                        <span>Circle {s.circle}:</span>
                        <span className="text-muted-foreground">{s.oldDate.slice(0, 7)}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-amber-400">{s.newDate.slice(0, 7)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {totalChanges === 0 && (
                  <p className="text-[12px] text-muted-foreground py-2">
                    Everything is in sync. No changes needed.
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleSync}
                    disabled={applying || totalChanges === 0}
                  >
                    {applying ? "Applying..." : `Apply changes (${totalChanges} updates)`}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                    Skip
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
