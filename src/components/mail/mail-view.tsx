"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  FileEdit,
  Inbox as InboxIcon,
  PenSquare,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { useCelebrate } from "@/components/shared/celebrate";
import { ComposeDialog } from "@/components/mail/compose-dialog";
import { MailList } from "@/components/mail/mail-list";
import { MailReader } from "@/components/mail/mail-reader";
import { PageHeader } from "@/components/shell/page-header";
import { threadDisplayName, type MailFolder, type MailThread } from "@/lib/mock";
import { useMailStore } from "@/lib/store/mail-store";
import { cn } from "@/lib/utils";

const FOLDERS: { id: MailFolder | "starred"; label: string; icon: typeof InboxIcon }[] = [
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "starred", label: "Starred", icon: Star },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileEdit },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "trash", label: "Trash", icon: Trash2 },
];

export function MailView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { threads, messages, markRead, moveToFolder, deleteThread, bulkApply, emptyTrash, restoreThreads } =
    useMailStore();
  const celebrate = useCelebrate();
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [cursor, setCursor] = React.useState(0);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const folder = (params.get("folder") as MailFolder | "starred") ?? "inbox";
  const threadId = params.get("t");
  const term = query.trim().toLowerCase();
  const searching = term.length > 0;

  const visible = React.useMemo(() => {
    if (searching) {
      return threads
        .filter((thread) => thread.folder !== "trash")
        .filter((thread) => {
          if (thread.subject.toLowerCase().includes(term)) return true;
          if (threadDisplayName(thread).toLowerCase().includes(term)) return true;
          return messages.some(
            (message) =>
              message.threadId === thread.id && message.body.toLowerCase().includes(term),
          );
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    const scoped =
      folder === "starred"
        ? threads.filter((thread) => thread.starred)
        : threads.filter((thread) => thread.folder === folder);
    return scoped.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [threads, messages, folder, term, searching]);

  const selectFolder = (next: MailFolder | "starred") => {
    setQuery("");
    const query = new URLSearchParams();
    query.set("folder", next);
    router.push(`${pathname}?${query.toString()}`, { scroll: false });
  };

  const selectThread = React.useCallback(
    (id: string) => {
      const query = new URLSearchParams(params.toString());
      query.set("t", id);
      router.push(`${pathname}?${query.toString()}`, { scroll: false });
      markRead(id, true);
    },
    [params, pathname, router, markRead],
  );

  const unreadInbox = threads.filter((t) => t.folder === "inbox" && !t.read).length;

  const scopeKey = searching ? `search:${term}` : folder;
  const visibleRef = React.useRef(visible);
  React.useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);
  const [lastScope, setLastScope] = React.useState(scopeKey);
  if (scopeKey !== lastScope) {
    setLastScope(scopeKey);
    setCursor(0);
  }

  const archiveAtCursor = React.useCallback(
    (thread: MailThread) => {
      const priorFolder = thread.folder;
      moveToFolder(thread.id, "archive");
      celebrate("🗄", `"${thread.subject}" archived`, () =>
        bulkApply([thread.id], { folder: priorFolder }),
      );
    },
    [moveToFolder, bulkApply, celebrate],
  );

  const deleteAtCursor = React.useCallback(
    (thread: MailThread) => {
      const priorFolder = thread.folder;
      deleteThread(thread.id);
      celebrate("🗑", `"${thread.subject}" deleted`, () =>
        bulkApply([thread.id], { folder: priorFolder }),
      );
    },
    [deleteThread, bulkApply, celebrate],
  );

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

      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        setComposeOpen(true);
        return;
      }

      const rows = visibleRef.current;
      if (rows.length === 0) return;
      const key = event.key.toLowerCase();

      if (key === "j" || key === "k") {
        event.preventDefault();
        setCursor((current) =>
          Math.max(0, Math.min(rows.length - 1, current + (key === "j" ? 1 : -1))),
        );
      } else if (event.key === "Enter" || key === "o") {
        event.preventDefault();
        const thread = rows[Math.min(cursor, rows.length - 1)];
        selectThread(thread.id);
      } else if (key === "u") {
        event.preventDefault();
        const thread = rows[Math.min(cursor, rows.length - 1)];
        markRead(thread.id, !thread.read);
      } else if (key === "e" && folder !== "trash") {
        event.preventDefault();
        archiveAtCursor(rows[Math.min(cursor, rows.length - 1)]);
      } else if ((key === "#" || event.key === "Delete" || event.key === "Backspace") && folder !== "trash") {
        event.preventDefault();
        deleteAtCursor(rows[Math.min(cursor, rows.length - 1)]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cursor, folder, selectThread, markRead, archiveAtCursor, deleteAtCursor]);

  const emptyTrashWithUndo = () => {
    const trashedThreads = threads.filter((thread) => thread.folder === "trash");
    if (trashedThreads.length === 0) return;
    const ids = new Set(trashedThreads.map((thread) => thread.id));
    const trashedMessages = messages.filter((message) => ids.has(message.threadId));
    emptyTrash();
    celebrate(
      "🗑",
      `Trash emptied · ${trashedThreads.length} ${trashedThreads.length === 1 ? "email" : "emails"}`,
      () => restoreThreads(trashedThreads, trashedMessages),
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Mail"
        actions={
          <>
            {folder === "trash" && !searching ? (
              <button
                type="button"
                onClick={emptyTrashWithUndo}
                disabled={visible.length === 0}
                className="flex h-7 items-center gap-1.5 rounded-md border border-grey-200 px-2.5 text-small text-grey-700 transition-colors hover:border-grey-300 disabled:pointer-events-none disabled:opacity-50"
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
                Empty trash
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="flex h-7 items-center gap-1.5 rounded-md bg-accent-600 px-2.5 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700"
            >
              <PenSquare className="size-3.5" strokeWidth={1.75} />
              Compose
            </button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1">
        <div className="hairline-r flex w-[200px] shrink-0 flex-col gap-3 bg-grey-50 px-2 py-3">
          <div className="flex h-8 items-center gap-1.5 rounded-md border border-grey-200 bg-grey-0 px-2 focus-within:border-accent-600">
            <Search className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search mail"
              aria-label="Search mail"
              className="min-w-0 flex-1 bg-transparent text-small text-grey-900 placeholder:text-grey-500 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="shrink-0 text-grey-400 hover:text-grey-700"
              >
                <X className="size-3.5" strokeWidth={1.75} />
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-0.5">
            {FOLDERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectFolder(id)}
                aria-current={!searching && folder === id ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-md px-2 text-small transition-colors",
                  !searching && folder === id
                    ? "bg-grey-150 font-medium text-grey-900"
                    : "text-grey-600 hover:bg-grey-100 hover:text-grey-900",
                )}
              >
                <Icon className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
                <span className="flex-1 text-left">{label}</span>
                {id === "inbox" && unreadInbox > 0 ? (
                  <span className="tnum text-caption text-grey-500">{unreadInbox}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="hairline-r flex w-[360px] shrink-0 flex-col">
          {searching ? (
            <div className="hairline-b flex h-9 shrink-0 items-center px-3 text-caption text-grey-500">
              {visible.length} {visible.length === 1 ? "result" : "results"} for &ldquo;{query.trim()}&rdquo;
            </div>
          ) : null}
          <MailList
            threads={visible}
            activeId={threadId}
            onSelect={selectThread}
            scopeKey={scopeKey}
            trash={folder === "trash" && !searching}
            cursorId={visible[cursor]?.id ?? null}
          />
        </div>

        {threadId ? (
          <MailReader threadId={threadId} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-small text-grey-500">
            Select an email to read it.
          </div>
        )}
      </div>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onSent={(id, sentFolder) => {
          const query = new URLSearchParams();
          query.set("folder", sentFolder);
          query.set("t", id);
          router.push(`${pathname}?${query.toString()}`, { scroll: false });
        }}
      />
    </div>
  );
}
