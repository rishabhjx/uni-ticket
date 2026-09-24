"use client";

import * as React from "react";

import {
  mailThreads as seedThreads,
  mailMessages as seedMessages,
  CURRENT_USER_ID,
  type Attachment,
  type MailFolder,
  type MailMessage,
  type MailThread,
} from "@/lib/mock";

export type NewMailInput = {
  subject: string;
  body: string;
  toIds: string[];
  ccIds?: string[];
  bccIds?: string[];
  externalEmail?: string;
  ticketRefs?: string[];
  attachments?: Omit<Attachment, "id">[];
  /** Composed but not sent — lands in Drafts instead of Sent. */
  asDraft?: boolean;
};

export type ReplyInput = {
  toIds?: string[];
  ccIds?: string[];
  attachments?: Omit<Attachment, "id">[];
};

type MailStoreValue = {
  threads: MailThread[];
  messages: MailMessage[];
  sendReply: (threadId: string, body: string, opts?: ReplyInput) => void;
  markRead: (threadId: string, read?: boolean) => void;
  toggleStar: (threadId: string) => void;
  moveToFolder: (threadId: string, folder: MailFolder) => void;
  deleteThread: (threadId: string) => void;
  /** Removes the thread and its messages outright. */
  permanentlyDelete: (threadId: string) => void;
  /** Permanently deletes every thread currently in Trash. */
  emptyTrash: () => void;
  /** Undoes a permanentlyDelete/emptyTrash — the caller snapshots what it
   *  removed and hands it back here, same "one level back" every other
   *  destructive action in this app gets. */
  restoreThreads: (threads: MailThread[], messages: MailMessage[]) => void;
  /** One state update for a whole selection — mark read, archive, trash, star. */
  bulkApply: (
    threadIds: string[],
    patch: Partial<Pick<MailThread, "folder" | "read" | "starred">>,
  ) => void;
  compose: (input: NewMailInput) => MailThread;
};

const MailStoreContext = React.createContext<MailStoreValue | null>(null);

export function MailStoreProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = React.useState<MailThread[]>(seedThreads);
  const [messages, setMessages] = React.useState<MailMessage[]>(seedMessages);
  const seq = React.useRef(0);

  const sendReply = React.useCallback(
    (threadId: string, body: string, opts: ReplyInput = {}) => {
      const trimmed = body.trim();
      const attachments = opts.attachments ?? [];
      if (!trimmed && attachments.length === 0) return;
      seq.current += 1;
      const at = new Date().toISOString();

      setMessages((current) => [
        ...current,
        {
          id: `mail-local-${seq.current}`,
          threadId,
          fromId: CURRENT_USER_ID,
          toIds: opts.toIds ?? [],
          ccIds: opts.ccIds ?? [],
          bccIds: [],
          body: trimmed,
          createdAt: at,
          attachments: attachments.map((file, index) => ({
            ...file,
            id: `mail-a-${seq.current}-${index}`,
          })),
        },
      ]);
      setThreads((current) =>
        current.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                updatedAt: at,
                folder: thread.folder === "drafts" ? "sent" : thread.folder,
                // A reply can widen who's in the thread (replying to someone
                // cc'd but not yet a full participant) — never narrow it.
                participantIds: [
                  ...new Set([
                    ...thread.participantIds,
                    ...(opts.toIds ?? []),
                    ...(opts.ccIds ?? []),
                  ]),
                ],
              }
            : thread,
        ),
      );
    },
    [],
  );

  const markRead = React.useCallback((threadId: string, read = true) => {
    setThreads((current) =>
      current.map((thread) => (thread.id === threadId ? { ...thread, read } : thread)),
    );
  }, []);

  const toggleStar = React.useCallback((threadId: string) => {
    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId ? { ...thread, starred: !thread.starred } : thread,
      ),
    );
  }, []);

  const moveToFolder = React.useCallback((threadId: string, folder: MailFolder) => {
    setThreads((current) =>
      current.map((thread) => (thread.id === threadId ? { ...thread, folder } : thread)),
    );
  }, []);

  const deleteThread = React.useCallback((threadId: string) => {
    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId ? { ...thread, folder: "trash" } : thread,
      ),
    );
  }, []);

  const permanentlyDelete = React.useCallback((threadId: string) => {
    setThreads((current) => current.filter((thread) => thread.id !== threadId));
    setMessages((current) => current.filter((message) => message.threadId !== threadId));
  }, []);

  const emptyTrash = React.useCallback(() => {
    setThreads((current) => {
      const trashed = new Set(
        current.filter((thread) => thread.folder === "trash").map((thread) => thread.id),
      );
      setMessages((messagesCurrent) =>
        messagesCurrent.filter((message) => !trashed.has(message.threadId)),
      );
      return current.filter((thread) => thread.folder !== "trash");
    });
  }, []);

  const restoreThreads = React.useCallback(
    (restoredThreads: MailThread[], restoredMessages: MailMessage[]) => {
      setThreads((current) => [...restoredThreads, ...current]);
      setMessages((current) => [...restoredMessages, ...current]);
    },
    [],
  );

  const bulkApply = React.useCallback(
    (threadIds: string[], patch: Partial<Pick<MailThread, "folder" | "read" | "starred">>) => {
      const ids = new Set(threadIds);
      setThreads((current) =>
        current.map((thread) => (ids.has(thread.id) ? { ...thread, ...patch } : thread)),
      );
    },
    [],
  );

  const compose = React.useCallback((input: NewMailInput) => {
    seq.current += 1;
    const at = new Date().toISOString();
    const id = `mail-new-${seq.current}`;
    const folder: MailFolder = input.asDraft ? "drafts" : "sent";
    const ccIds = input.ccIds ?? [];

    const thread: MailThread = {
      id,
      subject: input.subject.trim() || "(no subject)",
      participantIds: [...new Set([CURRENT_USER_ID, ...input.toIds, ...ccIds])],
      externalParticipant: input.externalEmail
        ? { name: input.externalEmail, email: input.externalEmail }
        : null,
      folder,
      read: true,
      starred: false,
      ticketRefs: input.ticketRefs ?? [],
      createdAt: at,
      updatedAt: at,
    };

    setThreads((current) => [thread, ...current]);
    setMessages((current) => [
      ...current,
      {
        id: `${id}-m1`,
        threadId: id,
        fromId: CURRENT_USER_ID,
        toIds: input.toIds,
        ccIds,
        bccIds: input.bccIds ?? [],
        body: input.body.trim(),
        createdAt: at,
        attachments: (input.attachments ?? []).map((file, index) => ({
          ...file,
          id: `${id}-a${index}`,
        })),
      },
    ]);

    return thread;
  }, []);

  const value = React.useMemo(
    () => ({
      threads,
      messages,
      sendReply,
      markRead,
      toggleStar,
      moveToFolder,
      deleteThread,
      permanentlyDelete,
      emptyTrash,
      restoreThreads,
      bulkApply,
      compose,
    }),
    [
      threads,
      messages,
      sendReply,
      markRead,
      toggleStar,
      moveToFolder,
      deleteThread,
      permanentlyDelete,
      emptyTrash,
      restoreThreads,
      bulkApply,
      compose,
    ],
  );

  return <MailStoreContext value={value}>{children}</MailStoreContext>;
}

export function useMailStore() {
  const context = React.use(MailStoreContext);
  if (!context) throw new Error("useMailStore must be used inside <MailStoreProvider>");
  return context;
}
