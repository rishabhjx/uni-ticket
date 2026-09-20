"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { BoardView } from "@/components/board/board-view";
import { ListView } from "@/components/list/list-view";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/shell/page-header";
import { ViewSwitcher } from "@/components/shell/view-switcher";
import { EmptyState } from "@/components/shared/empty-state";
import { TicketStoreProvider, useTicketStore } from "@/lib/store/ticket-store";

/**
 * A project created at runtime has no prerendered route, so the request falls
 * through to not-found. Rather than a dead end, the path is resolved against
 * the store — projects created here are persisted, so they survive the trip.
 */
export function ResolvedRoute() {
  const pathname = usePathname();
  const { projects } = useTicketStore();

  const match = pathname.match(/^\/projects\/([^/]+)\/(board|list)\/?$/);
  const project = match
    ? projects.find((item) => item.slug === match[1].toLowerCase())
    : undefined;

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

  return (
    <>
      <PageHeader
        title={`${project.emoji} ${project.name}`}
        actions={<ViewSwitcher projectSlug={project.slug} />}
      />
      {match[2] === "board" ? (
        <BoardView project={project} />
      ) : (
        <ListView project={project} />
      )}
    </>
  );
}

/**
 * The standalone version, for a request that never reached the /(app) layout —
 * a static host serving 404.html for an address it has no page for. Inside the
 * app layout the shell already exists, so ResolvedRoute is used bare.
 */
export function NotFoundRouter() {
  return (
    <TicketStoreProvider>
      <AppShell>
        <ResolvedRoute />
      </AppShell>
    </TicketStoreProvider>
  );
}
