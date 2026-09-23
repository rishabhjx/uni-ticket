"use client";

import * as React from "react";

import {
  chatConversations as seedConversations,
  chatMessages as seedMessages,
  seedLastReadAt,
  CURRENT_USER_ID,
  type Attachment,
  type ChatConversation,
  type ChatMessage,
} from "@/lib/mock";

const TICKET_KEY_PATTERN = /\b[A-Z]{2,6}-\d{1,5}\b/g;

type ChatStoreValue = {
  conversations: ChatConversation[];
  messages: ChatMessage[];
  lastReadAt: Record<string, string>;
  /** Every ticket key currently known, so a typed mention only links if real. */
  sendMessage: (
    conversationId: string,
    body: string,
    opts?: { parentId?: string | null; attachments?: Omit<Attachment, "id">[] },
  ) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  markRead: (conversationId: string) => void;
  unreadCount: (conversationId: string) => number;
};

const ChatStoreContext = React.createContext<ChatStoreValue | null>(null);

export function ChatStoreProvider({
  children,
  knownTicketKeys,
}: {
  children: React.ReactNode;
  /** Passed in rather than imported, so a message only cross-links a ticket
   *  that genuinely exists in the ticket store right now. */
  knownTicketKeys: Set<string>;
}) {
  const [conversations] = React.useState<ChatConversation[]>(seedConversations);
  const [messages, setMessages] = React.useState<ChatMessage[]>(seedMessages);
  const [lastReadAt, setLastReadAt] = React.useState<Record<string, string>>(
    seedLastReadAt,
  );

  const seq = React.useRef(0);

  const sendMessage = React.useCallback(
    (
      conversationId: string,
      body: string,
      opts: { parentId?: string | null; attachments?: Omit<Attachment, "id">[] } = {},
    ) => {
      const trimmed = body.trim();
      if (!trimmed && (!opts.attachments || opts.attachments.length === 0)) return;
      seq.current += 1;
      const at = new Date().toISOString();

      const ticketRefs = [...trimmed.matchAll(TICKET_KEY_PATTERN)]
        .map((match) => match[0])
        .filter((key) => knownTicketKeys.has(key));

      const message: ChatMessage = {
        id: `msg-local-${seq.current}`,
        conversationId,
        authorId: CURRENT_USER_ID,
        body: trimmed,
        createdAt: at,
        editedAt: null,
        parentId: opts.parentId ?? null,
        reactions: {},
        attachments: (opts.attachments ?? []).map((file, index) => ({
          ...file,
          id: `chat-a-${seq.current}-${index}`,
        })),
        ticketRefs: [...new Set(ticketRefs)],
      };

      setMessages((current) => [...current, message]);
      setLastReadAt((current) => ({ ...current, [conversationId]: at }));
    },
    [knownTicketKeys],
  );

  const toggleReaction = React.useCallback((messageId: string, emoji: string) => {
    setMessages((current) =>
      current.map((message) => {
        if (message.id !== messageId) return message;
        const reacted = message.reactions[emoji] ?? [];
        const mine = reacted.includes(CURRENT_USER_ID);
        const next = mine
          ? reacted.filter((id) => id !== CURRENT_USER_ID)
          : [...reacted, CURRENT_USER_ID];
        const reactions = { ...message.reactions };
        if (next.length === 0) delete reactions[emoji];
        else reactions[emoji] = next;
        return { ...message, reactions };
      }),
    );
  }, []);

  const markRead = React.useCallback((conversationId: string) => {
    setLastReadAt((current) => ({
      ...current,
      [conversationId]: new Date().toISOString(),
    }));
  }, []);

  const unreadCount = React.useCallback(
    (conversationId: string) => {
      const cutoff = lastReadAt[conversationId];
      if (!cutoff) return 0;
      return messages.filter(
        (message) =>
          message.conversationId === conversationId &&
          message.authorId !== CURRENT_USER_ID &&
          message.createdAt > cutoff,
      ).length;
    },
    [messages, lastReadAt],
  );

  const value = React.useMemo(
    () => ({
      conversations,
      messages,
      lastReadAt,
      sendMessage,
      toggleReaction,
      markRead,
      unreadCount,
    }),
    [conversations, messages, lastReadAt, sendMessage, toggleReaction, markRead, unreadCount],
  );

  return <ChatStoreContext value={value}>{children}</ChatStoreContext>;
}

export function useChatStore() {
  const context = React.use(ChatStoreContext);
  if (!context) throw new Error("useChatStore must be used inside <ChatStoreProvider>");
  return context;
}
