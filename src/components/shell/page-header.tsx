"use client";

import { PanelLeft } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  const { sidebarOpen, toggleSidebar } = useShell();

  return (
    <header className="hairline-b flex h-topbar shrink-0 items-center gap-3 px-6">
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

      <h1 className="text-title font-semibold text-grey-900">{title}</h1>
      {meta ? <div className="flex items-center gap-2">{meta}</div> : null}

      <div className="ml-auto flex items-center gap-2">{actions}</div>
    </header>
  );
}
