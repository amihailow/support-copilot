import type { PipelineInput, PipelineResult } from "./pipeline";

type LangfuseModule = typeof import("langfuse");
type LangfuseClient = InstanceType<LangfuseModule["Langfuse"]>;

let client: LangfuseClient | null = null;
let triedInit = false;

export function isObservabilityEnabled(): boolean {
  return (
    !!process.env.LANGFUSE_PUBLIC_KEY && !!process.env.LANGFUSE_SECRET_KEY
  );
}

async function getClient(): Promise<LangfuseClient | null> {
  if (!isObservabilityEnabled()) return null;
  if (triedInit) return client;
  triedInit = true;
  try {
    const mod = await import("langfuse");
    client = new mod.Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
      secretKey: process.env.LANGFUSE_SECRET_KEY!,
      baseUrl: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
    });
    return client;
  } catch (e) {
    console.warn(
      "Langfuse init failed, observability disabled:",
      e instanceof Error ? e.message : e,
    );
    return null;
  }
}

export async function logPipelineRun(
  input: PipelineInput,
  result: PipelineResult,
): Promise<void> {
  const lf = await getClient();
  if (!lf) return;

  try {
    const trace = lf.trace({
      name: "suggest",
      input: { subject: input.subject, body: input.body },
      output: {
        category: result.classification.category,
        priority: result.classification.priority,
        sentiment: result.classification.sentiment,
        suggestionCount: result.suggestions.length,
        citationCount: result.citations.length,
      },
      metadata: {
        ticketId: input.ticketId,
        mode: result.mode,
        totalLatencyMs: result.metrics.totalLatencyMs,
        totalCostUsd: result.metrics.totalCostUsd,
      },
    });

    let cursor = Date.now() - result.metrics.totalLatencyMs;
    for (const span of result.trace.spans) {
      const start = new Date(cursor);
      const end = new Date(cursor + (span.durationMs ?? 0));
      trace.span({
        name: span.name,
        startTime: start,
        endTime: end,
        metadata: span.data as Record<string, unknown> | undefined,
      });
      cursor = end.getTime();
    }

    await lf.flushAsync();
  } catch (e) {
    console.warn(
      "Langfuse logging failed:",
      e instanceof Error ? e.message : e,
    );
  }
}
