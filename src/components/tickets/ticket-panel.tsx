"use client";

import * as React from "react";
import {
  History,
  Maximize2,
  MessageSquare,
  Minimize2,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";

import { ActivityFeed } from "@/components/tickets/activity-feed";
import { AlertChip, TypeIcon } from "@/components/tickets/badges";
import { CommentComposer } from "@/components/tickets/comment-composer";
import { Description } from "@/components/tickets/description";
import {
  AttachmentsBlock,
  DevelopmentBlock,
} from "@/components/tickets/development-block";
import { InlineEdit } from "@/components/tickets/inline-edit";
import { LinksBlock } from "@/components/tickets/links-block";
import { TicketFields } from "@/components/tickets/ticket-fields";
import {
  blockersOf,
  canEdit as canEditProject,
  commentsForTicket,
  CURRENT_USER_ID,
  daysInColumn,
  getProject,
  getSprint,
  isSlaBreached,
  isStale,
  TYPE_LABEL,
} from "@/lib/mock";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

export function TicketPanel() {
  const { openTicketKey, closeTicket, expanded, toggleExpanded } =
    useTicketPanel();
  const { tickets, comments, updateTicket, reopenTicket } = useTicketStore();
  const headingRef = React.useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = React.useState(true);

  const ticket = React.useMemo(
    () => tickets.find((item) => item.key === openTicketKey) ?? null,
    [tickets, openTicketKey],
  );

  React.useEffect(() => {
    if (!openTicketKey) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTicket();
    };
    window.addEventListener("keydown", onKeyDown);
    headingRef.current?.focus();

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openTicketKey, closeTicket]);

  const project = ticket ? getProject(ticket.projectId) : undefined;
  const editable = canEditProject(project, CURRENT_USER_ID);
  const blockers = ticket ? blockersOf(tickets, ticket) : [];
  const sprint = ticket ? getSprint(ticket.sprintId) : undefined;
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
        "glass absolute inset-y-0 right-0 z-20 flex max-w-full flex-col border-l border-grey-200 transition-[transform,width] duration-[--duration-slow] max-md:w-full",
        expanded ? "w-[min(920px,100%)]" : "w-panel",
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

            {!editable ? (
              <span className="rounded-md bg-grey-100 px-1.5 py-0.5 text-caption font-medium text-grey-600">
                Read only
              </span>
            ) : null}

            {editable && ticket.status === "done" ? (
              <button
                type="button"
                onClick={() => reopenTicket(ticket.id)}
                className="flex h-6 items-center gap-1 rounded-md border border-grey-200 px-1.5 text-caption text-grey-700 transition-colors hover:border-grey-300 hover:text-grey-900"
              >
                <RotateCcw className="size-3" strokeWidth={2} />
                Reopen
              </button>
            ) : null}

            <button
              type="button"
              onClick={toggleExpanded}
              aria-label={expanded ? "Collapse ticket" : "Expand ticket"}
              title={expanded ? "Collapse" : "Expand"}
              className="ml-auto flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              {expanded ? (
                <Minimize2 className="size-4" strokeWidth={1.75} />
              ) : (
                <Maximize2 className="size-4" strokeWidth={1.75} />
              )}
            </button>

            <button
              type="button"
              onClick={closeTicket}
              aria-label="Close ticket"
              className="-mr-1.5 flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </header>

          <div className={cn("min-h-0 flex-1 overflow-y-auto", expanded && "px-2")}>
            {blockers.length > 0 ? (
              <div className="hairline-b flex items-start gap-2 bg-[var(--priority-urgent-bg)] px-5 py-2.5">
                <ShieldAlert
                  className="mt-0.5 size-4 shrink-0 text-[var(--priority-urgent-fg)]"
                  strokeWidth={1.75}
                />
                <p className="text-small text-[var(--priority-urgent-fg)]">
                  Blocked by{" "}
                  {blockers.map((blocker, index) => (
                    <React.Fragment key={blocker.id}>
                      {index > 0 ? ", " : ""}
                      <span className="tnum font-medium">{blocker.key}</span>
                    </React.Fragment>
                  ))}
                </p>
              </div>
            ) : null}

            <div
              ref={headingRef}
              tabIndex={-1}
              className="flex flex-col gap-4 px-5 py-4 outline-none"
            >
              {editable ? (
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
              ) : (
                <h2 className="text-title font-semibold text-grey-900">
                  {ticket.title}
                </h2>
              )}

              {editable ? (
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
              ) : (
                <Description text={ticket.description} />
              )}
            </div>

            <div className="hairline-t flex flex-col gap-4 px-5 py-4">
              <LinksBlock ticket={ticket} canEdit={editable} />
              {ticket.development ? (
                <DevelopmentBlock development={ticket.development} />
              ) : null}
              <AttachmentsBlock
                ticketId={ticket.id}
                attachments={ticket.attachments}
                canEdit={editable}
              />
            </div>

            <div className="hairline-t px-5 py-4">
              <TicketFields ticket={ticket} canEdit={editable} sprintName={sprint?.name} />
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

          {editable ? <CommentComposer ticketId={ticket.id} /> : null}
        </>
      ) : null}
    </aside>
  );
}
