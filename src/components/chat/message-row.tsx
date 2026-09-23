"use client";

import * as React from "react";
import { MessageSquare, TicketPlus } from "lucide-react";

import { MessageBody } from "@/components/chat/message-body";
import { ChatReactions } from "@/components/chat/reactions";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { getChatConversation, getUser, type ChatMessage } from "@/lib/mock";
import { formatTime } from "@/lib/format";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { getDefaultProjectId } from "@/lib/workspace-links";
import { cn } from "@/lib/utils";

export function MessageRow({
  message,
  replies = [],
  onOpenThread,
  compact,
}: {
  message: ChatMessage;
  /** This message's thread replies, from live store state — omitted (or left
   *  empty) inside the thread panel, which renders them as their own rows. */
  replies?: ChatMessage[];
  onOpenThread?: (messageId: string) => void;
  /** Inside the thread panel — no reply affordance, since it IS the thread. */
  compact?: boolean;
}) {
  const author = getUser(message.authorId);
  const lastReply = replies[replies.length - 1];
  const { createTicket } = useTicketStore();
  const { openTicket } = useTicketPanel();
  const [createdKey, setCreatedKey] = React.useState<string | null>(null);

  const convertToTicket = () => {
    const conversation = getChatConversation(message.conversationId);
    const projectId = conversation?.projectId ?? getDefaultProjectId();
    const ticket = createTicket({
      projectId,
      title: message.body.length > 80 ? `${message.body.slice(0, 77)}…` : message.body,
      description: message.body,
      type: "task",
      priority: "medium",
      severity: null,
      status: "backlog",
      assigneeIds: [],
      labelIds: [],
      estimate: null,
      dueAt: null,
      environment: null,
      buildVersion: null,
      parentId: null,
      sprintId: null,
      requesterId: null,
      custom: {},
      attachments: [],
    });
    setCreatedKey(ticket.key);
  };

  return (
    <div className="group/message flex gap-2.5 rounded-md px-2 py-1.5 hover:bg-grey-50">
      <UserAvatar userId={message.authorId} size="md" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-small font-semibold text-grey-900">
            {author?.name ?? "Unknown"}
          </span>
          <span className="text-caption text-grey-500">{formatTime(message.createdAt)}</span>
        </div>

        <MessageBody
          text={message.body}
          ticketRefs={message.ticketRefs}
          className="text-small text-grey-800"
        />

        <ChatReactions message={message} />

        {!compact && replies.length > 0 ? (
          <button
            type="button"
            onClick={() => onOpenThread?.(message.id)}
            className="mt-1 flex items-center gap-1.5 rounded-md py-0.5 text-caption font-medium text-accent-700 hover:underline"
          >
            <MessageSquare className="size-3" strokeWidth={2} />
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
            {lastReply ? (
              <span className="font-normal text-grey-500">
                · last {formatTime(lastReply.createdAt)}
              </span>
            ) : null}
          </button>
        ) : null}

        <div
          className={cn(
            "mt-1 flex items-center gap-3 opacity-0 transition-opacity group-hover/message:opacity-100",
            createdKey && "opacity-100",
          )}
        >
          {!compact ? (
            <button
              type="button"
              onClick={() => onOpenThread?.(message.id)}
              className={cn(
                "flex items-center gap-1 text-caption text-grey-500 hover:text-accent-700",
                replies.length > 0 && "hidden",
              )}
            >
              <MessageSquare className="size-3" strokeWidth={1.75} />
              Reply in thread
            </button>
          ) : null}

          {createdKey ? (
            <button
              type="button"
              onClick={() => openTicket(createdKey)}
              className="tnum flex items-center gap-1 text-caption font-medium text-accent-700 hover:underline"
            >
              Open {createdKey}
            </button>
          ) : (
            <button
              type="button"
              onClick={convertToTicket}
              className="flex items-center gap-1 text-caption text-grey-500 hover:text-accent-700"
            >
              <TicketPlus className="size-3" strokeWidth={1.75} />
              Turn into ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
