"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Hash, Mail as MailIcon, MessagesSquare, Video } from "lucide-react";

import { formatRelative } from "@/lib/format";
import { conversationName, getChatConversation, threadDisplayName, type Ticket } from "@/lib/mock";
import { useChatStore } from "@/lib/store/chat-store";
import { useFilesStore } from "@/lib/store/files-store";
import { useMailStore } from "@/lib/store/mail-store";
import { useMeetingsStore } from "@/lib/store/meetings-store";

function Row({
  icon: Icon,
  title,
  meta,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md border border-grey-200 px-2.5 py-1.5 text-left transition-colors hover:border-grey-300 hover:bg-grey-50"
    >
      <Icon className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate text-small text-grey-800">{title}</span>
      <span className="shrink-0 text-caption text-grey-500">{meta}</span>
    </button>
  );
}

/**
 * Everything the rest of the workspace knows about this ticket, in one place
 * — the payoff of every other app sharing one ticket-key format. A ticket
 * with nothing here just hides the section rather than showing four empty
 * states.
 */
export function ConnectionsBlock({ ticket }: { ticket: Ticket }) {
  const router = useRouter();
  const { messages: chatMessages } = useChatStore();
  const { threads: mailThreads } = useMailStore();
  const { meetings } = useMeetingsStore();
  const { files } = useFilesStore();

  const linkedMessages = React.useMemo(
    () => chatMessages.filter((m) => m.ticketRefs.includes(ticket.key)),
    [chatMessages, ticket.key],
  );
  const linkedThreads = React.useMemo(
    () => mailThreads.filter((t) => t.ticketRefs.includes(ticket.key)),
    [mailThreads, ticket.key],
  );
  const linkedMeetings = React.useMemo(
    () => meetings.filter((m) => m.ticketRefs.includes(ticket.key)),
    [meetings, ticket.key],
  );
  const linkedFiles = React.useMemo(
    () => files.filter((f) => f.ticketRefs.includes(ticket.key)),
    [files, ticket.key],
  );

  const hasAnything =
    linkedMessages.length > 0 ||
    linkedThreads.length > 0 ||
    linkedMeetings.length > 0 ||
    linkedFiles.length > 0;

  if (!hasAnything) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
        Connections
      </h3>

      {linkedMessages.map((message) => {
        const conversation = getChatConversation(message.conversationId);
        if (!conversation) return null;
        return (
          <Row
            key={message.id}
            icon={conversation.kind === "dm" ? MessagesSquare : Hash}
            title={`${conversationName(conversation)} — ${message.body}`}
            meta={formatRelative(message.createdAt)}
            onClick={() => {
              const query = new URLSearchParams({ c: conversation.id });
              if (message.parentId) query.set("thread", message.parentId);
              router.push(`/chat?${query.toString()}`);
            }}
          />
        );
      })}

      {linkedThreads.map((thread) => (
        <Row
          key={thread.id}
          icon={MailIcon}
          title={`${threadDisplayName(thread)} — ${thread.subject}`}
          meta={formatRelative(thread.updatedAt)}
          onClick={() =>
            router.push(`/mail?${new URLSearchParams({ folder: thread.folder, t: thread.id }).toString()}`)
          }
        />
      ))}

      {linkedMeetings.map((meeting) => (
        <Row
          key={meeting.id}
          icon={Video}
          title={meeting.title}
          meta={formatRelative(meeting.startsAt)}
          onClick={() => router.push(`/meetings?${new URLSearchParams({ open: meeting.id }).toString()}`)}
        />
      ))}

      {linkedFiles.map((file) => (
        <Row
          key={file.id}
          icon={FolderOpen}
          title={file.name}
          meta={formatRelative(file.updatedAt)}
          onClick={() => {
            const query = new URLSearchParams({ drive: file.projectId ?? "mine" });
            if (file.parentId) query.set("folder", file.parentId);
            router.push(`/files?${query.toString()}`);
          }}
        />
      ))}
    </div>
  );
}
