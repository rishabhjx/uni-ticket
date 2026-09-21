"use client";

import * as React from "react";

import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
} from "@/components/reui/timeline";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/reui/empty";
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
      // Seeded events hold a single user id; anything the store wrote is
      // already a list of names, so the lookup misses and the text passes
      // straight through.
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
      // The store records the whole assignee list as one joined string, so a
      // shared ticket reads "assigned it to Priya, Dan" from the same branch.
      return event.to
        ? `assigned it to ${valueLabel(event, event.to)}`
        : "left it unassigned";
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
      <Empty className="border-0 py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="text-xl">
            <span aria-hidden>💬</span>
          </EmptyMedia>
          <EmptyTitle className="mt-2 text-small font-medium text-grey-900">
            Nothing yet
          </EmptyTitle>
          <EmptyDescription className="text-small text-grey-500">
            Comments and changes to this ticket will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    /*
     * ReUI's Timeline draws the rail and the connecting line between entries,
     * which is what turns a list of changes into a history you can read at a
     * glance. Its `value` drives which steps render as completed; everything
     * here has already happened, so it sits past the last step.
     *
     * The indicator is the differentiator: a comment shows the author's
     * avatar on the rail, an event shows a plain dot. That is the same rule
     * the flat list used, but now the rail carries it.
     */
    <Timeline value={entries.length} className="w-full">
      {entries.map((entry, index) => (
        <TimelineItem
          key={entry.kind === "comment" ? entry.comment.id : entry.event.id}
          step={index + 1}
          className="ms-7! group-data-[orientation=vertical]/timeline:not-last:pb-5"
        >
          <TimelineSeparator className="-left-[18px]! bg-grey-200" />
          {entry.kind === "comment" ? (
            <>
              <TimelineIndicator asChild className="-left-[18px]! border-0">
                <UserAvatar userId={entry.comment.authorId} size="md" />
              </TimelineIndicator>
              <TimelineHeader className="flex items-baseline gap-2">
                <span className="text-small font-medium text-grey-900">
                  {getUser(entry.comment.authorId)?.name}
                </span>
                <span className="text-caption text-grey-500">
                  {formatRelative(entry.comment.createdAt)}
                </span>
              </TimelineHeader>
              <TimelineContent className="group/comment text-grey-700">
                <CommentBody comment={entry.comment} />
                <Reactions comment={entry.comment} />
              </TimelineContent>
            </>
          ) : (
            <>
              <TimelineIndicator className="-left-[18px]! size-6 border-0">
                <span className="flex size-6 items-center justify-center">
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-grey-300 ring-4 ring-grey-0"
                  />
                </span>
              </TimelineIndicator>
              <TimelineContent className="py-0.5 text-small text-grey-500">
                <span className="text-grey-700">
                  {getUser(entry.event.actorId)?.name}
                </span>{" "}
                {describe(entry.event)}
                <span className="ml-1.5 text-caption text-grey-500">
                  {formatRelative(entry.event.createdAt)}
                </span>
              </TimelineContent>
            </>
          )}
        </TimelineItem>
      ))}
    </Timeline>
  );
}
