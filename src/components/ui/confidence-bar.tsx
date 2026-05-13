import { cn } from "@/lib/utils";

export function ConfidenceBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.round(value * 100);

  let color = "bg-rose-500";
  if (pct >= 80) color = "bg-emerald-500";
  else if (pct >= 65) color = "bg-amber-500";
  else if (pct >= 50) color = "bg-orange-500";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-slate-400">{pct}%</span>
    </div>
  );
}
