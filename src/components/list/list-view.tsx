"use client";

import * as React from "react";
import { SearchX } from "lucide-react";

import {
  applyFilters,
  emptyFilters,
  FilterBar,
  type TicketFilters,
} from "@/components/list/filter-bar";
import { TicketTable } from "@/components/list/ticket-table";
import { useTicketStore } from "@/lib/store/ticket-store";
import type { Project, Ticket } from "@/lib/mock";

export function ListView({
  project,
  tickets: provided,
  showProject = false,
  onOpenTicket,
  emptyState,
}: {
  /** Scopes the assignee facet when the list belongs to one project. */
  project?: Project;
  /** Defaults to the project's tickets; My tickets passes its own set. */
  tickets?: Ticket[];
  showProject?: boolean;
  onOpenTicket?: (ticketId: string) => void;
  emptyState?: React.ReactNode;
}) {
  const { tickets: allTickets } = useTicketStore();
  const [filters, setFilters] = React.useState<TicketFilters>(emptyFilters);

  const scoped = React.useMemo(() => {
    if (provided) return provided;
    if (project) {
      return allTickets.filter((ticket) => ticket.projectId === project.id);
    }
    return allTickets;
  }, [provided, project, allTickets]);

  const filtered = React.useMemo(
    () => applyFilters(scoped, filters),
    [scoped, filters],
  );

  return (
    <>
      <FilterBar
        filters={filters}
        onChange={setFilters}
        project={project}
        resultCount={filtered.length}
        totalCount={scoped.length}
      />
      <TicketTable
        tickets={filtered}
        showProject={showProject}
        onOpenTicket={onOpenTicket}
        empty={
          scoped.length === 0 ? (
            emptyState
          ) : (
            <span className="flex flex-col items-center gap-1 py-12 text-center">
              <SearchX className="size-5 text-grey-300" strokeWidth={1.5} />
              <span className="text-heading font-medium text-grey-900">
                No tickets match these filters
              </span>
              <span className="text-small text-grey-500">
                Try removing a filter or widening your search.
              </span>
            </span>
          )
        }
      />
    </>
  );
}
