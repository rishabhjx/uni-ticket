"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { matchesSearch, parseSearch } from "@/lib/search";
import { countRules, matchesQuery } from "@/lib/ticket-query";
import type { FilterQuery } from "@/components/reui/filters/filters-types";
import {
  isOverdue,
  isSlaBreached,
  isStale,
  STATUS_DISCIPLINE,
  type Ticket,
  type TicketStatus,
} from "@/lib/mock";

/**
 * Filters used to be a flat bag of arrays, ANDed together. That shape cannot
 * express "urgent OR breached SLA", which is exactly the question triage asks,
 * so the conditions are a TREE now — ReUI's FilterQuery, evaluated by
 * `matchesQuery`. Free text stays beside it rather than inside: it has its own
 * `field:value` grammar and it is the control people type into first.
 */
export type TicketFilters = {
  search: string;
  query: FilterQuery<unknown>;
};

export const emptyQuery: FilterQuery<unknown> = {
  id: "root",
  type: "group",
  combinator: "and",
  rules: [],
};

export const emptyFilters: TicketFilters = {
  search: "",
  query: emptyQuery,
};

/**
 * "discipline" is the default: thirteen statuses make thirteen columns, which
 * is a horizontal scroll nobody reads. Six disciplines fit on a screen, and
 * dropping a card into one means "this team has it now".
 */
export type GroupBy =
  | "discipline"
  | "status"
  | "assignee"
  | "priority"
  | "severity"
  | "type";

/** A second dimension, drawn as rows while the columns stay the grouping. */
export type Swimlane = "none" | "assignee" | "priority" | "epic";
export type Density = "comfortable" | "compact";

const listKeys = [
  "statuses",
  "assignees",
  "priorities",
  "severities",
  "types",
  "labels",
  "environments",
] as const;

const flagKeys = ["overdueOnly", "staleOnly", "breachedOnly"] as const;

/** Short query keys, because these URLs get pasted into chat. */
const queryKey: Record<string, string> = {
  search: "q",
  statuses: "status",
  assignees: "assignee",
  priorities: "priority",
  severities: "severity",
  types: "type",
  labels: "label",
  environments: "env",
  overdueOnly: "overdue",
  staleOnly: "stale",
  breachedOnly: "breached",
};

/**
 * The query tree rides in the URL as compact JSON under `q`. Not a bespoke
 * encoding: a tree with groups and negation has no readable flat form, and a
 * shareable link matters more than a pretty one.
 */
/**
 * The short keys are how the rest of the product LINKS to a filtered view --
 * "Overdue 5" on Overview is `/my-work?overdue=1`. They were declared and
 * never read, so every one of those links landed on an unfiltered page: the
 * alarm had no handle, and worse, it looked like it did. They are also what
 * keeps links shared before the tree format existed working.
 */
function queryFromShortKeys(params: URLSearchParams): FilterQuery<unknown> {
  const rules: FilterQuery<unknown>["rules"] = [];

  const list: [string, string][] = [
    ["status", "status"],
    ["assignee", "assignee"],
    ["priority", "priority"],
    ["severity", "severity"],
    ["type", "type"],
    ["label", "label"],
    ["env", "env"],
    ["project", "project"],
  ];

  for (const [key, field] of list) {
    const raw = params.get(key);
    if (!raw) continue;
    const values = raw.split(",").filter(Boolean);
    if (values.length === 0) continue;
    rules.push({
      id: `short-${key}`,
      type: "rule",
      path: [field],
      operator: values.length === 1 ? "is" : "is_any_of",
      value: values.length === 1 ? values[0] : values,
    });
  }

  for (const [key, field] of [
    ["overdue", "overdue"],
    ["stale", "stale"],
    ["breached", "breached"],
  ] as const) {
    if (params.get(key) !== "1") continue;
    rules.push({
      id: `short-${key}`,
      type: "rule",
      path: [field],
      operator: "is",
      value: true,
    });
  }

  return rules.length === 0 ? emptyQuery : { ...emptyQuery, rules };
}

export function filtersFromParams(params: URLSearchParams): TicketFilters {
  const search = params.get("q") ?? "";
  const raw = params.get("where");

  if (!raw) return { search, query: queryFromShortKeys(params) };

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as FilterQuery<unknown>;
    // A malformed tree must not take the page down with it.
    if (parsed && parsed.type === "group" && Array.isArray(parsed.rules)) {
      return { search, query: parsed };
    }
  } catch {
    // Someone edited the URL by hand, or an old link predates this format.
  }
  return { search, query: queryFromShortKeys(params) };
}

export function filtersToParams(filters: TicketFilters) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("q", filters.search.trim());
  if (filters.query.rules.length > 0) {
    params.set("where", encodeURIComponent(JSON.stringify(filters.query)));
  }
  return params;
}

export function countActiveFilters(filters: TicketFilters) {
  return countRules(filters.query) + (filters.search.trim() ? 1 : 0);
}

export function applyFilters(tickets: Ticket[], filters: TicketFilters) {
  const trimmed = filters.search.trim();
  const parsed = trimmed ? parseSearch(trimmed) : null;

  return tickets.filter((ticket) => {
    if (parsed && !matchesSearch(ticket, parsed)) return false;
    return matchesQuery(ticket, filters.query);
  });
}

export type SavedView = {
  id: string;
  name: string;
  path: string;
  /** The full query: filters, plus scope, grouping and layout. */
  query: string;
};

type ViewStateValue = {
  filters: TicketFilters;
  setFilters: (next: TicketFilters) => void;
  clearFilters: () => void;
  activeCount: number;
  groupBy: GroupBy;
  setGroupBy: (next: GroupBy) => void;
  swimlane: Swimlane;
  setSwimlane: (next: Swimlane) => void;
  density: Density;
  setDensity: (next: Density) => void;
  savedViews: SavedView[];
  saveCurrentView: (name: string) => void;
  removeSavedView: (id: string) => void;
  /** Puts a deleted view back exactly as it was, for undo. */
  restoreSavedView: (view: SavedView) => void;
  selection: string[];
  toggleSelected: (ticketId: string) => void;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
};

const ViewStateContext = React.createContext<ViewStateValue | null>(null);

const SAVED_VIEWS_KEY = "uni.savedViews";
const DENSITY_KEY = "uni.density";

export function ViewStateProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // The URL is the filter state, so every view is a shareable link.
  const filters = React.useMemo(
    () => filtersFromParams(new URLSearchParams(params.toString())),
    [params],
  );

  const setFilters = React.useCallback(
    (next: TicketFilters) => {
      const query = filtersToParams(next).toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const clearFilters = React.useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const [selection, setSelection] = React.useState<string[]>([]);
  const [swimlane, setSwimlane] = React.useState<Swimlane>("none");

  const urlGroupBy = params.get("group") as GroupBy | null;
  const urlDensity = params.get("density") as Density | null;
  const [groupByState, setGroupByState] = React.useState<GroupBy>("discipline");

  // A saved view carries its grouping, so the URL wins where it says something.
  const groupBy = urlGroupBy ?? groupByState;

  const setGroupBy = React.useCallback(
    (next: GroupBy) => {
      setGroupByState(next);
      const query = new URLSearchParams(params.toString());
      if (next === "discipline") query.delete("group");
      else query.set("group", next);
      const search = query.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [params, router, pathname],
  );

  // Read once, lazily. The server renders the defaults and the first client
  // render reads storage, so nothing is set from inside an effect.
  const [densityState, setDensityState] = React.useState<Density>(() => {
    if (typeof window === "undefined") return "comfortable";
    try {
      const stored = window.localStorage.getItem(DENSITY_KEY);
      return stored === "compact" ? "compact" : "comfortable";
    } catch {
      return "comfortable";
    }
  });

  const [savedViews, setSavedViews] = React.useState<SavedView[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(SAVED_VIEWS_KEY);
      return stored ? (JSON.parse(stored) as SavedView[]) : [];
    } catch {
      return [];
    }
  });

  const density = urlDensity ?? densityState;

  const setDensity = React.useCallback((next: Density) => {
    setDensityState(next);
    try {
      window.localStorage.setItem(DENSITY_KEY, next);
    } catch {
      // Ignore — density is a convenience, not state worth failing over.
    }
  }, []);

  const persistViews = React.useCallback((next: SavedView[]) => {
    setSavedViews(next);
    try {
      window.localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(next));
    } catch {
      // Ignore.
    }
  }, []);

  const saveCurrentView = React.useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      // Start from the live URL so page-specific state — the My work scope,
      // for instance — survives, then layer the view controls on top.
      const query = new URLSearchParams(params.toString());
      query.delete("ticket");
      if (groupBy !== "discipline") query.set("group", groupBy);
      else query.delete("group");
      if (density !== "comfortable") query.set("density", density);
      else query.delete("density");

      persistViews([
        ...savedViews,
        {
          id: `v-${Date.now()}`,
          name: trimmed,
          path: pathname,
          query: query.toString(),
        },
      ]);
    },
    [savedViews, persistViews, pathname, params, groupBy, density],
  );

  const restoreSavedView = React.useCallback(
    (view: SavedView) =>
      persistViews(
        savedViews.some((item) => item.id === view.id)
          ? savedViews
          : [...savedViews, view],
      ),
    [savedViews, persistViews],
  );

  const removeSavedView = React.useCallback(
    (id: string) => persistViews(savedViews.filter((view) => view.id !== id)),
    [savedViews, persistViews],
  );

  const toggleSelected = React.useCallback((ticketId: string) => {
    setSelection((current) =>
      current.includes(ticketId)
        ? current.filter((id) => id !== ticketId)
        : [...current, ticketId],
    );
  }, []);

  const clearSelection = React.useCallback(() => setSelection([]), []);

  const value = React.useMemo(
    () => ({
      filters,
      setFilters,
      clearFilters,
      activeCount: countActiveFilters(filters),
      groupBy,
      setGroupBy,
      swimlane,
      setSwimlane,
      density,
      setDensity,
      savedViews,
      saveCurrentView,
      removeSavedView,
      restoreSavedView,
      selection,
      toggleSelected,
      setSelection,
      clearSelection,
    }),
    [
      filters,
      setFilters,
      clearFilters,
      groupBy,
      swimlane,
      density,
      setDensity,
      savedViews,
      saveCurrentView,
      removeSavedView,
      restoreSavedView,
      selection,
      toggleSelected,
      clearSelection,
    ],
  );

  return <ViewStateContext value={value}>{children}</ViewStateContext>;
}

export function useViewState() {
  const context = React.use(ViewStateContext);
  if (!context) {
    throw new Error("useViewState must be used inside <ViewStateProvider>");
  }
  return context;
}

/**
 * Comfortable went 44 -> 48. A status badge plus a priority badge plus an
 * avatar in a 44px row leaves 4px of air above and below them, which is what
 * made the list read as a wall rather than as rows.
 */
export const ROW_HEIGHT: Record<Density, number> = {
  comfortable: 48,
  compact: 34,
};

export function groupKeyOf(ticket: Ticket, groupBy: GroupBy): string {
  switch (groupBy) {
    case "discipline":
      return STATUS_DISCIPLINE[ticket.status];
    case "assignee":
      // A card can only live in one column, so grouping follows the lead.
      return ticket.assigneeIds[0] ?? "unassigned";
    case "priority":
      return ticket.priority;
    case "severity":
      return ticket.severity ?? "none";
    case "type":
      return ticket.type;
    default:
      return ticket.status as TicketStatus;
  }
}
