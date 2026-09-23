import { Prisma } from "@prisma/client";

import {
  comments,
  events,
  projects,
  tickets,
  users,
  workspaces,
} from "@/lib/mock";
import { prisma } from "@/lib/server/prisma";

async function main() {
  await prisma.$transaction(async (database) => {
    await database.ticketEvent.deleteMany();
    await database.comment.deleteMany();
    await database.ticketAssignee.deleteMany();
    await database.ticket.deleteMany();
    await database.project.deleteMany();
    await database.workspaceMember.deleteMany();
    await database.workspace.deleteMany();
    await database.user.deleteMany();

    await database.user.createMany({
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        initials: user.initials,
        email: user.email,
        role: user.role,
        tone: user.tone,
        managerId: user.managerId,
      })),
    });

    await database.workspace.createMany({
      data: workspaces.map((workspace) => ({
        id: workspace.id,
        slug: workspace.slug,
        name: workspace.name,
        description: workspace.description,
        emoji: workspace.emoji,
      })),
    });
    await database.workspaceMember.createMany({
      data: workspaces.flatMap((workspace) =>
        workspace.memberIds.map((userId) => ({ workspaceId: workspace.id, userId })),
      ),
    });

    await database.project.createMany({
      data: projects.map((project) => ({
        id: project.id,
        key: project.key,
        slug: project.slug,
        name: project.name,
        description: project.description,
        leadId: project.leadId,
        workspaceId: project.workspaceId,
        kind: project.kind,
        emoji: project.emoji,
        startedOn: new Date(project.startedOn),
        memberIds: project.memberIds,
        roles: project.roles as Prisma.InputJsonValue,
        team: project.team as Prisma.InputJsonValue,
        wipLimits: project.wipLimits as Prisma.InputJsonValue,
        customFields: project.customFields as Prisma.InputJsonValue,
        ticketSequence: tickets
          .filter((ticket) => ticket.projectId === project.id)
          .reduce((max, ticket) => Math.max(max, Number(ticket.key.split("-")[1]) || 0), 100),
      })),
    });

    await database.ticket.createMany({
      data: tickets.map((ticket) => ({
        id: ticket.id,
        key: ticket.key,
        projectId: ticket.projectId,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        type: ticket.type,
        assigneeIds: ticket.assigneeIds,
        reporterId: ticket.reporterId,
        labelIds: ticket.labelIds,
        estimate: ticket.estimate,
        severity: ticket.severity,
        environment: ticket.environment,
        buildVersion: ticket.buildVersion,
        requesterId: ticket.requesterId,
        slaDueAt: ticket.slaDueAt ? new Date(ticket.slaDueAt) : null,
        attachments: ticket.attachments as Prisma.InputJsonValue,
        statusChangedAt: new Date(ticket.statusChangedAt),
        parentId: ticket.parentId,
        links: ticket.links as Prisma.InputJsonValue,
        sprintId: ticket.sprintId,
        createdAt: new Date(ticket.createdAt),
        updatedAt: new Date(ticket.updatedAt),
        dueAt: ticket.dueAt ? new Date(ticket.dueAt) : null,
        boardOrder: ticket.order,
        custom: ticket.custom as Prisma.InputJsonValue,
      })),
    });
    await database.ticketAssignee.createMany({
      data: tickets.flatMap((ticket) =>
        ticket.assigneeIds.map((userId) => ({ ticketId: ticket.id, userId })),
      ),
    });

    await database.comment.createMany({
      data: comments.map((comment) => ({
        id: comment.id,
        ticketId: comment.ticketId,
        authorId: comment.authorId,
        body: comment.body,
        createdAt: new Date(comment.createdAt),
        reactions: comment.reactions as Prisma.InputJsonValue,
        attachments: comment.attachments as Prisma.InputJsonValue,
      })),
    });
    await database.ticketEvent.createMany({
      data: events.map((event) => ({
        id: event.id,
        ticketId: event.ticketId,
        actorId: event.actorId,
        kind: event.kind,
        fromValue: event.from,
        toValue: event.to,
        createdAt: new Date(event.createdAt),
      })),
    });
  });

  console.log(`Seeded ${tickets.length} tickets, ${projects.length} projects and ${users.length} users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());