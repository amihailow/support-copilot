import { getSupabaseAdmin } from "./db";
import { embedOne } from "./embeddings";
import type { KbChunk, RetrievalResult } from "@/types";

const VECTOR_K = 20;
const BM25_K = 20;
const FINAL_K = 5;

export async function vectorSearch(
  query: string,
  k: number = VECTOR_K,
): Promise<RetrievalResult[]> {
  const queryEmbedding = await embedOne(query);
  const db = getSupabaseAdmin();

  const { data, error } = await db.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    match_count: k,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return (data ?? []).map((row: KbChunk & { similarity: number }) => ({
    chunk: row,
    score: row.similarity,
    source: "vector" as const,
  }));
}

export async function keywordSearch(
  query: string,
  k: number = BM25_K,
): Promise<RetrievalResult[]> {
  const db = getSupabaseAdmin();

  const { data, error } = await db.rpc("search_chunks_bm25", {
    query_text: query,
    match_count: k,
  });

  if (error) {
    throw new Error(`BM25 search failed: ${error.message}`);
  }

  return (data ?? []).map((row: KbChunk & { rank: number }) => ({
    chunk: row,
    score: row.rank,
    source: "bm25" as const,
  }));
}

export function reciprocalRankFusion(
  resultLists: RetrievalResult[][],
  k: number = FINAL_K,
  rrfK: number = 60,
): RetrievalResult[] {
  const scores = new Map<string, { result: RetrievalResult; score: number }>();

  for (const list of resultLists) {
    list.forEach((res, rank) => {
      const id = res.chunk.id;
      const rrfScore = 1 / (rrfK + rank + 1);
      const existing = scores.get(id);
      if (existing) {
        existing.score += rrfScore;
      } else {
        scores.set(id, { result: res, score: rrfScore });
      }
    });
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => ({ ...s.result, score: s.score }));
}

export async function hybridSearch(query: string): Promise<RetrievalResult[]> {
  const [vec, bm25] = await Promise.all([
    vectorSearch(query),
    keywordSearch(query),
  ]);
  return reciprocalRankFusion([vec, bm25]);
}
