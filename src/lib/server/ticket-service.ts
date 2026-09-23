import type { Prisma } from "@prisma/client";

import type { Project, Ticket, Workspace } from "@/lib/mock";
import { prisma } from "@/lib/server/prisma";
import {
  ticketCreateSchema,
  ticketPatchSchema,
  ticketQuerySchema,
} from "@/lib/server/validation";

const ticketInclude = { assignees: true } as const;

function asJson<T>(value: unknown) {
  return value as T;
}

function mapTicket(row: Prisma.TicketGetPayload<{ include: typeof ticketInclude }>): Ticket {
  return {
    id: row.id,
    key: row.key,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    type: row.type,
    assigneeIds: row.assigneeIds,
    reporterId: row.reporterId,
    labelIds: row.labelIds,
    estimate: row.estimate,
    severity: row.severity,
    environment: row.environment,
    buildVersion: row.buildVersion,
    requesterId: row.requesterId,
    slaDueAt: row.slaDueAt?.toISOString() ?? null,
    attachments: asJson<Ticket["attachments"]>(row.attachments),
    statusChangedAt: row.statusChangedAt.toISOString(),
    parentId: row.parentId,
    links: asJson<Ticket["links"]>(row.links),
    sprintId: row.sprintId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    dueAt: row.dueAt?.toISOString() ?? null,
    order: row.boardOrder,
    custom: asJson<Ticket["custom"]>(row.custom),
  };
}

function mapProject(row: Prisma.ProjectGetPayload<Prisma.ProjectDefaultArgs>): Project {
  return {
    id: row.id,
    key: row.key,
    slug: row.slug,
    name: row.name,
    description: row.description,
    leadId: row.leadId,
    memberIds: row.memberIds,
    workspaceId: row.workspaceId,
    startedOn: row.startedOn.toISOString(),
    kind: row.kind,
    emoji: row.emoji,
    roles: asJson<Project["roles"]>(row.roles),
    team: asJson<Project["team"]>(row.team),
    wipLimits: asJson<Project["wipLimits"]>(row.wipLimits),
    customFields: asJson<Project["customFields"]>(row.customFields),
  };
}

function mapWorkspace(row: Prisma.WorkspaceGetPayload<{ include: { memberships: true } }>): Workspace {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    emoji: row.emoji,
    memberIds: row.memberships.map((membership) => membership.userId),
  };
}

export async function listWorkspaces() {
  const rows = await prisma.workspace.findMany({ include: { memberships: true }, orderBy: { name: "asc" } });
  return rows.map(mapWorkspace);
}

export async function listProjects() {
  const rows = await prisma.project.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapProject);
}

export async function listTickets(input: URLSearchParams) {
  const query = ticketQuerySchema.parse(Object.fromEntries(input.entries()));
  const where: Prisma.TicketWhereInput = {
    projectId: query.projectId,
    status: query.status,
    assigneeIds: query.assigneeId ? { has: query.assigneeId } : undefined,
  };
  const rows = await prisma.ticket.findMany({
    where,
    include: ticketInclude,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > query.limit;
  const page = rows.slice(0, query.limit);
  return { data: page.map(mapTicket), nextCursor: hasMore ? page.at(-1)?.id ?? null : null };
}

export async function getTicket(idOrKey: string) {
  const row = await prisma.ticket.findFirst({
    where: { OR: [{ id: idOrKey }, { key: idOrKey.toUpperCase() }] },
    include: ticketInclude,
  });
  return row ? mapTicket(row) : null;
}

export async function updateTicket(idOrKey: string, input: unknown) {
  const patch = ticketPatchSchema.parse(input);
  const existing = await prisma.ticket.findFirst({
    where: { OR: [{ id: idOrKey }, { key: idOrKey.toUpperCase() }] },
    include: ticketInclude,
  });
  if (!existing) return null;

  const now = new Date();
  const changedStatus = patch.status !== undefined && patch.status !== existing.status;
  const updated = await prisma.$transaction(async (database) => {
    const ticket = await database.ticket.update({
      where: { id: existing.id },
      data: {
        title: patch.title,
        description: patch.description,
        status: patch.status,
        priority: patch.priority,
        type: patch.type,
        assigneeIds: patch.assigneeIds,
        labelIds: patch.labelIds,
        estimate: patch.estimate,
        severity: patch.severity,
        environment: patch.environment,
        buildVersion: patch.buildVersion,
        dueAt: patch.dueAt === undefined ? undefined : patch.dueAt ? new Date(patch.dueAt) : null,
        custom: patch.custom as Prisma.InputJsonValue | undefined,
        ...(changedStatus ? { statusChangedAt: now } : {}),
        updatedAt: now,
      },
      include: ticketInclude,
    });

    if (changedStatus) {
      await database.ticketEvent.create({
        data: {
          id: crypto.randomUUID(),
          ticketId: existing.id,
          actorId: "u-1",
          kind: "status",
          fromValue: existing.status,
          toValue: patch.status,
          createdAt: now,
        },
      });
    }
    return ticket;
  });
  return mapTicket(updated);
}

export async function createTicket(input: unknown) {
  const data = ticketCreateSchema.parse(input);
  const now = new Date();
  const created = await prisma.$transaction(async (database) => {
    const project = await database.project.findUnique({ where: { id: data.projectId } });
    if (!project) return null;

    const nextProject = await database.project.update({
      where: { id: project.id },
      data: { ticketSequence: { increment: 1 } },
    });
    const ticket = await database.ticket.create({
      data: {
        id: crypto.randomUUID(),
        key: `${project.key}-${nextProject.ticketSequence}`,
        projectId: project.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        type: data.type,
        assigneeIds: data.assigneeIds,
        reporterId: "u-1",
        labelIds: data.labelIds,
        estimate: data.estimate,
        severity: data.severity,
        environment: data.environment,
        buildVersion: data.buildVersion,
        requesterId: data.requesterId,
        slaDueAt: null,
        attachments: data.attachments as Prisma.InputJsonValue,
        statusChangedAt: now,
        parentId: data.parentId,
        links: [],
        sprintId: data.sprintId,
        createdAt: now,
        updatedAt: now,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        boardOrder: -1,
        custom: data.custom as Prisma.InputJsonValue,
        assignees: {
          create: data.assigneeIds.map((userId) => ({ userId })),
        },
      },
      include: ticketInclude,
    });
    await database.ticketEvent.create({
      data: {
        id: crypto.randomUUID(),
        ticketId: ticket.id,
        actorId: "u-1",
        kind: "created",
        createdAt: now,
      },
    });
    return ticket;
  });
  return created ? mapTicket(created) : null;
}