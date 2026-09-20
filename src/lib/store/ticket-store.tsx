"use client";

import * as React from "react";

import {
  comments as seedComments,
  events as seedEvents,
  projects as seedProjects,
  workspaces as seedWorkspaces,
  tickets as seedTickets,
  getProject,
  getUser,
  CURRENT_USER_ID,
  type Comment,
  type Ticket,
  type TicketEvent,
  type Attachment,
  type LinkType,
  type Project,
  type Workspace,
  type TicketStatus,
  type TicketType,
  LINK_INVERSE,
} from "@/lib/mock";

export type NewTicketInput = {
  projectId: string;
  title: string;
  description: string;
  type: TicketType;
  priority: Ticket["priority"];
  severity: Ticket["severity"];
  status: TicketStatus;
  assigneeIds: string[];
  labelIds: string[];
  estimate: number | null;
  dueAt: string | null;
  environment: Ticket["environment"];
  buildVersion: string | null;
  parentId: string | null;
  sprintId: string | null;
};

/**
 * The prototype's single source of truth. Seeded from /lib/mock and mutated
 * locally — every change also writes to the audit trail, so the history in the
 * panel is never out of step with the ticket.
 */
export type NewProjectInput = {
  name: string;
  key: string;
  description: string;
  emoji: string;
  kind: Project["kind"];
  memberIds: string[];
  /** Every project belongs to a workspace. */
  workspaceId: string;
};

export type NewWorkspaceInput = {
  name: string;
  slug: string;
  description: string;
  emoji: string;
  memberIds: string[];
};

type TicketStoreValue = {
  workspaces: Workspace[];
  projects: Project[];
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
  createProject: (input: NewProjectInput) => Project;
  createWorkspace: (input: NewWorkspaceInput) => Workspace;
  /** Sends a verified ticket back to be worked on, and says so in the history. */
  reopenTicket: (ticketId: string) => void;
  linkTickets: (ticketId: string, otherId: string, type: LinkType) => void;
  unlinkTickets: (ticketId: string, otherId: string) => void;
  addAttachment: (ticketId: string, file: Omit<Attachment, "id">) => void;
  removeAttachment: (ticketId: string, attachmentId: string) => void;
  /** Restores the snapshot taken before the last bulk change. */
  undo: (() => void) | null;
  addComment: (
    ticketId: string,
    body: string,
    attachments?: Omit<Attachment, "id">[],
  ) => void;
  toggleReaction: (commentId: string, emoji: string) => void;
  editComment: (commentId: string, body: string) => void;
  deleteComment: (commentId: string) => void;
};

const TicketStoreContext = React.createContext<TicketStoreValue | null>(null);

const CREATED_PROJECTS_KEY = "uni.createdProjects";
const CREATED_WORKSPACES_KEY = "uni.createdWorkspaces";

/**
 * Projects created at runtime are persisted. A static host has no route for a
 * new project, so it falls through to the not-found page — which mounts its
 * own store. Without this the project would vanish on the way there.
 */
function loadCreatedProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(CREATED_PROJECTS_KEY);
    return stored ? (JSON.parse(stored) as Project[]) : [];
  } catch {
    return [];
  }
}

function loadCreatedWorkspaces(): Workspace[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(CREATED_WORKSPACES_KEY);
    return stored ? (JSON.parse(stored) as Workspace[]) : [];
  } catch {
    return [];
  }
}

/** Field changes worth recording in the history. */
const trackedFields = [
  "status",
  "assigneeIds",
  "priority",
  "severity",
  "title",
  "description",
] as const;

const eventKindForField: Record<(typeof trackedFields)[number], TicketEvent["kind"]> = {
  status: "status",
  assigneeIds: "assignee",
  priority: "priority",
  severity: "severity",
  title: "title",
  description: "description",
};

/** Long prose in an audit entry is unreadable, so record that it changed. */
function auditValue(field: (typeof trackedFields)[number], value: unknown) {
  if (value === null || value === undefined) return null;
  if (field === "assigneeIds") {
    const ids = value as string[];
    if (ids.length === 0) return null;
    return ids.map((id) => getUser(id)?.name ?? id).join(", ");
  }
  const text = String(value);
  if (field === "description") return null;
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
}

/** Arrays never compare equal by reference, so the audit needs this. */
function sameFieldValue(a: unknown, b: unknown) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => item === b[i]);
  }
  return a === b;
}

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
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>(() => [
    ...seedWorkspaces,
    ...loadCreatedWorkspaces(),
  ]);
  const [projects, setProjects] = React.useState<Project[]>(() => [
    ...seedProjects,
    ...loadCreatedProjects(),
  ]);
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
          (field) =>
            patch[field] !== undefined &&
            !sameFieldValue(patch[field], ticket[field]),
        )
        .map((field) => ({
          ticketId: ticket.id,
          kind: eventKindForField[field],
          from: auditValue(field, ticket[field]),
          to: auditValue(field, patch[field]),
        })),
    [],
  );

  // One level of undo, which is what a bulk action actually needs.
  const [undoSnapshot, setUndoSnapshot] = React.useState<Ticket[] | null>(null);

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
    (ticketIds: string[], patch: Partial<Ticket>) => {
      setTickets((current) => {
        setUndoSnapshot(current);
        return current;
      });
      applyPatch(ticketIds, patch);
    },
    [applyPatch],
  );

  const undo = React.useCallback(() => {
    if (!undoSnapshot) return;
    setTickets(undoSnapshot);
    setUndoSnapshot(null);
  }, [undoSnapshot]);

  const reopenTicket = React.useCallback(
    (ticketId: string) => {
      const at = new Date().toISOString();
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: "in_progress", updatedAt: at, statusChangedAt: at }
            : ticket,
        ),
      );
      queueMicrotask(() =>
        recordEvents(
          [{ ticketId, kind: "reopened", from: "done", to: "in_progress" }],
          at,
        ),
      );
    },
    [recordEvents],
  );

  const linkTickets = React.useCallback(
    (ticketId: string, otherId: string, type: LinkType) => {
      if (ticketId === otherId) return;
      setTickets((current) =>
        current.map((ticket) => {
          if (ticket.id === ticketId) {
            if (ticket.links.some((link) => link.ticketId === otherId)) return ticket;
            return { ...ticket, links: [...ticket.links, { type, ticketId: otherId }] };
          }
          if (ticket.id === otherId) {
            if (ticket.links.some((link) => link.ticketId === ticketId)) return ticket;
            // Both sides carry the relationship, so either one shows it.
            return {
              ...ticket,
              links: [...ticket.links, { type: LINK_INVERSE[type], ticketId }],
            };
          }
          return ticket;
        }),
      );
    },
    [],
  );

  const unlinkTickets = React.useCallback((ticketId: string, otherId: string) => {
    setTickets((current) =>
      current.map((ticket) => {
        if (ticket.id !== ticketId && ticket.id !== otherId) return ticket;
        const target = ticket.id === ticketId ? otherId : ticketId;
        return {
          ...ticket,
          links: ticket.links.filter((link) => link.ticketId !== target),
        };
      }),
    );
  }, []);

  const attachmentSeq = React.useRef(0);

  const addAttachment = React.useCallback(
    (ticketId: string, file: Omit<Attachment, "id">) => {
      attachmentSeq.current += 1;
      const id = `a-local-${attachmentSeq.current}`;
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, attachments: [...ticket.attachments, { ...file, id }] }
            : ticket,
        ),
      );
    },
    [],
  );

  const removeAttachment = React.useCallback(
    (ticketId: string, attachmentId: string) => {
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                attachments: ticket.attachments.filter(
                  (file) => file.id !== attachmentId,
                ),
              }
            : ticket,
        ),
      );
    },
    [],
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
        assigneeIds: input.assigneeIds,
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
        parentId: input.parentId,
        links: [],
        sprintId: input.sprintId,
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

  const createProject = React.useCallback((input: NewProjectInput) => {
    const slug = input.key.toLowerCase();
    const project: Project = {
      id: `p-${slug}`,
      key: input.key.toUpperCase(),
      slug,
      name: input.name.trim(),
      description: input.description.trim(),
      leadId: CURRENT_USER_ID,
      memberIds: input.memberIds,
      workspaceId: input.workspaceId,
      kind: input.kind,
      emoji: input.emoji,
      // Whoever creates a project administers it.
      roles: Object.fromEntries(
        input.memberIds.map((id) => [
          id,
          id === CURRENT_USER_ID ? "admin" : "member",
        ]),
      ),
      startedOn: new Date().toISOString(),
    };

    setProjects((current) => {
      const next = [...current, project];
      try {
        window.localStorage.setItem(
          CREATED_PROJECTS_KEY,
          JSON.stringify(next.filter((item) => !seedProjects.includes(item))),
        );
      } catch {
        // Persisting is a convenience; the project still exists in memory.
      }
      return next;
    });
    return project;
  }, []);

  const createWorkspace = React.useCallback((input: NewWorkspaceInput) => {
    const workspace: Workspace = {
      id: `w-${input.slug}`,
      slug: input.slug,
      name: input.name.trim(),
      description: input.description.trim(),
      emoji: input.emoji,
      memberIds: input.memberIds,
    };

    setWorkspaces((current) => {
      const next = [...current, workspace];
      try {
        window.localStorage.setItem(
          CREATED_WORKSPACES_KEY,
          JSON.stringify(next.filter((item) => !seedWorkspaces.includes(item))),
        );
      } catch {
        // Persisting is a convenience; the workspace still exists in memory.
      }
      return next;
    });
    return workspace;
  }, []);

  const commentFileSeq = React.useRef(0);

  const addComment = React.useCallback(
    (
      ticketId: string,
      body: string,
      attachments: Omit<Attachment, "id">[] = [],
    ) => {
      const trimmed = body.trim();
      // A comment that is only a screenshot is still a comment.
      if (!trimmed && attachments.length === 0) return;
      const at = new Date().toISOString();

      setComments((current) => [
        ...current,
        {
          id: `c-local-${current.length + 1}-${ticketId}`,
          ticketId,
          authorId: CURRENT_USER_ID,
          body: trimmed,
          createdAt: at,
          reactions: {},
          attachments: attachments.map((file) => {
            commentFileSeq.current += 1;
            return { ...file, id: `ca-${commentFileSeq.current}` };
          }),
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

  const toggleReaction = React.useCallback((commentId: string, emoji: string) => {
    setComments((current) =>
      current.map((comment) => {
        if (comment.id !== commentId) return comment;
        const reacted = comment.reactions[emoji] ?? [];
        const mine = reacted.includes(CURRENT_USER_ID);
        const next = mine
          ? reacted.filter((id) => id !== CURRENT_USER_ID)
          : [...reacted, CURRENT_USER_ID];

        const reactions = { ...comment.reactions };
        if (next.length === 0) delete reactions[emoji];
        else reactions[emoji] = next;

        return { ...comment, reactions };
      }),
    );
  }, []);

  const editComment = React.useCallback((commentId: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId ? { ...comment, body: trimmed } : comment,
      ),
    );
  }, []);

  const deleteComment = React.useCallback((commentId: string) => {
    setComments((current) => current.filter((comment) => comment.id !== commentId));
  }, []);

  const value = React.useMemo(
    () => ({
      workspaces,
      projects,
      tickets,
      comments,
      events,
      isLoading,
      moveTicket,
      applyBoardOrder,
      updateTicket,
      updateMany,
      createTicket,
      createProject,
      createWorkspace,
      reopenTicket,
      linkTickets,
      unlinkTickets,
      addAttachment,
      removeAttachment,
      undo: undoSnapshot ? undo : null,
      addComment,
      toggleReaction,
      editComment,
      deleteComment,
    }),
    [
      workspaces,
      projects,
      tickets,
      comments,
      events,
      isLoading,
      moveTicket,
      applyBoardOrder,
      updateTicket,
      updateMany,
      createTicket,
      createProject,
      createWorkspace,
      reopenTicket,
      linkTickets,
      unlinkTickets,
      addAttachment,
      removeAttachment,
      undoSnapshot,
      undo,
      addComment,
      toggleReaction,
      editComment,
      deleteComment,
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
