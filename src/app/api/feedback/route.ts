import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FeedbackSchema = z.object({
  suggestionId: z.string().min(1),
  ticketId: z.string().min(1),
  action: z.enum(["sent_as_is", "edited_then_sent", "rejected", "escalated"]),
  finalText: z.string().nullable().optional(),
  agentId: z.string().default("anonymous"),
});

const memory: z.infer<typeof FeedbackSchema>[] = [];

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = FeedbackSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  memory.push(parsed.data);

  return NextResponse.json({
    ok: true,
    recorded: parsed.data,
    sessionTotal: memory.length,
    note: "In live mode this would persist to Supabase and emit a Langfuse trace.",
  });
}

export async function GET() {
  return NextResponse.json({ count: memory.length, recent: memory.slice(-20) });
}
