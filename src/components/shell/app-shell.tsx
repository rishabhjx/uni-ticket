"use client";

import { PanelLeftClose } from "lucide-react";

import { CelebrateProvider } from "@/components/shared/celebrate";
import { AppRail } from "@/components/shell/app-rail";
import { CommandPaletteProvider } from "@/components/shell/command-palette";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { SectionSidebar } from "@/components/shell/section-sidebar";
import { TicketPanel } from "@/components/tickets/ticket-panel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TicketPanelProvider } from "@/lib/store/ticket-panel";
import { ShellProvider, useShell } from "@/hooks/use-shell";
import { ViewStateProvider } from "@/lib/store/view-state";

function CreateDialogHost() {
  const { createOpen, setCreateOpen } = useShell();
  return <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />;
}

function SidebarCollapseButton() {
  const { sidebarOpen, toggleSidebar } = useShell();
  if (!sidebarOpen) return null;

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Hide sidebar"
      title="Hide sidebar ⌘B"
      className="absolute top-3 left-[calc(var(--rail-w)+var(--sidebar-w)-32px)] z-10 flex size-7 items-center justify-center rounded-md text-grey-400 opacity-0 transition-opacity hover:bg-grey-150 hover:text-grey-700 focus-visible:opacity-100 group-hover/shell:opacity-100"
    >
      <PanelLeftClose className="size-4" strokeWidth={1.75} />
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <CelebrateProvider>
      <ViewStateProvider>
      <TicketPanelProvider>
      <CommandPaletteProvider>
      <TooltipProvider delayDuration={300}>
        <div className="group/shell relative flex h-full">
          <AppRail />
          <SectionSidebar />
          <SidebarCollapseButton />
          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
            {children}
            <TicketPanel />
            <CreateDialogHost />
          </main>
        </div>
      </TooltipProvider>
      </CommandPaletteProvider>
      </TicketPanelProvider>
      </ViewStateProvider>
      </CelebrateProvider>
    </ShellProvider>
  );
}
