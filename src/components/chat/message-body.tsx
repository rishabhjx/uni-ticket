"use client";

import * as React from "react";

import { useTicketPanel } from "@/lib/store/ticket-panel";
import { cn } from "@/lib/utils";

const TICKET_KEY_SOURCE = String.raw`\b[A-Z]{2,6}-\d{1,5}\b`;

/**
 * Renders a chat or mail body with any mentioned ticket key turned into a
 * link that opens the ticket panel — the same key a person would paste from
 * Tickets, now clickable wherever it shows up in the workspace.
 */
export function MessageBody({
  text,
  ticketRefs,
  className,
}: {
  text: string;
  ticketRefs: string[];
  className?: string;
}) {
  const { openTicket } = useTicketPanel();

  if (ticketRefs.length === 0) {
    return <p className={cn("whitespace-pre-wrap break-words", className)}>{text}</p>;
  }

  const parts = text.split(new RegExp(TICKET_KEY_SOURCE, "g"));
  const matches = [...text.matchAll(new RegExp(TICKET_KEY_SOURCE, "g"))].map(
    (match) => match[0],
  );

  if (matches.length === 0) {
    return <p className={cn("whitespace-pre-wrap break-words", className)}>{text}</p>;
  }

  return (
    <p className={cn("whitespace-pre-wrap break-words", className)}>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part}
          {matches[index] ? (
            ticketRefs.includes(matches[index]) ? (
              <button
                type="button"
                onClick={() => openTicket(matches[index])}
                className="tnum mx-0.5 rounded-md bg-accent-50 px-1 py-px text-caption font-medium text-accent-700 hover:underline"
              >
                {matches[index]}
              </button>
            ) : (
              matches[index]
            )
          ) : null}
        </React.Fragment>
      ))}
    </p>
  );
}
