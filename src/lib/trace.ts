type SpanData = Record<string, unknown>;

export interface Span {
  name: string;
  startedAt: number;
  endedAt?: number;
  data?: SpanData;
  children: Span[];
}

export class Trace {
  readonly name: string;
  readonly startedAt: number;
  endedAt?: number;
  readonly spans: Span[] = [];

  constructor(name: string) {
    this.name = name;
    this.startedAt = Date.now();
  }

  span(name: string, data?: SpanData): Span {
    const s: Span = {
      name,
      startedAt: Date.now(),
      data,
      children: [],
    };
    this.spans.push(s);
    return s;
  }

  endSpan(s: Span, data?: SpanData) {
    s.endedAt = Date.now();
    if (data) s.data = { ...s.data, ...data };
  }

  end() {
    this.endedAt = Date.now();
  }

  durationMs(): number {
    return (this.endedAt ?? Date.now()) - this.startedAt;
  }

  toJSON() {
    return {
      name: this.name,
      durationMs: this.durationMs(),
      spans: this.spans.map((s) => ({
        name: s.name,
        durationMs: (s.endedAt ?? Date.now()) - s.startedAt,
        data: s.data,
      })),
    };
  }
}

export async function withSpan<T>(
  trace: Trace,
  name: string,
  fn: () => Promise<T>,
  meta?: SpanData,
): Promise<T> {
  const s = trace.span(name, meta);
  try {
    const result = await fn();
    trace.endSpan(s, { ok: true });
    return result;
  } catch (e) {
    trace.endSpan(s, {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}
