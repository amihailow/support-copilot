import { NextResponse } from "next/server";
import { getMockTickets } from "@/lib/mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const priority = url.searchParams.get("priority");

  let tickets = getMockTickets().map(
    ({ classification, retrievedChunks, suggestions, ...t }) => t,
  );

  if (status) tickets = tickets.filter((t) => t.status === status);
  if (category) tickets = tickets.filter((t) => t.category === category);
  if (priority) tickets = tickets.filter((t) => t.priority === priority);

  return NextResponse.json({ tickets, count: tickets.length });
}
