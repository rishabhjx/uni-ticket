"use client";

import * as React from "react";

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/kanban";
import { TicketCard } from "@/components/tickets/ticket-card";
import { useTicketStore } from "@/lib/store/ticket-store";
import {
  STATUS_LABEL,
  TICKET_STATUSES,
  type Project,
  type Ticket,
  type TicketStatus,
} from "@/lib/mock";

/** The shape Kibo's kanban works in: one flat list keyed by column. */
type BoardCard = {
  id: string;
  name: string;
  column: TicketStatus;
  ticket: Ticket;
};

const columns = TICKET_STATUSES.map((status) => ({
  id: status,
  name: STATUS_LABEL[status],
}));

export function BoardView({
  project,
  onOpenTicket,
}: {
  project: Project;
  onOpenTicket?: (ticketId: string) => void;
}) {
  const { tickets, applyBoardOrder } = useTicketStore();

  /**
   * Grouped by column, then ordered within it. `order` is only meaningful
   * inside a column — two tickets in different columns share order 0 — so
   * sorting the whole project by it would reshuffle on every drag and the
   * board would never settle.
   */
  const data = React.useMemo<BoardCard[]>(() => {
    const byStatus = new Map<TicketStatus, Ticket[]>();
    for (const ticket of tickets) {
      if (ticket.projectId !== project.id) continue;
      const column = byStatus.get(ticket.status);
      if (column) column.push(ticket);
      else byStatus.set(ticket.status, [ticket]);
    }

    return TICKET_STATUSES.flatMap((status) =>
      (byStatus.get(status) ?? [])
        .sort((a, b) => a.order - b.order)
        .map((ticket) => ({
          id: ticket.id,
          name: ticket.title,
          column: ticket.status,
          ticket,
        })),
    );
  }, [tickets, project.id]);

  const counts = React.useMemo(() => {
    const totals = new Map<TicketStatus, number>();
    for (const card of data) {
      totals.set(card.column, (totals.get(card.column) ?? 0) + 1);
    }
    return totals;
  }, [data]);

  // The kanban hands back the full arrangement; the store is the source of
  // truth, so every drag — including the live cross-column preview — lands here.
  const handleDataChange = React.useCallback(
    (next: BoardCard[]) => {
      applyBoardOrder(next.map(({ id, column }) => ({ id, column })));
    },
    [applyBoardOrder],
  );

  return (
    <div className="min-h-0 flex-1 px-6 py-4">
      <KanbanProvider
        // dnd-kit derives its aria-describedby id from this; without a stable
        // value the server and client disagree and hydration warns.
        id={`board-${project.id}`}
        columns={columns}
        data={data}
        onDataChange={handleDataChange}
        className="h-full"
      >
        {(column) => (
          <KanbanBoard key={column.id} id={column.id}>
            <KanbanHeader className="flex h-10 items-center gap-2 border-b border-grey-200 px-3">
              <span className="text-caption font-semibold tracking-wide text-grey-700 uppercase">
                {column.name}
              </span>
              <span className="tnum text-caption text-grey-500">
                {counts.get(column.id as TicketStatus) ?? 0}
              </span>
            </KanbanHeader>

            <KanbanCards id={column.id}>
              {(card: BoardCard) => (
                <KanbanCard key={card.id} {...card}>
                  <TicketCard ticket={card.ticket} onOpen={onOpenTicket} />
                </KanbanCard>
              )}
            </KanbanCards>

            {(counts.get(column.id as TicketStatus) ?? 0) === 0 ? (
              <p className="px-3 pb-3 text-caption text-grey-400">
                Drag a ticket here.
              </p>
            ) : null}
          </KanbanBoard>
        )}
      </KanbanProvider>
    </div>
  );
}
