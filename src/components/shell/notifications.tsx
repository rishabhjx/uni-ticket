"use client";

import * as React from "react";
import { Bell } from "lucide-react";

import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatRelative } from "@/lib/format";
import { CURRENT_USER_ID, getUser } from "@/lib/mock";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useInbox } from "@/lib/store/inbox";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

/**
 * Comments were a dead end before this: somebody replied and nobody was told.
 * Mentions are derived from comments on tickets you are involved in.
 */
export function Notifications() {
  const { tickets, comments } = useTicketStore();
  const { openTicket } = useTicketPanel();
  const { readIds: read, markRead } = useInbox();

  const items = React.useMemo(() => {
    const mine = new Map(
      tickets
        .filter(
          (ticket) =>
            ticket.assigneeId === CURRENT_USER_ID ||
            ticket.reporterId === CURRENT_USER_ID,
        )
        .map((ticket) => [ticket.id, ticket]),
    );

    return comments
      .filter(
        (comment) =>
          comment.authorId !== CURRENT_USER_ID && mine.has(comment.ticketId),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 12)
      .map((comment) => ({ comment, ticket: mine.get(comment.ticketId)! }));
  }, [tickets, comments]);

  const unread = items.filter((item) => !read.has(item.comment.id)).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `Inbox, ${unread} unread` : "Inbox"}
          className="relative flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
        >
          <Bell className="size-4" strokeWidth={1.75} />
          {unread > 0 ? (
            <span className="tnum absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent-600 px-1 text-[9px] font-semibold text-grey-0">
              {unread}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="hairline-b flex items-center gap-2 px-3 py-2">
          <span className="text-small font-semibold text-grey-900">Inbox</span>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => markRead(items.map((item) => item.comment.id))}
              className="ml-auto text-caption text-grey-500 transition-colors hover:text-grey-900"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-small text-grey-500">
              🌤️ All quiet. Replies on your tickets show up here.
            </p>
          ) : (
            items.map(({ comment, ticket }) => {
              const isRead = read.has(comment.id);
              return (
                <button
                  key={comment.id}
                  type="button"
                  onClick={() => {
                    markRead([comment.id]);
                    openTicket(ticket.key);
                  }}
                  className={cn(
                    "flex w-full gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-grey-50",
                    !isRead && "bg-accent-50/50",
                  )}
                >
                  <UserAvatar userId={comment.authorId} size="md" className="mt-0.5" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-small font-medium text-grey-900">
                        {getUser(comment.authorId)?.name}
                      </span>
                      <span className="tnum text-caption text-grey-500">
                        {ticket.key}
                      </span>
                      <span className="ml-auto text-caption text-grey-400">
                        {formatRelative(comment.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-small text-grey-600">
                      {comment.body}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
