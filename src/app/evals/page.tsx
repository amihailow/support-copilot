import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";

interface MetricStatusEntry {
  status: "pass" | "fail";
  valueStr: string;
  targetStr: string;
}

interface CaseResult {
  id: string;
  category_correct: boolean;
  priority_correct: boolean;
  citation_recall: boolean;
  required_phrase_hit: boolean;
  prohibited_phrase_hits: number;
  faithfulness_proxy: number;
  latency_ms: number;
  cost_usd: number;
  pass: boolean;
  notes: string[];
}

interface MetricDef {
  name: string;
  description: string;
}

interface EvalSnapshot {
  generatedAt: string;
  mode: string;
  dataset: {
    count: number;
    metrics: MetricDef[];
  };
  aggregate: Record<string, number>;
  cases: CaseResult[];
  metricStatus: Record<string, MetricStatusEntry>;
}

function loadSnapshot(): EvalSnapshot | null {
  try {
    const file = path.resolve(process.cwd(), "evals/results.json");
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export default function EvalsPage() {
  const snap = loadSnapshot();

  if (!snap) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 p-10">
          <h1 className="text-2xl font-semibold text-slate-100">
            No eval results yet
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Run <code className="rounded bg-slate-800 px-1.5 py-0.5">npm run eval</code> to generate
            <code className="ml-1 rounded bg-slate-800 px-1.5 py-0.5">evals/results.json</code>.
          </p>
        </main>
      </div>
    );
  }

  const totalCases = snap.cases.length;
  const passedCases = snap.cases.filter((c) => c.pass).length;
  const failedMetrics = Object.values(snap.metricStatus).filter(
    (s) => s.status === "fail",
  ).length;

  const generated = new Date(snap.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-8 py-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to inbox
            </Link>
            <div className="mt-3 flex items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Eval suite
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold text-slate-100">
                  Quality gates for the AI pipeline
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-400">
                  Every prompt or model change must pass these checks before
                  it ships. Run locally with{" "}
                  <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                    npm run eval
                  </code>
                  . Wired into CI as a blocking step.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-6 text-right text-xs text-slate-500">
                <div>
                  <div className="font-mono text-slate-300">
                    {snap.mode}
                  </div>
                  <div>mode</div>
                </div>
                <div>
                  <div className="font-mono text-slate-300">
                    {passedCases}/{totalCases}
                  </div>
                  <div>cases passed</div>
                </div>
                <div>
                  <div
                    className={
                      failedMetrics === 0
                        ? "font-mono text-emerald-300"
                        : "font-mono text-amber-300"
                    }
                  >
                    {failedMetrics === 0 ? "all pass" : `${failedMetrics} fail`}
                  </div>
                  <div>metric targets</div>
                </div>
                <div>
                  <div className="font-mono text-slate-300">{generated}</div>
                  <div>last run</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl space-y-10 px-8 py-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Aggregate metrics
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Targets set in <code>evals/dataset.yaml</code>. Eval run fails if
              any target is missed.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {snap.dataset.metrics.map((m) => {
                const status = snap.metricStatus[m.name];
                if (!status) return null;
                const isPass = status.status === "pass";
                return (
                  <div
                    key={m.name}
                    className={`rounded-lg border bg-slate-900/40 p-4 ${
                      isPass
                        ? "border-emerald-900/60"
                        : "border-amber-900/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-medium text-slate-300">
                        {m.name}
                      </div>
                      {isPass ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-amber-400" />
                      )}
                    </div>
                    <div className="mt-3 font-mono text-2xl font-semibold text-slate-100">
                      {status.valueStr}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      target {status.targetStr}
                    </div>
                    <div className="mt-3 text-xs leading-relaxed text-slate-500">
                      {m.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Case-by-case
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Each row runs the full classify → retrieve → rerank → generate
              pipeline and checks the output against expected fields.
            </p>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Case</th>
                    <th className="px-3 py-3 text-center font-medium">Category</th>
                    <th className="px-3 py-3 text-center font-medium">Priority</th>
                    <th className="px-3 py-3 text-center font-medium">Citation</th>
                    <th className="px-3 py-3 text-center font-medium">Phrase</th>
                    <th className="px-3 py-3 text-center font-medium">Bad</th>
                    <th className="px-3 py-3 text-right font-medium">Latency</th>
                    <th className="px-3 py-3 text-right font-medium">Cost</th>
                    <th className="px-4 py-3 text-right font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/20">
                  {snap.cases.map((c) => (
                    <tr key={c.id} className="text-slate-300">
                      <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                      <td className="px-3 py-3 text-center">
                        <CheckCell value={c.category_correct} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <CheckCell value={c.priority_correct} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <CheckCell value={c.citation_recall} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <CheckCell value={c.required_phrase_hit} />
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-xs">
                        {c.prohibited_phrase_hits === 0 ? (
                          <span className="text-slate-500">0</span>
                        ) : (
                          <span className="text-amber-400">
                            {c.prohibited_phrase_hits}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-slate-400">
                        {c.latency_ms.toFixed(0)}ms
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-slate-400">
                        ${c.cost_usd.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.pass ? (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                            pass
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
                            fail
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {snap.cases.some((c) => c.notes.length > 0) && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Failures
              </h2>
              <div className="mt-4 space-y-3">
                {snap.cases
                  .filter((c) => c.notes.length > 0)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-amber-900/60 bg-amber-500/5 p-4"
                    >
                      <div className="font-mono text-xs text-amber-300">
                        {c.id}
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-slate-400">
                        {c.notes.map((note, i) => (
                          <li key={i}>- {note}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </section>
          )}

          <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Methodology
            </h2>
            <div className="mt-4 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Classification
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Predicted category and priority must exactly match the
                  ground-truth label.
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Citation recall
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  When a test expects a specific KB document, at least one
                  retrieved chunk must come from that document.
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Phrase constraints
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Drafts must mention at least one required phrase
                  (e.g. &quot;14-day window&quot;) and never mention prohibited
                  ones (e.g. &quot;non-refundable&quot;).
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Faithfulness
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Live mode: LLM-as-judge scores each draft against retrieved
                  chunks. Mock mode: proxy = fraction of drafts that include a{" "}
                  <code>[doc-N]</code> citation.
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Latency &amp; cost
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  p95 of end-to-end pipeline latency and mean cost per ticket
                  (Anthropic + OpenAI + Cohere combined).
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Test data
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Hand-curated tickets in{" "}
                  <code>evals/dataset.yaml</code>: refunds inside/outside the
                  window, technical urgents, escalation cases, billing
                  disputes, and feature requests without KB context.
                </p>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-6 py-4 text-sm text-slate-400">
            <div>
              Generated by <code>scripts/eval.ts</code>. Markdown report lives
              at <code>evals/RESULTS.md</code>.
            </div>
            <Link
              href="https://github.com/amihailow/support-copilot/blob/main/evals/RESULTS.md"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-emerald-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View on GitHub
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

function CheckCell({ value }: { value: boolean }) {
  return value ? (
    <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-400" />
  ) : (
    <XCircle className="mx-auto h-4 w-4 text-amber-400" />
  );
}
