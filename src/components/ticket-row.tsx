import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import {
  Badge,
  categoryVariant,
  priorityVariant,
  sentimentVariant,
} from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";
import type { Ticket } from "@/types";

export function TicketRow({ ticket }: { ticket: Ticket }) {
  const subjectPreview = ticket.body.replace(/\s+/g, " ").slice(0, 90);

  return (
    <Link
      href={`/ticket/${ticket.id}`}
      className="group block border-b border-slate-800/70 px-5 py-4 transition-colors hover:bg-slate-900/40"
    >
      <div className="flex items-start gap-3">
        <Avatar name={ticket.customerName} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="truncate text-sm font-medium text-slate-100">
                {ticket.customerName}
              </span>
              <span className="hidden text-xs text-slate-500 sm:inline">
                {ticket.customerEmail}
              </span>
            </div>
            <span className="shrink-0 text-xs text-slate-500">
              {timeAgo(ticket.createdAt)}
            </span>
          </div>

          <div className="mt-0.5 truncate text-sm text-slate-200 group-hover:text-slate-100">
            {ticket.subject}
          </div>

          <div className="mt-1 truncate text-xs text-slate-500">
            {subjectPreview}
            {ticket.body.length > 90 ? "..." : ""}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {ticket.category ? (
              <Badge variant={categoryVariant(ticket.category)}>
                {ticket.category.replace("_", " ")}
              </Badge>
            ) : null}
            {ticket.priority ? (
              <Badge variant={priorityVariant(ticket.priority)}>
                {ticket.priority}
              </Badge>
            ) : null}
            {ticket.sentiment && ticket.sentiment !== "neutral" ? (
              <Badge variant={sentimentVariant(ticket.sentiment)}>
                {ticket.sentiment}
              </Badge>
            ) : null}
            {ticket.status !== "open" ? (
              <Badge variant="neutral">{ticket.status.replace("_", " ")}</Badge>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
