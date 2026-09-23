"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, Mail, MessagesSquare, Ticket as TicketIcon, Video } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatRelative } from "@/lib/format";
import {
  chatConversationsForUser,
  conversationName,
  isMeetingSoon,
  isRecentlyUpdated,
  meetingStatus,
  threadDisplayName,
  CURRENT_USER_ID,
} from "@/lib/mock";
import { useChatStore } from "@/lib/store/chat-store";
import { useMailStore } from "@/lib/store/mail-store";
import { useMeetingsStore } from "@/lib/store/meetings-store";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  icon: React.ElementType;
  text: string;
  at: string;
  onSelect: () => void;
};

/**
 * One bell for the whole workspace, because four separate unread counts —
 * chat, mail, meetings, tickets — is four things to check, and the point of
 * a unified workspace is that you only have to check one.
 */
export function NotificationsMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { openTicket } = useTicketPanel();

  const { unreadCount, markRead } = useChatStore();
  const { threads: mailThreads, markRead: markMailRead } = useMailStore();
  const { meetings } = useMeetingsStore();
  const { tickets } = useTicketStore();

  const items = React.useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];

    for (const conversation of chatConversationsForUser()) {
      const count = unreadCount(conversation.id);
      if (count === 0) continue;
      list.push({
        id: `chat-${conversation.id}`,
        icon: MessagesSquare,
        text: `${count} new in ${conversationName(conversation)}`,
        at: new Date().toISOString(),
        onSelect: () => {
          markRead(conversation.id);
          router.push(`/chat?c=${conversation.id}`);
        },
      });
    }

    for (const thread of mailThreads) {
      if (thread.folder !== "inbox" || thread.read) continue;
      list.push({
        id: `mail-${thread.id}`,
        icon: Mail,
        text: `${threadDisplayName(thread)}: ${thread.subject}`,
        at: thread.updatedAt,
        onSelect: () => {
          markMailRead(thread.id, true);
          router.push(`/mail?folder=inbox&t=${thread.id}`);
        },
      });
    }

    for (const meeting of meetings) {
      if (!isMeetingSoon(meeting)) continue;
      list.push({
        id: `meeting-${meeting.id}`,
        icon: Video,
        text:
          meetingStatus(meeting) === "live"
            ? `${meeting.title} is live now`
            : `${meeting.title} starts soon`,
        at: meeting.startsAt,
        onSelect: () => router.push(`/meetings?open=${meeting.id}`),
      });
    }

    for (const ticket of tickets) {
      if (!ticket.assigneeIds.includes(CURRENT_USER_ID)) continue;
      if (!isRecentlyUpdated(ticket)) continue;
      list.push({
        id: `ticket-${ticket.id}`,
        icon: TicketIcon,
        text: `${ticket.key} updated — ${ticket.title}`,
        at: ticket.updatedAt,
        onSelect: () => openTicket(ticket.key),
      });
    }

    return list.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
  }, [unreadCount, mailThreads, meetings, tickets, router, markRead, markMailRead, openTicket]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/*
          Lives in the app rail now, not the top bar — the same icon-button
          shape every other app in the rail uses, so it reads as one more
          thing the rail switches you to rather than a bolted-on control.
        */}
        <button
          type="button"
          aria-label={`Notifications${items.length > 0 ? `, ${items.length} unread` : ""}`}
          className="relative flex size-9 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-200 hover:text-grey-800"
        >
          <Bell className="size-[18px]" strokeWidth={1.75} />
          {items.length > 0 ? (
            <span
              aria-hidden
              className="tnum absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-semibold text-grey-0"
            >
              {items.length > 9 ? "9+" : items.length}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={8} className="w-80 p-0">
        <div className="hairline-b px-3 py-2 text-small font-semibold text-grey-900">
          Notifications
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-small text-grey-500">You&apos;re all caught up.</p>
          ) : (
            items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-grey-100",
                  )}
                >
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate text-small text-grey-800">{item.text}</span>
                  <span className="shrink-0 text-caption text-grey-500">{formatRelative(item.at)}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
