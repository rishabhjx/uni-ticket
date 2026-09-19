"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  const query = filters.search.trim().toLowerCase();
  const now = new Date();

  return tickets.filter((ticket) => {
    if (filters.overdueOnly && !isOverdue(ticket, now)) return false;
    if (filters.staleOnly && !isStale(ticket, now)) return false;
    if (filters.breachedOnly && !isSlaBreached(ticket, now)) return false;

    if (query) {
      const haystack = `${ticket.key} ${ticket.title} ${ticket.description}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
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
      if (!filters.assignees.includes(ticket.assigneeId ?? "unassigned")) {
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
  query: string;
};

type ViewStateValue = {
  filters: TicketFilters;
  setFilters: (next: TicketFilters) => void;
  clearFilters: () => void;
  activeCount: number;
  groupBy: GroupBy;
  setGroupBy: (next: GroupBy) => void;
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

  const [groupBy, setGroupBy] = React.useState<GroupBy>("status");
  const [selection, setSelection] = React.useState<string[]>([]);

  // Read once, lazily. The server renders the defaults and the first client
  // render reads storage, so nothing is set from inside an effect.
  const [density, setDensityState] = React.useState<Density>(() => {
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
      persistViews([
        ...savedViews,
        {
          id: `v-${Date.now()}`,
          name: trimmed,
          path: pathname,
          query: filtersToParams(filters).toString(),
        },
      ]);
    },
    [savedViews, persistViews, pathname, filters],
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
      return ticket.assigneeId ?? "unassigned";
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
