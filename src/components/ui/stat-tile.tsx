import { cn } from "@/lib/utils";

export function StatTile({
  value,
  sub,
  label,
  className,
}: {
  value: string;
  sub?: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-cb-card border border-cb-line bg-cb-raised px-3 py-3", className)}>
      <div className="flex items-baseline gap-1">
        <span className="font-cb-serif text-cb-title leading-none text-cb-text">
          {value}
        </span>
        {sub && (
          <span className="font-cb-mono text-cb-foot tabular-nums text-cb-muted">
            {sub}
          </span>
        )}
      </div>
      <p className="mt-1.5 cb-label-mono text-cb-caption text-cb-muted">{label}</p>
    </div>
  );
}
