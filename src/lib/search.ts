import {
  getUser,
  users,
  CURRENT_USER_ID,
  type Ticket,
} from "@/lib/mock";

/**
 * One search implementation, shared by the list and the command palette. They
 * used to disagree: the list matched descriptions and the palette did not, so
 * the same query gave different answers depending on where you typed it.
 *
 * Supports `field:value` operators alongside free text, because once someone
 * knows what they want, facets are slower than typing.
 */
export type SearchTerm = { field: string; value: string };

export type ParsedSearch = {
  text: string;
  terms: SearchTerm[];
};

const FIELDS = new Set([
  "assignee",
  "status",
  "priority",
  "severity",
  "type",
  "label",
  "env",
  "project",
  "is",
]);

export function parseSearch(query: string): ParsedSearch {
  const terms: SearchTerm[] = [];
  const free: string[] = [];

  for (const token of query.trim().split(/\s+/).filter(Boolean)) {
    const match = token.match(/^([a-z]+):(.+)$/i);
    if (match && FIELDS.has(match[1].toLowerCase())) {
      terms.push({ field: match[1].toLowerCase(), value: match[2].toLowerCase() });
    } else {
      free.push(token);
    }
  }

  return { text: free.join(" ").toLowerCase(), terms };
}

function userMatches(ticket: Ticket, value: string) {
  if (value === "me") return ticket.assigneeId === CURRENT_USER_ID;
  if (value === "none" || value === "unassigned") return ticket.assigneeId === null;
  const user = getUser(ticket.assigneeId);
  if (!user) return false;
  return (
    user.name.toLowerCase().includes(value) ||
    user.email.toLowerCase().startsWith(value)
  );
}

function matchesTerm(ticket: Ticket, term: SearchTerm) {
  switch (term.field) {
    case "assignee":
      return userMatches(ticket, term.value);
    case "status":
      return ticket.status.replace(/_/g, "").startsWith(term.value.replace(/[-_]/g, ""));
    case "priority":
      return ticket.priority.startsWith(term.value);
    case "severity":
      return (ticket.severity ?? "").startsWith(term.value);
    case "type":
      return ticket.type.startsWith(term.value);
    case "env":
      return (ticket.environment ?? "").startsWith(term.value);
    case "project":
      return ticket.key.toLowerCase().startsWith(term.value);
    case "label":
      return ticket.labelIds.some((id) => id.replace("l-", "").includes(term.value));
    case "is":
      if (term.value === "open") return ticket.status !== "done";
      if (term.value === "closed") return ticket.status === "done";
      if (term.value === "blocked")
        return ticket.links.some((link) => link.type === "blocked_by");
      if (term.value === "epic") return ticket.type === "epic";
      if (term.value === "mine") return ticket.assigneeId === CURRENT_USER_ID;
      return true;
    default:
      return true;
  }
}

export function matchesSearch(ticket: Ticket, parsed: ParsedSearch) {
  if (parsed.text) {
    const haystack =
      `${ticket.key} ${ticket.title} ${ticket.description}`.toLowerCase();
    if (!haystack.includes(parsed.text)) return false;
  }
  return parsed.terms.every((term) => matchesTerm(ticket, term));
}

/** Suggestions shown under an empty or partial query. */
export const SEARCH_HINTS = [
  "assignee:me",
  "is:open",
  "is:blocked",
  "status:review",
  "severity:s1",
  "type:bug",
];

export const SEARCH_PLACEHOLDER =
  "Search, or try assignee:me is:open severity:s1";

export function assigneeSuggestions() {
  return users.map((user) => `assignee:${user.email.split("@")[0]}`);
}
