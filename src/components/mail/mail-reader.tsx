"use client";

import * as React from "react";
import {
  Archive,
  ArrowLeft,
  MailOpen,
  Paperclip,
  Send,
  Sparkles,
  Star,
  TicketPlus,
  Trash2,
} from "lucide-react";

import {
  Attachment as AttachmentCard,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/reui/attachment";
import { MessageBody } from "@/components/chat/message-body";
import { attachmentIcon, kindOf } from "@/components/tickets/comment-composer";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { formatBytes, formatDateTime } from "@/lib/format";
import { draftMailReply } from "@/lib/assistant";
import { getMailThread, getUser, type Attachment, CURRENT_USER_ID } from "@/lib/mock";
import { useMailStore } from "@/lib/store/mail-store";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { getDefaultProjectId } from "@/lib/workspace-links";

export function MailReader({
  threadId,
  onBack,
}: {
  threadId: string;
  onBack?: () => void;
}) {
  const thread = getMailThread(threadId);
  const { messages, sendReply, markRead, toggleStar, moveToFolder, deleteThread } = useMailStore();
  const { createTicket } = useTicketStore();
  const { openTicket } = useTicketPanel();
  const [body, setBody] = React.useState("");
  const [createdKey, setCreatedKey] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<(Omit<Attachment, "id"> & { url?: string })[]>([]);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Switching threads should not carry an unsent reply (or its attachments)
  // from the previous one along with it.
  const [lastThreadId, setLastThreadId] = React.useState(threadId);
  if (threadId !== lastThreadId) {
    setLastThreadId(threadId);
    setBody("");
    setDrafts([]);
    setCreatedKey(null);
  }

  const threadMessages = React.useMemo(
    () =>
      messages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages, threadId],
  );

  if (!thread) {
    return (
      <div className="flex flex-1 items-center justify-center text-small text-grey-500">
        Pick an email to read it.
      </div>
    );
  }

  const submit = () => {
    if (!body.trim() && drafts.length === 0) return;
    sendReply(
      threadId,
      body,
      drafts.map(({ name, size, kind, url }) => ({ name, size, kind, url })),
    );
    setBody("");
    setDrafts([]);
  };

  const convertToTicket = () => {
    const projectId = getDefaultProjectId();
    const firstMessage = threadMessages[0];
    const ticket = createTicket({
      projectId,
      title: thread.subject,
      description: firstMessage?.body ?? "",
      type: "request",
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
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="hairline-b flex h-topbar shrink-0 items-center gap-1 px-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to list"
            className="flex size-7 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-grey-900 md:hidden"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
          </button>
        ) : null}
        <h1 className="min-w-0 flex-1 truncate px-1 text-small font-semibold text-grey-900">
          {thread.subject}
        </h1>

        <button
          type="button"
          onClick={() => toggleStar(thread.id)}
          aria-label={thread.starred ? "Unstar" : "Star"}
          className="flex size-7 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-grey-900"
        >
          <Star
            className={"size-4 " + (thread.starred ? "fill-current text-accent-600" : "")}
            strokeWidth={1.75}
          />
        </button>
        <button
          type="button"
          onClick={() => markRead(thread.id, false)}
          aria-label="Mark as unread"
          title="Mark as unread"
          className="flex size-7 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-grey-900"
        >
          <MailOpen className="size-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => moveToFolder(thread.id, "archive")}
          aria-label="Archive"
          title="Archive"
          className="flex size-7 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-grey-900"
        >
          <Archive className="size-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => deleteThread(thread.id)}
          aria-label="Delete"
          title="Delete"
          className="flex size-7 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-[color:var(--danger)]"
        >
          <Trash2 className="size-4" strokeWidth={1.75} />
        </button>

        {createdKey ? (
          <button
            type="button"
            onClick={() => openTicket(createdKey)}
            className="tnum flex h-7 items-center gap-1.5 rounded-md bg-grey-100 px-2 text-caption font-medium text-grey-700 hover:bg-grey-150"
          >
            Open {createdKey}
          </button>
        ) : thread.ticketRefs.length > 0 ? (
          <button
            type="button"
            onClick={() => openTicket(thread.ticketRefs[0])}
            className="tnum flex h-7 items-center gap-1.5 rounded-md bg-accent-50 px-2 text-caption font-medium text-accent-700 hover:bg-accent-100"
          >
            {thread.ticketRefs[0]}
          </button>
        ) : (
          <button
            type="button"
            onClick={convertToTicket}
            title="Create a ticket from this email"
            className="flex h-7 items-center gap-1.5 rounded-md border border-grey-200 px-2 text-caption font-medium text-grey-700 hover:border-grey-300"
          >
            <TicketPlus className="size-3.5" strokeWidth={1.75} />
            Turn into ticket
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-5">
          {threadMessages.map((message) => {
            const sender = message.fromId
              ? getUser(message.fromId)
              : thread.externalParticipant;
            return (
              <div key={message.id} className="flex gap-3">
                <UserAvatar userId={message.fromId} size="md" className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-small font-semibold text-grey-900">
                      {sender?.name ?? "Unknown"}
                    </span>
                    <span className="text-caption text-grey-500">
                      {formatDateTime(message.createdAt)}
                    </span>
                  </div>
                  <MessageBody
                    text={message.body}
                    ticketRefs={thread.ticketRefs}
                    className="mt-1 text-small text-grey-800"
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
                              {attachment.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={attachment.url} alt={attachment.name} />
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
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hairline-t flex flex-col gap-2 px-4 py-3">
        {drafts.length > 0 ? (
          <AttachmentGroup className="flex flex-wrap pl-10">
            {drafts.map((draft, index) => {
              const Icon = attachmentIcon[draft.kind];
              return (
                <AttachmentCard key={`${draft.name}-${index}`} size="sm" className="w-[190px]">
                  <AttachmentMedia variant={draft.url ? "image" : "icon"} className="rounded-md">
                    {draft.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={draft.url} alt={draft.name} />
                    ) : (
                      <Icon className="size-4 text-grey-400" strokeWidth={1.75} />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{draft.name}</AttachmentTitle>
                    <AttachmentDescription>{formatBytes(draft.size)}</AttachmentDescription>
                  </AttachmentContent>
                </AttachmentCard>
              );
            })}
          </AttachmentGroup>
        ) : null}
        <div className="flex items-end gap-2">
          <UserAvatar userId={CURRENT_USER_ID} size="md" className="mb-1" />
          <div className="flex min-w-0 flex-1 items-end gap-1.5 rounded-md border border-grey-200 bg-grey-0 px-2.5 py-1.5 transition-colors focus-within:border-accent-600">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder="Write a reply"
              aria-label="Reply"
              className="min-h-6 w-full resize-none bg-transparent text-small text-grey-900 placeholder:text-grey-500 focus:outline-none"
            />
            <input
              ref={fileRef}
              type="file"
              multiple
              className="sr-only"
              onChange={(event) => {
                const files = event.target.files;
                if (files) {
                  const next = Array.from(files).map((file) => {
                    const kind = kindOf(file);
                    return {
                      name: file.name,
                      size: file.size,
                      kind,
                      url: kind === "image" ? URL.createObjectURL(file) : undefined,
                    };
                  });
                  setDrafts((current) => [...current, ...next]);
                }
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Attach a file"
              title="Attach a file"
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              <Paperclip className="size-3.5" strokeWidth={1.75} />
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              setBody(draftMailReply(thread.subject, threadMessages[threadMessages.length - 1]?.body ?? ""))
            }
            title="Draft a reply with AI (simulated)"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-accent-600"
          >
            <Sparkles className="size-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!body.trim() && drafts.length === 0}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-100 disabled:text-grey-400"
          >
            <Send className="size-3.5" strokeWidth={1.75} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
