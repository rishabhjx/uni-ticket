"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Archive, FileEdit, Inbox as InboxIcon, PenSquare, Send, Star } from "lucide-react";

import { ComposeDialog } from "@/components/mail/compose-dialog";
import { MailList } from "@/components/mail/mail-list";
import { MailReader } from "@/components/mail/mail-reader";
import { PageHeader } from "@/components/shell/page-header";
import type { MailFolder } from "@/lib/mock";
import { useMailStore } from "@/lib/store/mail-store";
import { cn } from "@/lib/utils";

const FOLDERS: { id: MailFolder | "starred"; label: string; icon: typeof InboxIcon }[] = [
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "starred", label: "Starred", icon: Star },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileEdit },
  { id: "archive", label: "Archive", icon: Archive },
];

export function MailView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { threads, markRead } = useMailStore();
  const [composeOpen, setComposeOpen] = React.useState(false);

  const folder = (params.get("folder") as MailFolder | "starred") ?? "inbox";
  const threadId = params.get("t");

  const visible = React.useMemo(() => {
    const scoped =
      folder === "starred"
        ? threads.filter((thread) => thread.starred)
        : threads.filter((thread) => thread.folder === folder);
    return scoped.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [threads, folder]);

  const selectFolder = (next: MailFolder | "starred") => {
    const query = new URLSearchParams();
    query.set("folder", next);
    router.push(`${pathname}?${query.toString()}`, { scroll: false });
  };

  const selectThread = (id: string) => {
    const query = new URLSearchParams(params.toString());
    query.set("t", id);
    router.push(`${pathname}?${query.toString()}`, { scroll: false });
    markRead(id, true);
  };

  const unreadInbox = threads.filter((t) => t.folder === "inbox" && !t.read).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Mail"
        actions={
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="flex h-7 items-center gap-1.5 rounded-md bg-accent-600 px-2.5 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700"
          >
            <PenSquare className="size-3.5" strokeWidth={1.75} />
            Compose
          </button>
        }
      />

      <div className="flex min-h-0 flex-1">
        <div className="hairline-r flex w-[200px] shrink-0 flex-col gap-0.5 bg-grey-50 px-2 py-3">
          {FOLDERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => selectFolder(id)}
              aria-current={folder === id ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2 text-small transition-colors",
                folder === id
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

        <div className="hairline-r flex w-[360px] shrink-0 flex-col">
          <MailList threads={visible} activeId={threadId} onSelect={selectThread} />
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
        onSent={(id) => {
          const query = new URLSearchParams();
          query.set("folder", "sent");
          query.set("t", id);
          router.push(`${pathname}?${query.toString()}`, { scroll: false });
        }}
      />
    </div>
  );
}
