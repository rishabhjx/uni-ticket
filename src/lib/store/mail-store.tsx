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
  externalEmail?: string;
  ticketRefs?: string[];
  attachments?: Omit<Attachment, "id">[];
  /** Composed but not sent — lands in Drafts instead of Sent. */
  asDraft?: boolean;
};

type MailStoreValue = {
  threads: MailThread[];
  messages: MailMessage[];
  sendReply: (
    threadId: string,
    body: string,
    attachments?: Omit<Attachment, "id">[],
  ) => void;
  markRead: (threadId: string, read?: boolean) => void;
  toggleStar: (threadId: string) => void;
  moveToFolder: (threadId: string, folder: MailFolder) => void;
  deleteThread: (threadId: string) => void;
  compose: (input: NewMailInput) => MailThread;
};

const MailStoreContext = React.createContext<MailStoreValue | null>(null);

export function MailStoreProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = React.useState<MailThread[]>(seedThreads);
  const [messages, setMessages] = React.useState<MailMessage[]>(seedMessages);
  const seq = React.useRef(0);

  const sendReply = React.useCallback(
    (threadId: string, body: string, attachments: Omit<Attachment, "id">[] = []) => {
      const trimmed = body.trim();
      if (!trimmed && attachments.length === 0) return;
      seq.current += 1;
      const at = new Date().toISOString();

      setMessages((current) => [
        ...current,
        {
          id: `mail-local-${seq.current}`,
          threadId,
          fromId: CURRENT_USER_ID,
          toIds: [],
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
            ? { ...thread, updatedAt: at, folder: thread.folder === "drafts" ? "sent" : thread.folder }
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

  const compose = React.useCallback((input: NewMailInput) => {
    seq.current += 1;
    const at = new Date().toISOString();
    const id = `mail-new-${seq.current}`;
    const folder: MailFolder = input.asDraft ? "drafts" : "sent";

    const thread: MailThread = {
      id,
      subject: input.subject.trim() || "(no subject)",
      participantIds: [CURRENT_USER_ID, ...input.toIds],
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
      compose,
    }),
    [threads, messages, sendReply, markRead, toggleStar, moveToFolder, deleteThread, compose],
  );

  return <MailStoreContext value={value}>{children}</MailStoreContext>;
}

export function useMailStore() {
  const context = React.use(MailStoreContext);
  if (!context) throw new Error("useMailStore must be used inside <MailStoreProvider>");
  return context;
}
