"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  FileText,
  FolderOpen,
  Inbox,
  MessagesSquare,
  Rocket,
  Settings,
  Target,
  Ticket,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  chatConversationsForUser,
  getUser,
  isMeetingSoon,
  CURRENT_USER_ID,
} from "@/lib/mock";
import { useChatStore } from "@/lib/store/chat-store";
import { useMailStore } from "@/lib/store/mail-store";
import { useMeetingsStore } from "@/lib/store/meetings-store";
import { cn } from "@/lib/utils";

type WorkspaceApp = {
  name: string;
  icon: LucideIcon;
  /** Only apps built in this prototype carry an href. */
  href?: string;
  /** A live count shown as a badge on the icon — chat mentions, unread mail. */
  badge?: number;
};

const railButton =
  "relative flex size-9 items-center justify-center rounded-md transition-colors";
const railIdle = "text-grey-500 hover:bg-grey-200 hover:text-grey-800";
const railActive = "bg-grey-0 text-accent-600 ring-1 ring-grey-200";

function RailBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className="tnum absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-semibold text-grey-0"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

function RailItem({ app, active }: { app: WorkspaceApp; active: boolean }) {
  const Icon = app.icon;
  const icon = <Icon className="size-[18px]" strokeWidth={1.75} />;
  const isBuilt = Boolean(app.href);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {app.href ? (
          <Link
            href={app.href}
            aria-label={app.name}
            aria-current={active ? "page" : undefined}
            className={cn(railButton, active ? railActive : railIdle)}
          >
            {icon}
            <RailBadge count={app.badge ?? 0} />
          </Link>
        ) : (
          <button
            type="button"
            aria-label={app.name}
            className={cn(railButton, railIdle)}
          >
            {icon}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {app.name}
        {!isBuilt ? (
          <span className="ml-1.5 text-grey-500">· not in prototype</span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

export function AppRail() {
  const currentUser = getUser(CURRENT_USER_ID);
  const pathname = usePathname();

  const { unreadCount } = useChatStore();
  const { threads } = useMailStore();
  const { meetings } = useMeetingsStore();

  const chatUnread = chatConversationsForUser().reduce(
    (sum, conversation) => sum + unreadCount(conversation.id),
    0,
  );
  const mailUnread = threads.filter(
    (thread) => thread.folder === "inbox" && !thread.read,
  ).length;
  const meetingsSoon = meetings.filter((meeting) => isMeetingSoon(meeting)).length;

  const apps: WorkspaceApp[] = [
    { name: "Tickets", icon: Ticket, href: "/" },
    { name: "Mail", icon: Inbox, href: "/mail", badge: mailUnread },
    { name: "Docs", icon: FileText },
    { name: "Chat", icon: MessagesSquare, href: "/chat", badge: chatUnread },
    { name: "Meetings", icon: CalendarDays, href: "/meetings", badge: meetingsSoon },
    { name: "Files", icon: FolderOpen, href: "/files" },
    { name: "People", icon: Users },
    { name: "Insights", icon: BarChart3 },
    { name: "Goals", icon: Target },
    { name: "Releases", icon: Rocket },
    { name: "Spend", icon: Wallet },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Workspace apps"
      className="hairline-r flex w-rail shrink-0 flex-col items-center gap-1 bg-grey-100 py-3"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="UNI workspace"
            className="mb-2 flex size-8 items-center justify-center rounded-md bg-grey-900 text-caption font-semibold text-grey-0"
          >
            U
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          UNI workspace
        </TooltipContent>
      </Tooltip>

      {apps.map((app) => (
        <RailItem
          key={app.name}
          app={app}
          active={Boolean(app.href) && isActive(app.href!)}
        />
      ))}

      <div className="mt-auto flex flex-col items-center gap-1 pt-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Settings"
              className={cn(railButton, railIdle)}
            >
              <Settings className="size-[18px]" strokeWidth={1.75} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Settings
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={currentUser?.name ?? "Account"}
              className="flex size-8 items-center justify-center rounded-full bg-grey-300 text-caption font-medium text-grey-800"
            >
              {currentUser?.initials}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {currentUser?.name}
          </TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
}
