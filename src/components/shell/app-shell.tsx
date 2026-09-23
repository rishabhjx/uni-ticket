"use client";

import { usePathname } from "next/navigation";

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
  /*
   * Calendar is a different app in the rail's suite, with its own header and
   * sidebar — Tickets' top bar (its own top-level tabs, the workspace/project
   * breadcrumb, a "New ticket" menu) doesn't describe anything on that page,
   * so it would just be a second, irrelevant toolbar stacked above the first.
   */
  const pathname = usePathname();
  const showTopNav = !pathname.startsWith("/calendar");

  return (
    <ShellProvider>
      <CelebrateProvider>
      <ViewStateProvider>
      <TicketPanelProvider>
      <CommandPaletteProvider>
      <TooltipProvider delayDuration={300}>
        <div className="group/shell relative flex h-full overflow-hidden">
          {/*
            A keyboard user had to walk the entire rail and top bar on every
            page before reaching the thing they came for. Visible only when
            focused, which is the whole point of it.
          */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:flex focus:h-8 focus:items-center focus:rounded-md focus:bg-accent-600 focus:px-3 focus:text-small focus:font-medium focus:text-grey-0"
          >
            Skip to content
          </a>
          {/*
            The rail stays: it is the unified workspace's own switcher between
            its apps, and this app is one of them. The section sidebar is gone
            — see TopNav for why a second permanent column was the wrong shape
            for a tenant of somebody else's shell.
          */}
          <AppRail />
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
            {showTopNav ? <TopNav /> : null}
            <main
              id="main"
              tabIndex={-1}
              className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
            >
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
