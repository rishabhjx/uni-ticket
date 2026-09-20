"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, History, MessageSquare } from "lucide-react";

import { CallButton } from "@/components/shared/call-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ActivityFeed } from "@/components/tickets/activity-feed";
import { AlertChip, TypeIcon } from "@/components/tickets/badges";
import { CommentComposer } from "@/components/tickets/comment-composer";
import { Description } from "@/components/tickets/description";
import { AttachmentsBlock } from "@/components/tickets/development-block";
import { InlineEdit } from "@/components/tickets/inline-edit";
import { LinksBlock } from "@/components/tickets/links-block";
import { CustomFields } from "@/components/tickets/custom-fields";
import { TicketFields } from "@/components/tickets/ticket-fields";
import {
  blockersOf,
  canEdit as canEditProject,
  commentsForTicket,
  CURRENT_USER_ID,
  getProject,
  getSprint,
  isSlaBreached,
  TYPE_LABEL,
} from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

/**
 * The ticket as a page rather than a panel — what the expand control opens.
 *
 * A panel is the right shape while you are working a list: the list stays
 * behind it and you keep your place. It is the wrong shape when the ticket IS
 * the work, which is what a long thread, a spec-length description or a
 * screen-share of one ticket all are. Same components either way; only the
 * frame changes, so there is no second implementation to drift.
 */
export function TicketPage({ ticketKey }: { ticketKey: string }) {
  const { tickets, comments, updateTicket, isLoading } = useTicketStore();
  const [showHistory, setShowHistory] = React.useState(true);

  const ticket = React.useMemo(
    () => tickets.find((item) => item.key === ticketKey) ?? null,
    [tickets, ticketKey],
  );

  const project = ticket ? getProject(ticket.projectId) : undefined;
  const parent =
    ticket?.parentId ? tickets.find((item) => item.id === ticket.parentId) : null;
  const editable = canEditProject(project, CURRENT_USER_ID);
  const blockers = ticket ? blockersOf(tickets, ticket) : [];
  const sprint = ticket ? getSprint(ticket.sprintId) : undefined;
  const commentCount = ticket ? commentsForTicket(comments, ticket.id).length : 0;

  if (!ticket) {
    if (isLoading) return null;
    return (
      <EmptyState
        emoji="🧭"
        title="No such ticket"
        description={`Nothing in this workspace has the key ${ticketKey}.`}
        action={{ label: "Go to overview", href: "/" }}
      />
    );
  }

  const tabClass = (active: boolean) =>
    cn(
      "flex h-7 items-center gap-1.5 rounded-md px-2 text-small font-medium transition-colors",
      active ? "bg-grey-0 text-grey-900" : "text-grey-600 hover:text-grey-900",
    );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-6 py-6">
        <header className="flex items-center gap-2">
          {parent ? (
            <Link
              href={`/tickets/${parent.key.toLowerCase()}`}
              title={`${parent.key} · ${parent.title}`}
              className="flex items-center gap-1 rounded-md px-1 text-caption text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              <ChevronLeft className="size-3.5" strokeWidth={2} />
              <span className="tnum">{parent.key}</span>
              <span aria-hidden className="text-grey-400">
                /
              </span>
            </Link>
          ) : project ? (
            <Link
              href={`/projects/${project.slug}/list`}
              className="flex items-center gap-1 rounded-md px-1 text-caption text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              <ChevronLeft className="size-3.5" strokeWidth={2} />
              {project.name}
            </Link>
          ) : null}

          <TypeIcon type={ticket.type} />
          <span className="tnum text-small font-medium text-grey-600">
            {ticket.key}
          </span>
          <span className="text-caption text-grey-400">
            {TYPE_LABEL[ticket.type]}
          </span>
          {isSlaBreached(ticket) ? <AlertChip tone="breached">SLA breached</AlertChip> : null}

          <CallButton
            subject={`${ticket.key} ${ticket.title}`}
            participantIds={
              ticket.assigneeIds.length > 0
                ? ticket.assigneeIds
                : (project?.memberIds ?? [])
            }
            className="ml-auto"
          />
        </header>

        {blockers.length > 0 ? (
          <p className="rounded-md border border-grey-200 bg-grey-50 px-3 py-2 text-small text-grey-700">
            Blocked by{" "}
            {blockers.map((item) => item.key).join(", ")}
          </p>
        ) : null}

        <InlineEdit
          label="title"
          value={ticket.title}
          onSave={(title) => updateTicket(ticket.id, { title })}
          className={editable ? undefined : "pointer-events-none"}
          editClassName="text-title font-semibold"
        >
          <h1 className="text-title font-semibold text-grey-900">
            {ticket.title}
          </h1>
        </InlineEdit>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="flex min-w-0 flex-col gap-5">
            {editable ? (
              <InlineEdit
                label="description"
                multiline
                value={ticket.description}
                onSave={(description) =>
                  updateTicket(ticket.id, { description })
                }
                placeholder="Describe it."
              >
                <Description text={ticket.description} />
              </InlineEdit>
            ) : (
              <Description text={ticket.description} />
            )}

            <div className="flex items-center gap-0.5 rounded-md bg-grey-100 p-0.5 self-start">
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className={tabClass(!showHistory)}
              >
                <MessageSquare className="size-3.5" strokeWidth={1.75} />
                Comments {commentCount}
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className={tabClass(showHistory)}
              >
                <History className="size-3.5" strokeWidth={1.75} />
                Everything
              </button>
            </div>

            <ActivityFeed ticketId={ticket.id} showHistory={showHistory} />
            {editable ? <CommentComposer ticketId={ticket.id} /> : null}
          </div>

          <aside className="flex flex-col gap-5">
            <TicketFields
              ticket={ticket}
              canEdit={editable}
              sprintName={sprint?.name}
            />
            <CustomFields ticket={ticket} canEdit={editable} />
            <LinksBlock ticket={ticket} canEdit={editable} />
            <AttachmentsBlock
              ticketId={ticket.id}
              attachments={ticket.attachments}
              canEdit={editable}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
