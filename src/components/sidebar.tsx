import Link from "next/link";
import {
  Inbox,
  BarChart3,
  BookOpen,
  Settings,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Inbox", icon: Inbox, badge: 8 },
  { href: "/evals", label: "Evals", icon: ClipboardCheck },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/knowledge", label: "Knowledge base", icon: BookOpen },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-800 bg-slate-950/70 lg:flex lg:flex-col">
      <Link
        href="/"
        className="flex items-center gap-2 border-b border-slate-800 px-5 py-4"
      >
        <Sparkles className="h-5 w-5 text-emerald-400" />
        <span className="font-semibold text-slate-100">Support Copilot</span>
      </Link>

      <nav className="flex-1 px-3 py-4">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 hover:text-slate-100"
          >
            <span className="flex items-center gap-2.5">
              <item.icon className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />
              {item.label}
            </span>
            {item.badge ? (
              <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400 group-hover:bg-slate-700">
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
            AM
          </div>
          <div className="leading-tight">
            <div className="text-sm text-slate-200">Alex M.</div>
            <div className="text-xs text-slate-500">Support agent</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
