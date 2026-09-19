"use client";

import * as React from "react";
import { X } from "lucide-react";

import { TypeIcon } from "@/components/tickets/badges";
import {
  CommentComposer,
  CommentThread,
} from "@/components/tickets/comment-thread";
import { Description } from "@/components/tickets/description";
import { TicketFields } from "@/components/tickets/ticket-fields";
import { commentsForTicket, TYPE_LABEL } from "@/lib/mock";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

/**
 * A non-modal panel over the current view: the board or list stays visible and
 * clickable behind it, so picking the next ticket takes one click. Escape and
 * the close button dismiss it.
 */
export function TicketPanel() {
  const { openTicketId, closeTicket } = useTicketPanel();
  const { tickets, comments } = useTicketStore();
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const ticket = React.useMemo(
    () => tickets.find((item) => item.id === openTicketId) ?? null,
    [tickets, openTicketId],
  );

  React.useEffect(() => {
    if (!openTicketId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTicket();
    };
    window.addEventListener("keydown", onKeyDown);
    // Move the reading position into the panel when it opens.
    headingRef.current?.focus();

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openTicketId, closeTicket]);

  const open = Boolean(ticket);
  const commentCount = ticket
    ? commentsForTicket(comments, ticket.id).length
    : 0;

  return (
    <aside
      aria-label={ticket ? `Ticket ${ticket.key}` : "Ticket detail"}
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "absolute inset-y-0 right-0 z-20 flex w-panel max-w-full flex-col border-l border-grey-200 bg-grey-0 transition-transform duration-150 ease-out",
        open ? "translate-x-0 shadow-overlay" : "translate-x-full",
      )}
    >
      {ticket ? (
        <>
          <header className="hairline-b flex h-topbar shrink-0 items-center gap-2 px-5">
            <TypeIcon type={ticket.type} />
            <span className="tnum text-small font-medium text-grey-600">
              {ticket.key}
            </span>
            <span className="text-caption text-grey-400">
              {TYPE_LABEL[ticket.type]}
            </span>
            <button
              type="button"
              onClick={closeTicket}
              aria-label="Close ticket"
              className="-mr-1.5 ml-auto flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-5 px-5 py-4">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-title font-semibold text-grey-900 outline-none"
              >
                {ticket.title}
              </h2>

              <Description text={ticket.description} />
            </div>

            <div className="hairline-t px-5 py-4">
              <TicketFields ticket={ticket} />
            </div>

            <div className="hairline-t px-5 py-4">
              <div className="mb-3 flex items-baseline gap-2">
                <h3 className="text-heading font-semibold text-grey-900">
                  Activity
                </h3>
                <span className="tnum text-small text-grey-500">
                  {commentCount === 1 ? "1 comment" : `${commentCount} comments`}
                </span>
              </div>
              <CommentThread ticketId={ticket.id} />
            </div>
          </div>

          <CommentComposer ticketId={ticket.id} />
        </>
      ) : null}
    </aside>
  );
}
