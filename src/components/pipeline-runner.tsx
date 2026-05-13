"use client";

import { useState } from "react";
import { Play, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatLatency } from "@/lib/utils";

interface SpanSummary {
  name: string;
  durationMs: number;
  data?: Record<string, unknown>;
}

interface PipelineResponse {
  mode: "live" | "mock";
  metrics: {
    totalLatencyMs: number;
    totalCostUsd: number;
    retrievedChunks: number;
    rerankerSurvivors: number;
  };
  trace: {
    name: string;
    durationMs: number;
    spans: SpanSummary[];
  };
  warnings?: string[];
}

export function PipelineRunner({
  ticketId,
  subject,
  body,
}: {
  ticketId: string;
  subject: string;
  body: string;
}) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<PipelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setResponse(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <Clock className="h-4 w-4 text-slate-400" />
            Run pipeline live
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Calls{" "}
            <span className="font-mono text-slate-400">POST /api/suggest</span>{" "}
            with the ticket. Falls back to the seed cache if API keys are
            missing.
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            loading
              ? "bg-slate-800 text-slate-400"
              : "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {loading ? "Running..." : "Run"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {response ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Pipeline completed</span>
              <Badge variant={response.mode === "live" ? "emerald" : "amber"}>
                mode: {response.mode}
              </Badge>
            </div>
            <div className="flex items-center gap-3 tabular-nums">
              <span>{formatLatency(response.metrics.totalLatencyMs)}</span>
              <span className="text-slate-700">·</span>
              <span>{formatCurrency(response.metrics.totalCostUsd)}</span>
            </div>
          </div>

          {response.warnings?.length ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
              {response.warnings.map((w, i) => (
                <div key={i}>· {w}</div>
              ))}
            </div>
          ) : null}

          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-300">
              Trace
            </div>
            <ol className="space-y-1 font-mono text-xs">
              {response.trace.spans.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded bg-slate-950/60 px-2 py-1.5 ring-1 ring-slate-800"
                >
                  <span className="text-slate-300">{s.name}</span>
                  <span className="tabular-nums text-slate-500">
                    {formatLatency(s.durationMs)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}
