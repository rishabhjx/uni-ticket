"use client";

import * as React from "react";

const STORAGE_KEY = "uni.sidebar.open";

/**
 * The sidebar's open state lives in localStorage, which is an external store.
 * useSyncExternalStore reads it without a setState-in-effect and hydrates
 * cleanly: the server snapshot is always "open".
 */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) !== "false";
}

function getServerSnapshot() {
  return true;
}

function writeSidebarOpen(open: boolean) {
  window.localStorage.setItem(STORAGE_KEY, String(open));
  for (const listener of listeners) listener();
}

type ShellContextValue = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
};

const ShellContext = React.createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const sidebarOpen = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setSidebarOpen = React.useCallback((open: boolean) => {
    writeSidebarOpen(open);
  }, []);
  const toggleSidebar = React.useCallback(() => {
    writeSidebarOpen(window.localStorage.getItem(STORAGE_KEY) === "false");
  }, []);

  // ⌘B / Ctrl+B — the one global shortcut in the shell.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  const value = React.useMemo(
    () => ({ sidebarOpen, toggleSidebar, setSidebarOpen }),
    [sidebarOpen, toggleSidebar, setSidebarOpen],
  );

  return <ShellContext value={value}>{children}</ShellContext>;
}

export function useShell() {
  const context = React.use(ShellContext);
  if (!context) throw new Error("useShell must be used inside <ShellProvider>");
  return context;
}
