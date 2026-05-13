import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Sparkles, Brain, Search } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Avatar } from "@/components/ui/avatar";
import {
  Badge,
  categoryVariant,
  priorityVariant,
  sentimentVariant,
} from "@/components/ui/badge";
import { SuggestionCard } from "@/components/suggestion-card";
import { PipelineRunner } from "@/components/pipeline-runner";
import { getMockTicket } from "@/lib/mock";
import { timeAgo } from "@/lib/utils";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = getMockTicket(id);
  if (!ticket) notFound();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <main className="flex-1">
        <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-3 backdrop-blur">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to inbox
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr]">
          {/* LEFT: ticket */}
          <section className="border-b border-slate-800 px-6 py-6 lg:border-b-0 lg:border-r">
            <div className="flex items-start gap-3">
              <Avatar name={ticket.customerName} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold text-slate-100">
                  {ticket.customerName}
                </div>
                <div className="text-sm text-slate-400">{ticket.customerEmail}</div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>#{ticket.id}</div>
                <div>{timeAgo(ticket.createdAt)}</div>
              </div>
            </div>

            <h2 className="mt-6 text-lg font-medium text-slate-100">
              {ticket.subject}
            </h2>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant={categoryVariant(ticket.category)}>
                {ticket.category?.replace("_", " ")}
              </Badge>
              <Badge variant={priorityVariant(ticket.priority)}>
                {ticket.priority}
              </Badge>
              <Badge variant={sentimentVariant(ticket.sentiment)}>
                {ticket.sentiment}
              </Badge>
            </div>

            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm leading-relaxed text-slate-200">
              {ticket.body}
            </div>

            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                <Brain className="h-4 w-4 text-violet-400" />
                Triage reasoning
              </div>
              <p className="text-sm text-slate-400">
                {ticket.classification.reasoning}
              </p>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                <Search className="h-4 w-4 text-sky-400" />
                Retrieved context
                <span className="text-xs font-normal text-slate-500">
                  ({ticket.retrievedChunks.length} chunks
                  {ticket.retrievedChunks.length > 0
                    ? ` from ${new Set(ticket.retrievedChunks.map((r) => r.chunk.documentTitle)).size} document(s)`
                    : ""}
                  )
                </span>
              </div>
              {ticket.retrievedChunks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/20 p-4 text-sm text-slate-500">
                  No relevant KB chunks found. Drafts will be marked low
                  confidence and may suggest escalation.
                </div>
              ) : (
                <ul className="space-y-2">
                  {ticket.retrievedChunks.map((r, idx) => (
                    <li
                      key={r.chunk.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <FileText className="h-3.5 w-3.5 text-slate-500" />
                          <span className="font-medium">
                            [doc-{idx + 1}]
                          </span>
                          <span className="text-slate-400">
                            {r.chunk.documentTitle}
                          </span>
                        </div>
                        <span className="text-xs tabular-nums text-emerald-400">
                          {r.score.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-400">
                        {r.chunk.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* RIGHT: suggestions */}
          <section className="px-6 py-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-200">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Suggested drafts
              <span className="text-xs font-normal text-slate-500">
                grounded in retrieved KB chunks
              </span>
            </div>

            <div className="space-y-3">
              {ticket.suggestions.map((s, i) => (
                <SuggestionCard key={s.id} suggestion={s} index={i} />
              ))}
            </div>

            <div className="mt-6">
              <PipelineRunner
                ticketId={ticket.id}
                subject={ticket.subject}
                body={ticket.body}
              />
            </div>

            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/20 p-4 text-xs text-slate-500">
              <span className="font-medium text-slate-400">Tip:</span> citations
              like{" "}
              <span className="inline-flex items-center rounded bg-emerald-500/10 px-1 py-0.5 font-mono text-[10px] text-emerald-300 ring-1 ring-emerald-500/30">
                [doc-1]
              </span>{" "}
              link to the exact chunk used. Hover to preview the source.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
