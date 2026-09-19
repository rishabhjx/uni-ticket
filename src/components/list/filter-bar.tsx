"use client";

import { CalendarClock, Search, X } from "lucide-react";

import { FacetFilter, type FacetOption } from "@/components/list/facet-filter";
import { PriorityBadge, StatusBadge } from "@/components/tickets/badges";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { cn } from "@/lib/utils";
import {
  isOverdue,
  labels,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  users,
  type Project,
  type Ticket,
} from "@/lib/mock";

export type TicketFilters = {
  search: string;
  statuses: string[];
  assignees: string[];
  priorities: string[];
  labels: string[];
  /** Derived rather than a field, so it gets its own toggle. */
  overdueOnly: boolean;
};

export const emptyFilters: TicketFilters = {
  search: "",
  statuses: [],
  assignees: [],
  priorities: [],
  labels: [],
  overdueOnly: false,
};

export function countActiveFilters(filters: TicketFilters) {
  return (
    filters.statuses.length +
    filters.assignees.length +
    filters.priorities.length +
    filters.labels.length +
    (filters.search.trim() ? 1 : 0) +
    (filters.overdueOnly ? 1 : 0)
  );
}

const statusOptions: FacetOption[] = TICKET_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABEL[status],
  render: <StatusBadge status={status} />,
}));

const priorityOptions: FacetOption[] = TICKET_PRIORITIES.map((priority) => ({
  value: priority,
  label: PRIORITY_LABEL[priority],
  render: <PriorityBadge priority={priority} />,
}));

const labelOptions: FacetOption[] = labels.map((label) => ({
  value: label.id,
  label: label.name,
}));

export function FilterBar({
  filters,
  onChange,
  project,
  resultCount,
  totalCount,
}: {
  filters: TicketFilters;
  onChange: (next: TicketFilters) => void;
  /** Limits the assignee list to a project's members when scoped to one. */
  project?: Project;
  resultCount: number;
  totalCount: number;
}) {
  const memberIds = project ? project.memberIds : users.map((user) => user.id);
  const assigneeOptions: FacetOption[] = [
    {
      value: "unassigned",
      label: "Unassigned",
      render: (
        <span className="flex items-center gap-2">
          <UserAvatar userId={null} />
          Unassigned
        </span>
      ),
    },
    ...memberIds.map((id) => {
      const user = users.find((item) => item.id === id);
      return {
        value: id,
        label: user?.name ?? id,
        render: (
          <span className="flex items-center gap-2">
            <UserAvatar userId={id} />
            {user?.name}
          </span>
        ),
      };
    }),
  ];

  const active = countActiveFilters(filters);

  return (
    <div className="hairline-b flex flex-wrap items-center gap-2 px-6 py-2.5">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-grey-400"
          strokeWidth={1.75}
        />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search title or key"
          aria-label="Search tickets"
          className="h-7 w-56 rounded-md border border-grey-200 pr-2 pl-7 text-small text-grey-900 transition-colors placeholder:text-grey-400 hover:border-grey-300 focus:border-accent-600 focus:outline-none"
        />
      </div>

      <FacetFilter
        title="Status"
        options={statusOptions}
        selected={filters.statuses}
        onChange={(statuses) => onChange({ ...filters, statuses })}
      />
      <FacetFilter
        title="Assignee"
        options={assigneeOptions}
        selected={filters.assignees}
        onChange={(assignees) => onChange({ ...filters, assignees })}
        searchable
      />
      <FacetFilter
        title="Priority"
        options={priorityOptions}
        selected={filters.priorities}
        onChange={(priorities) => onChange({ ...filters, priorities })}
      />
      <FacetFilter
        title="Label"
        options={labelOptions}
        selected={filters.labels}
        onChange={(next) => onChange({ ...filters, labels: next })}
        searchable
      />

      <button
        type="button"
        aria-pressed={filters.overdueOnly}
        onClick={() => onChange({ ...filters, overdueOnly: !filters.overdueOnly })}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-md border px-2 text-small transition-colors",
          filters.overdueOnly
            ? "border-accent-200 bg-accent-50 text-accent-700"
            : "border-grey-200 text-grey-600 hover:border-grey-300 hover:text-grey-900",
        )}
      >
        <CalendarClock className="size-3.5" strokeWidth={1.75} />
        Overdue
      </button>

      {active > 0 ? (
        <button
          type="button"
          onClick={() => onChange(emptyFilters)}
          className="flex h-7 items-center gap-1 rounded-md px-2 text-small text-grey-600 transition-colors hover:bg-grey-100 hover:text-grey-900"
        >
          <X className="size-3.5" strokeWidth={1.75} />
          Clear
        </button>
      ) : null}

      <span className="tnum ml-auto text-small text-grey-500">
        {resultCount === totalCount
          ? `${totalCount} tickets`
          : `${resultCount} of ${totalCount}`}
      </span>
    </div>
  );
}

/** Shared by the project list, My tickets and search. */
export function applyFilters(tickets: Ticket[], filters: TicketFilters) {
  const query = filters.search.trim().toLowerCase();
  const now = new Date();

  return tickets.filter((ticket) => {
    if (filters.overdueOnly && !isOverdue(ticket, now)) return false;
    if (
      query &&
      !ticket.title.toLowerCase().includes(query) &&
      !ticket.key.toLowerCase().includes(query)
    ) {
      return false;
    }
    if (filters.statuses.length > 0 && !filters.statuses.includes(ticket.status)) {
      return false;
    }
    if (
      filters.priorities.length > 0 &&
      !filters.priorities.includes(ticket.priority)
    ) {
      return false;
    }
    if (filters.assignees.length > 0) {
      const key = ticket.assigneeId ?? "unassigned";
      if (!filters.assignees.includes(key)) return false;
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
