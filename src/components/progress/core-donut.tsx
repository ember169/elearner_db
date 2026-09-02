import { cn } from "@/lib/utils";

export type CircleSlice = {
  circle: number;
  done: number;
  total: number;
  state: "done" | "current" | "locked";
};

export function CoreDonut({
  circles,
  coreDone,
  coreTotal,
  level,
}: {
  circles: CircleSlice[];
  coreDone: number;
  coreTotal: number;
  level: number | null;
}) {
  const grand = coreTotal || 1;
  const gap = 1.4;
  const offsets = circles.reduce<number[]>((acc, c, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + (circles[i - 1].total / grand) * 100);
    return acc;
  }, []);
  const segs = circles.map((c, i) => {
    const segLen = (c.total / grand) * 100;
    const doneLen = Math.min(segLen - gap, (c.done / grand) * 100);
    return {
      circle: c.circle,
      offset: offsets[i],
      trackLen: Math.max(0, segLen - gap),
      doneLen: Math.max(0, doneLen),
      trackColor:
        c.state === "current"
          ? "color-mix(in oklch, var(--cb-or) 34%, var(--cb-raised))"
          : "var(--cb-raised)",
      color:
        c.state === "done"
          ? "var(--cb-success)"
          : c.done > 0
            ? "var(--cb-or)"
            : "var(--cb-line)",
    };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[172px] w-[172px]">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          {segs.map((s) => (
            <circle
              key={`t${s.circle}`}
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={s.trackColor}
              strokeWidth="11"
              pathLength={100}
              strokeDasharray={`${s.trackLen} ${100 - s.trackLen}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
            />
          ))}
          {segs.map((s) =>
            s.doneLen > 0 ? (
              <circle
                key={`d${s.circle}`}
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={s.color}
                strokeWidth="11"
                pathLength={100}
                strokeDasharray={`${s.doneLen} ${100 - s.doneLen}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="round"
              />
            ) : null,
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="cb-label-mono text-[9px] text-cb-muted">42 level</span>
          <span className="font-cb-serif text-[38px] leading-none text-cb-text">
            {level != null ? level.toFixed(2) : "—"}
          </span>
          <span className="mt-1 font-cb-mono text-[11px] tabular-nums text-cb-second">
            {coreDone}/{coreTotal} core
          </span>
        </div>
      </div>
    </div>
  );
}

export function CircleBars({ circles }: { circles: CircleSlice[] }) {
  return (
    <div className="space-y-2.5">
      {circles.map((c) => {
        const pct = c.total > 0 ? (c.done / c.total) * 100 : 0;
        const barColor =
          c.state === "done"
            ? "bg-cb-success"
            : c.state === "current"
              ? "bg-cb-or"
              : "bg-cb-line";
        const barWidth =
          c.state === "current" ? Math.max(pct, 8) : c.done > 0 ? pct : 0;
        return (
          <div key={c.circle} className="flex items-center gap-3">
            <span className="w-6 shrink-0 font-cb-mono text-[11px] text-cb-muted">
              C{c.circle}
            </span>
            <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-cb-raised">
              <div
                className={cn("h-full rounded-full", barColor)}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right font-cb-mono text-[11px] tabular-nums text-cb-second">
              {c.done}/{c.total}
            </span>
          </div>
        );
      })}
    </div>
  );
}
