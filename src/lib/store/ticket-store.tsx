"use client";

import * as React from "react";

import {
  comments as seedComments,
  events as seedEvents,
  tickets as seedTickets,
  getProject,
  CURRENT_USER_ID,
  type Comment,
  type Ticket,
  type TicketEvent,
  type TicketStatus,
  type TicketType,
} from "@/lib/mock";

export type NewTicketInput = {
  projectId: string;
  title: string;
  description: string;
  type: TicketType;
  priority: Ticket["priority"];
  severity: Ticket["severity"];
  status: TicketStatus;
  assigneeId: string | null;
  labelIds: string[];
  estimate: number | null;
  dueAt: string | null;
  environment: Ticket["environment"];
  buildVersion: string | null;
};

/**
 * The prototype's single source of truth. Seeded from /lib/mock and mutated
 * locally — every change also writes to the audit trail, so the history in the
 * panel is never out of step with the ticket.
 */
type TicketStoreValue = {
  tickets: Ticket[];
  comments: Comment[];
  events: TicketEvent[];
  isLoading: boolean;
  moveTicket: (ticketId: string, status: TicketStatus, toIndex: number) => void;
  applyBoardOrder: (entries: { id: string; column: TicketStatus }[]) => void;
  updateTicket: (ticketId: string, patch: Partial<Ticket>) => void;
  /** Applies the same patch to many tickets at once. */
  updateMany: (ticketIds: string[], patch: Partial<Ticket>) => void;
  createTicket: (input: NewTicketInput) => Ticket;
  addComment: (ticketId: string, body: string) => void;
};

const TicketStoreContext = React.createContext<TicketStoreValue | null>(null);

/** Field changes worth recording in the history. */
const trackedFields = ["status", "assigneeId", "priority", "severity"] as const;

const eventKindForField: Record<(typeof trackedFields)[number], TicketEvent["kind"]> = {
  status: "status",
  assigneeId: "assignee",
  priority: "priority",
  severity: "severity",
};

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

  return new Map(column.map((ticket, index) => [ticket.id, index]));
}

export function TicketStoreProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = React.useState<Ticket[]>(seedTickets);
  const [comments, setComments] = React.useState<Comment[]>(seedComments);
  const [events, setEvents] = React.useState<TicketEvent[]>(seedEvents);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const eventSeq = React.useRef(0);
  const recordEvents = React.useCallback(
    (entries: Omit<TicketEvent, "id" | "createdAt" | "actorId">[], at: string) => {
      if (entries.length === 0) return;
      setEvents((current) => [
        ...current,
        ...entries.map((entry) => {
          eventSeq.current += 1;
          return {
            ...entry,
            id: `e-local-${eventSeq.current}`,
            actorId: CURRENT_USER_ID,
            createdAt: at,
          };
        }),
      ]);
    },
    [],
  );

  /** Turns a patch into the history entries it implies. */
  const diffToEvents = React.useCallback(
    (ticket: Ticket, patch: Partial<Ticket>) =>
      trackedFields
        .filter(
          (field) => patch[field] !== undefined && patch[field] !== ticket[field],
        )
        .map((field) => ({
          ticketId: ticket.id,
          kind: eventKindForField[field],
          from: (ticket[field] as string | null) ?? null,
          to: (patch[field] as string | null) ?? null,
        })),
    [],
  );

  const applyPatch = React.useCallback(
    (ticketIds: string[], patch: Partial<Ticket>) => {
      const at = new Date().toISOString();
      const ids = new Set(ticketIds);

      setTickets((current) => {
        const pending: Omit<TicketEvent, "id" | "createdAt" | "actorId">[] = [];

        const next = current.map((ticket) => {
          if (!ids.has(ticket.id)) return ticket;
          pending.push(...diffToEvents(ticket, patch));
          return {
            ...ticket,
            ...patch,
            updatedAt: at,
            statusChangedAt:
              patch.status !== undefined && patch.status !== ticket.status
                ? at
                : ticket.statusChangedAt,
          };
        });

        // Queued out of the updater so a double-invoked render cannot double
        // up the history.
        queueMicrotask(() => recordEvents(pending, at));
        return next;
      });
    },
    [diffToEvents, recordEvents],
  );

  const updateTicket = React.useCallback(
    (ticketId: string, patch: Partial<Ticket>) => applyPatch([ticketId], patch),
    [applyPatch],
  );

  const updateMany = React.useCallback(
    (ticketIds: string[], patch: Partial<Ticket>) => applyPatch(ticketIds, patch),
    [applyPatch],
  );

  const moveTicket = React.useCallback(
    (ticketId: string, status: TicketStatus, toIndex: number) => {
      setTickets((current) => {
        const moved = current.find((ticket) => ticket.id === ticketId);
        if (!moved) return current;
        if (moved.status === status && moved.order === toIndex) return current;

        const at = new Date().toISOString();
        const next = { ...moved, status, updatedAt: at, statusChangedAt: at };
        const orders = reorderColumn(current, next, status, toIndex);

        if (moved.status !== status) {
          queueMicrotask(() =>
            recordEvents(
              [{ ticketId, kind: "status", from: moved.status, to: status }],
              at,
            ),
          );
        }

        return current.map((ticket) => {
          if (ticket.id === ticketId) {
            return { ...next, order: orders.get(ticketId) ?? next.order };
          }
          const order = orders.get(ticket.id);
          return order === undefined ? ticket : { ...ticket, order };
        });
      });
    },
    [recordEvents],
  );

  const applyBoardOrder = React.useCallback(
    (entries: { id: string; column: TicketStatus }[]) => {
      const movedAt = new Date().toISOString();

      const placement = new Map<string, { status: TicketStatus; order: number }>();
      const nextOrder = new Map<TicketStatus, number>();
      for (const entry of entries) {
        const order = nextOrder.get(entry.column) ?? 0;
        placement.set(entry.id, { status: entry.column, order });
        nextOrder.set(entry.column, order + 1);
      }

      setTickets((current) => {
        const pending: Omit<TicketEvent, "id" | "createdAt" | "actorId">[] = [];

        const next = current.map((ticket) => {
          const target = placement.get(ticket.id);
          if (!target) return ticket;
          if (ticket.status === target.status && ticket.order === target.order) {
            return ticket;
          }
          const changedColumn = ticket.status !== target.status;
          if (changedColumn) {
            pending.push({
              ticketId: ticket.id,
              kind: "status",
              from: ticket.status,
              to: target.status,
            });
          }
          return {
            ...ticket,
            status: target.status,
            order: target.order,
            updatedAt: changedColumn ? movedAt : ticket.updatedAt,
            statusChangedAt: changedColumn ? movedAt : ticket.statusChangedAt,
          };
        });

        queueMicrotask(() => recordEvents(pending, movedAt));
        return next;
      });
    },
    [recordEvents],
  );

  const createdCount = React.useRef(0);

  const createTicket = React.useCallback(
    (input: NewTicketInput) => {
      const at = new Date().toISOString();
      createdCount.current += 1;

      const project = getProject(input.projectId);
      const id = `t-new-${createdCount.current}`;
      // Continue the project's key sequence rather than restarting at 1.
      const highest = seedTickets
        .filter((ticket) => ticket.projectId === input.projectId)
        .reduce(
          (max, ticket) => Math.max(max, Number(ticket.key.split("-")[1]) || 0),
          100,
        );

      const ticket: Ticket = {
        id,
        key: `${project?.key ?? "NEW"}-${highest + createdCount.current}`,
        projectId: input.projectId,
        title: input.title.trim(),
        description: input.description.trim(),
        status: input.status,
        priority: input.priority,
        type: input.type,
        assigneeId: input.assigneeId,
        reporterId: CURRENT_USER_ID,
        labelIds: input.labelIds,
        estimate: input.estimate,
        severity: input.severity,
        environment: input.environment,
        buildVersion: input.buildVersion,
        requesterId: null,
        slaDueAt: null,
        development: null,
        attachments: [],
        createdAt: at,
        updatedAt: at,
        statusChangedAt: at,
        dueAt: input.dueAt,
        order: -1,
      };

      // order -1 puts it at the top of its column, where a new ticket belongs.
      setTickets((current) => [ticket, ...current]);
      queueMicrotask(() =>
        recordEvents([{ ticketId: id, kind: "created", from: null, to: null }], at),
      );

      return ticket;
    },
    [recordEvents],
  );

  const addComment = React.useCallback(
    (ticketId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const at = new Date().toISOString();

      setComments((current) => [
        ...current,
        {
          id: `c-local-${current.length + 1}-${ticketId}`,
          ticketId,
          authorId: CURRENT_USER_ID,
          body: trimmed,
          createdAt: at,
        },
      ]);
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, updatedAt: at } : ticket,
        ),
      );
    },
    [],
  );

  const value = React.useMemo(
    () => ({
      tickets,
      comments,
      events,
      isLoading,
      moveTicket,
      applyBoardOrder,
      updateTicket,
      updateMany,
      createTicket,
      addComment,
    }),
    [
      tickets,
      comments,
      events,
      isLoading,
      moveTicket,
      applyBoardOrder,
      updateTicket,
      updateMany,
      createTicket,
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
