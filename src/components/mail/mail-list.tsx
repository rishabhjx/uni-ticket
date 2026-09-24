"use client";

import * as React from "react";
import { Archive, ArchiveRestore, MailOpen, Star, Trash2 } from "lucide-react";

import { useCelebrate } from "@/components/shared/celebrate";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { formatRelative } from "@/lib/format";
import { threadDisplayName, type MailThread } from "@/lib/mock";
import { useMailStore } from "@/lib/store/mail-store";
import { cn } from "@/lib/utils";

type BulkPatch = Partial<Pick<MailThread, "folder" | "read" | "starred">>;

export function MailList({
  threads,
  activeId,
  onSelect,
  scopeKey,
  trash = false,
  cursorId = null,
}: {
  threads: MailThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  /** Changes whenever the folder or search term changes, so a stale
   *  selection from the last view never carries into this one. */
  scopeKey: string;
  /** The Trash folder gets Restore instead of Archive/Delete. */
  trash?: boolean;
  /** The j/k keyboard-navigation cursor, from the parent — this list has no
   *  virtualization to fight, so a plain prop is enough (no imperative DOM
   *  marking needed, unlike the ticket table). */
  cursorId?: string | null;
}) {
  const { messages, toggleStar, markRead, deleteThread, bulkApply, permanentlyDelete, restoreThreads } =
    useMailStore();
  const celebrate = useCelebrate();
  const [selection, setSelection] = React.useState<Set<string>>(new Set());

  const [lastScope, setLastScope] = React.useState(scopeKey);
  if (scopeKey !== lastScope) {
    setLastScope(scopeKey);
    if (selection.size > 0) setSelection(new Set());
  }

  const toggleOne = (id: string) => {
    setSelection((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = threads.length > 0 && threads.every((thread) => selection.has(thread.id));
  const someSelected = threads.some((thread) => selection.has(thread.id));

  const toggleAll = () => {
    setSelection(allSelected ? new Set() : new Set(threads.map((thread) => thread.id)));
  };

  /** Snapshots each selected thread's OWN prior values before patching, so
   *  undo restores a mixed selection to what it actually was — not to
   *  whatever the first thread in it happened to hold. Mirrors the ticket
   *  bulk bar's applyWithUndo. */
  const applyWithUndo = (ids: string[], patch: BulkPatch, label: string, emoji = "→") => {
    const keys = Object.keys(patch) as (keyof BulkPatch)[];
    const before = threads
      .filter((thread) => ids.includes(thread.id))
      .map((thread) => ({
        id: thread.id,
        prior: Object.fromEntries(keys.map((key) => [key, thread[key]])) as BulkPatch,
      }));
    bulkApply(ids, patch);
    setSelection(new Set());
    celebrate(emoji, `${label} · ${ids.length} ${ids.length === 1 ? "email" : "emails"}`, () => {
      for (const entry of before) bulkApply([entry.id], entry.prior);
    });
  };

  const deleteForever = (ids: string[]) => {
    const removedThreads = threads.filter((thread) => ids.includes(thread.id));
    const idSet = new Set(ids);
    const removedMessages = messages.filter((message) => idSet.has(message.threadId));
    for (const id of ids) permanentlyDelete(id);
    setSelection(new Set());
    celebrate(
      "🗑",
      `Deleted forever · ${ids.length} ${ids.length === 1 ? "email" : "emails"}`,
      () => restoreThreads(removedThreads, removedMessages),
    );
  };

  const selected = Array.from(selection);

  if (threads.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-small text-grey-500">
        Nothing here.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="hairline-b flex h-9 shrink-0 items-center gap-2 px-3">
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={toggleAll}
          aria-label={allSelected ? "Deselect all" : "Select all"}
        />
        {selected.length > 0 ? (
          <div className="flex flex-1 items-center gap-1">
            <span className="mr-1 text-caption text-grey-500">{selected.length} selected</span>
            <button
              type="button"
              onClick={() => {
                bulkApply(selected, { read: true });
                setSelection(new Set());
              }}
              title="Mark as read"
              className="flex size-6 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-grey-900"
            >
              <MailOpen className="size-3.5" strokeWidth={1.75} />
            </button>
            {trash ? (
              <>
                <button
                  type="button"
                  onClick={() => applyWithUndo(selected, { folder: "inbox" }, "Restored", "↩")}
                  title="Restore to inbox"
                  className="flex size-6 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-grey-900"
                >
                  <ArchiveRestore className="size-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteForever(selected)}
                  title="Delete forever"
                  className="flex size-6 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-[color:var(--danger)]"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => applyWithUndo(selected, { folder: "archive" }, "Archived", "🗄")}
                  title="Archive"
                  className="flex size-6 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-grey-900"
                >
                  <Archive className="size-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => applyWithUndo(selected, { folder: "trash" }, "Deleted", "🗑")}
                  title="Delete"
                  className="flex size-6 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 hover:text-[color:var(--danger)]"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </button>
              </>
            )}
          </div>
        ) : (
          <span className="text-caption text-grey-500">
            {threads.length} {threads.length === 1 ? "email" : "emails"}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {threads.map((thread) => {
        const threadMessages = messages
          .filter((m) => m.threadId === thread.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const last = threadMessages[threadMessages.length - 1];
        const senderId = thread.externalParticipant
          ? null
          : (last?.fromId ?? thread.participantIds[0]);
        const checked = selection.has(thread.id);

        return (
          <div
            key={thread.id}
            className={cn(
              "group/thread hairline-b flex items-start gap-2.5 px-3 py-2.5 transition-colors",
              thread.id === activeId ? "bg-grey-150" : "hover:bg-grey-50",
              thread.id === cursorId &&
                "shadow-[inset_2px_0_0_var(--accent-500)]",
            )}
          >
            <span
              className={cn(
                "mt-0.5 shrink-0 opacity-0 transition-opacity group-hover/thread:opacity-100",
                checked && "opacity-100",
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggleOne(thread.id)}
                aria-label={`Select "${thread.subject}"`}
              />
            </span>

            <button
              type="button"
              onClick={() => toggleStar(thread.id)}
              aria-label={thread.starred ? "Unstar" : "Star"}
              className="mt-0.5 shrink-0 text-grey-400 hover:text-grey-700"
            >
              <Star
                className={cn("size-3.5", thread.starred && "fill-current text-accent-600")}
                strokeWidth={1.75}
              />
            </button>

            <UserAvatar userId={senderId} size="md" className="mt-0.5 shrink-0" />

            <button
              type="button"
              onClick={() => onSelect(thread.id)}
              aria-current={thread.id === activeId ? "page" : undefined}
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-small",
                    !thread.read ? "font-semibold text-grey-900" : "text-grey-700",
                  )}
                >
                  {threadDisplayName(thread)}
                </span>
                {!thread.read ? (
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent-600" />
                ) : null}
                <span className="shrink-0 text-caption text-grey-500">
                  {formatRelative(thread.updatedAt)}
                </span>
              </div>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-small",
                    !thread.read ? "font-medium text-grey-900" : "text-grey-600",
                  )}
                >
                  {thread.subject}
                  {last ? (
                    <span className="font-normal text-grey-500"> — {last.body}</span>
                  ) : null}
                </span>
                {thread.ticketRefs.length > 0 ? (
                  <span className="tnum shrink-0 rounded-md bg-accent-50 px-1.5 py-0.5 text-caption font-medium text-accent-700">
                    {thread.ticketRefs[0]}
                  </span>
                ) : null}
              </div>
            </button>

            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/thread:opacity-100">
              <button
                type="button"
                onClick={() => markRead(thread.id, !thread.read)}
                aria-label={thread.read ? "Mark as unread" : "Mark as read"}
                title={thread.read ? "Mark as unread" : "Mark as read"}
                className="flex size-6 items-center justify-center rounded-md text-grey-400 hover:bg-grey-150 hover:text-grey-700"
              >
                <MailOpen className="size-3.5" strokeWidth={1.75} />
              </button>
              {trash ? (
                <>
                  <button
                    type="button"
                    onClick={() => applyWithUndo([thread.id], { folder: "inbox" }, "Restored", "↩")}
                    aria-label="Restore to inbox"
                    title="Restore to inbox"
                    className="flex size-6 items-center justify-center rounded-md text-grey-400 hover:bg-grey-150 hover:text-grey-700"
                  >
                    <ArchiveRestore className="size-3.5" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteForever([thread.id])}
                    aria-label="Delete forever"
                    title="Delete forever"
                    className="flex size-6 items-center justify-center rounded-md text-grey-400 hover:bg-grey-150 hover:text-[color:var(--danger)]"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    deleteThread(thread.id);
                    celebrate("🗑", `"${thread.subject}" deleted`, () =>
                      bulkApply([thread.id], { folder: thread.folder }),
                    );
                  }}
                  aria-label="Delete"
                  title="Delete"
                  className="flex size-6 items-center justify-center rounded-md text-grey-400 hover:bg-grey-150 hover:text-[color:var(--danger)]"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}
