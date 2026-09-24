"use client";

import * as React from "react";
import {
  Archive,
  ArrowLeft,
  Forward as ForwardIcon,
  MailOpen,
  Paperclip,
  Reply,
  ReplyAll,
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
import { useCelebrate } from "@/components/shared/celebrate";
import { MessageBody } from "@/components/chat/message-body";
import { ComposeDialog, type ComposeInitial } from "@/components/mail/compose-dialog";
import { attachmentIcon, kindOf } from "@/components/tickets/comment-composer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { formatBytes, formatDateTime } from "@/lib/format";
import { draftMailReply } from "@/lib/assistant";
import { getMailThread, getUser, type Attachment, CURRENT_USER_ID } from "@/lib/mock";
import { useMailStore } from "@/lib/store/mail-store";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { getDefaultProjectId } from "@/lib/workspace-links";
import { cn } from "@/lib/utils";

function namesOf(ids: string[]) {
  return ids.map((id) => getUser(id)?.name.split(" ")[0] ?? id).join(", ");
}

function AttachmentPreviewDialog({
  attachment,
  onOpenChange,
}: {
  attachment: Attachment | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!attachment) return null;
  const Icon = attachmentIcon[attachment.kind];
  return (
    <Dialog open={Boolean(attachment)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-grey-400" strokeWidth={1.75} />
            <span className="truncate">{attachment.name}</span>
          </DialogTitle>
          <DialogDescription className="text-small text-grey-500">
            {formatBytes(attachment.size)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md bg-grey-50">
          {attachment.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={attachment.url} alt={attachment.name} className="size-full object-contain" />
          ) : (
            <Icon className="size-10 text-grey-300" strokeWidth={1.25} />
          )}
        </div>
        <p className="text-caption text-grey-500">
          This is a prototype — there is nothing behind this file to download.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function MailReader({
  threadId,
  onBack,
}: {
  threadId: string;
  onBack?: () => void;
}) {
  const thread = getMailThread(threadId);
  const { messages, sendReply, markRead, toggleStar, moveToFolder, deleteThread, bulkApply } =
    useMailStore();
  const { createTicket } = useTicketStore();
  const { openTicket } = useTicketPanel();
  const celebrate = useCelebrate();
  const [body, setBody] = React.useState("");
  const [createdKey, setCreatedKey] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<(Omit<Attachment, "id"> & { url?: string })[]>([]);
  const [replyMode, setReplyMode] = React.useState<"one" | "all">("all");
  const [forwardSeed, setForwardSeed] = React.useState<ComposeInitial | null>(null);
  const [previewing, setPreviewing] = React.useState<Attachment | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const replyRef = React.useRef<HTMLTextAreaElement>(null);

  // Switching threads should not carry an unsent reply (or its attachments)
  // from the previous one along with it.
  const [lastThreadId, setLastThreadId] = React.useState(threadId);
  if (threadId !== lastThreadId) {
    setLastThreadId(threadId);
    setBody("");
    setDrafts([]);
    setCreatedKey(null);
    setReplyMode("all");
  }

  const threadMessages = React.useMemo(
    () =>
      messages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages, threadId],
  );
  const lastMessage = threadMessages[threadMessages.length - 1];

  // Both hooks below need `thread`, which isn't known until after the early
  // return — so each guards internally instead, keeping every hook call
  // itself unconditional.
  const openForward = React.useCallback(() => {
    if (!thread) return;
    const source = lastMessage;
    const senderName = source?.fromId
      ? (getUser(source.fromId)?.name ?? "Unknown")
      : (thread.externalParticipant?.name ?? "Unknown");
    const quoted = [
      "---------- Forwarded message ----------",
      `From: ${senderName}`,
      source ? `Date: ${formatDateTime(source.createdAt)}` : null,
      `Subject: ${thread.subject}`,
      "",
      source?.body ?? "",
    ]
      .filter((line) => line !== null)
      .join("\n");
    setForwardSeed({
      subject: `Fwd: ${thread.subject}`,
      body: quoted,
      attachments: source?.attachments.map(({ name, size, kind, url }) => ({ name, size, kind, url })) ?? [],
    });
  }, [thread, lastMessage]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "r") {
        event.preventDefault();
        replyRef.current?.focus();
      } else if (key === "f") {
        event.preventDefault();
        openForward();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openForward]);

  if (!thread) {
    return (
      <div className="flex flex-1 items-center justify-center text-small text-grey-500">
        Pick an email to read it.
      </div>
    );
  }

  const otherParticipants = thread.participantIds.filter((id) => id !== CURRENT_USER_ID);
  const lastSenderId = lastMessage?.fromId ?? null;
  const lastCc = lastMessage?.ccIds.filter((id) => id !== CURRENT_USER_ID) ?? [];
  const showReplyModeToggle = otherParticipants.length > 1 || lastCc.length > 0;

  const replyRecipients =
    replyMode === "all"
      ? { toIds: otherParticipants, ccIds: lastCc }
      : {
          toIds: lastSenderId && lastSenderId !== CURRENT_USER_ID ? [lastSenderId] : otherParticipants.slice(0, 1),
          ccIds: [] as string[],
        };

  const submit = () => {
    if (!body.trim() && drafts.length === 0) return;
    sendReply(threadId, body, {
      toIds: replyRecipients.toIds,
      ccIds: replyRecipients.ccIds,
      attachments: drafts.map(({ name, size, kind, url }) => ({ name, size, kind, url })),
    });
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

  const archiveWithUndo = () => {
    const priorFolder = thread.folder;
    moveToFolder(thread.id, "archive");
    celebrate("🗄", `"${thread.subject}" archived`, () =>
      bulkApply([thread.id], { folder: priorFolder }),
    );
  };

  const deleteWithUndo = () => {
    const priorFolder = thread.folder;
    deleteThread(thread.id);
    celebrate("🗑", `"${thread.subject}" deleted`, () =>
      bulkApply([thread.id], { folder: priorFolder }),
    );
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
          onClick={archiveWithUndo}
          aria-label="Archive"
          title="Archive"
          className="flex size-7 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-grey-900"
        >
          <Archive className="size-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={deleteWithUndo}
          aria-label="Delete"
          title="Delete"
          className="flex size-7 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-[color:var(--danger)]"
        >
          <Trash2 className="size-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={openForward}
          aria-label="Forward"
          title="Forward"
          className="flex size-7 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-grey-900"
        >
          <ForwardIcon className="size-4" strokeWidth={1.75} />
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
            const to = message.toIds.filter((id) => id !== message.fromId);
            const cc = message.ccIds;
            const bcc = message.fromId === CURRENT_USER_ID ? message.bccIds : [];
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
                  {to.length > 0 || cc.length > 0 || bcc.length > 0 ? (
                    <p className="text-caption text-grey-500">
                      {to.length > 0 ? <>to {namesOf(to)}</> : null}
                      {cc.length > 0 ? <> · cc {namesOf(cc)}</> : null}
                      {bcc.length > 0 ? <> · bcc {namesOf(bcc)}</> : null}
                    </p>
                  ) : null}
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
                          <button
                            key={attachment.id}
                            type="button"
                            onClick={() => setPreviewing(attachment)}
                            className="text-left"
                          >
                            <AttachmentCard size="sm" className="w-[200px] hover:border-grey-300">
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
                          </button>
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
        {showReplyModeToggle ? (
          <div className="ml-10 flex w-fit rounded-md border border-grey-200 p-0.5">
            <button
              type="button"
              onClick={() => setReplyMode("one")}
              className={cn(
                "flex h-6 items-center gap-1 rounded-[5px] px-2 text-caption font-medium transition-colors",
                replyMode === "one" ? "bg-grey-150 text-grey-900" : "text-grey-600 hover:text-grey-900",
              )}
            >
              <Reply className="size-3" strokeWidth={1.75} />
              Reply
            </button>
            <button
              type="button"
              onClick={() => setReplyMode("all")}
              className={cn(
                "flex h-6 items-center gap-1 rounded-[5px] px-2 text-caption font-medium transition-colors",
                replyMode === "all" ? "bg-grey-150 text-grey-900" : "text-grey-600 hover:text-grey-900",
              )}
            >
              <ReplyAll className="size-3" strokeWidth={1.75} />
              Reply all
            </button>
          </div>
        ) : null}

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
              ref={replyRef}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder={
                replyMode === "all" && otherParticipants.length > 1
                  ? `Reply all to ${namesOf(otherParticipants)}`
                  : "Write a reply"
              }
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

      <AttachmentPreviewDialog
        attachment={previewing}
        onOpenChange={(open) => !open && setPreviewing(null)}
      />

      <ComposeDialog
        open={forwardSeed !== null}
        onOpenChange={(open) => !open && setForwardSeed(null)}
        initial={forwardSeed ?? undefined}
      />
    </div>
  );
}
