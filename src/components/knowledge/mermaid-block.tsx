"use client";

import { useEffect, useRef, useState } from "react";

let mermaidInit: Promise<typeof import("mermaid").default> | null = null;

/** Mermaid is ~1MB, so it loads once, lazily, and only for pages that hit a
 *  diagram — never as part of the app bundle. */
function loadMermaid() {
  if (!mermaidInit) {
    mermaidInit = import("mermaid").then((mod) => {
      const mermaid = mod.default;
      const css = getComputedStyle(document.documentElement);
      const token = (name: string, fallback: string) =>
        css.getPropertyValue(name).trim() || fallback;

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        fontFamily: token("--font-cb-sans", "Archivo, sans-serif"),
        theme: "base",
        themeVariables: {
          background: token("--cb-card", "#1d1c19"),
          primaryColor: token("--cb-raised", "#242320"),
          primaryTextColor: token("--cb-text", "#f7f3ea"),
          primaryBorderColor: token("--cb-line", "#35342f"),
          lineColor: token("--cb-text-muted", "#98968d"),
          secondaryColor: token("--cb-raised-hover", "#2f2e29"),
          tertiaryColor: token("--cb-card", "#1d1c19"),
          mainBkg: token("--cb-raised", "#242320"),
          nodeBorder: token("--cb-or", "#d7c19c"),
          textColor: token("--cb-text", "#f7f3ea"),
        },
      });
      return mermaid;
    });
  }
  return mermaidInit;
}

let seq = 0;

export function MermaidBlock({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `cb-mermaid-${(seq += 1)}`;

    loadMermaid()
      .then((mermaid) => mermaid.render(id, chart))
      .then(({ svg }) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        // A malformed diagram must not take the article down with it — the
        // prose around it is still worth reading.
        setError(e instanceof Error ? e.message : "Diagram failed to render");
      });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <figure className="my-4 rounded-cb-card border border-cb-line bg-cb-raised p-3">
        <figcaption className="cb-label-mono text-cb-caption text-cb-muted">
          Diagram could not be rendered
        </figcaption>
        <pre className="mt-2 overflow-x-auto text-cb-foot text-cb-second">{chart}</pre>
      </figure>
    );
  }

  return (
    <div
      ref={ref}
      className="my-4 flex justify-center overflow-x-auto rounded-cb-card border border-cb-line bg-cb-card p-3"
    />
  );
}
