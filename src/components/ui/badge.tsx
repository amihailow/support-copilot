import { cn } from "@/lib/utils";

type Variant =
  | "neutral"
  | "slate"
  | "sky"
  | "amber"
  | "rose"
  | "emerald"
  | "orange"
  | "violet";

const variants: Record<Variant, string> = {
  neutral: "bg-slate-800/60 text-slate-300 ring-slate-700/60",
  slate: "bg-slate-800/60 text-slate-200 ring-slate-700/60",
  sky: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
  amber: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  rose: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
  emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  orange: "bg-orange-500/10 text-orange-300 ring-orange-500/30",
  violet: "bg-violet-500/10 text-violet-300 ring-violet-500/30",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function priorityVariant(p: string | null): Variant {
  switch (p) {
    case "urgent":
      return "rose";
    case "high":
      return "amber";
    case "medium":
      return "sky";
    default:
      return "slate";
  }
}

export function sentimentVariant(s: string | null): Variant {
  switch (s) {
    case "positive":
      return "emerald";
    case "frustrated":
      return "rose";
    case "negative":
      return "orange";
    default:
      return "slate";
  }
}

export function categoryVariant(c: string | null): Variant {
  switch (c) {
    case "billing":
    case "refund":
      return "violet";
    case "technical":
      return "sky";
    case "account":
      return "slate";
    case "feature_request":
      return "emerald";
    default:
      return "neutral";
  }
}
