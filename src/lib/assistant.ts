import {
  blockersOf,
  conversationName,
  isOverdue,
  PRIORITY_LABEL,
  STATUS_LABEL,
  getUser,
  type ChatConversation,
  type ChatMessage,
  type Project,
  type Ticket,
} from "@/lib/mock";
import { formatRelative } from "@/lib/format";

export type AssistantContext = {
  tickets: Ticket[];
  projects: Project[];
  conversations: ChatConversation[];
  chatMessages: ChatMessage[];
};

const TICKET_KEY_PATTERN = /\b[A-Z]{2,6}-\d{1,5}\b/;

function summarizeTicket(ticket: Ticket, ctx: AssistantContext) {
  const assignees = ticket.assigneeIds.map((id) => getUser(id)?.name).filter(Boolean);
  const blockers = blockersOf(ctx.tickets, ticket);
  const lines = [
    `${ticket.key} — ${ticket.title}`,
    `Status: ${STATUS_LABEL[ticket.status]} · Priority: ${PRIORITY_LABEL[ticket.priority]}`,
    assignees.length > 0 ? `Assigned to ${assignees.join(", ")}.` : "Unassigned.",
    isOverdue(ticket) ? "This is overdue." : null,
    blockers.length > 0
      ? `Blocked by ${blockers.map((b) => b.key).join(", ")}.`
      : null,
    `Last updated ${formatRelative(ticket.updatedAt)}.`,
  ].filter(Boolean);
  return lines.join("\n");
}

function findConversation(query: string, conversations: ChatConversation[]) {
  const term = query.toLowerCase();
  return conversations.find(
    (c) => c.kind !== "dm" && term.includes(c.name.toLowerCase()),
  );
}

function findProject(query: string, projects: Project[]) {
  const term = query.toLowerCase();
  return projects.find(
    (p) =>
      term.includes(p.name.toLowerCase()) ||
      term.includes(p.key.toLowerCase()) ||
      term.includes(p.slug.toLowerCase()),
  );
}

const CAPABILITIES =
  "I can summarize a channel (\"summarize #incidents\"), look up a ticket (\"what's the status of APO-142\"), or find what's overdue on a project (\"what's overdue on Apollo Platform\"). This is a simulated assistant — it reads the workspace's own data rather than calling a real model.";

/**
 * A rules-based stand-in for a real assistant. There is no model API wired
 * into this prototype, so rather than fake a call and return a canned
 * paragraph, this reads the same data every other app in the workspace reads
 * and answers from it — honest about being simulated, genuinely useful about
 * what it returns.
 */
export function answerAssistant(query: string, ctx: AssistantContext): string {
  const trimmed = query.trim();
  if (!trimmed) return CAPABILITIES;

  const ticketMatch = trimmed.match(TICKET_KEY_PATTERN);
  if (ticketMatch) {
    const ticket = ctx.tickets.find((t) => t.key === ticketMatch[0]);
    if (ticket) return summarizeTicket(ticket, ctx);
    return `I can't find a ticket called ${ticketMatch[0]}.`;
  }

  if (/summar/i.test(trimmed)) {
    const conversation = findConversation(trimmed, ctx.conversations);
    if (conversation) {
      const recent = ctx.chatMessages
        .filter((m) => m.conversationId === conversation.id && m.parentId === null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6)
        .reverse();
      if (recent.length === 0) {
        return `${conversationName(conversation)} doesn't have any messages yet.`;
      }
      const authors = [...new Set(recent.map((m) => getUser(m.authorId)?.name))].filter(Boolean);
      const bullets = recent
        .map((m) => `• ${getUser(m.authorId)?.name?.split(" ")[0]}: ${m.body}`)
        .join("\n");
      return `Last activity in ${conversationName(conversation)} (${authors.join(", ")}):\n${bullets}`;
    }
    return "Which channel? Try \"summarize #general\" or name a project channel.";
  }

  if (/overdue|blocked|stuck/i.test(trimmed)) {
    const project = findProject(trimmed, ctx.projects);
    const scoped = project
      ? ctx.tickets.filter((t) => t.projectId === project.id)
      : ctx.tickets;
    const overdue = scoped.filter((t) => isOverdue(t)).slice(0, 8);
    if (overdue.length === 0) {
      return project
        ? `Nothing overdue on ${project.name} right now.`
        : "Nothing overdue right now.";
    }
    const bullets = overdue.map((t) => `• ${t.key} — ${t.title}`).join("\n");
    return `${overdue.length} overdue${project ? ` on ${project.name}` : ""}:\n${bullets}`;
  }

  return CAPABILITIES;
}

/** A canned, on-topic draft — the same "simulated, not a real model" honesty
 *  as the rest of this file, applied to Mail's "draft with AI" button. */
export function draftMailReply(subject: string, lastMessageBody: string) {
  return `Thanks for the note on "${subject}".\n\n${
    lastMessageBody
      ? "Following up on this — "
      : ""
  }I'll take a look and get back to you shortly.\n\nBest,`;
}

export const ASSISTANT_SUGGESTIONS = [
  "Summarize #general",
  "What's overdue on Apollo Platform?",
  "What's the status of APO-101?",
];
