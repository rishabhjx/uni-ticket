import { criteriaByType, commentBodies, summariesByType } from "./content";
import { daysFromToday } from "./dates";
import { labels } from "./labels";
import { projects } from "./projects";
import { createRandom, type Random } from "./random";
import { sprintsForProject } from "./sprints";
import { titlesByProject } from "./titles";
import { LINK_INVERSE, REACTIONS } from "./types";
import { TICKET_STATUSES } from "./types";
import {
  ENVIRONMENTS,
  isDefect,
  TICKET_TYPES,
  type Comment,
  type Project,
  type Ticket,
  type TicketPriority,
  type TicketEvent,
  type TicketSeverity,
  type TicketStatus,
  type TicketType,
} from "./types";
import { CURRENT_USER_ID, users } from "./users";

const SEED = 20260919;

/** Severity skews low: most defects are not critical. */
const severityWeights: Record<TicketSeverity, number> = {
  s1: 6,
  s2: 22,
  s3: 46,
  s4: 26,
};

const branchPrefix: Record<string, string> = {
  bug: "fix",
  incident: "hotfix",
  feature: "feat",
  task: "chore",
  chore: "chore",
  request: "ops",
};

const attachmentPool: { name: string; kind: "image" | "log" | "video" | "document" }[] = [
  { name: "screenshot-failure.png", kind: "image" },
  { name: "console-output.log", kind: "log" },
  { name: "network-trace.har", kind: "log" },
  { name: "screen-recording.mp4", kind: "video" },
  { name: "repro-steps.pdf", kind: "document" },
  { name: "before-after.png", kind: "image" },
  { name: "stacktrace.txt", kind: "log" },
];

function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .slice(0, 5)
    .join("-");
}

const statusWeights: Record<TicketStatus, number> = {
  backlog: 26,
  todo: 16,
  in_progress: 15,
  in_review: 10,
  resolved: 9,
  done: 24,
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
  resolved: [5, 40],
  done: [18, 130],
};

/** How likely a ticket in this state is to have an owner. */
const assignedChanceByStatus: Record<TicketStatus, number> = {
  backlog: 0.42,
  todo: 0.86,
  in_progress: 1,
  in_review: 1,
  resolved: 1,
  done: 1,
};

/** Labels that make sense on each project, so tags don't look random. */
const labelPoolByProject: Record<string, string[]> = {
  "p-apo": ["l-api", "l-performance", "l-security", "l-infra", "l-tech-debt", "l-docs", "l-regression"],
  "p-atl": ["l-billing", "l-api", "l-security", "l-customer", "l-tech-debt", "l-docs", "l-regression"],
  "p-hel": ["l-mobile", "l-accessibility", "l-performance", "l-onboarding", "l-customer", "l-regression"],
  "p-orb": ["l-analytics", "l-infra", "l-performance", "l-security", "l-tech-debt", "l-docs"],
  "p-ver": ["l-design-system", "l-accessibility", "l-docs", "l-onboarding", "l-tech-debt"],
  "p-hlp": ["l-infra", "l-security", "l-onboarding", "l-docs", "l-customer"],
};

const estimates = [1, 1, 2, 2, 3, 3, 3, 5, 5, 8];

/**
 * Round-robins the type buckets so each project's tickets interleave rather
 * than arriving as four solid blocks.
 */
function interleaveTitles(project: Project) {
  const pool = titlesByProject[project.id];
  const cursors = new Map<TicketType, number>();
  const total = TICKET_TYPES.reduce(
    (sum, type) => sum + (pool[type]?.length ?? 0),
    0,
  );
  const ordered: { title: string; type: TicketType }[] = [];

  while (ordered.length < total) {
    for (const type of TICKET_TYPES) {
      const titles = pool[type];
      if (!titles) continue;
      const cursor = cursors.get(type) ?? 0;
      if (cursor < titles.length) {
        ordered.push({ title: titles[cursor], type });
        cursors.set(type, cursor + 1);
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
          daysFromToday(
            -updatedDaysAgo,
            // Same-day updates land early so they read as the past.
            (updatedDaysAgo === 0 ? random.int(6, 9) : random.int(9, 18)) * 60,
          ).getTime(),
          createdAt.getTime() + 36e5,
        ),
      );

      const defect = isDefect(type);
      const severity = defect ? random.weighted(severityWeights) : null;

      // A service desk request comes from someone outside the team and runs
      // against a response target rather than a sprint.
      const isService = project.kind === "service";
      const requesterId = isService
        ? random.pick(
            users
              .filter((user) => !project.memberIds.includes(user.id))
              .map((user) => user.id),
          )
        : null;
      const slaHours = severity === "s1" ? 4 : severity === "s2" ? 24 : 72;
      const slaDueAt =
        isService && status !== "done"
          ? new Date(createdAt.getTime() + slaHours * 36e5).toISOString()
          : null;

      // Work that reached review or done usually has a branch behind it.
      const development =
        !isService &&
        (status === "in_review" || status === "resolved" || status === "done")
          ? {
              branch: `${branchPrefix[type] ?? "chore"}/${project.key.toLowerCase()}-${
                101 + index
              }-${slugifyTitle(title)}`,
              prNumber: 1200 + random.int(1, 899),
              prState:
                status === "done" || status === "resolved"
                  ? ("merged" as const)
                  : random.chance(0.15)
                    ? ("draft" as const)
                    : ("open" as const),
              checks:
                status === "done" || status === "resolved"
                  ? ("passing" as const)
                  : random.weighted({ passing: 70, failing: 18, running: 12 }),
            }
          : null;

      const attachmentCount = defect
        ? random.int(0, 3)
        : random.chance(0.15)
          ? 1
          : 0;

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
        severity,
        environment: defect ? random.pick(ENVIRONMENTS) : null,
        buildVersion: defect
          ? `${random.int(3, 4)}.${random.int(0, 9)}.${random.int(0, 4)}`
          : null,
        requesterId,
        slaDueAt,
        development,
        parentId: null,
        links: [],
        sprintId: null,
        attachments: random
          .sample(attachmentPool, attachmentCount)
          .map((file, fileIndex) => ({
            id: `a-${project.slug}-${index + 1}-${fileIndex}`,
            name: file.name,
            kind: file.kind,
            size: random.int(12, 4800) * 1024,
          })),
        statusChangedAt: updatedAt.toISOString(),
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
      // A light sprinkle, so reactions read as a feature rather than noise.
      const reactions: Record<string, string[]> = {};
      if (random.chance(0.3)) {
        const emoji = random.pick(REACTIONS);
        reactions[emoji] = random.sample(project.memberIds, random.int(1, 3));
      }

      comments.push({
        id: `c-${sequence}`,
        ticketId: ticket.id,
        authorId: random.pick(project.memberIds),
        body,
        createdAt: new Date(at).toISOString(),
        reactions,
        attachments: [],
      });
    });
  }

  return comments;
}

/**
 * The audit trail behind each ticket: created, then the transitions that got
 * it to where it is. Reconstructed backwards from the current state so the
 * history always agrees with the ticket.
 */
function buildEvents(random: Random, tickets: Ticket[]) {
  const events: TicketEvent[] = [];
  let sequence = 0;

  const add = (
    ticket: Ticket,
    kind: TicketEvent["kind"],
    from: string | null,
    to: string | null,
    at: number,
  ) => {
    sequence += 1;
    events.push({
      id: `e-${sequence}`,
      ticketId: ticket.id,
      actorId: ticket.assigneeId ?? ticket.reporterId,
      kind,
      from,
      to,
      createdAt: new Date(at).toISOString(),
    });
  };

  for (const ticket of tickets) {
    const createdMs = new Date(ticket.createdAt).getTime();
    const updatedMs = new Date(ticket.updatedAt).getTime();
    const span = Math.max(updatedMs - createdMs, 36e5);

    sequence += 1;
    events.push({
      id: `e-${sequence}`,
      ticketId: ticket.id,
      actorId: ticket.reporterId,
      kind: "created",
      from: null,
      to: null,
      createdAt: ticket.createdAt,
    });

    // The columns it passed through on the way to its current one.
    const target = TICKET_STATUSES.indexOf(ticket.status);
    const path = TICKET_STATUSES.slice(0, target + 1);
    path.forEach((status, index) => {
      if (index === 0) return;
      add(
        ticket,
        "status",
        path[index - 1],
        status,
        createdMs + (span * index) / (path.length + 1),
      );
    });

    if (ticket.assigneeId) {
      add(ticket, "assignee", null, ticket.assigneeId, createdMs + span * 0.2);
    }
    if (random.chance(0.28)) {
      add(ticket, "priority", "medium", ticket.priority, createdMs + span * 0.5);
    }
    if (ticket.severity && random.chance(0.2)) {
      add(ticket, "severity", "s3", ticket.severity, createdMs + span * 0.6);
    }
  }

  return events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Epics, parent links, blockers and sprints, applied once the tickets exist so
 * every reference points at something real.
 */
function relateTickets(random: Random, tickets: Ticket[]) {
  for (const project of projects) {
    const scoped = tickets.filter((ticket) => ticket.projectId === project.id);
    if (scoped.length === 0) continue;

    // A handful of larger items become epics for the rest to hang off.
    const epicCount = Math.max(1, Math.round(scoped.length / 26));
    const epics = random.sample(
      scoped.filter((ticket) => ticket.type === "feature"),
      epicCount,
    );
    for (const epic of epics) {
      epic.type = "epic";
      epic.estimate = null;
    }

    const epicIds = epics.map((epic) => epic.id);
    const children = scoped.filter((ticket) => !epicIds.includes(ticket.id));

    for (const ticket of children) {
      if (epicIds.length > 0 && random.chance(0.28)) {
        ticket.parentId = random.pick(epicIds);
      }

      // Blockers only make sense between open tickets in the same project.
      if (random.chance(0.12)) {
        const candidates = children.filter(
          (other) => other.id !== ticket.id && other.status !== "done",
        );
        if (candidates.length > 0) {
          const other = random.pick(candidates);
          const type = random.weighted({
            blocked_by: 45,
            blocks: 25,
            relates_to: 22,
            duplicates: 8,
          });
          if (!ticket.links.some((link) => link.ticketId === other.id)) {
            ticket.links.push({ type, ticketId: other.id });
            other.links.push({ type: LINK_INVERSE[type], ticketId: ticket.id });
          }
        }
      }
    }

    // Sprints: finished work sits in past cycles, live work in the active one.
    const cycles = sprintsForProject(project.id);
    if (cycles.length === 0) continue;
    const past = cycles.find((cycle) => cycle.state === "past");
    const active = cycles.find((cycle) => cycle.state === "active");
    const next = cycles.find((cycle) => cycle.state === "upcoming");

    for (const ticket of scoped) {
      if (ticket.type === "epic") continue;
      if (ticket.status === "done") {
        ticket.sprintId = random.chance(0.7) ? (past?.id ?? null) : (active?.id ?? null);
      } else if (ticket.status === "backlog") {
        ticket.sprintId = random.chance(0.25) ? (next?.id ?? null) : null;
      } else {
        ticket.sprintId = active?.id ?? null;
      }
    }
  }
}

export function generateDataset() {
  const random = createRandom(SEED);
  const tickets = buildTickets(random);
  relateTickets(random, tickets);
  const comments = buildComments(random, tickets);
  const events = buildEvents(random, tickets);

  // Ageing is measured from the last transition, so take it from the history.
  const lastStatusChange = new Map<string, string>();
  for (const event of events) {
    if (event.kind === "status" || event.kind === "created") {
      lastStatusChange.set(event.ticketId, event.createdAt);
    }
  }
  for (const ticket of tickets) {
    ticket.statusChangedAt =
      lastStatusChange.get(ticket.id) ?? ticket.createdAt;
  }

  return { tickets, comments, events };
}
