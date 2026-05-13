import { z } from "zod";
import { getAnthropic, MODELS, estimateCost } from "./llm";
import type { Classification } from "@/types";

const CLASSIFICATION_SCHEMA = z.object({
  category: z.enum([
    "billing",
    "technical",
    "account",
    "feature_request",
    "refund",
    "other",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  sentiment: z.enum(["positive", "neutral", "negative", "frustrated"]),
  reasoning: z.string().max(280),
});

const SYSTEM_PROMPT = `You are a support-ticket triage classifier.

Given a customer ticket, output a JSON object with these fields:
- category: one of [billing, technical, account, feature_request, refund, other]
- priority: one of [low, medium, high, urgent]
  - urgent: customer cannot use the product at all, mentions losing money, or threatens churn
  - high: blocking issue or paying customer with clear frustration
  - medium: degraded experience but workaround exists
  - low: question, feedback, or minor issue
- sentiment: one of [positive, neutral, negative, frustrated]
- reasoning: one short sentence explaining your choice

Output ONLY valid JSON. No prose, no markdown fences.`;

export interface ClassifyResult {
  classification: Classification;
  costUsd: number;
  latencyMs: number;
}

export async function classifyTicket(
  subject: string,
  body: string,
): Promise<ClassifyResult> {
  const client = getAnthropic();
  const userMessage = `Subject: ${subject}\n\nBody:\n${body}`;

  const start = Date.now();
  const res = await client.messages.create({
    model: MODELS.classifier,
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });
  const latencyMs = Date.now() - start;

  const textBlock = res.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Classifier returned no text");
  }

  const parsed = JSON.parse(textBlock.text);
  const classification = CLASSIFICATION_SCHEMA.parse(parsed);

  const costUsd = estimateCost(
    MODELS.classifier,
    res.usage.input_tokens,
    res.usage.output_tokens,
  );

  return { classification, costUsd, latencyMs };
}
