"use client";

import Link from "next/link";
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
import { currentUser } from "@/components/shell/nav-data";
import { cn } from "@/lib/utils";

type WorkspaceApp = {
  name: string;
  icon: LucideIcon;
  /** Only the ticketing app is built in this prototype. */
  href?: string;
};

const apps: WorkspaceApp[] = [
  { name: "Tickets", icon: Ticket, href: "/" },
  { name: "Inbox", icon: Inbox },
  { name: "Docs", icon: FileText },
  { name: "Chat", icon: MessagesSquare },
  { name: "Calendar", icon: CalendarDays },
  { name: "Files", icon: FolderOpen },
  { name: "People", icon: Users },
  { name: "Insights", icon: BarChart3 },
  { name: "Goals", icon: Target },
  { name: "Releases", icon: Rocket },
  { name: "Spend", icon: Wallet },
];

const railButton =
  "flex size-9 items-center justify-center rounded-md transition-colors";
const railIdle = "text-grey-500 hover:bg-grey-200 hover:text-grey-800";
const railActive = "bg-grey-0 text-accent-600 ring-1 ring-grey-200";

function RailItem({ app }: { app: WorkspaceApp }) {
  const Icon = app.icon;
  const active = Boolean(app.href);
  const icon = <Icon className="size-[18px]" strokeWidth={1.75} />;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {app.href ? (
          <Link
            href={app.href}
            aria-label={app.name}
            aria-current="page"
            className={cn(railButton, railActive)}
          >
            {icon}
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
        {!active ? (
          <span className="ml-1.5 text-grey-400">· not in prototype</span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

export function AppRail() {
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
        <RailItem key={app.name} app={app} />
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
              aria-label={currentUser.name}
              className="flex size-8 items-center justify-center rounded-full bg-grey-300 text-caption font-medium text-grey-800"
            >
              {currentUser.initials}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {currentUser.name}
          </TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
}
