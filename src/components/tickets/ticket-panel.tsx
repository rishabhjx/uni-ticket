"use client";

import * as React from "react";
import { History, MessageSquare, X } from "lucide-react";

import { ActivityFeed } from "@/components/tickets/activity-feed";
import { AlertChip, TypeIcon } from "@/components/tickets/badges";
import { CommentComposer } from "@/components/tickets/comment-composer";
import { Description } from "@/components/tickets/description";
import {
  AttachmentsBlock,
  DevelopmentBlock,
} from "@/components/tickets/development-block";
import { InlineEdit } from "@/components/tickets/inline-edit";
import { TicketFields } from "@/components/tickets/ticket-fields";
import {
  commentsForTicket,
  daysInColumn,
  isSlaBreached,
  isStale,
  TYPE_LABEL,
} from "@/lib/mock";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

export function TicketPanel() {
  const { openTicketId, closeTicket } = useTicketPanel();
  const { tickets, comments, updateTicket } = useTicketStore();
  const headingRef = React.useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = React.useState(true);

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
    headingRef.current?.focus();

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openTicketId, closeTicket]);

  const open = Boolean(ticket);
  const commentCount = ticket ? commentsForTicket(comments, ticket.id).length : 0;

  const tabClass = (active: boolean) =>
    cn(
      "flex h-7 items-center gap-1.5 rounded-md px-2 text-small font-medium transition-colors",
      active ? "bg-grey-0 text-grey-900" : "text-grey-600 hover:text-grey-900",
    );

  return (
    <aside
      aria-label={ticket ? `Ticket ${ticket.key}` : "Ticket detail"}
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "glass absolute inset-y-0 right-0 z-20 flex w-panel max-w-full flex-col border-l border-grey-200 transition-transform duration-[--duration-slow]",
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

            {isSlaBreached(ticket) ? (
              <AlertChip>SLA breached</AlertChip>
            ) : isStale(ticket) ? (
              <span className="rounded-md bg-grey-100 px-1.5 py-0.5 text-caption font-medium text-grey-700">
                {daysInColumn(ticket)}d in column
              </span>
            ) : null}

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
            <div
              ref={headingRef}
              tabIndex={-1}
              className="flex flex-col gap-4 px-5 py-4 outline-none"
            >
              <InlineEdit
                label="title"
                value={ticket.title}
                onSave={(title) => updateTicket(ticket.id, { title })}
                editClassName="text-title font-semibold text-grey-900"
              >
                <h2 className="text-title font-semibold text-grey-900">
                  {ticket.title}
                </h2>
              </InlineEdit>

              <InlineEdit
                label="description"
                multiline
                value={ticket.description}
                placeholder="Add a description. Use ``` fences for logs."
                onSave={(description) => updateTicket(ticket.id, { description })}
              >
                {ticket.description ? (
                  <Description text={ticket.description} />
                ) : (
                  <p className="text-small text-grey-400">
                    Add a description. Use ``` fences for logs.
                  </p>
                )}
              </InlineEdit>
            </div>

            {ticket.development || ticket.attachments.length > 0 ? (
              <div className="hairline-t flex flex-col gap-4 px-5 py-4">
                {ticket.development ? (
                  <DevelopmentBlock development={ticket.development} />
                ) : null}
                {ticket.attachments.length > 0 ? (
                  <AttachmentsBlock attachments={ticket.attachments} />
                ) : null}
              </div>
            ) : null}

            <div className="hairline-t px-5 py-4">
              <TicketFields ticket={ticket} />
            </div>

            <div className="hairline-t px-5 py-4">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-heading font-semibold text-grey-900">
                  Activity
                </h3>
                <span className="tnum text-small text-grey-500">
                  {commentCount === 1 ? "1 comment" : `${commentCount} comments`}
                </span>

                <div className="ml-auto flex items-center gap-0.5 rounded-md bg-grey-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setShowHistory(true)}
                    className={tabClass(showHistory)}
                  >
                    <History className="size-3.5" strokeWidth={1.75} />
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className={tabClass(!showHistory)}
                  >
                    <MessageSquare className="size-3.5" strokeWidth={1.75} />
                    Comments
                  </button>
                </div>
              </div>

              <ActivityFeed ticketId={ticket.id} showHistory={showHistory} />
            </div>
          </div>

          <CommentComposer ticketId={ticket.id} />
        </>
      ) : null}
    </aside>
  );
}
