import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
  "bg-sky-500/20 text-sky-300 ring-sky-500/30",
  "bg-violet-500/20 text-violet-300 ring-violet-500/30",
  "bg-rose-500/20 text-rose-300 ring-rose-500/30",
  "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  "bg-cyan-500/20 text-cyan-300 ring-cyan-500/30",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const color = PALETTE[hashString(name) % PALETTE.length];
  const sizeClass =
    size === "sm"
      ? "h-7 w-7 text-xs"
      : size === "lg"
        ? "h-12 w-12 text-base"
        : "h-9 w-9 text-sm";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-medium ring-1 ring-inset",
        sizeClass,
        color,
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
