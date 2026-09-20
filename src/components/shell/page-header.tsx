"use client";

import { FolderPlus, PanelLeft, Plus, TicketPlus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useShell } from "@/hooks/use-shell";

export function PageHeader({
  title,
  meta,
  actions,
}: {
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const { sidebarOpen, toggleSidebar, openCreate, openCreateProject } = useShell();

  return (
    <header className="glass-strong hairline-b relative z-10 flex h-topbar shrink-0 items-center gap-3 px-4 sm:px-6">
      {!sidebarOpen ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Show sidebar"
              className="-ml-2 flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              <PanelLeft className="size-4" strokeWidth={1.75} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            Show sidebar ⌘B
          </TooltipContent>
        </Tooltip>
      ) : null}

      <h1 className="truncate text-title font-semibold text-grey-900">{title}</h1>
      {meta ? <div className="flex items-center gap-2">{meta}</div> : null}

      <div className="ml-auto flex items-center gap-2">
        {actions}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-7 items-center gap-1.5 rounded-md bg-accent-600 px-2.5 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700"
            >
              <Plus className="size-3.5" strokeWidth={2.25} />
              New
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={openCreate} className="gap-2">
              <TicketPlus className="size-3.5 text-grey-400" strokeWidth={1.75} />
              New ticket
              <kbd className="ml-auto text-caption text-grey-400">C</kbd>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openCreateProject} className="gap-2">
              <FolderPlus className="size-3.5 text-grey-400" strokeWidth={1.75} />
              New project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
