"use client";

import * as React from "react";

import { Reactions } from "@/components/tickets/reactions";
import { CommentBody } from "@/components/tickets/comment-body";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { formatRelative } from "@/lib/format";
import {
  commentsForTicket,
  eventsForTicket,
  getUser,
  PRIORITY_LABEL,
  SEVERITY_LABEL,
  STATUS_LABEL,
  type Comment,
  type TicketEvent,
} from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";

type Entry =
  | { kind: "comment"; at: string; comment: Comment }
  | { kind: "event"; at: string; event: TicketEvent };

function valueLabel(event: TicketEvent, value: string | null) {
  if (!value) return "nobody";
  switch (event.kind) {
    case "status":
      return STATUS_LABEL[value as keyof typeof STATUS_LABEL] ?? value;
    case "priority":
      return PRIORITY_LABEL[value as keyof typeof PRIORITY_LABEL] ?? value;
    case "severity":
      return SEVERITY_LABEL[value as keyof typeof SEVERITY_LABEL] ?? value;
    case "assignee":
      return getUser(value)?.name ?? value;
    default:
      return value;
  }
}

function describe(event: TicketEvent) {
  switch (event.kind) {
    case "created":
      return "created this ticket";
    case "status":
      return `moved it from ${valueLabel(event, event.from)} to ${valueLabel(event, event.to)}`;
    case "assignee":
      return `assigned it to ${valueLabel(event, event.to)}`;
    case "priority":
      return `changed priority to ${valueLabel(event, event.to)}`;
    case "severity":
      return `changed severity to ${valueLabel(event, event.to)}`;
    case "title":
      return `renamed it to "${event.to}"`;
    case "description":
      return "edited the description";
    case "reopened":
      return "reopened it";
    default:
      return "updated it";
  }
}

/**
 * Comments alone never answer "who moved this and when", which is the first
 * question QA and IT ask. History and discussion share one timeline.
 */
export function ActivityFeed({
  ticketId,
  showHistory,
}: {
  ticketId: string;
  showHistory: boolean;
}) {
  const { comments, events } = useTicketStore();

  const entries = React.useMemo<Entry[]>(() => {
    const threads: Entry[] = commentsForTicket(comments, ticketId).map(
      (comment) => ({ kind: "comment", at: comment.createdAt, comment }),
    );

    if (showHistory) {
      threads.push(
        ...eventsForTicket(events, ticketId).map((event) => ({
          kind: "event" as const,
          at: event.createdAt,
          event,
        })),
      );
    }

    return threads.sort((a, b) => a.at.localeCompare(b.at));
  }, [comments, events, ticketId, showHistory]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-8 text-center">
        <span aria-hidden className="text-xl">💬</span>
        <p className="text-small font-medium text-grey-900">Nothing yet</p>
        <p className="text-small text-grey-500">
          Comments and changes to this ticket will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {entries.map((entry) =>
        entry.kind === "comment" ? (
          <li key={entry.comment.id} className="group/comment flex gap-2.5">
            <UserAvatar
              userId={entry.comment.authorId}
              size="md"
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-small font-medium text-grey-900">
                  {getUser(entry.comment.authorId)?.name}
                </span>
                <span className="text-caption text-grey-500">
                  {formatRelative(entry.comment.createdAt)}
                </span>
              </div>
              <CommentBody comment={entry.comment} />
              <Reactions comment={entry.comment} />
            </div>
          </li>
        ) : (
          <li key={entry.event.id} className="flex items-center gap-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center">
              <span aria-hidden className="size-1.5 rounded-full bg-grey-300" />
            </span>
            <p className="text-small text-grey-500">
              <span className="text-grey-700">
                {getUser(entry.event.actorId)?.name}
              </span>{" "}
              {describe(entry.event)}
              <span className="ml-1.5 text-caption text-grey-400">
                {formatRelative(entry.event.createdAt)}
              </span>
            </p>
          </li>
        ),
      )}
    </ul>
  );
}
