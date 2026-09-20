"use client";

import * as React from "react";

import { GroupBySelect } from "@/components/board/group-by-select";
import { FilterBar } from "@/components/list/filter-bar";
import { randomCheer, useCelebrate } from "@/components/shared/celebrate";
import { EmptyState } from "@/components/shared/empty-state";
import { BoardSkeleton } from "@/components/shared/skeletons";
import { TicketCard } from "@/components/tickets/ticket-card";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/reui/kanban";
import {
  getUser,
  PRIORITY_LABEL,
  SEVERITY_SHORT,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
  TYPE_LABEL,
  type Project,
  type Ticket,
  type TicketStatus,
} from "@/lib/mock";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import {
  applyFilters,
  groupKeyOf,
  useViewState,
  type GroupBy,
} from "@/lib/store/view-state";
import { cn } from "@/lib/utils";

/** Columns depend on what the board is grouped by. */
function columnsFor(groupBy: GroupBy, project: Project) {
  switch (groupBy) {
    case "assignee":
      return [
        { id: "unassigned", name: "Unassigned" },
        ...project.memberIds.map((id) => ({
          id,
          name: getUser(id)?.name ?? id,
        })),
      ];
    case "priority":
      return TICKET_PRIORITIES.map((priority) => ({
        id: priority as string,
        name: PRIORITY_LABEL[priority],
      }));
    case "severity":
      return [
        ...TICKET_SEVERITIES.map((severity) => ({
          id: severity as string,
          name: SEVERITY_SHORT[severity],
        })),
        { id: "none", name: "No severity" },
      ];
    case "type":
      return TICKET_TYPES.map((type) => ({
        id: type as string,
        name: TYPE_LABEL[type],
      }));
    default:
      return TICKET_STATUSES.map((status) => ({
        id: status as string,
        name: STATUS_LABEL[status],
      }));
  }
}

export function BoardView({ project }: { project: Project }) {
  const { tickets, applyBoardOrder, isLoading } = useTicketStore();
  const { openTicket } = useTicketPanel();
  const { filters, groupBy, swimlane } = useViewState();
  const celebrate = useCelebrate();

  const scoped = React.useMemo(
    () => tickets.filter((ticket) => ticket.projectId === project.id),
    [tickets, project.id],
  );

  const filtered = React.useMemo(
    () => applyFilters(scoped, filters),
    [scoped, filters],
  );

  const columns = React.useMemo(
    () => columnsFor(groupBy, project),
    [groupBy, project],
  );

  /**
   * ReUI's kanban keeps one array per column rather than a single flat list,
   * so a move never has to be expressed as an index into everything. That is
   * also the shape the store wants back.
   */
  const value = React.useMemo(() => {
    const byColumn: Record<string, Ticket[]> = {};
    for (const column of columns) byColumn[column.id] = [];

    for (const ticket of filtered) {
      const key = groupKeyOf(ticket, groupBy);
      if (byColumn[key]) byColumn[key].push(ticket);
    }
    for (const key of Object.keys(byColumn)) {
      byColumn[key].sort((a, b) => a.order - b.order);
    }
    return byColumn;
  }, [filtered, columns, groupBy]);

  // Only a status board can commit a drag: the other groupings would need a
  // different field written, which the brief does not ask for.
  const handleValueChange = React.useCallback(
    (next: Record<string, Ticket[]>) => {
      if (groupBy !== "status") return;

      const entries: { id: string; column: TicketStatus }[] = [];
      let finished = 0;

      for (const [column, items] of Object.entries(next)) {
        for (const ticket of items) {
          entries.push({ id: ticket.id, column: column as TicketStatus });
          if (column === "done" && ticket.status !== "done") finished += 1;
        }
      }

      applyBoardOrder(entries);
      if (finished > 0) celebrate(randomCheer(), "Nice — that's verified");
    },
    [applyBoardOrder, groupBy, celebrate],
  );

  const wipLimit = (columnId: string) =>
    groupBy === "status"
      ? project.wipLimits?.[columnId as TicketStatus]
      : undefined;

  const overLimit = (columnId: string) => {
    const limit = wipLimit(columnId);
    return limit !== undefined && (value[columnId]?.length ?? 0) > limit;
  };

  /** Swimlanes are rows of a second dimension; drag stays on the plain board. */
  const lanes = React.useMemo(() => {
    if (swimlane === "none") return [];

    const laneOf = (ticket: Ticket) => {
      if (swimlane === "assignee") return ticket.assigneeId ?? "unassigned";
      if (swimlane === "priority") return ticket.priority;
      return ticket.parentId ?? "none";
    };

    const buckets = new Map<string, Ticket[]>();
    for (const ticket of filtered) {
      const key = laneOf(ticket);
      const bucket = buckets.get(key);
      if (bucket) bucket.push(ticket);
      else buckets.set(key, [ticket]);
    }

    const nameOf = (key: string) => {
      if (swimlane === "assignee") {
        return key === "unassigned" ? "Unassigned" : (getUser(key)?.name ?? key);
      }
      if (swimlane === "priority") {
        return PRIORITY_LABEL[key as keyof typeof PRIORITY_LABEL] ?? key;
      }
      if (key === "none") return "No epic";
      return tickets.find((item) => item.id === key)?.title ?? key;
    };

    return [...buckets.entries()]
      .map(([id, items]) => ({ id, name: nameOf(id), items }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [filtered, swimlane, tickets]);

  if (isLoading) return <BoardSkeleton />;

  const columnHeader = (column: { id: string; name: string }, count: number) => (
    <div className="flex h-10 shrink-0 items-center gap-2 border-b border-grey-200 px-3">
      <span className="truncate text-caption font-semibold tracking-wide text-grey-700 uppercase">
        {column.name}
      </span>
      <span
        className={cn("tnum text-caption", !overLimit(column.id) && "text-grey-500")}
        style={
          overLimit(column.id) ? { color: "var(--priority-urgent-fg)" } : undefined
        }
      >
        {count}
        {wipLimit(column.id) ? ` / ${wipLimit(column.id)}` : ""}
      </span>
      {overLimit(column.id) ? (
        <span title="Over the work-in-progress limit" className="text-caption">
          ⚠️
        </span>
      ) : null}
    </div>
  );

  return (
    <>
      <FilterBar
        project={project}
        resultCount={filtered.length}
        totalCount={scoped.length}
        hideStatus={groupBy === "status"}
        extra={<GroupBySelect />}
      />

      {filtered.length === 0 ? (
        <EmptyState
          emoji="🧊"
          title={
            scoped.length === 0
              ? "This board is empty"
              : "No tickets match these filters"
          }
          description={
            scoped.length === 0
              ? `No tickets in ${project.name} yet. Tickets added to this project show up in Backlog.`
              : "Try removing a filter or widening your search."
          }
        />
      ) : lanes.length > 1 ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          {lanes.map((lane) => (
            <section key={lane.id}>
              <h3 className="mb-2 flex items-center gap-2 text-caption font-semibold tracking-wide text-grey-600 uppercase">
                {lane.name}
                <span className="tnum font-normal text-grey-400">
                  {lane.items.length}
                </span>
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {columns.map((column) => {
                  const items = lane.items.filter(
                    (ticket) => groupKeyOf(ticket, groupBy) === column.id,
                  );
                  return (
                    <div
                      key={column.id}
                      className="flex w-[300px] shrink-0 flex-col gap-2 rounded-md border border-grey-200 bg-grey-50 p-2"
                    >
                      <span className="px-1 text-caption font-semibold tracking-wide text-grey-600 uppercase">
                        {column.name}
                        <span className="tnum ml-1.5 font-normal text-grey-400">
                          {items.length}
                        </span>
                      </span>
                      {items.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="rounded-md border border-grey-200 bg-grey-0"
                        >
                          <TicketCard
                            ticket={ticket}
                            onOpen={openTicket}
                            showStatus={groupBy !== "status"}
                          />
                        </div>
                      ))}
                      {items.length === 0 ? (
                        <p className="px-1 pb-1 text-caption text-grey-400">—</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="min-h-0 flex-1 px-6 py-4">
          <Kanban
            value={value}
            onValueChange={handleValueChange}
            getItemValue={(ticket) => ticket.id}
            className="h-full"
          >
            <KanbanBoard className="flex h-full gap-3 overflow-x-auto overflow-y-hidden sm:grid-cols-none">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  value={column.id}
                  className="flex h-full w-[300px] shrink-0 flex-col overflow-hidden rounded-md border border-grey-200 bg-grey-50 p-0"
                >
                  {columnHeader(column, value[column.id]?.length ?? 0)}

                  <KanbanColumnContent
                    value={column.id}
                    className="flex flex-1 flex-col gap-2 overflow-y-auto p-2"
                  >
                    {(value[column.id] ?? []).map((ticket) => (
                      <KanbanItem key={ticket.id} value={ticket.id}>
                        {/*
                          KanbanItem publishes its drag listeners through
                          context rather than onto the element, so the handle
                          is what makes the card draggable. Wrapping the whole
                          card keeps "grab anywhere" while ReUI's 10px
                          activation distance leaves plain clicks intact.
                        */}
                        <KanbanItemHandle
                          asChild
                          className="rounded-md border border-grey-200 bg-grey-0 transition-[border-color,transform] duration-[--duration-instant] hover:border-grey-300 active:scale-[0.995]"
                        >
                          <div>
                            <TicketCard
                              ticket={ticket}
                              onOpen={openTicket}
                              showStatus={groupBy !== "status"}
                            />
                          </div>
                        </KanbanItemHandle>
                      </KanbanItem>
                    ))}

                    {(value[column.id]?.length ?? 0) === 0 ? (
                      <p className="px-1 text-caption text-grey-400">
                        {groupBy === "status" ? "Drag a ticket here." : "Nothing here."}
                      </p>
                    ) : null}
                  </KanbanColumnContent>
                </KanbanColumn>
              ))}
            </KanbanBoard>

            <KanbanOverlay>
              {({ value: activeId }) => {
                const ticket = filtered.find((item) => item.id === activeId);
                if (!ticket) return null;
                return (
                  <div className="w-[284px] rotate-[1.5deg] scale-[1.02] rounded-md border border-grey-300 bg-grey-0 shadow-drag">
                    <TicketCard ticket={ticket} showStatus={groupBy !== "status"} />
                  </div>
                );
              }}
            </KanbanOverlay>
          </Kanban>
        </div>
      )}
    </>
  );
}
