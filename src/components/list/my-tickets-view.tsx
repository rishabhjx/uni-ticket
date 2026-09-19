"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";

import { emptyFilters, type TicketFilters } from "@/components/list/filter-bar";
import { ListView } from "@/components/list/list-view";
import { EmptyState } from "@/components/shared/empty-state";
import { useTicketStore } from "@/lib/store/ticket-store";
import { CURRENT_USER_ID } from "@/lib/mock";

/** The presets Home's KPI cards link to. */
const presets: Record<string, Partial<TicketFilters>> = {
  pending: { statuses: ["backlog", "todo"] },
  active: { statuses: ["in_progress", "in_review"] },
  overdue: { overdueOnly: true },
};

export function MyTicketsView() {
  const params = useSearchParams();
  const { tickets } = useTicketStore();
  const view = params.get("view");

  const mine = React.useMemo(
    () => tickets.filter((ticket) => ticket.assigneeId === CURRENT_USER_ID),
    [tickets],
  );

  return (
    <ListView
      tickets={mine}
      showProject
      initialFilters={view ? presets[view] ?? emptyFilters : undefined}
      emptyState={
        <EmptyState
          icon={CircleCheck}
          title="Nothing assigned to you"
          description="Tickets assigned to you across every project land here. Pick one up from a board to get started."
          action={{ label: "Go to projects", href: "/projects" }}
        />
      }
    />
  );
}
