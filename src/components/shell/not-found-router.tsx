"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { BoardView } from "@/components/board/board-view";
import { ListView } from "@/components/list/list-view";
import { RoadmapView } from "@/components/roadmap/roadmap-view";
import { TicketPage } from "@/components/tickets/ticket-page";
import { WorkspaceView } from "@/components/workspaces/workspace-view";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TicketStoreProvider, useTicketStore } from "@/lib/store/ticket-store";
import { WorkspaceProviders } from "@/lib/store/workspace-providers";

/**
 * A project created at runtime has no prerendered route, so the request falls
 * through to not-found. Rather than a dead end, the path is resolved against
 * the store — projects created here are persisted, so they survive the trip.
 */
export function ResolvedRoute() {
  const pathname = usePathname();
  const { projects, workspaces } = useTicketStore();

  // Workspaces created at runtime have no prerendered route either.
  const wsMatch = pathname.match(/^\/workspaces\/([^/]+)\/?$/);
  const workspace = wsMatch
    ? workspaces.find((item) => item.slug === wsMatch[1].toLowerCase())
    : undefined;

  const match = pathname.match(/^\/projects\/([^/]+)\/(board|list|roadmap)\/?$/);
  const project = match
    ? projects.find((item) => item.slug === match[1].toLowerCase())
    : undefined;

  // A ticket created at runtime has no prerendered page either.
  const ticketMatch = pathname.match(/^\/tickets\/([^/]+)\/?$/);
  if (ticketMatch) {
    return <TicketPage ticketKey={ticketMatch[1].toUpperCase()} />;
  }

  if (workspace) return <WorkspaceView workspaceId={workspace.id} />;

  if (!project || !match) {
    return (
      <>
        <PageHeader title="Not found" />
        <EmptyState
          emoji="🧭"
          title="Nothing here"
          description="That address does not match a project or a screen in this workspace."
          action={{ label: "Go to overview", href: "/" }}
        />
      </>
    );
  }

  if (match[2] === "board") return <BoardView project={project} />;
  if (match[2] === "roadmap") return <RoadmapView project={project} />;
  return <ListView project={project} />;
}

/**
 * The standalone version, for a request that never reached the /(app) layout —
 * a static host serving 404.html for an address it has no page for. Inside the
 * app layout the shell already exists, so ResolvedRoute is used bare.
 */
export function NotFoundRouter() {
  return (
    <TicketStoreProvider>
      <WorkspaceProviders>
        <AppShell>
          <ResolvedRoute />
        </AppShell>
      </WorkspaceProviders>
    </TicketStoreProvider>
  );
}
