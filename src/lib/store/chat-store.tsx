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
  editMessage: (messageId: string, body: string) => void;
  deleteMessage: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  markRead: (conversationId: string) => void;
  unreadCount: (conversationId: string) => number;
  /** Finds (or silently reuses) the 1:1 with this person and returns its id. */
  startDm: (userId: string) => string;
  createChannel: (name: string, memberIds: string[]) => ChatConversation;
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
  const [conversations, setConversations] =
    React.useState<ChatConversation[]>(seedConversations);
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

  const editMessage = React.useCallback((messageId: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, body: trimmed, editedAt: new Date().toISOString() }
          : message,
      ),
    );
  }, []);

  const deleteMessage = React.useCallback((messageId: string) => {
    // Replies stay — deleting the root of a thread should not orphan its
    // conversation the way removing the row outright would.
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, body: "", attachments: [], reactions: {}, deleted: true }
          : message,
      ),
    );
  }, []);

  const startDm = React.useCallback(
    (userId: string) => {
      const id = `dm-${[CURRENT_USER_ID, userId].sort().join("-")}`;
      setConversations((current) => {
        if (current.some((conversation) => conversation.id === id)) return current;
        const conversation: ChatConversation = {
          id,
          name: "",
          topic: "",
          kind: "dm",
          projectId: null,
          memberIds: [CURRENT_USER_ID, userId],
        };
        return [...current, conversation];
      });
      return id;
    },
    [],
  );

  const createChannel = React.useCallback((name: string, memberIds: string[]) => {
    seq.current += 1;
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    const conversation: ChatConversation = {
      id: `chan-local-${seq.current}`,
      name: slug || `channel-${seq.current}`,
      topic: "",
      kind: "topic",
      projectId: null,
      memberIds: [...new Set([CURRENT_USER_ID, ...memberIds])],
    };
    setConversations((current) => [...current, conversation]);
    return conversation;
  }, []);

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
      editMessage,
      deleteMessage,
      toggleReaction,
      markRead,
      unreadCount,
      startDm,
      createChannel,
    }),
    [
      conversations,
      messages,
      lastReadAt,
      sendMessage,
      editMessage,
      deleteMessage,
      toggleReaction,
      markRead,
      unreadCount,
      startDm,
      createChannel,
    ],
  );

  return <ChatStoreContext value={value}>{children}</ChatStoreContext>;
}

export function useChatStore() {
  const context = React.use(ChatStoreContext);
  if (!context) throw new Error("useChatStore must be used inside <ChatStoreProvider>");
  return context;
}
