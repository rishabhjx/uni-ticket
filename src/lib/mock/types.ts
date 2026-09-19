export const TICKET_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["urgent", "high", "medium", "low"] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_TYPES = ["bug", "feature", "task", "chore"] as const;

export type TicketType = (typeof TICKET_TYPES)[number];

export type User = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: string;
  /** 0–3 — a neutral grey step for the avatar. Colour is never used here. */
  tone: 0 | 1 | 2 | 3;
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
  startedOn: string;
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
  assigneeId: string | null;
  reporterId: string;
  labelIds: string[];
  estimate: number | null;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
  /** Position within its status column on the board. */
  order: number;
};

export type Comment = {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

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
};
