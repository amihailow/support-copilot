import { describe, it, expect } from "vitest";
import {
  aggregate,
  mean,
  metricStatus,
  p95,
  scoreCase,
  type AggregateMetrics,
  type CaseResult,
  type MetricDef,
} from "./eval-scoring";
import type { PipelineResult } from "./pipeline";
import type { KbChunk } from "@/types";

function chunk(title: string, body: string = "content"): KbChunk {
  return {
    id: `c-${title}`,
    documentId: `d-${title}`,
    documentTitle: title,
    documentUrl: null,
    content: body,
    chunkIndex: 0,
  };
}

function makeResult(overrides: Partial<PipelineResult> = {}): PipelineResult {
  return {
    mode: "mock",
    classification: {
      category: "refund",
      priority: "low",
      sentiment: "neutral",
      reasoning: "test",
    },
    citations: [
      { chunk: chunk("Refund Policy"), score: 0.9 },
      { chunk: chunk("Pricing FAQ"), score: 0.5 },
    ],
    suggestions: [
      {
        id: "s1",
        ticketId: "t1",
        draft: "You are within the 14-day window. [doc-1]",
        confidence: 0.9,
        citations: [chunk("Refund Policy")],
        model: "claude-haiku-4-5",
        latencyMs: 200,
        costUsd: 0.01,
      },
      {
        id: "s2",
        ticketId: "t1",
        draft: "Refund will be processed. [doc-1]",
        confidence: 0.85,
        citations: [chunk("Refund Policy")],
        model: "claude-haiku-4-5",
        latencyMs: 220,
        costUsd: 0.012,
      },
      {
        id: "s3",
        ticketId: "t1",
        draft: "Escalate for review.",
        confidence: 0.6,
        citations: [],
        model: "claude-haiku-4-5",
        latencyMs: 180,
        costUsd: 0.008,
      },
    ],
    metrics: {
      totalLatencyMs: 600,
      totalCostUsd: 0.03,
      retrievedChunks: 2,
      rerankerSurvivors: 2,
    },
    trace: { name: "test", durationMs: 600, spans: [] },
    ...overrides,
  };
}

describe("mean & p95", () => {
  it("returns 0 for empty input", () => {
    expect(mean([])).toBe(0);
    expect(p95([])).toBe(0);
  });

  it("computes mean", () => {
    expect(mean([1, 2, 3, 4])).toBeCloseTo(2.5);
  });

  it("computes p95 on sorted values", () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    expect(p95(values)).toBe(100);
  });

  it("p95 is stable on small inputs", () => {
    expect(p95([100])).toBe(100);
    expect(p95([50, 100])).toBe(100);
  });
});

describe("scoreCase", () => {
  it("passes when every expected field matches", () => {
    const r = scoreCase(
      "case-1",
      {
        category: "refund",
        priority: "low",
        must_cite: "Refund Policy",
        must_contain_any: ["14-day", "refund"],
        must_not_contain: ["non-refundable"],
      },
      makeResult(),
    );
    expect(r.category_correct).toBe(true);
    expect(r.priority_correct).toBe(true);
    expect(r.citation_recall).toBe(true);
    expect(r.required_phrase_hit).toBe(true);
    expect(r.prohibited_phrase_hits).toBe(0);
    expect(r.pass).toBe(true);
    expect(r.notes).toEqual([]);
  });

  it("flags category mismatch", () => {
    const r = scoreCase(
      "case-2",
      { category: "billing" },
      makeResult(),
    );
    expect(r.category_correct).toBe(false);
    expect(r.pass).toBe(false);
    expect(r.notes[0]).toContain("category");
  });

  it("flags missing citation", () => {
    const r = scoreCase(
      "case-3",
      { must_cite: "API Rate Limits" },
      makeResult(),
    );
    expect(r.citation_recall).toBe(false);
    expect(r.pass).toBe(false);
  });

  it("citation match is case-insensitive substring", () => {
    const r = scoreCase(
      "case-4",
      { must_cite: "refund policy" },
      makeResult(),
    );
    expect(r.citation_recall).toBe(true);
  });

  it("detects prohibited phrases across all drafts", () => {
    const result = makeResult({
      suggestions: [
        {
          ...makeResult().suggestions[0],
          draft: "Sorry, this charge is non-refundable per our policy.",
        },
      ],
    });
    const r = scoreCase(
      "case-5",
      { must_not_contain: ["non-refundable"] },
      result,
    );
    expect(r.prohibited_phrase_hits).toBe(1);
    expect(r.pass).toBe(false);
  });

  it("required_phrase_hit ok if any one phrase appears anywhere", () => {
    const r = scoreCase(
      "case-6",
      { must_contain_any: ["never-appears", "14-day"] },
      makeResult(),
    );
    expect(r.required_phrase_hit).toBe(true);
  });

  it("faithfulness proxy = 1 when retrievals are absent", () => {
    const r = scoreCase(
      "case-7",
      {},
      makeResult({ citations: [] }),
    );
    expect(r.faithfulness_proxy).toBe(1);
  });

  it("faithfulness proxy = fraction of drafts with [doc-N] markers", () => {
    const r = scoreCase("case-8", {}, makeResult());
    expect(r.faithfulness_proxy).toBeCloseTo(2 / 3, 5);
  });
});

describe("aggregate", () => {
  function fakeCase(over: Partial<CaseResult>): CaseResult {
    return {
      id: "x",
      category_correct: true,
      priority_correct: true,
      citation_recall: true,
      required_phrase_hit: true,
      prohibited_phrase_hits: 0,
      faithfulness_proxy: 1,
      latency_ms: 500,
      cost_usd: 0.02,
      pass: true,
      notes: [],
      ...over,
    };
  }

  it("averages correctness flags into rates", () => {
    const agg = aggregate([
      fakeCase({ category_correct: true }),
      fakeCase({ category_correct: false }),
      fakeCase({ category_correct: true }),
      fakeCase({ category_correct: true }),
    ]);
    expect(agg.category_accuracy).toBeCloseTo(0.75);
  });

  it("sums prohibited_phrase_violations across cases", () => {
    const agg = aggregate([
      fakeCase({ prohibited_phrase_hits: 0 }),
      fakeCase({ prohibited_phrase_hits: 2 }),
      fakeCase({ prohibited_phrase_hits: 1 }),
    ]);
    expect(agg.prohibited_phrase_violations).toBe(3);
  });

  it("uses p95 for latency", () => {
    const agg = aggregate([
      fakeCase({ latency_ms: 100 }),
      fakeCase({ latency_ms: 200 }),
      fakeCase({ latency_ms: 300 }),
      fakeCase({ latency_ms: 9000 }),
    ]);
    expect(agg.latency_p95_ms).toBe(9000);
  });
});

describe("metricStatus", () => {
  const agg: AggregateMetrics = {
    category_accuracy: 0.9,
    priority_accuracy: 0.7,
    citation_recall: 1,
    required_phrase_coverage: 1,
    prohibited_phrase_violations: 0,
    faithfulness_proxy: 0.95,
    latency_p95_ms: 800,
    cost_per_ticket_usd: 0.018,
  };

  it("rate metric pass / fail vs target", () => {
    const pass: MetricDef = {
      name: "category_accuracy",
      type: "exact_match",
      target: 0.85,
      description: "",
    };
    expect(metricStatus("category_accuracy", agg, pass).status).toBe("pass");

    const fail: MetricDef = { ...pass, target: 0.95 };
    expect(metricStatus("category_accuracy", agg, fail).status).toBe("fail");
  });

  it("numeric < target_lt: pass when below", () => {
    const m: MetricDef = {
      name: "latency_p95_ms",
      type: "numeric",
      target_lt: 3500,
      description: "",
    };
    const s = metricStatus("latency_p95_ms", agg, m);
    expect(s.status).toBe("pass");
    expect(s.valueStr).toBe("800ms");
    expect(s.targetStr).toBe("< 3500");
  });

  it("numeric < target_lt: fail when above", () => {
    const m: MetricDef = {
      name: "latency_p95_ms",
      type: "numeric",
      target_lt: 500,
      description: "",
    };
    expect(metricStatus("latency_p95_ms", agg, m).status).toBe("fail");
  });

  it("formats _usd as currency", () => {
    const m: MetricDef = {
      name: "cost_per_ticket_usd",
      type: "numeric",
      target_lt: 0.05,
      description: "",
    };
    const s = metricStatus("cost_per_ticket_usd", agg, m);
    expect(s.valueStr).toBe("$0.0180");
  });
});
