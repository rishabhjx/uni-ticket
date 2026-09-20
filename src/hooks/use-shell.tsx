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
  createOpen: boolean;
  openCreate: () => void;
  setCreateOpen: (open: boolean) => void;
  createProjectOpen: boolean;
  openCreateProject: () => void;
  setCreateProjectOpen: (open: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
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

  const [createOpen, setCreateOpen] = React.useState(false);
  const openCreate = React.useCallback(() => setCreateOpen(true), []);
  const [createProjectOpen, setCreateProjectOpen] = React.useState(false);
  const openCreateProject = React.useCallback(
    () => setCreateProjectOpen(true),
    [],
  );

  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  // ⌘B toggles the sidebar; C starts a ticket and ? lists the rest, the way
  // every tracker does.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        setCreateOpen(true);
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  const value = React.useMemo(
    () => ({
      sidebarOpen,
      toggleSidebar,
      setSidebarOpen,
      createOpen,
      openCreate,
      setCreateOpen,
      createProjectOpen,
      openCreateProject,
      setCreateProjectOpen,
      shortcutsOpen,
      setShortcutsOpen,
    }),
    [
      sidebarOpen,
      toggleSidebar,
      setSidebarOpen,
      createOpen,
      openCreate,
      createProjectOpen,
      openCreateProject,
      shortcutsOpen,
    ],
  );

  return <ShellContext value={value}>{children}</ShellContext>;
}

export function useShell() {
  const context = React.use(ShellContext);
  if (!context) throw new Error("useShell must be used inside <ShellProvider>");
  return context;
}
