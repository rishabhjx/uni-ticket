"use client";

import { CelebrateProvider } from "@/components/shared/celebrate";
import { AppRail } from "@/components/shell/app-rail";
import { CommandPaletteProvider } from "@/components/shell/command-palette";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { ShortcutsDialog } from "@/components/shell/shortcuts-dialog";
import { TopNav } from "@/components/shell/top-nav";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";
import { MediaViewer } from "@/components/tickets/media-viewer";
import { TicketPanel } from "@/components/tickets/ticket-panel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TicketPanelProvider } from "@/lib/store/ticket-panel";
import { ShellProvider, useShell } from "@/hooks/use-shell";
import { ViewStateProvider } from "@/lib/store/view-state";

function CreateDialogHost() {
  const {
    createOpen,
    setCreateOpen,
    createProjectOpen,
    setCreateProjectOpen,
    createWorkspaceOpen,
    setCreateWorkspaceOpen,
    shortcutsOpen,
    setShortcutsOpen,
  } = useShell();

  return (
    <>
      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
      />
      <CreateWorkspaceDialog
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
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
        <div className="group/shell relative flex h-full overflow-hidden">
          {/*
            The rail stays: it is the unified workspace's own switcher between
            its apps, and this app is one of them. The section sidebar is gone
            — see TopNav for why a second permanent column was the wrong shape
            for a tenant of somebody else's shell.
          */}
          <AppRail />
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
            <TopNav />
            <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              {children}
              <TicketPanel />
              <MediaViewer />
              <CreateDialogHost />
            </main>
          </div>
        </div>
      </TooltipProvider>
      </CommandPaletteProvider>
      </TicketPanelProvider>
      </ViewStateProvider>
      </CelebrateProvider>
    </ShellProvider>
  );
}
