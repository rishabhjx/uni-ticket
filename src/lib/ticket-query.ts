import {
  daysInColumn,
  getLabel,
  getProject,
  getUser,
  isOverdue,
  isSlaBreached,
  isStale,
  STATUS_DISCIPLINE,
  type Ticket,
} from "@/lib/mock";
import type {
  FilterNode,
  FilterQuery,
  FilterRule,
} from "@/components/reui/filters/filters-types";

/**
 * Evaluates one of ReUI's filter trees against a ticket.
 *
 * The old filter model was a flat bag of arrays ANDed together, which cannot
 * say "urgent OR breached SLA" — and that is the question people actually ask
 * when triaging. A tree can, at any depth, with NOR falling out of a negated
 * OR rather than needing its own combinator.
 */
export type FieldValue = string | string[] | boolean | number | null;

/** Everything a ticket can be filtered on, as plain values. */
function valuesOf(ticket: Ticket, field: string): FieldValue {
  switch (field) {
    case "status":
      return ticket.status;
    case "discipline":
      return STATUS_DISCIPLINE[ticket.status];
    case "assignee":
      return ticket.assigneeIds.length > 0 ? ticket.assigneeIds : ["unassigned"];
    case "reporter":
      return ticket.reporterId;
    case "priority":
      return ticket.priority;
    case "severity":
      return ticket.severity ?? "none";
    case "type":
      return ticket.type;
    case "label":
      return ticket.labelIds.length > 0 ? ticket.labelIds : ["none"];
    case "env":
      return ticket.environment ?? "none";
    case "project":
      return ticket.projectId;
    case "sprint":
      return ticket.sprintId ?? "none";
    case "epic":
      return ticket.parentId ?? "none";
    case "estimate":
      return ticket.estimate;
    case "age":
      return daysInColumn(ticket);
    case "overdue":
      return isOverdue(ticket);
    case "stale":
      return isStale(ticket);
    case "breached":
      return isSlaBreached(ticket);
    case "hasAttachments":
      return ticket.attachments.length > 0;
    case "title":
      return ticket.title;
    case "description":
      return ticket.description;
    default:
      return null;
  }
}

/** Free text a `contains` rule searches, per field. */
function textOf(ticket: Ticket, field: string): string {
  const value = valuesOf(ticket, field);
  if (typeof value === "string") {
    if (field === "assignee" || field === "reporter") {
      return getUser(value)?.name ?? value;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((id) =>
        field === "assignee"
          ? (getUser(id)?.name ?? id)
          : field === "label"
            ? (getLabel(id)?.name ?? id)
            : id,
      )
      .join(" ");
  }
  if (field === "project") return getProject(String(value))?.name ?? "";
  return String(value ?? "");
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value === null || value === undefined) return [];
  return [String(value)];
}

function matchesRule(ticket: Ticket, rule: FilterRule<unknown>): boolean {
  const field = rule.path[0];
  if (!field) return true;

  const actual = valuesOf(ticket, field);
  const wanted = asArray(rule.value);
  const mine = asArray(actual);

  let result: boolean;

  switch (rule.operator) {
    case "":
      // A half-built rule filters nothing, or the list would empty out while
      // somebody is still choosing an operator.
      return true;

    case "is":
      if (typeof actual === "boolean") {
        // A boolean rule with no value chosen reads as "is true", which is
        // what clicking "Overdue" means.
        return wanted.length === 0 ? actual : String(actual) === wanted[0];
      }
      result = wanted.length === 0 || mine.some((v) => v === wanted[0]);
      break;

    case "is_not":
      result = !mine.some((v) => v === wanted[0]);
      break;

    case "is_any_of":
    case "has_any_of":
      result = wanted.length === 0 || mine.some((v) => wanted.includes(v));
      break;

    case "is_none_of":
    case "has_none_of":
      result = !mine.some((v) => wanted.includes(v));
      break;

    case "has_all_of":
      result = wanted.every((v) => mine.includes(v));
      break;

    case "empty":
      result = mine.length === 0 || mine[0] === "none" || mine[0] === "unassigned";
      break;

    case "not_empty":
      result = !(
        mine.length === 0 ||
        mine[0] === "none" ||
        mine[0] === "unassigned"
      );
      break;

    case "contains":
      result = textOf(ticket, field)
        .toLowerCase()
        .includes(String(rule.value ?? "").toLowerCase());
      break;

    case "not_contains":
      result = !textOf(ticket, field)
        .toLowerCase()
        .includes(String(rule.value ?? "").toLowerCase());
      break;

    case "starts_with":
      result = textOf(ticket, field)
        .toLowerCase()
        .startsWith(String(rule.value ?? "").toLowerCase());
      break;

    case "eq":
      result = Number(actual) === Number(rule.value);
      break;
    case "neq":
      result = Number(actual) !== Number(rule.value);
      break;
    case "gt":
      result = Number(actual) > Number(rule.value);
      break;
    case "gte":
      result = Number(actual) >= Number(rule.value);
      break;
    case "lt":
      result = Number(actual) < Number(rule.value);
      break;
    case "lte":
      result = Number(actual) <= Number(rule.value);
      break;
    case "between": {
      const [lo, hi] = asArray(rule.value).map(Number);
      const n = Number(actual);
      result = n >= lo && n <= hi;
      break;
    }

    default:
      // An operator this app does not implement must not silently hide rows.
      result = true;
  }

  // `negated` is how the bar expresses NOT on an operator with no inverse;
  // a negated OR group is what makes NOR expressible without its own keyword.
  return rule.negated ? !result : result;
}

function matchesNode(ticket: Ticket, node: FilterNode<unknown>): boolean {
  if (node.type === "rule") return matchesRule(ticket, node);

  // An empty group matches everything: "no filters" is not "nothing".
  if (node.rules.length === 0) return true;

  return node.combinator === "or"
    ? node.rules.some((child) => matchesNode(ticket, child))
    : node.rules.every((child) => matchesNode(ticket, child));
}

export function matchesQuery(ticket: Ticket, query: FilterQuery<unknown>) {
  return matchesNode(ticket, query);
}

/** How many conditions are actually doing something, for the "Clear" chip. */
export function countRules(node: FilterNode<unknown>): number {
  if (node.type === "rule") return node.operator ? 1 : 0;
  return node.rules.reduce((sum, child) => sum + countRules(child), 0);
}
