import { classifyTicket } from "./classify";
import { hybridSearch } from "./retrieval";
import { rerank } from "./rerank";
import { generateResponses } from "./generate";
import { Trace, withSpan } from "./trace";
import { detectMode } from "./mode";
import { getMockTicket } from "./mock";
import { MODELS } from "./llm";
import { isObservabilityEnabled, logPipelineRun } from "./observability";
import type {
  Classification,
  KbChunk,
  SuggestedResponse,
} from "@/types";

export interface PipelineInput {
  ticketId: string;
  subject: string;
  body: string;
}

export interface PipelineMetrics {
  totalLatencyMs: number;
  totalCostUsd: number;
  retrievedChunks: number;
  rerankerSurvivors: number;
}

export interface PipelineResult {
  mode: "live" | "mock";
  classification: Classification;
  citations: { chunk: KbChunk; score: number }[];
  suggestions: SuggestedResponse[];
  metrics: PipelineMetrics;
  trace: ReturnType<Trace["toJSON"]>;
  warnings?: string[];
}

export async function runPipeline(
  input: PipelineInput,
): Promise<PipelineResult> {
  const { mode, missingKeys } = detectMode();

  const result =
    mode === "mock"
      ? await mockPipeline(input, missingKeys)
      : await livePipeline(input);

  if (isObservabilityEnabled() && result.mode === "live") {
    void logPipelineRun(input, result);
  }

  return result;
}

async function livePipeline(input: PipelineInput): Promise<PipelineResult> {
  const trace = new Trace("suggest");

  const classify = await withSpan(trace, "classify", () =>
    classifyTicket(input.subject, input.body),
  );

  const query = `${input.subject}\n${input.body}`;

  const candidates = await withSpan(trace, "retrieve.hybrid", () =>
    hybridSearch(query),
  );

  const reranked = await withSpan(trace, "rerank", () =>
    rerank(query, candidates, 5),
  );

  const generated = await withSpan(trace, "generate", () =>
    generateResponses({
      ticketSubject: input.subject,
      ticketBody: input.body,
      classification: classify.classification,
      citations: reranked.map((r) => r.chunk),
    }),
  );

  trace.end();

  const suggestions: SuggestedResponse[] = generated.drafts.map((d, i) => ({
    id: `${input.ticketId}-s-${i}`,
    ticketId: input.ticketId,
    draft: d.draft,
    confidence: d.confidence,
    citations: d.citations,
    model: MODELS.generator,
    latencyMs: Math.round(generated.latencyMs / generated.drafts.length),
    costUsd: generated.costUsd / generated.drafts.length,
  }));

  return {
    mode: "live",
    classification: classify.classification,
    citations: reranked.map((r) => ({ chunk: r.chunk, score: r.score })),
    suggestions,
    metrics: {
      totalLatencyMs: trace.durationMs(),
      totalCostUsd: classify.costUsd + generated.costUsd,
      retrievedChunks: candidates.length,
      rerankerSurvivors: reranked.length,
    },
    trace: trace.toJSON(),
  };
}

async function mockPipeline(
  input: PipelineInput,
  missingKeys: string[],
): Promise<PipelineResult> {
  const trace = new Trace("suggest.mock");

  const cached = getMockTicket(input.ticketId);

  await withSpan(trace, "mock.lookup", async () => {
    await new Promise((r) => setTimeout(r, 80));
  });

  if (!cached) {
    trace.end();
    return {
      mode: "mock",
      classification: {
        category: "other",
        priority: "low",
        sentiment: "neutral",
        reasoning:
          "Mock fallback: ticket not in cache and live keys are unavailable.",
      },
      citations: [],
      suggestions: [],
      metrics: {
        totalLatencyMs: trace.durationMs(),
        totalCostUsd: 0,
        retrievedChunks: 0,
        rerankerSurvivors: 0,
      },
      trace: trace.toJSON(),
      warnings: [
        `Running in mock mode. Missing: ${missingKeys.join(", ")}.`,
        "Ticket not found in seed cache.",
      ],
    };
  }

  await withSpan(trace, "mock.classify", async () => {
    await new Promise((r) => setTimeout(r, 120));
  });
  await withSpan(trace, "mock.retrieve", async () => {
    await new Promise((r) => setTimeout(r, 90));
  });
  await withSpan(trace, "mock.rerank", async () => {
    await new Promise((r) => setTimeout(r, 70));
  });
  await withSpan(trace, "mock.generate", async () => {
    await new Promise((r) => setTimeout(r, 240));
  });

  trace.end();

  return {
    mode: "mock",
    classification: cached.classification,
    citations: cached.retrievedChunks,
    suggestions: cached.suggestions,
    metrics: {
      totalLatencyMs: trace.durationMs(),
      totalCostUsd: cached.suggestions.reduce(
        (sum, s) => sum + s.costUsd,
        0,
      ),
      retrievedChunks: cached.retrievedChunks.length,
      rerankerSurvivors: cached.retrievedChunks.length,
    },
    trace: trace.toJSON(),
    warnings:
      missingKeys.length > 0
        ? [
            `Running in mock mode. Missing keys: ${missingKeys.join(", ")}.`,
            "Add the keys to .env.local and restart to run the live pipeline.",
          ]
        : undefined,
  };
}
