/**
 * "Done" used to mean a developer thought it was finished, which left QA with
 * nowhere to stand. `resolved` is the fix landing; `done` is someone having
 * verified it. Reopening sends a ticket back to in_progress.
 */
/**
 * Six statuses said "somebody is doing something" without saying who. Design
 * handing over to development and development handing over to QA are the two
 * moments a ticket actually changes hands, and neither was visible: everything
 * between To Do and Verified was one undifferentiated middle.
 *
 * Statuses are grouped by the discipline that owns them, which is also what
 * makes routing possible — see `Project["team"]`. Order is the order work
 * flows in, so the board reads left to right.
 */
export const DISCIPLINES = [
  "intake",
  "design",
  "development",
  "qa",
  "product",
  "closed",
] as const;

export type Discipline = (typeof DISCIPLINES)[number];

export const TICKET_STATUSES = [
  "backlog",
  "triage",
  "design_todo",
  "in_design",
  "design_review",
  "todo",
  "in_progress",
  "code_review",
  "ready_for_qa",
  "in_qa",
  "qa_failed",
  "product_review",
  "done",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const STATUS_DISCIPLINE: Record<TicketStatus, Discipline> = {
  backlog: "intake",
  triage: "intake",
  design_todo: "design",
  in_design: "design",
  design_review: "design",
  todo: "development",
  in_progress: "development",
  code_review: "development",
  ready_for_qa: "qa",
  in_qa: "qa",
  qa_failed: "qa",
  product_review: "product",
  done: "closed",
};

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  intake: "Intake",
  design: "Design",
  development: "Development",
  qa: "QA",
  product: "Product",
  closed: "Closed",
};

/**
 * Where a ticket lands when it is moved to a discipline rather than to a
 * specific status — dropping a card into the "QA" column on a board grouped by
 * discipline means "QA has it now", which is Ready for QA, not In QA.
 */
export const DISCIPLINE_ENTRY_STATUS: Record<Discipline, TicketStatus> = {
  intake: "backlog",
  design: "design_todo",
  development: "todo",
  qa: "ready_for_qa",
  product: "product_review",
  closed: "done",
};

export function statusesForDiscipline(discipline: Discipline) {
  return TICKET_STATUSES.filter(
    (status) => STATUS_DISCIPLINE[status] === discipline,
  );
}

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
  /** Fields this project adds to its own tickets. */
  customFields?: CustomField[];
  /**
   * Who owns each discipline here. Moving a ticket into a discipline's status
   * hands it to that person, which is the whole point of the split: a ticket
   * reaching QA should already be on the QA person's list.
   */
  team: Partial<Record<Discipline, string>>;
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

/**
 * A field a project adds to its own tickets. Every project asks for something
 * the shared model does not carry — a customer name on a support queue, a
 * design-review link, a risk score — and the alternative is a convention in
 * the description that nothing can filter on.
 */
export const CUSTOM_FIELD_TYPES = [
  "text",
  "number",
  "select",
  "checkbox",
  "date",
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export type CustomField = {
  id: string;
  name: string;
  type: CustomFieldType;
  /** Only for `select`. */
  options?: string[];
  /** Shown on the board card and as a list column when true. */
  showOnCard?: boolean;
};

export type CustomFieldValue = string | number | boolean | null;

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
  /** Values for the project's custom fields, keyed by field id. */
  custom?: Record<string, CustomFieldValue>;
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

export type Attachment = {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  kind: "image" | "log" | "video" | "document";
  /**
   * Where the bytes are. For a file dropped in this session it is an object
   * URL; for seeded data it is a generated placeholder, because a prototype
   * with no backend has nothing real to point at. Absent means "no preview",
   * which is the honest state for a log file.
   */
  url?: string;
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
  triage: "Triage",
  design_todo: "Design todo",
  in_design: "In design",
  design_review: "Design review",
  todo: "To do",
  in_progress: "In progress",
  code_review: "Code review",
  ready_for_qa: "Ready for QA",
  in_qa: "In QA",
  qa_failed: "QA failed",
  product_review: "Product review",
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
