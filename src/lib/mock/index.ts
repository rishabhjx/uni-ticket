import { generateDataset } from "./generate";
import { startOfWeek, TODAY } from "./dates";
import { projects } from "./projects";
import type { Comment, Ticket, TicketEvent, TicketStatus } from "./types";
import { CURRENT_USER_ID, reporteeIds } from "./users";

const dataset = generateDataset();

export const tickets: Ticket[] = dataset.tickets;
export const comments: Comment[] = dataset.comments;
export const events: TicketEvent[] = dataset.events;

export * from "./types";
export * from "./users";
export * from "./labels";
export * from "./projects";
export * from "./dates";

/** Open work — everything that has not reached Done. */
export function isOpen(ticket: Ticket) {
  return ticket.status !== "done";
}

export function isOverdue(ticket: Ticket, now: Date = new Date()) {
  return isOpen(ticket) && ticket.dueAt !== null && new Date(ticket.dueAt) < now;
}

export function ticketsForProject(all: Ticket[], projectId: string) {
  return all.filter((ticket) => ticket.projectId === projectId);
}

export function ticketsForUser(all: Ticket[], userId: string = CURRENT_USER_ID) {
  return all.filter((ticket) => ticket.assigneeId === userId);
}

export function commentsForTicket(all: Comment[], ticketId: string) {
  return all
    .filter((comment) => comment.ticketId === ticketId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function eventsForTicket(all: TicketEvent[], ticketId: string) {
  return all
    .filter((event) => event.ticketId === ticketId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Whole days a ticket has sat in its current column. */
export function daysInColumn(ticket: Ticket, now: Date = new Date()) {
  return Math.floor(
    (now.getTime() - new Date(ticket.statusChangedAt).getTime()) / 86_400_000,
  );
}

/** Long enough in one column that somebody should look at it. */
export function isStale(ticket: Ticket, now: Date = new Date()) {
  if (!isOpen(ticket) || ticket.status === "backlog") return false;
  return daysInColumn(ticket, now) >= 7;
}

export function isSlaBreached(ticket: Ticket, now: Date = new Date()) {
  return (
    isOpen(ticket) && ticket.slaDueAt !== null && new Date(ticket.slaDueAt) < now
  );
}

/** Everything assigned to the people who report to this person. */
export function ticketsForTeam(all: Ticket[], userId: string = CURRENT_USER_ID) {
  const team = new Set(reporteeIds(userId));
  return all.filter(
    (ticket) => ticket.assigneeId !== null && team.has(ticket.assigneeId),
  );
}

export function countCommentsByTicket(all: Comment[]) {
  const counts = new Map<string, number>();
  for (const comment of all) {
    counts.set(comment.ticketId, (counts.get(comment.ticketId) ?? 0) + 1);
  }
  return counts;
}

export type PersonalKpis = {
  pending: number;
  inProgress: number;
  overdue: number;
  assignedThisWeek: number;
  stale: number;
  total: number;
};

/** The four numbers on the Home screen. */
export function personalKpis(
  all: Ticket[],
  userId: string = CURRENT_USER_ID,
): PersonalKpis {
  const mine = ticketsForUser(all, userId);
  const now = new Date();
  const weekStart = startOfWeek(TODAY);

  return {
    pending: mine.filter(
      (ticket) => ticket.status === "backlog" || ticket.status === "todo",
    ).length,
    inProgress: mine.filter(
      (ticket) => ticket.status === "in_progress" || ticket.status === "in_review",
    ).length,
    overdue: mine.filter((ticket) => isOverdue(ticket, now)).length,
    assignedThisWeek: mine.filter(
      (ticket) => new Date(ticket.updatedAt) >= weekStart,
    ).length,
    stale: mine.filter((ticket) => isStale(ticket, now)).length,
    total: mine.length,
  };
}

/** The same four numbers, for whatever set of tickets you hand it. */
export function kpisFor(scoped: Ticket[]): PersonalKpis {
  const now = new Date();
  const weekStart = startOfWeek(TODAY);

  return {
    pending: scoped.filter(
      (ticket) => ticket.status === "backlog" || ticket.status === "todo",
    ).length,
    inProgress: scoped.filter(
      (ticket) => ticket.status === "in_progress" || ticket.status === "in_review",
    ).length,
    overdue: scoped.filter((ticket) => isOverdue(ticket, now)).length,
    assignedThisWeek: scoped.filter(
      (ticket) => new Date(ticket.updatedAt) >= weekStart,
    ).length,
    stale: scoped.filter((ticket) => isStale(ticket, now)).length,
    total: scoped.length,
  };
}

export type ProjectStats = {
  total: number;
  open: number;
  done: number;
  inProgress: number;
  overdue: number;
  mine: number;
  /** 0–100. */
  completion: number;
};

export function projectStats(
  all: Ticket[],
  projectId: string,
  userId: string = CURRENT_USER_ID,
): ProjectStats {
  const scoped = ticketsForProject(all, projectId);
  const now = new Date();
  const done = scoped.filter((ticket) => ticket.status === "done").length;

  return {
    total: scoped.length,
    open: scoped.length - done,
    done,
    inProgress: scoped.filter((ticket) => ticket.status === "in_progress").length,
    overdue: scoped.filter((ticket) => isOverdue(ticket, now)).length,
    mine: scoped.filter((ticket) => ticket.assigneeId === userId).length,
    completion: scoped.length === 0 ? 0 : Math.round((done / scoped.length) * 100),
  };
}

export function countByStatus(scoped: Ticket[]) {
  const counts: Record<TicketStatus, number> = {
    backlog: 0,
    todo: 0,
    in_progress: 0,
    in_review: 0,
    done: 0,
  };
  for (const ticket of scoped) counts[ticket.status] += 1;
  return counts;
}

/** Projects the current user is assigned work on, busiest first. */
export function myProjects(all: Ticket[], userId: string = CURRENT_USER_ID) {
  return projects
    .map((project) => ({
      project,
      stats: projectStats(all, project.id, userId),
    }))
    .filter((entry) => entry.stats.mine > 0)
    .sort((a, b) => b.stats.mine - a.stats.mine);
}
