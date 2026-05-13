import { getAnthropic, MODELS, estimateCost } from "./llm";
import type { KbChunk, SuggestedResponse, Classification } from "@/types";

const SYSTEM_PROMPT = `You are a senior customer-support agent drafting reply options.

Your job is to write 3 DISTINCT response drafts to a customer ticket, using ONLY the provided knowledge-base context. Each draft should:

1. Be grounded in the context. If the context does not answer the question, say so explicitly in the draft and recommend escalation. Do NOT invent facts.
2. Match the customer's tone (de-escalate if frustrated, stay efficient if neutral).
3. Cite sources inline as [doc-id] markers where claims come from a chunk.
4. Differ from each other meaningfully: tone, level of detail, or next-step suggestion.

Output ONLY valid JSON in this exact shape:

{
  "drafts": [
    { "text": "...", "confidence": 0.85, "tone": "concise" },
    { "text": "...", "confidence": 0.78, "tone": "empathetic" },
    { "text": "...", "confidence": 0.60, "tone": "escalation" }
  ]
}

Confidence is your honest estimate (0-1) that the draft fully resolves the ticket based on the context.`;

export interface GenerateInput {
  ticketSubject: string;
  ticketBody: string;
  classification: Classification;
  citations: KbChunk[];
}

export interface GenerateResult {
  drafts: Pick<SuggestedResponse, "draft" | "confidence" | "citations">[];
  costUsd: number;
  latencyMs: number;
}

export async function generateResponses(
  input: GenerateInput,
): Promise<GenerateResult> {
  const client = getAnthropic();

  const contextBlock = input.citations
    .map(
      (c, i) =>
        `[doc-${i + 1}] (${c.documentTitle})\n${c.content}`,
    )
    .join("\n\n---\n\n");

  const userMessage = `Customer ticket:
Subject: ${input.ticketSubject}
Body: ${input.ticketBody}

Triage:
- Category: ${input.classification.category}
- Priority: ${input.classification.priority}
- Sentiment: ${input.classification.sentiment}

Knowledge-base context:
${contextBlock}

Now produce 3 response drafts as JSON.`;

  const start = Date.now();
  const res = await client.messages.create({
    model: MODELS.generator,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });
  const latencyMs = Date.now() - start;

  const textBlock = res.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Generator returned no text");
  }

  const parsed = JSON.parse(textBlock.text) as {
    drafts: { text: string; confidence: number; tone: string }[];
  };

  const drafts = parsed.drafts.map((d) => ({
    draft: d.text,
    confidence: d.confidence,
    citations: input.citations,
  }));

  const costUsd = estimateCost(
    MODELS.generator,
    res.usage.input_tokens,
    res.usage.output_tokens,
  );

  return { drafts, costUsd, latencyMs };
}
