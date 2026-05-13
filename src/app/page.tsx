import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import {
  Sparkles,
  Brain,
  ShieldCheck,
  Activity,
  ArrowRight,
  Code2,
  CircleDot,
  Quote,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";

interface EvalSnapshot {
  generatedAt: string;
  mode: string;
  dataset: { count: number; metrics: { name: string; description: string }[] };
  aggregate: Record<string, number>;
  metricStatus: Record<
    string,
    { status: "pass" | "fail"; valueStr: string; targetStr: string }
  >;
}

function loadEvalSnapshot(): EvalSnapshot | null {
  try {
    const file = path.resolve(process.cwd(), "evals/results.json");
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export default function Home() {
  const evals = loadEvalSnapshot();
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      {/* nav */}
      <header className="border-b border-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Support Copilot
          </Link>
          <div className="flex items-center gap-1 text-sm">
            <a
              href="https://github.com/amihailow/support-copilot"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            >
              <Code2 className="h-4 w-4" />
              GitHub
            </a>
            <Link
              href="/dashboard"
              className="ml-2 rounded-md bg-emerald-500 px-4 py-1.5 font-medium text-slate-950 hover:bg-emerald-400"
            >
              Open demo
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="border-b border-slate-900/80 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1 text-xs text-slate-400">
            <CircleDot className="h-3 w-3 text-emerald-400" />
            Production-grade RAG, not just a chatbot wrapper
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            AI assistant for human support agents -
            <br />
            <span className="text-slate-400">
              not another bot replying to your customers
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Classifies the ticket, retrieves grounded answers from your
            knowledge base, and drafts 3 reply options with source citations.
            The agent stays in control.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-5 py-2.5 font-medium text-slate-950 hover:bg-emerald-400"
            >
              Try the live demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com/amihailow/support-copilot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/50 px-5 py-2.5 font-medium text-slate-100 hover:bg-slate-900"
            >
              <Code2 className="h-4 w-4" />
              View source
            </a>
          </div>
        </div>

        {/* preview */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-slate-800 bg-slate-900/80 px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
              <div className="ml-3 text-xs text-slate-500">
                support-copilot/dashboard
              </div>
            </div>
            <div className="grid gap-0 md:grid-cols-[280px_1fr]">
              <div className="border-r border-slate-800 bg-slate-950 p-4 text-sm">
                <div className="mb-2 font-medium text-slate-300">Inbox</div>
                {[
                  ["Sarah Chen", "Refund for plan...", "refund"],
                  ["Marcus Patel", "Production API 429s", "urgent"],
                  ["Linda Okafor", "Locked out - 2FA", "high"],
                  ["James O'Reilly", "GDPR Article 17...", "account"],
                ].map(([name, subj, tag]) => (
                  <div
                    key={name}
                    className="mb-1 rounded px-2 py-1.5 hover:bg-slate-900"
                  >
                    <div className="truncate text-slate-200">{name}</div>
                    <div className="truncate text-xs text-slate-500">
                      {subj}
                    </div>
                    <span className="mt-1 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                      {tag}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-5">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Draft 1 · concise · 92% confidence
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">
                  Hi Sarah - good news, you&apos;re well within the 14-day
                  refund window{" "}
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-300 ring-1 ring-emerald-500/30">
                    [doc-1]
                  </span>
                  . I&apos;ll process the refund on order N-49213 today. You
                  should see the money back on the original card within 5-10
                  business days{" "}
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-300 ring-1 ring-emerald-500/30">
                    [doc-2]
                  </span>
                  . Anything else I can sort out before you go?
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <span>1.84s</span>
                  <span className="text-slate-700">·</span>
                  <span>$0.0084</span>
                  <span className="text-slate-700">·</span>
                  <span className="font-mono">claude-sonnet-4-5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="border-b border-slate-900/80 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-semibold">
            What separates this from another GPT wrapper
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={Brain}
              title="Hybrid retrieval"
              body="BM25 + dense vectors fused via Reciprocal Rank Fusion, then re-ranked by Cohere rerank-3.5. Naive vector search alone misses 30%+ of relevant chunks."
            />
            <Feature
              icon={ShieldCheck}
              title="Grounded by design"
              body="Every draft cites the exact KB chunks it used. If context doesn't cover the question, the draft says so and recommends escalation."
            />
            <Feature
              icon={Activity}
              title="Evals before vibes"
              body="100+ real ticket-response pairs gate every prompt change. Faithfulness (LLM-judge), citation recall, p95 latency, cost per ticket - all tracked."
            />
            <Feature
              icon={Sparkles}
              title="Multi-tone drafts"
              body="3 drafts per ticket: concise, empathetic, escalation. The agent picks the right register for the customer."
            />
            <Feature
              icon={Quote}
              title="Feedback loop"
              body="Agent actions (sent / edited / rejected) are logged with the original draft. The diff becomes training data for the next prompt iteration."
            />
            <Feature
              icon={CircleDot}
              title="Observability included"
              body="Every classification, retrieval, rerank and generation step is traced in Langfuse. Debug a bad response by clicking one link."
            />
          </div>
        </div>
      </section>

      {/* evals */}
      <section className="border-b border-slate-900/80 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex items-center gap-2 text-sm text-emerald-400">
            <ClipboardCheck className="h-4 w-4" />
            <span className="font-medium uppercase tracking-wider">
              Live eval suite
            </span>
          </div>
          <h2 className="mb-3 text-3xl font-semibold">
            Every prompt change must pass these checks
          </h2>
          <p className="mb-10 max-w-3xl text-slate-400">
            8 hand-curated tickets covering refunds inside/outside the window,
            urgent technical issues, escalation cases, billing disputes, and
            feature requests without KB coverage. Run locally with{" "}
            <span className="font-mono text-slate-300">npm run eval</span>.
            Wired into CI as a blocking step.
          </p>

          {evals ? (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {evals.dataset.metrics.map((m) => {
                  const s = evals.metricStatus[m.name];
                  if (!s) return null;
                  const pass = s.status === "pass";
                  return (
                    <div
                      key={m.name}
                      className={`rounded-lg border p-4 ${
                        pass
                          ? "border-emerald-900/60 bg-emerald-500/5"
                          : "border-amber-900/60 bg-amber-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs text-slate-400">{m.name}</div>
                        {pass && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        )}
                      </div>
                      <div className="mt-2 font-mono text-xl font-semibold text-slate-100">
                        {s.valueStr}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        target {s.targetStr}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="text-slate-500">
                  Last run:{" "}
                  <span className="text-slate-300">
                    {new Date(evals.generatedAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  {" · "}
                  <span className="font-mono text-slate-400">
                    {evals.mode}
                  </span>{" "}
                  mode {" · "}
                  <span className="text-slate-300">
                    {evals.dataset.count} cases
                  </span>
                </div>
                <Link
                  href="/evals"
                  className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200"
                >
                  Full eval breakdown
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
              Run <span className="font-mono text-slate-300">npm run eval</span>{" "}
              to generate{" "}
              <span className="font-mono text-slate-300">evals/results.json</span>{" "}
              and populate this section.
            </div>
          )}
        </div>
      </section>

      {/* footer */}
      <footer className="px-6 py-10">
        <div className="mx-auto max-w-5xl text-sm text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              Built by{" "}
              <a
                href="https://github.com/amihailow"
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-emerald-300"
              >
                @amihailow
              </a>
              {" · "}
              MIT licensed
            </div>
            <div className="flex items-center gap-3">
              <span>
                Stack: Next.js · Claude · OpenAI · Cohere · Supabase ·
                Langfuse
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Brain;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-colors hover:border-slate-700 hover:bg-slate-900/60">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/20">
        <Icon className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="mb-1.5 font-medium text-slate-100">{title}</div>
      <p className="text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}

