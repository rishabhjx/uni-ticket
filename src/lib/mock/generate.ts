import { criteriaByType, commentBodies, summariesByType } from "./content";
import { daysFromToday } from "./dates";
import { labels } from "./labels";
import { projects } from "./projects";
import { createRandom, type Random } from "./random";
import { titlesByProject } from "./titles";
import {
  TICKET_TYPES,
  type Comment,
  type Project,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
  type TicketType,
} from "./types";
import { CURRENT_USER_ID } from "./users";

const SEED = 20260919;

const statusWeights: Record<TicketStatus, number> = {
  backlog: 28,
  todo: 18,
  in_progress: 16,
  in_review: 12,
  done: 26,
};

const priorityWeights: Record<TicketPriority, number> = {
  urgent: 7,
  high: 24,
  medium: 47,
  low: 22,
};

/** How old a ticket is, by the state it reached. */
const ageByStatus: Record<TicketStatus, [number, number]> = {
  backlog: [8, 150],
  todo: [2, 70],
  in_progress: [3, 45],
  in_review: [4, 32],
  done: [18, 130],
};

/** How likely a ticket in this state is to have an owner. */
const assignedChanceByStatus: Record<TicketStatus, number> = {
  backlog: 0.42,
  todo: 0.86,
  in_progress: 1,
  in_review: 1,
  done: 1,
};

/** Labels that make sense on each project, so tags don't look random. */
const labelPoolByProject: Record<string, string[]> = {
  "p-apo": ["l-api", "l-performance", "l-security", "l-infra", "l-tech-debt", "l-docs", "l-regression"],
  "p-atl": ["l-billing", "l-api", "l-security", "l-customer", "l-tech-debt", "l-docs", "l-regression"],
  "p-hel": ["l-mobile", "l-accessibility", "l-performance", "l-onboarding", "l-customer", "l-regression"],
  "p-orb": ["l-analytics", "l-infra", "l-performance", "l-security", "l-tech-debt", "l-docs"],
  "p-ver": ["l-design-system", "l-accessibility", "l-docs", "l-onboarding", "l-tech-debt"],
};

const estimates = [1, 1, 2, 2, 3, 3, 3, 5, 5, 8];

/**
 * Round-robins the type buckets so each project's tickets interleave rather
 * than arriving as four solid blocks.
 */
function interleaveTitles(project: Project) {
  const pool = titlesByProject[project.id];
  const cursors: Record<TicketType, number> = { bug: 0, feature: 0, task: 0, chore: 0 };
  const total = TICKET_TYPES.reduce((sum, type) => sum + pool[type].length, 0);
  const ordered: { title: string; type: TicketType }[] = [];

  while (ordered.length < total) {
    for (const type of TICKET_TYPES) {
      const cursor = cursors[type];
      if (cursor < pool[type].length) {
        ordered.push({ title: pool[type][cursor], type });
        cursors[type] = cursor + 1;
      }
    }
  }

  return ordered;
}

function buildDescription(random: Random, type: TicketType, title: string) {
  const summary = random.pick(summariesByType[type]);
  const criteria = random.sample(criteriaByType[type], random.int(2, 4));
  return [
    summary,
    "",
    "Acceptance criteria",
    ...criteria.map((item) => `- ${item}`),
    "",
    `Scope is limited to what the title describes: ${title.toLowerCase()}. Anything broader gets its own ticket.`,
  ].join("\n");
}

function pickAssignee(random: Random, project: Project, status: TicketStatus) {
  if (!random.chance(assignedChanceByStatus[status])) return null;
  // The current user carries a meaningful share so "My tickets" is populated.
  if (random.chance(0.24)) return CURRENT_USER_ID;
  const others = project.memberIds.filter((id) => id !== CURRENT_USER_ID);
  return random.pick(others);
}

function buildTickets(random: Random) {
  const tickets: Ticket[] = [];

  for (const project of projects) {
    const ordered = interleaveTitles(project);
    const labelPool = labelPoolByProject[project.id] ?? labels.map((label) => label.id);

    ordered.forEach(({ title, type }, index) => {
      const status = random.weighted(statusWeights);
      const priority = random.weighted(priorityWeights);
      const [minAge, maxAge] = ageByStatus[status];
      const createdDaysAgo = random.int(minAge, maxAge);

      // Done tickets settled a while ago; open ones were touched recently.
      const updatedDaysAgo =
        status === "done"
          ? random.int(1, Math.max(1, Math.floor(createdDaysAgo * 0.6)))
          : random.int(0, Math.min(14, createdDaysAgo));

      const assigneeId = pickAssignee(random, project, status);
      const reporterPool = project.memberIds.filter((id) => id !== assigneeId);
      const reporterId = random.pick(reporterPool.length > 0 ? reporterPool : project.memberIds);

      let dueAt: string | null = null;
      if (status === "done") {
        dueAt = random.chance(0.7)
          ? daysFromToday(-random.int(1, createdDaysAgo), 17 * 60).toISOString()
          : null;
      } else if (random.chance(0.62)) {
        // A slice of these land in the past, which is what makes a ticket overdue.
        dueAt = daysFromToday(random.int(-16, 45), 17 * 60).toISOString();
      }

      const createdAt = daysFromToday(-createdDaysAgo, random.int(9, 18) * 60);
      // Same-day tickets can otherwise land their update before their creation.
      const updatedAt = new Date(
        Math.max(
          daysFromToday(-updatedDaysAgo, random.int(9, 18) * 60).getTime(),
          createdAt.getTime() + 36e5,
        ),
      );

      tickets.push({
        id: `t-${project.slug}-${index + 1}`,
        key: `${project.key}-${101 + index}`,
        projectId: project.id,
        title,
        description: buildDescription(random, type, title),
        status,
        priority,
        type,
        assigneeId,
        reporterId,
        labelIds: random.sample(labelPool, random.int(0, 3)),
        estimate: random.chance(0.78) ? random.pick(estimates) : null,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        dueAt,
        order: 0,
      });
    });
  }

  // Board position: tickets are ordered within their own project column.
  const cursors = new Map<string, number>();
  for (const ticket of tickets) {
    const columnKey = `${ticket.projectId}:${ticket.status}`;
    const next = cursors.get(columnKey) ?? 0;
    ticket.order = next;
    cursors.set(columnKey, next + 1);
  }

  return tickets;
}

function buildComments(random: Random, tickets: Ticket[]) {
  const comments: Comment[] = [];
  let sequence = 0;

  for (const ticket of tickets) {
    // Busier tickets attract more discussion; quiet ones have none at all.
    const chance =
      ticket.status === "in_review" || ticket.status === "in_progress"
        ? 0.72
        : ticket.status === "done"
          ? 0.4
          : 0.18;
    if (!random.chance(chance)) continue;

    const project = projects.find((item) => item.id === ticket.projectId);
    if (!project) continue;

    const count = random.int(1, 6);
    const bodies = random.sample(commentBodies, count);
    const createdMs = new Date(ticket.createdAt).getTime();
    const updatedMs = new Date(ticket.updatedAt).getTime();
    const span = Math.max(updatedMs - createdMs, 36e5);

    bodies.forEach((body, index) => {
      sequence += 1;
      // Spread the thread evenly between creation and last activity.
      const at = createdMs + (span * (index + 1)) / (count + 1);
      comments.push({
        id: `c-${sequence}`,
        ticketId: ticket.id,
        authorId: random.pick(project.memberIds),
        body,
        createdAt: new Date(at).toISOString(),
      });
    });
  }

  return comments;
}

export function generateDataset() {
  const random = createRandom(SEED);
  const tickets = buildTickets(random);
  const comments = buildComments(random, tickets);
  return { tickets, comments };
}
