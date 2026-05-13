import { Search, Filter, Inbox } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { TicketRow } from "@/components/ticket-row";
import { Badge } from "@/components/ui/badge";
import { getMockTickets } from "@/lib/mock";

export default function Dashboard() {
  const tickets = getMockTickets();
  const open = tickets.filter((t) => t.status === "open");
  const urgent = open.filter((t) => t.priority === "urgent");
  const high = open.filter((t) => t.priority === "high");

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <main className="flex-1">
        <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                <Inbox className="h-5 w-5 text-slate-400" />
                Inbox
              </h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
                <span>{open.length} open</span>
                {urgent.length > 0 ? (
                  <>
                    <span className="text-slate-700">·</span>
                    <Badge variant="rose">{urgent.length} urgent</Badge>
                  </>
                ) : null}
                {high.length > 0 ? (
                  <>
                    <span className="text-slate-700">·</span>
                    <Badge variant="amber">{high.length} high</Badge>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  className="w-64 rounded-md border border-slate-800 bg-slate-900 py-1.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>
              <button className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>
        </header>

        <div className="border-b border-slate-800 bg-slate-950 px-6">
          <nav className="flex gap-6 text-sm">
            <Tab label="All" count={tickets.length} active />
            <Tab label="Open" count={open.length} />
            <Tab label="In progress" count={tickets.filter((t) => t.status === "in_progress").length} />
            <Tab label="Resolved" count={tickets.filter((t) => t.status === "resolved").length} />
            <Tab label="Escalated" count={tickets.filter((t) => t.status === "escalated").length} />
          </nav>
        </div>

        <div>
          {tickets.map((t) => (
            <TicketRow key={t.id} ticket={t} />
          ))}
        </div>
      </main>
    </div>
  );
}

function Tab({
  label,
  count,
  active,
}: {
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <button
      className={`relative py-3 text-sm transition-colors ${
        active
          ? "text-slate-100"
          : "text-slate-500 hover:text-slate-300"
      }`}
    >
      <span>{label}</span>
      <span className="ml-1.5 text-xs text-slate-500">{count}</span>
      {active ? (
        <span className="absolute inset-x-0 -bottom-px h-0.5 bg-emerald-500" />
      ) : null}
    </button>
  );
}
