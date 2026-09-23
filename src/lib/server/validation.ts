import { z } from "zod";

import {
  ENVIRONMENTS,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
} from "@/lib/mock";

export const ticketQuerySchema = z.object({
  projectId: z.string().min(1).optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  assigneeId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).optional(),
});

export const ticketPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    description: z.string().max(50_000).optional(),
    status: z.enum(TICKET_STATUSES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    type: z.enum(TICKET_TYPES).optional(),
    assigneeIds: z.array(z.string().min(1)).max(20).optional(),
    labelIds: z.array(z.string().min(1)).max(50).optional(),
    estimate: z.number().int().min(0).max(10_000).nullable().optional(),
    severity: z.enum(TICKET_SEVERITIES).nullable().optional(),
    environment: z.enum(ENVIRONMENTS).nullable().optional(),
    buildVersion: z.string().max(200).nullable().optional(),
    dueAt: z.string().datetime().nullable().optional(),
    custom: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  })
  .strict();

export const ticketCreateSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1).max(500),
  description: z.string().max(50_000).default(""),
  type: z.enum(TICKET_TYPES).default("task"),
  priority: z.enum(TICKET_PRIORITIES).default("medium"),
  severity: z.enum(TICKET_SEVERITIES).nullable().default(null),
  status: z.enum(TICKET_STATUSES).default("backlog"),
  assigneeIds: z.array(z.string().min(1)).max(20).default([]),
  labelIds: z.array(z.string().min(1)).max(50).default([]),
  estimate: z.number().int().min(0).max(10_000).nullable().default(null),
  dueAt: z.string().datetime().nullable().default(null),
  environment: z.enum(ENVIRONMENTS).nullable().default(null),
  buildVersion: z.string().max(200).nullable().default(null),
  parentId: z.string().nullable().default(null),
  sprintId: z.string().nullable().default(null),
  requesterId: z.string().nullable().default(null),
  custom: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
  attachments: z.array(z.record(z.string(), z.unknown())).default([]),
});