import { generateDataset } from "./generate";
import { startOfWeek, TODAY } from "./dates";
import { projects } from "./projects";
import {
  TICKET_STATUSES,
  type Comment,
  type Project,
  type Ticket,
  type TicketEvent,
  type TicketStatus,
} from "./types";
import { CURRENT_USER_ID, reporteeIds } from "./users";

const dataset = generateDataset();

export const tickets: Ticket[] = dataset.tickets;
export const comments: Comment[] = dataset.comments;
export const events: TicketEvent[] = dataset.events;

export * from "./types";
export * from "./users";
export * from "./labels";
export * from "./projects";
export * from "./workspaces";
export * from "./dates";
export * from "./sprints";

/** Projects inside a workspace, in the order the workspace lists them. */
export function projectsForWorkspace(all: Project[], workspaceId: string) {
  return all.filter((project) => project.workspaceId === workspaceId);
}

/** Somebody is actively holding it, as opposed to it sitting in a queue. */
export const ACTIVE_STATUSES = new Set<TicketStatus>([
  "in_design",
  "design_review",
  "in_progress",
  "code_review",
  "in_qa",
  "product_review",
]);

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
  return all.filter((ticket) => ticket.assigneeIds.includes(userId));
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

/**
 * How long is too long depends on the column. Seven days in In Review is
 * alarming; seven days in Backlog is Tuesday. A flat threshold fired on more
 * than half of everything, which taught people to ignore it.
 */
export const STALE_AFTER_DAYS: Record<TicketStatus, number | null> = {
  backlog: null,
  // Roughly the 80th percentile of how long work actually sits in each
  // column. A flat seven days fired on more than half of everything, which
  // teaches people to ignore the signal; this flags the genuine tail.
  triage: 14,
  design_todo: 45,
  in_design: 26,
  design_review: 16,
  todo: 37,
  in_progress: 23,
  code_review: 18,
  ready_for_qa: 12,
  in_qa: 14,
  // A failed QA run is the one thing nobody should be able to sit on.
  qa_failed: 7,
  product_review: 15,
  done: null,
};

export function isStale(ticket: Ticket, now: Date = new Date()) {
  const threshold = STALE_AFTER_DAYS[ticket.status];
  if (threshold === null) return false;
  return daysInColumn(ticket, now) >= threshold;
}

/**
 * The audit trail records every transition, so how long a ticket spent in each
 * column is already known — this is what turns it into a number people can act
 * on.
 */
export function timeInStatuses(all: TicketEvent[], ticket: Ticket) {
  const history = eventsForTicket(all, ticket.id);
  const spans = new Map<TicketStatus, number>();

  let current: TicketStatus = "backlog";
  let since = new Date(ticket.createdAt).getTime();

  for (const event of history) {
    if (event.kind !== "status" || !event.to) continue;
    const at = new Date(event.createdAt).getTime();
    spans.set(current, (spans.get(current) ?? 0) + Math.max(0, at - since));
    current = event.to as TicketStatus;
    since = at;
  }

  spans.set(
    current,
    (spans.get(current) ?? 0) + Math.max(0, Date.now() - since),
  );
  return spans;
}

/** Days from creation to being verified. Only closed tickets have one. */
export function cycleTimeDays(all: TicketEvent[], ticket: Ticket) {
  if (ticket.status !== "done") return null;
  const closed = eventsForTicket(all, ticket.id)
    .filter((event) => event.kind === "status" && event.to === "done")
    .at(-1);
  if (!closed) return null;
  return (
    (new Date(closed.createdAt).getTime() -
      new Date(ticket.createdAt).getTime()) /
    86_400_000
  );
}

export type FlowMetrics = {
  /** Median days from created to verified. */
  cycleTime: number | null;
  /** Tickets verified in the last 14 days. */
  throughput: number;
  /** Median days currently spent in each open column. */
  medianInStatus: Partial<Record<TicketStatus, number>>;
  sampleSize: number;
};

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function flowMetrics(
  scoped: Ticket[],
  all: TicketEvent[],
  now: Date = new Date(),
): FlowMetrics {
  const cycles = scoped
    .map((ticket) => cycleTimeDays(all, ticket))
    .filter((value): value is number => value !== null);

  const fortnightAgo = now.getTime() - 14 * 86_400_000;
  const throughput = scoped.filter(
    (ticket) =>
      ticket.status === "done" &&
      new Date(ticket.statusChangedAt).getTime() >= fortnightAgo,
  ).length;

  const medianInStatus: Partial<Record<TicketStatus, number>> = {};
  for (const status of TICKET_STATUSES) {
    if (status === "done") continue;
    const days = scoped
      .filter((ticket) => ticket.status === status)
      .map((ticket) => daysInColumn(ticket, now));
    const value = median(days);
    if (value !== null) medianInStatus[status] = value;
  }

  return {
    cycleTime: median(cycles),
    throughput,
    medianInStatus,
    sampleSize: cycles.length,
  };
}

/**
 * Opened and verified per week, for the trend chart on Insights. Weeks run
 * back from today rather than from a calendar Monday, so the last bucket is
 * always the week in progress and the shape does not jump on a Sunday.
 */
export function weeklyFlow(scoped: Ticket[], weeks = 12, now: Date = new Date()) {
  const week = 7 * 86_400_000;
  const end = now.getTime();
  const buckets = Array.from({ length: weeks }, (_, index) => {
    const from = end - (weeks - index) * week;
    return { from, to: from + week, label: "", opened: 0, verified: 0 };
  });

  const indexOf = (iso: string) => {
    const at = new Date(iso).getTime();
    if (at < buckets[0].from || at > end) return -1;
    return Math.min(weeks - 1, Math.floor((at - buckets[0].from) / week));
  };

  for (const ticket of scoped) {
    const opened = indexOf(ticket.createdAt);
    if (opened >= 0) buckets[opened].opened += 1;
    if (ticket.status === "done") {
      const closed = indexOf(ticket.statusChangedAt);
      if (closed >= 0) buckets[closed].verified += 1;
    }
  }

  return buckets.map((bucket, index) => ({
    ...bucket,
    label:
      index === weeks - 1
        ? "now"
        : new Date(bucket.from).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          }),
  }));
}

/** Open tickets this one is waiting on. */
export function blockersOf(all: Ticket[], ticket: Ticket) {
  const byId = new Map(all.map((item) => [item.id, item]));
  return ticket.links
    .filter((link) => link.type === "blocked_by")
    .map((link) => byId.get(link.ticketId))
    .filter((item): item is Ticket => Boolean(item) && item!.status !== "done");
}

export function childrenOf(all: Ticket[], ticketId: string) {
  return all.filter((ticket) => ticket.parentId === ticketId);
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
    (ticket) => ticket.assigneeIds.some((id) => team.has(id)),
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
      (ticket) => ACTIVE_STATUSES.has(ticket.status),
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
      (ticket) => ACTIVE_STATUSES.has(ticket.status),
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
    mine: scoped.filter((ticket) => ticket.assigneeIds.includes(userId)).length,
    completion: scoped.length === 0 ? 0 : Math.round((done / scoped.length) * 100),
  };
}

export function countByStatus(scoped: Ticket[]) {
  const counts = Object.fromEntries(
    TICKET_STATUSES.map((status) => [status, 0]),
  ) as Record<TicketStatus, number>;
  for (const ticket of scoped) counts[ticket.status] += 1;
  return counts;
}

/** Projects the current user is assigned work on, busiest first. */
export function myProjects(
  all: Ticket[],
  userId: string = CURRENT_USER_ID,
  /** Defaults to the seeded set; pass the store's list to include new ones. */
  scope: Project[] = projects,
) {
  return scope
    .map((project) => ({
      project,
      stats: projectStats(all, project.id, userId),
    }))
    .filter((entry) => entry.stats.mine > 0)
    .sort((a, b) => b.stats.mine - a.stats.mine);
}
