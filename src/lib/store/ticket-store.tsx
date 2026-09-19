"use client";

import * as React from "react";

import {
  comments as seedComments,
  tickets as seedTickets,
  CURRENT_USER_ID,
  type Comment,
  type Ticket,
  type TicketStatus,
} from "@/lib/mock";

/**
 * The prototype's single source of truth. Seeded from /lib/mock and mutated
 * locally — moving a card or posting a comment updates this and nothing else,
 * which is why the prototype feels real without a backend.
 */
type TicketStoreValue = {
  tickets: Ticket[];
  comments: Comment[];
  /**
   * The prototype has no backend, so nothing is genuinely pending — but a tool
   * like this always loads its data, and the loading state is part of the
   * design. It resolves once, shortly after mount, so prerendered HTML shows
   * skeletons and navigation afterwards is instant.
   */
  isLoading: boolean;
  /** Moves a ticket into a status at a given index within that column. */
  moveTicket: (
    ticketId: string,
    status: TicketStatus,
    toIndex: number,
  ) => void;
  /**
   * Commits a whole board arrangement: entries arrive in board order, and each
   * ticket takes the status and position the drag left it in.
   */
  applyBoardOrder: (entries: { id: string; column: TicketStatus }[]) => void;
  updateTicket: (ticketId: string, patch: Partial<Ticket>) => void;
  addComment: (ticketId: string, body: string) => void;
};

const TicketStoreContext = React.createContext<TicketStoreValue | null>(null);

function reorderColumn(
  all: Ticket[],
  moved: Ticket,
  status: TicketStatus,
  toIndex: number,
) {
  const column = all
    .filter(
      (ticket) =>
        ticket.projectId === moved.projectId &&
        ticket.status === status &&
        ticket.id !== moved.id,
    )
    .sort((a, b) => a.order - b.order);

  const clamped = Math.max(0, Math.min(toIndex, column.length));
  column.splice(clamped, 0, moved);

  const orders = new Map(column.map((ticket, index) => [ticket.id, index]));
  return orders;
}

export function TicketStoreProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = React.useState<Ticket[]>(seedTickets);
  const [comments, setComments] = React.useState<Comment[]>(seedComments);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // setState lands in the timer callback, not the effect body.
    const timer = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const moveTicket = React.useCallback(
    (ticketId: string, status: TicketStatus, toIndex: number) => {
      setTickets((current) => {
        const moved = current.find((ticket) => ticket.id === ticketId);
        if (!moved) return current;
        if (moved.status === status && moved.order === toIndex) return current;

        const next = { ...moved, status, updatedAt: new Date().toISOString() };
        const orders = reorderColumn(current, next, status, toIndex);

        return current.map((ticket) => {
          if (ticket.id === ticketId) {
            return { ...next, order: orders.get(ticketId) ?? next.order };
          }
          const order = orders.get(ticket.id);
          return order === undefined ? ticket : { ...ticket, order };
        });
      });
    },
    [],
  );

  const applyBoardOrder = React.useCallback(
    (entries: { id: string; column: TicketStatus }[]) => {
      // Computed outside the updater so a double-invoked render can't produce
      // two different timestamps.
      const movedAt = new Date().toISOString();

      const placement = new Map<string, { status: TicketStatus; order: number }>();
      const nextOrder = new Map<TicketStatus, number>();
      for (const entry of entries) {
        const order = nextOrder.get(entry.column) ?? 0;
        placement.set(entry.id, { status: entry.column, order });
        nextOrder.set(entry.column, order + 1);
      }

      setTickets((current) =>
        current.map((ticket) => {
          const next = placement.get(ticket.id);
          if (!next) return ticket;
          if (ticket.status === next.status && ticket.order === next.order) {
            return ticket;
          }
          return {
            ...ticket,
            status: next.status,
            order: next.order,
            updatedAt:
              ticket.status === next.status ? ticket.updatedAt : movedAt,
          };
        }),
      );
    },
    [],
  );

  const updateTicket = React.useCallback(
    (ticketId: string, patch: Partial<Ticket>) => {
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, ...patch, updatedAt: new Date().toISOString() }
            : ticket,
        ),
      );
    },
    [],
  );

  const addComment = React.useCallback((ticketId: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;

    setComments((current) => [
      ...current,
      {
        id: `c-local-${current.length + 1}-${ticketId}`,
        ticketId,
        authorId: CURRENT_USER_ID,
        body: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, updatedAt: new Date().toISOString() }
          : ticket,
      ),
    );
  }, []);

  const value = React.useMemo(
    () => ({
      tickets,
      comments,
      isLoading,
      moveTicket,
      applyBoardOrder,
      updateTicket,
      addComment,
    }),
    [
      tickets,
      comments,
      isLoading,
      moveTicket,
      applyBoardOrder,
      updateTicket,
      addComment,
    ],
  );

  return <TicketStoreContext value={value}>{children}</TicketStoreContext>;
}

export function useTicketStore() {
  const context = React.use(TicketStoreContext);
  if (!context) {
    throw new Error("useTicketStore must be used inside <TicketStoreProvider>");
  }
  return context;
}
