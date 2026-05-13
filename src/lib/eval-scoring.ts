import type { PipelineResult } from "./pipeline";

export interface ExpectedFields {
  category?: string;
  priority?: string;
  sentiment?: string;
  must_cite?: string;
  must_contain_any?: string[];
  must_not_contain?: string[];
}

export interface CaseResult {
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

export interface MetricDef {
  name: string;
  type: "exact_match" | "numeric";
  target?: number;
  target_lt?: number;
  description: string;
}

export interface AggregateMetrics {
  category_accuracy: number;
  priority_accuracy: number;
  citation_recall: number;
  required_phrase_coverage: number;
  prohibited_phrase_violations: number;
  faithfulness_proxy: number;
  latency_p95_ms: number;
  cost_per_ticket_usd: number;
}

export interface MetricStatus {
  status: "pass" | "fail";
  valueStr: string;
  targetStr: string;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

export function scoreCase(
  caseId: string,
  expected: ExpectedFields,
  result: PipelineResult,
): CaseResult {
  const notes: string[] = [];

  const category_correct =
    !expected.category || result.classification.category === expected.category;
  if (!category_correct) {
    notes.push(
      `category: expected ${expected.category}, got ${result.classification.category}`,
    );
  }

  const priority_correct =
    !expected.priority || result.classification.priority === expected.priority;
  if (!priority_correct) {
    notes.push(
      `priority: expected ${expected.priority}, got ${result.classification.priority}`,
    );
  }

  const citation_recall = expected.must_cite
    ? result.citations.some((c) =>
        c.chunk.documentTitle
          .toLowerCase()
          .includes(expected.must_cite!.toLowerCase()),
      )
    : true;
  if (expected.must_cite && !citation_recall) {
    notes.push(
      `citation: expected to cite "${expected.must_cite}", none did`,
    );
  }

  const allDraftText = result.suggestions
    .map((s) => s.draft)
    .join("\n")
    .toLowerCase();

  const required_phrase_hit =
    !expected.must_contain_any ||
    expected.must_contain_any.length === 0 ||
    expected.must_contain_any.some((phrase) =>
      allDraftText.includes(phrase.toLowerCase()),
    );
  if (expected.must_contain_any && !required_phrase_hit) {
    notes.push(
      `no required phrase hit: ${expected.must_contain_any.join(" | ")}`,
    );
  }

  const prohibited_phrase_hits = (expected.must_not_contain ?? []).filter(
    (phrase) => allDraftText.includes(phrase.toLowerCase()),
  ).length;
  if (prohibited_phrase_hits > 0) {
    notes.push(`prohibited phrases hit: ${prohibited_phrase_hits}`);
  }

  const hasRetrievals = result.citations.length > 0;
  const faithfulness_proxy = hasRetrievals
    ? result.suggestions.filter((s) => /\[doc-\d+\]/.test(s.draft)).length /
      Math.max(1, result.suggestions.length)
    : 1;

  const pass =
    category_correct &&
    priority_correct &&
    citation_recall &&
    required_phrase_hit &&
    prohibited_phrase_hits === 0;

  return {
    id: caseId,
    category_correct,
    priority_correct,
    citation_recall,
    required_phrase_hit,
    prohibited_phrase_hits,
    faithfulness_proxy,
    latency_ms: result.metrics.totalLatencyMs,
    cost_usd: result.metrics.totalCostUsd,
    pass,
    notes,
  };
}

export function aggregate(results: CaseResult[]): AggregateMetrics {
  return {
    category_accuracy: mean(results.map((r) => (r.category_correct ? 1 : 0))),
    priority_accuracy: mean(results.map((r) => (r.priority_correct ? 1 : 0))),
    citation_recall: mean(results.map((r) => (r.citation_recall ? 1 : 0))),
    required_phrase_coverage: mean(
      results.map((r) => (r.required_phrase_hit ? 1 : 0)),
    ),
    prohibited_phrase_violations: results.reduce(
      (s, r) => s + r.prohibited_phrase_hits,
      0,
    ),
    faithfulness_proxy: mean(results.map((r) => r.faithfulness_proxy)),
    latency_p95_ms: p95(results.map((r) => r.latency_ms)),
    cost_per_ticket_usd: mean(results.map((r) => r.cost_usd)),
  };
}

export function metricStatus(
  name: keyof AggregateMetrics,
  agg: AggregateMetrics,
  metric: MetricDef,
): MetricStatus {
  const value = agg[name];

  if (metric.target_lt !== undefined) {
    const targetStr = `< ${metric.target_lt}`;
    const valueStr = formatValue(name, value);
    const status = value < metric.target_lt ? "pass" : "fail";
    return { status, valueStr, targetStr };
  }

  if (metric.target !== undefined) {
    const isRate = metric.type === "exact_match" && metric.target <= 1;
    const targetStr = isRate
      ? `>= ${(metric.target * 100).toFixed(0)}%`
      : `>= ${metric.target}`;
    const valueStr = isRate
      ? `${(value * 100).toFixed(1)}%`
      : formatValue(name, value);
    const status = value >= metric.target ? "pass" : "fail";
    return { status, valueStr, targetStr };
  }

  return { status: "pass", valueStr: String(value), targetStr: "-" };
}

function formatValue(name: string, value: number): string {
  if (name.endsWith("_ms")) return `${value.toFixed(0)}ms`;
  if (name.endsWith("_usd")) return `$${value.toFixed(4)}`;
  return value.toFixed(3);
}
