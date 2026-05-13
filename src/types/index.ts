export type TicketCategory =
  | "billing"
  | "technical"
  | "account"
  | "feature_request"
  | "refund"
  | "other";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketSentiment = "positive" | "neutral" | "negative" | "frustrated";

export type TicketStatus = "open" | "in_progress" | "resolved" | "escalated";

export interface Ticket {
  id: string;
  customerEmail: string;
  customerName: string;
  subject: string;
  body: string;
  createdAt: Date;
  status: TicketStatus;
  category: TicketCategory | null;
  priority: TicketPriority | null;
  sentiment: TicketSentiment | null;
}

export interface KbChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  documentUrl: string | null;
  content: string;
  chunkIndex: number;
}

export interface RetrievalResult {
  chunk: KbChunk;
  score: number;
  source: "bm25" | "vector" | "reranker";
}

export interface SuggestedResponse {
  id: string;
  ticketId: string;
  draft: string;
  confidence: number;
  citations: KbChunk[];
  model: string;
  latencyMs: number;
  costUsd: number;
}

export interface Classification {
  category: TicketCategory;
  priority: TicketPriority;
  sentiment: TicketSentiment;
  reasoning: string;
}

export interface AgentFeedback {
  suggestionId: string;
  action: "sent_as_is" | "edited_then_sent" | "rejected" | "escalated";
  finalText: string | null;
  agentId: string;
  timestamp: Date;
}
