/**
 * "Done" used to mean a developer thought it was finished, which left QA with
 * nowhere to stand. `resolved` is the fix landing; `done` is someone having
 * verified it. Reopening sends a ticket back to in_progress.
 */
export const TICKET_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "resolved",
  "done",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["urgent", "high", "medium", "low"] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_TYPES = [
  "bug",
  "feature",
  "task",
  "chore",
  "request",
  "incident",
  "epic",
] as const;

export type TicketType = (typeof TICKET_TYPES)[number];

/**
 * Severity is how bad it is; priority is when we will deal with it. A crash
 * affecting three people is high severity and low priority, and QA cannot file
 * accurately when the two are collapsed into one field.
 */
export const TICKET_SEVERITIES = ["s1", "s2", "s3", "s4"] as const;

export type TicketSeverity = (typeof TICKET_SEVERITIES)[number];

export const ENVIRONMENTS = ["production", "staging", "local", "unknown"] as const;

export type Environment = (typeof ENVIRONMENTS)[number];

/** Software projects track work; service desks track inbound requests. */
export type ProjectKind = "software" | "service";

export type User = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: string;
  /** 0–3 — a neutral grey step for the avatar. Colour is never used here. */
  tone: 0 | 1 | 2 | 3;
  /** Who this person reports to, which is what drives the team view. */
  managerId: string | null;
};

export type Project = {
  id: string;
  /** Uppercase ticket prefix, e.g. "APO". */
  key: string;
  /** Lowercase route segment, e.g. "apo". */
  slug: string;
  name: string;
  description: string;
  leadId: string;
  memberIds: string[];
  /** The workspace this project lives in. */
  workspaceId: string;
  startedOn: string;
  kind: ProjectKind;
  /** One emoji per project — faster to recognise than a two-letter tile. */
  emoji: string;
  /** Anyone not listed here is a viewer and cannot change anything. */
  roles: Record<string, ProjectRole>;
  /** Cards per column before the board warns you. */
  wipLimits?: Partial<Record<TicketStatus, number>>;
};

/**
 * The level above a project. A project belongs to exactly one workspace, so
 * the hierarchy reads workspace > project > ticket.
 */
export type Workspace = {
  id: string;
  slug: string;
  name: string;
  description: string;
  emoji: string;
  memberIds: string[];
};

export type Label = {
  id: string;
  name: string;
};

export type Ticket = {
  id: string;
  /** Human key, e.g. "APO-124". */
  key: string;
  projectId: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  /**
   * Work is often shared, so a ticket carries a list rather than one owner.
   * Empty means unassigned. The first entry is the lead: it is what single-slot
   * places (board grouping, a swimlane, a sort key) fall back to, because a
   * card cannot sit in two columns at once.
   */
  assigneeIds: string[];
  reporterId: string;
  labelIds: string[];
  estimate: number | null;
  /** Bugs and incidents only. */
  severity: TicketSeverity | null;
  environment: Environment | null;
  buildVersion: string | null;
  /** Service desk only — the person who asked, who is not on the team. */
  requesterId: string | null;
  slaDueAt: string | null;
  development: Development | null;
  attachments: Attachment[];
  /** When it last entered its current column, which is what ageing measures. */
  statusChangedAt: string;
  /** An epic this belongs to, if any. */
  parentId: string | null;
  links: TicketLink[];
  sprintId: string | null;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
  /** Position within its status column on the board. */
  order: number;
};

export const LINK_TYPES = [
  "blocks",
  "blocked_by",
  "relates_to",
  "duplicates",
] as const;

export type LinkType = (typeof LINK_TYPES)[number];

export const LINK_LABEL: Record<LinkType, string> = {
  blocks: "Blocks",
  blocked_by: "Blocked by",
  relates_to: "Relates to",
  duplicates: "Duplicates",
};

export const LINK_INVERSE: Record<LinkType, LinkType> = {
  blocks: "blocked_by",
  blocked_by: "blocks",
  relates_to: "relates_to",
  duplicates: "duplicates",
};

export type TicketLink = {
  type: LinkType;
  ticketId: string;
};

/** A planning window. Tickets belong to at most one. */
export type Sprint = {
  id: string;
  projectId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  state: "past" | "active" | "upcoming";
};

/** What a person may do inside a project. */
export const PROJECT_ROLES = ["admin", "member", "viewer"] as const;

export type ProjectRole = (typeof PROJECT_ROLES)[number];

export type Development = {
  branch: string;
  prNumber: number;
  prState: "open" | "merged" | "draft";
  checks: "passing" | "failing" | "running";
};

export type Attachment = {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  kind: "image" | "log" | "video" | "document";
};

/**
 * The audit trail. QA and IT need to know who changed what and when, which
 * comments alone never tell you.
 */
export const EVENT_KINDS = [
  "created",
  "status",
  "assignee",
  "priority",
  "severity",
  "title",
  "description",
  "reopened",
  "comment",
] as const;

export type EventKind = (typeof EVENT_KINDS)[number];

export type TicketEvent = {
  id: string;
  ticketId: string;
  actorId: string;
  kind: EventKind;
  from: string | null;
  to: string | null;
  createdAt: string;
};

export type Comment = {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  createdAt: string;
  /** emoji -> the people who reacted with it. */
  reactions: Record<string, string[]>;
  /** Screenshots, recordings and logs pasted into the thread. */
  attachments: Attachment[];
};

/** The reactions offered on a comment. Deliberately a short list. */
export const REACTIONS = ["👍", "🎉", "👀", "🔥", "🤔"] as const;

export const STATUS_LABEL: Record<TicketStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  resolved: "Ready for QA",
  done: "Verified",
};

/** Only a verified ticket is finished. */
export function isClosed(status: TicketStatus) {
  return status === "done";
}

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const TYPE_LABEL: Record<TicketType, string> = {
  bug: "Bug",
  feature: "Feature",
  task: "Task",
  chore: "Chore",
  request: "Request",
  incident: "Incident",
  epic: "Epic",
};

export const SEVERITY_LABEL: Record<TicketSeverity, string> = {
  s1: "S1 · Critical",
  s2: "S2 · Major",
  s3: "S3 · Minor",
  s4: "S4 · Trivial",
};

export const SEVERITY_SHORT: Record<TicketSeverity, string> = {
  s1: "S1",
  s2: "S2",
  s3: "S3",
  s4: "S4",
};

export const ENVIRONMENT_LABEL: Record<Environment, string> = {
  production: "Production",
  staging: "Staging",
  local: "Local",
  unknown: "Unknown",
};

/** Bugs and incidents carry severity, environment and a build. */
export function isDefect(type: TicketType) {
  return type === "bug" || type === "incident";
}
