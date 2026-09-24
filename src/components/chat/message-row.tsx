"use client";

import * as React from "react";
import { Check, MessageSquare, Pencil, TicketPlus, Trash2, X } from "lucide-react";

import {
  Attachment as AttachmentCard,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/reui/attachment";
import { MessageBody } from "@/components/chat/message-body";
import { ChatReactions } from "@/components/chat/reactions";
import { attachmentIcon } from "@/components/tickets/comment-composer";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { formatBytes, formatTime } from "@/lib/format";
import {
  CURRENT_USER_ID,
  getChatConversation,
  getUser,
  type ChatMessage,
} from "@/lib/mock";
import { useChatStore } from "@/lib/store/chat-store";
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
  const { editMessage, deleteMessage } = useChatStore();
  const { openTicket } = useTicketPanel();
  const [createdKey, setCreatedKey] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(message.body);
  const mine = message.authorId === CURRENT_USER_ID;

  const startEdit = () => {
    setDraft(message.body);
    setEditing(true);
  };

  const saveEdit = () => {
    if (draft.trim() && draft.trim() !== message.body) editMessage(message.id, draft);
    setEditing(false);
  };

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
          {message.editedAt && !message.deleted ? (
            <span className="text-caption text-grey-400">(edited)</span>
          ) : null}
        </div>

        {message.deleted ? (
          <p className="text-small text-grey-400 italic">Message deleted</p>
        ) : editing ? (
          <div className="mt-0.5 flex flex-col gap-1.5">
            <textarea
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  saveEdit();
                } else if (event.key === "Escape") {
                  setEditing(false);
                }
              }}
              rows={1}
              aria-label="Edit message"
              className="max-h-32 w-full resize-none rounded-md border border-accent-600 bg-grey-0 px-2 py-1 text-small text-grey-900 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveEdit}
                className="flex items-center gap-1 rounded-md bg-accent-600 px-2 py-0.5 text-caption font-medium text-grey-0 hover:bg-accent-700"
              >
                <Check className="size-3" strokeWidth={2.25} />
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-caption text-grey-600 hover:bg-grey-100"
              >
                <X className="size-3" strokeWidth={2.25} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <MessageBody
              text={message.body}
              ticketRefs={message.ticketRefs}
              className="text-small text-grey-800"
            />

            {message.attachments.length > 0 ? (
              <AttachmentGroup className="mt-1.5 flex flex-wrap">
                {message.attachments.map((attachment) => {
                  const Icon = attachmentIcon[attachment.kind];
                  return (
                    <AttachmentCard key={attachment.id} size="sm" className="w-[200px]">
                      <AttachmentMedia
                        variant={attachment.url ? "image" : "icon"}
                        className="rounded-md"
                      >
                        {attachment.url && attachment.kind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={attachment.url} alt={attachment.name} />
                        ) : attachment.url && attachment.kind === "video" ? (
                          <video src={attachment.url} muted />
                        ) : (
                          <Icon className="size-4 text-grey-400" strokeWidth={1.75} />
                        )}
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>{attachment.name}</AttachmentTitle>
                        <AttachmentDescription>
                          {formatBytes(attachment.size)}
                        </AttachmentDescription>
                      </AttachmentContent>
                    </AttachmentCard>
                  );
                })}
              </AttachmentGroup>
            ) : null}
          </>
        )}

        {!message.deleted ? <ChatReactions message={message} /> : null}

        {!compact && !message.deleted && replies.length > 0 ? (
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
            (createdKey || editing) && "opacity-100",
          )}
        >
          {!compact && !message.deleted && !editing ? (
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

          {mine && !message.deleted && !editing ? (
            <>
              <button
                type="button"
                onClick={startEdit}
                className="flex items-center gap-1 text-caption text-grey-500 hover:text-accent-700"
              >
                <Pencil className="size-3" strokeWidth={1.75} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => deleteMessage(message.id)}
                className="flex items-center gap-1 text-caption text-grey-500 hover:text-[color:var(--danger)]"
              >
                <Trash2 className="size-3" strokeWidth={1.75} />
                Delete
              </button>
            </>
          ) : null}

          {message.deleted || editing ? null : createdKey ? (
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
