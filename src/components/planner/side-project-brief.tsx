"use client";

import { useState } from "react";

type SideProject = {
  title: string;
  description: string;
  skills?: string[];
  prerequisites?: { label: string; status: string }[];
  steps?: { title: string; description: string; estimatedHours: number }[];
  bonus_extensions?: string[];
  capstone_connection?: string;
};

export function SideProjectBrief({ project, weekLabel }: { project: SideProject; weekLabel?: string }) {
  const [expanded, setExpanded] = useState(false);
  const totalHours = project.steps?.reduce((s, step) => s + step.estimatedHours, 0) ?? 0;
  const stepCount = project.steps?.length ?? 0;

  return (
    <div
      className="rounded-sm border border-border overflow-hidden"
      style={{ borderLeft: "3px solid var(--primary)" }}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {weekLabel && (
              <p className="text-[14px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Side project {weekLabel}
              </p>
            )}
            <h3 className="text-[14px] font-semibold">{project.title}</h3>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              {stepCount} steps · ~{totalHours}h
              {project.capstone_connection && ` · feeds into ${project.capstone_connection.split(" ").slice(0, 4).join(" ")}`}
            </p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[15px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {expanded ? "Collapse" : "Expand"} {expanded ? "↑" : "↓"}
          </button>
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
