"use client";

import { useState } from "react";
import {
  Check,
  Pencil,
  X,
  ArrowUpRight,
  Copy,
  Loader2,
} from "lucide-react";
import { ConfidenceBar } from "@/components/ui/confidence-bar";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatLatency } from "@/lib/utils";
import type { SuggestedResponse } from "@/types";

type ActionState = "idle" | "loading" | "done";
type FeedbackAction =
  | "sent_as_is"
  | "edited_then_sent"
  | "rejected"
  | "escalated";

const TONE_LABELS = ["concise", "empathetic", "escalation"] as const;

export function SuggestionCard({
  suggestion,
  index,
}: {
  suggestion: SuggestedResponse;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<ActionState>("idle");
  const [chosen, setChosen] = useState<FeedbackAction | null>(null);
  const tone = TONE_LABELS[index] ?? "draft";

  async function recordFeedback(action: FeedbackAction) {
    setState("loading");
    setChosen(action);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          ticketId: suggestion.ticketId,
          action,
          finalText: action === "sent_as_is" ? suggestion.draft : null,
          agentId: "demo-agent",
        }),
      });
      setState("done");
    } catch {
      setState("idle");
      setChosen(null);
    }
  }

  const renderedDraft = suggestion.draft.split(/(\[doc-\d+\])/g).map((part, i) => {
    const match = part.match(/^\[doc-(\d+)\]$/);
    if (match) {
      const docIdx = parseInt(match[1], 10) - 1;
      const cite = suggestion.citations[docIdx];
      return (
        <a
          key={i}
          href={cite?.documentUrl ?? "#"}
          className="inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20"
          title={cite?.content ?? ""}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });

  function copy() {
    navigator.clipboard.writeText(suggestion.draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-300">
            Draft {index + 1}
          </span>
          <Badge variant="neutral">{tone}</Badge>
        </div>
        <ConfidenceBar value={suggestion.confidence} />
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
        {renderedDraft}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{formatLatency(suggestion.latencyMs)}</span>
          <span className="text-slate-700">·</span>
          <span>{formatCurrency(suggestion.costUsd)}</span>
          <span className="text-slate-700">·</span>
          <span className="font-mono">{suggestion.model}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={copy}
            className={cn(
              "rounded px-2 py-1 text-xs transition-colors hover:bg-slate-800",
              copied ? "text-emerald-400" : "text-slate-400",
            )}
            title="Copy draft"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            disabled={state !== "idle"}
            onClick={() => recordFeedback("edited_then_sent")}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            disabled={state !== "idle"}
            onClick={() => recordFeedback("escalated")}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Escalate
          </button>
          <button
            disabled={state !== "idle"}
            onClick={() => recordFeedback("rejected")}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-300 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </button>
          <button
            disabled={state !== "idle"}
            onClick={() => recordFeedback("sent_as_is")}
            className={cn(
              "ml-1 flex items-center gap-1 rounded px-3 py-1 text-xs font-medium transition-colors",
              state === "done" && chosen === "sent_as_is"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
              state === "loading" && "opacity-70",
            )}
          >
            {state === "loading" && chosen === "sent_as_is" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {state === "done" && chosen === "sent_as_is" ? "Sent" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
