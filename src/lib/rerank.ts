import { CohereClient } from "cohere-ai";
import { MODELS } from "./llm";
import type { RetrievalResult } from "@/types";

let cohereClient: CohereClient | null = null;

function getCohere(): CohereClient {
  if (!cohereClient) {
    const token = process.env.COHERE_API_KEY;
    if (!token) {
      throw new Error("COHERE_API_KEY is not set");
    }
    cohereClient = new CohereClient({ token });
  }
  return cohereClient;
}

export async function rerank(
  query: string,
  results: RetrievalResult[],
  topN: number = 5,
): Promise<RetrievalResult[]> {
  if (results.length === 0) return [];

  const client = getCohere();
  const documents = results.map((r) => r.chunk.content);

  const res = await client.rerank({
    model: MODELS.reranker,
    query,
    documents,
    topN: Math.min(topN, results.length),
  });

  return res.results.map((r) => ({
    chunk: results[r.index].chunk,
    score: r.relevanceScore,
    source: "reranker" as const,
  }));
}
