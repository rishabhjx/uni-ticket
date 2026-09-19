"use client";

import * as React from "react";

const READ_KEY = "uni.inbox.read";

/**
 * Read state used to live in the notification popover, which is mounted inside
 * the page header — so it remounted on every navigation and everything went
 * unread again. It belongs above the routes, and it should survive a reload.
 */
type InboxValue = {
  readIds: Set<string>;
  markRead: (ids: string[]) => void;
};

const InboxContext = React.createContext<InboxValue | null>(null);

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const [readIds, setReadIds] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(READ_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  const markRead = React.useCallback((ids: string[]) => {
    setReadIds((current) => {
      const next = Array.from(new Set([...current, ...ids]));
      try {
        window.localStorage.setItem(READ_KEY, JSON.stringify(next));
      } catch {
        // Read state is a convenience, not something worth failing over.
      }
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ readIds: new Set(readIds), markRead }),
    [readIds, markRead],
  );

  return <InboxContext value={value}>{children}</InboxContext>;
}

export function useInbox() {
  const context = React.use(InboxContext);
  if (!context) throw new Error("useInbox must be used inside <InboxProvider>");
  return context;
}
