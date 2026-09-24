"use client";

import * as React from "react";

import { BulkBar } from "@/components/list/bulk-bar";
import { ColumnChooser } from "@/components/list/column-chooser";
import { FilterBar } from "@/components/list/filter-bar";
import { ProjectActions } from "@/components/projects/project-actions";
import { TicketTable, type ColumnId } from "@/components/list/ticket-table";
import { FilterBarSkeleton, RowsSkeleton } from "@/components/shared/skeletons";
import { useProjectFields } from "@/lib/store/added-fields";
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

const COLUMNS_KEY = "uni.listColumns";

/** Read once, lazily — the same shape `density` already persists in. */
function loadVisibleColumns(fallback: ColumnId[]): Set<ColumnId> {
  if (typeof window === "undefined") return new Set(fallback);
  try {
    const stored = window.localStorage.getItem(COLUMNS_KEY);
    if (!stored) return new Set(fallback);
    const parsed = JSON.parse(stored) as ColumnId[];
    return Array.isArray(parsed) && parsed.length > 0
      ? new Set(parsed)
      : new Set(fallback);
  } catch {
    return new Set(fallback);
  }
}

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
  const { filters, selection, setSelection, clearFilters } = useViewState();
  const projectFields = useProjectFields(project?.id);

  const defaultColumns = React.useMemo<ColumnId[]>(
    () => (showProject ? [...DEFAULT_COLUMNS, "project"] : DEFAULT_COLUMNS),
    [showProject],
  );
  const [visibleColumns, setVisibleColumnsState] = React.useState<Set<ColumnId>>(
    () => loadVisibleColumns(defaultColumns),
  );
  const setVisibleColumns = React.useCallback(
    (next: Set<ColumnId>) => {
      setVisibleColumnsState(next);
      try {
        window.localStorage.setItem(
          COLUMNS_KEY,
          JSON.stringify(Array.from(next)),
        );
      } catch {
        // Not being able to remember column choices is not worth failing over.
      }
    },
    [],
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
  // The value itself is read only inside the keydown handler's own closures
  // below (via the setCursor updater); nothing here re-renders off it, since
  // the current row is marked directly on its DOM node by showCursor.
  const [, setCursor] = React.useState(0);
  const filteredRef = React.useRef(filtered);

  React.useEffect(() => {
    filteredRef.current = filtered;
  }, [filtered]);

  // The grid's real row element for the ticket at `cursor`, so j/k can scroll
  // it into view and mark it as current — found by data-row-id, which
  // DataGridTableRenderedRow already renders per row keyed to `ticket.id`.
  const cursorRowRef = React.useRef<HTMLElement | null>(null);

  const showCursor = React.useCallback((ticketId: string) => {
    cursorRowRef.current?.removeAttribute("data-cursor");
    const row = document.querySelector<HTMLElement>(
      `[data-row-id="${CSS.escape(ticketId)}"]`,
    );
    row?.setAttribute("data-cursor", "true");
    row?.scrollIntoView({ block: "nearest" });
    cursorRowRef.current = row;
  }, []);

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
          showCursor(rows[next].id);
          return next;
        });
      } else if (event.key === "Enter") {
        event.preventDefault();
        setCursor((current) => {
          const ticket = rows[Math.min(current, rows.length - 1)];
          // By KEY, not id: openTicket resolves ?ticket= against ticket.key.
          openTicket(ticket.key);
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
  }, [openTicket, selection, setSelection, showCursor]);

  if (isLoading) {
    return (
      <>
        <FilterBarSkeleton extra={4} />
        <div className="hairline-b flex h-9 shrink-0 items-center gap-8 px-4">
          {[60, 180, 70, 72, 90, 80].map((w) => (
            <div
              key={w}
              className="h-3 animate-pulse rounded-md bg-grey-150"
              style={{ width: w }}
            />
          ))}
        </div>
        <RowsSkeleton rows={12} />
      </>
    );
  }

  return (
    /*
     * `settle` covers the seam where the skeleton is replaced: the bars used
     * to vanish and the rows appear in the same frame, which reads as a
     * glitch rather than as loading finishing.
     */
    <div className="settle flex min-h-0 flex-1 flex-col">
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
        customFields={projectFields}
        onOpenTicket={openTicket}
        empty={
          scoped.length === 0 ? (
            emptyState
          ) : (
            /*
             * "Try removing a filter" is advice, not a way out. The one thing
             * the person wants here is a button that undoes what hid their
             * work, so that is the only thing this offers.
             */
            <span className="flex flex-col items-center gap-1.5 py-12 text-center">
              <span
                aria-hidden
                className="mb-2 flex size-14 items-center justify-center rounded-full bg-grey-50 text-2xl ring-1 ring-grey-200 ring-inset"
              >
                🔍
              </span>
              <span className="text-heading font-semibold text-grey-900">
                No tickets match these filters
              </span>
              <span className="max-w-xs text-small text-grey-600">
                All {scoped.length} tickets here are hidden by the conditions
                you have set.
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 flex h-8 items-center rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-[background-color,transform] hover:bg-accent-700 active:scale-[0.98]"
              >
                Clear filters
              </button>
            </span>
          )
        }
      />
      <BulkBar />
    </div>
  );
}
