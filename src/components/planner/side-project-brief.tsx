"use client";

import { useState } from "react";
import { RefreshCw, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SideProject = {
  title: string;
  description: string;
  skills?: string[];
  prerequisites?: { label: string; status: string }[];
  steps?: { title: string; description: string; estimatedHours: number }[];
  bonus_extensions?: string[];
  capstone_connection?: string;
};

type AcceptedState = {
  title: string;
  goalId: number;
  status: "accepted" | "done" | "aborted";
} | null;

export function SideProjectBrief({
  project,
  weekLabel,
  onRefresh,
  acceptedState,
  onAccept,
  onDone,
  onAbort,
}: {
  project: SideProject;
  weekLabel?: string;
  onRefresh?: () => void;
  acceptedState?: AcceptedState;
  onAccept?: () => void;
  onDone?: () => void;
  onAbort?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmAbort, setConfirmAbort] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const totalHours = project.steps?.reduce((s, step) => s + step.estimatedHours, 0) ?? 0;
  const stepCount = project.steps?.length ?? 0;
  const isAccepted = acceptedState?.status === "accepted";

  return (
    <div
      className="rounded-sm border border-border overflow-hidden"
      style={{ borderLeft: `3px solid ${isAccepted ? "var(--status-done)" : "var(--primary)"}` }}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {weekLabel && (
              <p className="text-[14px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Side project {weekLabel}
              </p>
            )}
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold">{project.title}</h3>
              {isAccepted && (
                <Badge className="text-[11px] px-1.5 py-0 font-bold uppercase" style={{ background: "color-mix(in oklch, var(--status-done) 15%, transparent)", color: "var(--status-done)", border: "1px solid color-mix(in oklch, var(--status-done) 30%, transparent)" }}>
                  Accepted
                </Badge>
              )}
            </div>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              {stepCount} steps · ~{totalHours}h
              {project.capstone_connection && ` · feeds into ${project.capstone_connection.split(" ").slice(0, 4).join(" ")}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isAccepted && onRefresh && (
              <button
                onClick={async () => {
                  setRefreshing(true);
                  try { await onRefresh(); } finally { setRefreshing(false); }
                }}
                disabled={refreshing}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Suggest a different project"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[15px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? "Collapse" : "Expand"} {expanded ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {!expanded && project.skills && project.skills.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {project.skills.map((skill) => (
              <span
                key={skill}
                className="text-[14px] font-medium px-2 py-0.5 rounded-sm border border-border"
                style={{ color: "var(--primary)" }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          {!isAccepted && onAccept && (
            <>
              <Button
                size="sm"
                onClick={async () => {
                  setAccepting(true);
                  try { await onAccept(); } finally { setAccepting(false); }
                }}
                disabled={accepting}
                className="text-[13px]"
              >
                <Check className="h-3 w-3 mr-1" />
                {accepting ? "Accepting..." : "Accept"}
              </Button>
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    setRefreshing(true);
                    try { await onRefresh(); } finally { setRefreshing(false); }
                  }}
                  disabled={refreshing}
                  className="text-[13px]"
                >
                  <X className="h-3 w-3 mr-1" />
                  Decline
                </Button>
              )}
            </>
          )}
          {isAccepted && (
            <>
              {onDone && (
                <Button
                  size="sm"
                  onClick={onDone}
                  className="text-[13px]"
                  style={{ background: "var(--status-done)" }}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Done
                </Button>
              )}
              {onAbort && !confirmAbort && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmAbort(true)}
                  className="text-[13px] text-red-400 hover:text-red-300"
                >
                  Abort side project
                </Button>
              )}
              {onAbort && confirmAbort && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-red-400">Are you sure?</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setConfirmAbort(false); onAbort(); }}
                    className="text-[13px] text-red-400 border-red-500/30 hover:bg-red-500/10"
                  >
                    Yes, abort
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmAbort(false)}
                    className="text-[13px]"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 space-y-3 border-t border-border pt-3">
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {project.description}
          </p>

          {project.prerequisites && project.prerequisites.length > 0 && (
            <div className="rounded-sm px-4 py-3" style={{ background: "var(--muted)" }}>
              <p className="text-[15px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Prerequisites
              </p>
              <div className="space-y-1">
                {project.prerequisites.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-[14px]">
                    <span>
                      {p.status === "done" ? (
                        <span className="text-success">{"✓"}</span>
                      ) : p.status === "partial" ? (
                        <span className="text-warning">~</span>
                      ) : (
                        <span className="text-danger">{"✗"}</span>
                      )}
                    </span>
                    <span className="text-muted-foreground">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.steps && project.steps.length > 0 && (
            <div className="space-y-1.5">
              {project.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-2.5 rounded-sm border border-border"
                >
                  <span className="text-[14px] font-bold text-muted-foreground mt-0.5 shrink-0">
                    {i + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[15px] font-medium">{step.title}</span>
                    <p className="text-[14px] text-muted-foreground">{step.description}</p>
                  </div>
                  <span className="text-[15px] text-muted-foreground shrink-0">~{step.estimatedHours}h</span>
                </div>
              ))}
            </div>
          )}

          {project.capstone_connection && (
            <div
              className="rounded-sm px-4 py-3 text-[14px] text-muted-foreground leading-relaxed"
              style={{ background: "color-mix(in oklch, var(--primary) 6%, transparent)" }}
            >
              <span className="font-semibold text-primary">Capstone:</span> {project.capstone_connection}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
