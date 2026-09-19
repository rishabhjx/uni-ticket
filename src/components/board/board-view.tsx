"use client";

import * as React from "react";

import { randomCheer, useCelebrate } from "@/components/shared/celebrate";
import { FilterBar } from "@/components/list/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { BoardSkeleton } from "@/components/shared/skeletons";
import { TicketCard } from "@/components/tickets/ticket-card";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/kanban";
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
import { GroupBySelect } from "@/components/board/group-by-select";
import { cn } from "@/lib/utils";

type BoardCard = {
  id: string;
  name: string;
  column: string;
  ticket: Ticket;
};

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
        id: priority,
        name: PRIORITY_LABEL[priority],
      }));
    case "severity":
      return [
        ...TICKET_SEVERITIES.map((severity) => ({
          id: severity,
          name: SEVERITY_SHORT[severity],
        })),
        { id: "none", name: "No severity" },
      ];
    case "type":
      return TICKET_TYPES.map((type) => ({ id: type, name: TYPE_LABEL[type] }));
    default:
      return TICKET_STATUSES.map((status) => ({
        id: status,
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
   * Grouped by column, then ordered within it. `order` is only meaningful
   * inside a column, so sorting the whole project by it would reshuffle on
   * every drag and the board would never settle.
   */
  const data = React.useMemo<BoardCard[]>(() => {
    const byColumn = new Map<string, Ticket[]>();
    for (const ticket of filtered) {
      const key = groupKeyOf(ticket, groupBy);
      const bucket = byColumn.get(key);
      if (bucket) bucket.push(ticket);
      else byColumn.set(key, [ticket]);
    }

    return columns.flatMap((column) =>
      (byColumn.get(column.id) ?? [])
        .sort((a, b) => a.order - b.order)
        .map((ticket) => ({
          id: ticket.id,
          name: ticket.title,
          column: column.id,
          ticket,
        })),
    );
  }, [filtered, columns, groupBy]);

  const counts = React.useMemo(() => {
    const totals = new Map<string, number>();
    for (const card of data) {
      totals.set(card.column, (totals.get(card.column) ?? 0) + 1);
    }
    return totals;
  }, [data]);

  // Only a status board can commit a drag: the other groupings would need a
  // different field written, which the brief does not ask for.
  const handleDataChange = React.useCallback(
    (next: BoardCard[]) => {
      if (groupBy !== "status") return;

      // Only cheer for work that actually crossed into Done.
      const justFinished = next.filter(
        (card) => card.column === "done" && card.ticket.status !== "done",
      );

      applyBoardOrder(
        next.map(({ id, column }) => ({ id, column: column as TicketStatus })),
      );

      if (justFinished.length > 0) {
        celebrate(randomCheer(), "Nice — that's done");
      }
    },
    [applyBoardOrder, groupBy, celebrate],
  );

  /**
   * WIP limits are the one board constraint teams actually enforce, and a
   * count with no ceiling beside it does not tell you when to stop starting.
   */
  const wipLimit = (columnId: string) =>
    groupBy === "status"
      ? project.wipLimits?.[columnId as TicketStatus]
      : undefined;

  const overLimit = (columnId: string) => {
    const limit = wipLimit(columnId);
    return limit !== undefined && (counts.get(columnId) ?? 0) > limit;
  };

  /**
   * Swimlanes are rows of a second dimension. Drag is disabled inside them —
   * a drop would have to write two fields at once, and guessing which is worse
   * than not offering it.
   */
  const lanes = React.useMemo(() => {
    if (swimlane === "none") return [];

    const laneOf = (card: BoardCard) => {
      if (swimlane === "assignee") return card.ticket.assigneeId ?? "unassigned";
      if (swimlane === "priority") return card.ticket.priority;
      return card.ticket.parentId ?? "none";
    };

    const buckets = new Map<string, BoardCard[]>();
    for (const card of data) {
      const key = laneOf(card);
      const bucket = buckets.get(key);
      if (bucket) bucket.push(card);
      else buckets.set(key, [card]);
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
      .map(([id, cards]) => ({ id, name: nameOf(id), cards }))
      .sort((a, b) => b.cards.length - a.cards.length);
  }, [data, swimlane, tickets]);

  if (isLoading) return <BoardSkeleton />;

  return (
    <>
      <FilterBar
        project={project}
        resultCount={filtered.length}
        totalCount={scoped.length}
        hideStatus={groupBy === "status"}
        extra={<GroupBySelect />}
      />

      {lanes.length > 1 ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          {lanes.map((lane) => (
            <section key={lane.id}>
              <h3 className="mb-2 flex items-center gap-2 text-caption font-semibold tracking-wide text-grey-600 uppercase">
                {lane.name}
                <span className="tnum font-normal text-grey-400">
                  {lane.cards.length}
                </span>
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {columns.map((column) => {
                  const cards = lane.cards.filter(
                    (card) => card.column === column.id,
                  );
                  return (
                    <div
                      key={column.id}
                      className="flex w-[300px] shrink-0 flex-col gap-2 rounded-md border border-grey-200 bg-grey-50 p-2"
                    >
                      <span className="px-1 text-caption font-semibold tracking-wide text-grey-600 uppercase">
                        {column.name}
                        <span className="tnum ml-1.5 font-normal text-grey-400">
                          {cards.length}
                        </span>
                      </span>
                      {cards.map((card) => (
                        <div
                          key={card.id}
                          className="rounded-md border border-grey-200 bg-grey-0"
                        >
                          <TicketCard
                            ticket={card.ticket}
                            onOpen={openTicket}
                            showStatus={groupBy !== "status"}
                          />
                        </div>
                      ))}
                      {cards.length === 0 ? (
                        <p className="px-1 pb-1 text-caption text-grey-400">—</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : data.length === 0 ? (
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
      ) : (
        <div className="min-h-0 flex-1 px-6 py-4">
          <KanbanProvider
            id={`board-${project.id}-${groupBy}`}
            columns={columns}
            data={data}
            onDataChange={handleDataChange}
            className="h-full"
          >
            {(column) => (
              <KanbanBoard key={column.id} id={column.id}>
                <KanbanHeader className="flex h-10 items-center gap-2 border-b border-grey-200 px-3">
                  <span className="truncate text-caption font-semibold tracking-wide text-grey-700 uppercase">
                    {column.name}
                  </span>
                  <span
                    className={cn(
                      "tnum text-caption",
                      overLimit(column.id) ? "font-semibold" : "text-grey-500",
                    )}
                    style={
                      overLimit(column.id)
                        ? { color: "var(--priority-urgent-fg)" }
                        : undefined
                    }
                  >
                    {counts.get(column.id) ?? 0}
                    {wipLimit(column.id) ? ` / ${wipLimit(column.id)}` : ""}
                  </span>
                  {overLimit(column.id) ? (
                    <span
                      title="Over the work-in-progress limit"
                      className="text-caption"
                      aria-label="Over the work in progress limit"
                    >
                      ⚠️
                    </span>
                  ) : null}
                </KanbanHeader>

                <KanbanCards id={column.id}>
                  {(card: BoardCard) => (
                    <KanbanCard key={card.id} {...card}>
                      <TicketCard
                        ticket={card.ticket}
                        onOpen={openTicket}
                        showStatus={groupBy !== "status"}
                      />
                    </KanbanCard>
                  )}
                </KanbanCards>

                {(counts.get(column.id) ?? 0) === 0 ? (
                  <p className="px-3 pb-3 text-caption text-grey-400">
                    {groupBy === "status" ? "Drag a ticket here." : "Nothing here."}
                  </p>
                ) : null}
              </KanbanBoard>
            )}
          </KanbanProvider>
        </div>
      )}
    </>
  );
}
