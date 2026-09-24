"use client";

import { MailOpen, Star, Trash2 } from "lucide-react";

import { UserAvatar } from "@/components/tickets/user-avatar";
import { formatRelative } from "@/lib/format";
import { threadDisplayName, type MailThread } from "@/lib/mock";
import { useMailStore } from "@/lib/store/mail-store";
import { cn } from "@/lib/utils";

export function MailList({
  threads,
  activeId,
  onSelect,
}: {
  threads: MailThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const { messages, toggleStar, markRead, deleteThread } = useMailStore();

  if (threads.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-small text-grey-500">
        Nothing here.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {threads.map((thread) => {
        const threadMessages = messages
          .filter((m) => m.threadId === thread.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const last = threadMessages[threadMessages.length - 1];
        const senderId = thread.externalParticipant
          ? null
          : (last?.fromId ?? thread.participantIds[0]);

        return (
          <div
            key={thread.id}
            className={cn(
              "group/thread hairline-b flex items-start gap-2.5 px-3 py-2.5 transition-colors",
              thread.id === activeId ? "bg-grey-150" : "hover:bg-grey-50",
            )}
          >
            <button
              type="button"
              onClick={() => toggleStar(thread.id)}
              aria-label={thread.starred ? "Unstar" : "Star"}
              className="mt-0.5 shrink-0 text-grey-400 hover:text-grey-700"
            >
              <Star
                className={cn("size-3.5", thread.starred && "fill-current text-accent-600")}
                strokeWidth={1.75}
              />
            </button>

            <UserAvatar userId={senderId} size="md" className="mt-0.5 shrink-0" />

            <button
              type="button"
              onClick={() => onSelect(thread.id)}
              aria-current={thread.id === activeId ? "page" : undefined}
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-small",
                    !thread.read ? "font-semibold text-grey-900" : "text-grey-700",
                  )}
                >
                  {threadDisplayName(thread)}
                </span>
                {!thread.read ? (
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent-600" />
                ) : null}
                <span className="shrink-0 text-caption text-grey-500">
                  {formatRelative(thread.updatedAt)}
                </span>
              </div>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-small",
                    !thread.read ? "font-medium text-grey-900" : "text-grey-600",
                  )}
                >
                  {thread.subject}
                  {last ? (
                    <span className="font-normal text-grey-500"> — {last.body}</span>
                  ) : null}
                </span>
                {thread.ticketRefs.length > 0 ? (
                  <span className="tnum shrink-0 rounded-md bg-accent-50 px-1.5 py-0.5 text-caption font-medium text-accent-700">
                    {thread.ticketRefs[0]}
                  </span>
                ) : null}
              </div>
            </button>

            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/thread:opacity-100">
              <button
                type="button"
                onClick={() => markRead(thread.id, !thread.read)}
                aria-label={thread.read ? "Mark as unread" : "Mark as read"}
                title={thread.read ? "Mark as unread" : "Mark as read"}
                className="flex size-6 items-center justify-center rounded-md text-grey-400 hover:bg-grey-150 hover:text-grey-700"
              >
                <MailOpen className="size-3.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => deleteThread(thread.id)}
                aria-label="Delete"
                title="Delete"
                className="flex size-6 items-center justify-center rounded-md text-grey-400 hover:bg-grey-150 hover:text-[color:var(--danger)]"
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
