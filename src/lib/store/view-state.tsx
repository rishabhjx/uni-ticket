"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { matchesSearch, parseSearch } from "@/lib/search";
import {
  isOverdue,
  isSlaBreached,
  isStale,
  type Ticket,
  type TicketStatus,
} from "@/lib/mock";

export type TicketFilters = {
  search: string;
  statuses: string[];
  assignees: string[];
  priorities: string[];
  severities: string[];
  types: string[];
  labels: string[];
  environments: string[];
  /** Derived rather than fields, so each gets its own toggle. */
  overdueOnly: boolean;
  staleOnly: boolean;
  breachedOnly: boolean;
};

export const emptyFilters: TicketFilters = {
  search: "",
  statuses: [],
  assignees: [],
  priorities: [],
  severities: [],
  types: [],
  labels: [],
  environments: [],
  overdueOnly: false,
  staleOnly: false,
  breachedOnly: false,
};

export type GroupBy = "status" | "assignee" | "priority" | "severity" | "type";

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

export function filtersFromParams(params: URLSearchParams): TicketFilters {
  const next: TicketFilters = { ...emptyFilters, statuses: [] };
  next.search = params.get(queryKey.search) ?? "";
  for (const key of listKeys) {
    const raw = params.get(queryKey[key]);
    next[key] = raw ? raw.split(",").filter(Boolean) : [];
  }
  for (const key of flagKeys) {
    next[key] = params.get(queryKey[key]) === "1";
  }
  return next;
}

export function filtersToParams(filters: TicketFilters) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set(queryKey.search, filters.search.trim());
  for (const key of listKeys) {
    if (filters[key].length > 0) params.set(queryKey[key], filters[key].join(","));
  }
  for (const key of flagKeys) {
    if (filters[key]) params.set(queryKey[key], "1");
  }
  return params;
}

export function countActiveFilters(filters: TicketFilters) {
  return (
    listKeys.reduce((sum, key) => sum + filters[key].length, 0) +
    flagKeys.reduce((sum, key) => sum + (filters[key] ? 1 : 0), 0) +
    (filters.search.trim() ? 1 : 0)
  );
}

export function applyFilters(tickets: Ticket[], filters: TicketFilters) {
  const trimmed = filters.search.trim();
  const parsed = trimmed ? parseSearch(trimmed) : null;
  const now = new Date();

  return tickets.filter((ticket) => {
    if (filters.overdueOnly && !isOverdue(ticket, now)) return false;
    if (filters.staleOnly && !isStale(ticket, now)) return false;
    if (filters.breachedOnly && !isSlaBreached(ticket, now)) return false;

    if (parsed && !matchesSearch(ticket, parsed)) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(ticket.status)) {
      return false;
    }
    if (filters.types.length > 0 && !filters.types.includes(ticket.type)) {
      return false;
    }
    if (
      filters.priorities.length > 0 &&
      !filters.priorities.includes(ticket.priority)
    ) {
      return false;
    }
    if (filters.severities.length > 0) {
      if (!ticket.severity || !filters.severities.includes(ticket.severity)) {
        return false;
      }
    }
    if (filters.environments.length > 0) {
      if (!ticket.environment || !filters.environments.includes(ticket.environment)) {
        return false;
      }
    }
    if (filters.assignees.length > 0) {
      const on =
        ticket.assigneeIds.length === 0
          ? ["unassigned"]
          : ticket.assigneeIds;
      if (!on.some((id) => filters.assignees.includes(id))) {
        return false;
      }
    }
    if (
      filters.labels.length > 0 &&
      !ticket.labelIds.some((id) => filters.labels.includes(id))
    ) {
      return false;
    }
    return true;
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
  const [groupByState, setGroupByState] = React.useState<GroupBy>("status");

  // A saved view carries its grouping, so the URL wins where it says something.
  const groupBy = urlGroupBy ?? groupByState;

  const setGroupBy = React.useCallback(
    (next: GroupBy) => {
      setGroupByState(next);
      const query = new URLSearchParams(params.toString());
      if (next === "status") query.delete("group");
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
      if (groupBy !== "status") query.set("group", groupBy);
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

export const ROW_HEIGHT: Record<Density, number> = {
  comfortable: 44,
  compact: 32,
};

export function groupKeyOf(ticket: Ticket, groupBy: GroupBy): string {
  switch (groupBy) {
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
