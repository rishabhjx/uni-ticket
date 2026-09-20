"use client";

import * as React from "react";

import { BulkBar } from "@/components/list/bulk-bar";
import { ColumnChooser } from "@/components/list/column-chooser";
import { FilterBar } from "@/components/list/filter-bar";
import { ProjectActions } from "@/components/projects/project-actions";
import { TicketTable, type ColumnId } from "@/components/list/ticket-table";
import { RowsSkeleton } from "@/components/shared/skeletons";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { applyFilters, useViewState } from "@/lib/store/view-state";
import type { Project, Ticket } from "@/lib/mock";

const DEFAULT_COLUMNS: ColumnId[] = [
  "select",
  "key",
  "title",
  "status",
  "priority",
  "assignee",
  "labels",
  "dueAt",
  "updatedAt",
];

export function ListView({
  project,
  tickets: provided,
  showProject = false,
  emptyState,
}: {
  project?: Project;
  tickets?: Ticket[];
  showProject?: boolean;
  emptyState?: React.ReactNode;
}) {
  const { tickets: allTickets, isLoading } = useTicketStore();
  const { openTicket } = useTicketPanel();
  const { filters, selection, setSelection } = useViewState();

  const [visibleColumns, setVisibleColumns] = React.useState<Set<ColumnId>>(
    () =>
      new Set(
        showProject ? [...DEFAULT_COLUMNS, "project"] : DEFAULT_COLUMNS,
      ),
  );

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

  // J/K to move, Enter to open, X to select — developers do not want a mouse.
  const [cursor, setCursor] = React.useState(0);
  const filteredRef = React.useRef(filtered);

  React.useEffect(() => {
    filteredRef.current = filtered;
  }, [filtered]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const rows = filteredRef.current;
      if (rows.length === 0) return;

      const key = event.key.toLowerCase();
      if (key === "j" || key === "k") {
        event.preventDefault();
        setCursor((current) => {
          const next = Math.max(
            0,
            Math.min(rows.length - 1, current + (key === "j" ? 1 : -1)),
          );
          document
            .querySelector(`[data-ticket-row="${rows[next].id}"]`)
            ?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (event.key === "Enter") {
        event.preventDefault();
        setCursor((current) => {
          openTicket(rows[Math.min(current, rows.length - 1)].id);
          return current;
        });
      } else if (key === "x") {
        event.preventDefault();
        setCursor((current) => {
          const ticket = rows[Math.min(current, rows.length - 1)];
          setSelection(
            selection.includes(ticket.id)
              ? selection.filter((id) => id !== ticket.id)
              : [...selection, ticket.id],
          );
          return current;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openTicket, selection, setSelection]);

  void cursor;

  if (isLoading) {
    return (
      <>
        <div className="hairline-b h-[45px] shrink-0" />
        <RowsSkeleton rows={12} />
      </>
    );
  }

  return (
    <>
      <FilterBar
        project={project}
        resultCount={filtered.length}
        totalCount={scoped.length}
        extra={
          <>
            <ColumnChooser visible={visibleColumns} onChange={setVisibleColumns} />
            {project ? (
              <ProjectActions project={project} tickets={filtered} />
            ) : null}
          </>
        }
      />
      <TicketTable
        tickets={filtered}
        visibleColumns={visibleColumns}
        customFields={project?.customFields}
        onOpenTicket={openTicket}
        empty={
          scoped.length === 0 ? (
            emptyState
          ) : (
            <span className="flex flex-col items-center gap-1 py-12 text-center">
              <span aria-hidden className="text-2xl">🔍</span>
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
      <BulkBar />
    </>
  );
}
