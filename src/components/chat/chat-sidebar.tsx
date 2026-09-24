"use client";

import * as React from "react";
import { Hash, Lock, SquarePen, Search, Users } from "lucide-react";

import { NewConversationDialog } from "@/components/chat/new-conversation-dialog";
import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  conversationName,
  CURRENT_USER_ID,
  type ChatConversation,
  type ChatMessage,
} from "@/lib/mock";
import { useChatStore } from "@/lib/store/chat-store";
import { cn } from "@/lib/utils";

function ConversationRow({
  conversation,
  active,
  unread,
  last,
  onSelect,
}: {
  conversation: ChatConversation;
  active: boolean;
  unread: number;
  last: ChatMessage | undefined;
  onSelect: () => void;
}) {
  const name = conversationName(conversation);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
        active ? "bg-grey-150 text-grey-900" : "text-grey-600 hover:bg-grey-100 hover:text-grey-900",
      )}
    >
      {conversation.kind === "dm" ? (
        <UserAvatar
          userId={conversation.memberIds.find((id) => id !== CURRENT_USER_ID) ?? null}
          size="sm"
        />
      ) : conversation.kind === "team" ? (
        <Users className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
      ) : conversation.kind === "topic" && conversation.name === "incidents" ? (
        <Lock className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
      ) : (
        <Hash className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
      )}

      <span
        className={cn(
          "min-w-0 flex-1 truncate text-small",
          unread > 0 && !active && "font-semibold text-grey-900",
        )}
      >
        {name}
      </span>

      {last ? (
        <span className="shrink-0 text-caption text-grey-500">
          {new Date(last.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </span>
      ) : null}

      {unread > 0 ? (
        <span className="tnum flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-semibold text-grey-0">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </button>
  );
}

function Section({
  title,
  conversations,
  activeId,
  lastByConversation,
  onSelect,
}: {
  title: string;
  conversations: ChatConversation[];
  activeId: string | null;
  lastByConversation: Map<string, ChatMessage>;
  onSelect: (id: string) => void;
}) {
  const { unreadCount } = useChatStore();
  if (conversations.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="px-2 py-1 text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
        {title}
      </h3>
      {conversations.map((conversation) => (
        <ConversationRow
          key={conversation.id}
          conversation={conversation}
          active={conversation.id === activeId}
          unread={unreadCount(conversation.id)}
          last={lastByConversation.get(conversation.id)}
          onSelect={() => onSelect(conversation.id)}
        />
      ))}
    </div>
  );
}

export function ChatSidebar({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [newOpen, setNewOpen] = React.useState(false);
  const { conversations, messages } = useChatStore();

  const all = React.useMemo(
    () => conversations.filter((conversation) => conversation.memberIds.includes(CURRENT_USER_ID)),
    [conversations],
  );

  const lastByConversation = React.useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const message of messages) {
      const current = map.get(message.conversationId);
      if (!current || message.createdAt > current.createdAt) {
        map.set(message.conversationId, message);
      }
    }
    return map;
  }, [messages]);

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return all;
    return all.filter((conversation) =>
      conversationName(conversation).toLowerCase().includes(term),
    );
  }, [all, query]);

  const channels = filtered.filter(
    (c) => c.kind === "project" || c.kind === "topic",
  );
  const teams = filtered.filter((c) => c.kind === "team");
  const dms = filtered
    .filter((c) => c.kind === "dm")
    .sort((a, b) => {
      const aLast = lastByConversation.get(a.id)?.createdAt ?? "";
      const bLast = lastByConversation.get(b.id)?.createdAt ?? "";
      return bLast.localeCompare(aLast);
    });

  return (
    <div className="hairline-r flex w-[248px] shrink-0 flex-col bg-grey-50">
      <div className="hairline-b flex h-topbar shrink-0 items-center gap-2 px-3">
        <Search className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a channel or person"
          aria-label="Find a conversation"
          className="min-w-0 flex-1 bg-transparent text-small text-grey-900 placeholder:text-grey-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          aria-label="New message"
          title="New message"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-150 hover:text-grey-900"
        >
          <SquarePen className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2 py-3">
        <Section
          title="Channels"
          conversations={channels}
          activeId={activeId}
          lastByConversation={lastByConversation}
          onSelect={onSelect}
        />
        <Section
          title="Teams"
          conversations={teams}
          activeId={activeId}
          lastByConversation={lastByConversation}
          onSelect={onSelect}
        />
        <Section
          title="Direct messages"
          conversations={dms}
          activeId={activeId}
          lastByConversation={lastByConversation}
          onSelect={onSelect}
        />
      </div>

      <NewConversationDialog open={newOpen} onOpenChange={setNewOpen} onCreated={onSelect} />
    </div>
  );
}
