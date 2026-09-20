"use client";

import * as React from "react";
import {
  AlarmClock,
  CalendarClock,
  Hourglass,
  Rows2,
  Rows3,
  Search,
  Star,
  X,
} from "lucide-react";

import { FacetFilter, type FacetOption } from "@/components/list/facet-filter";
import {
  PriorityBadge,
  SeverityBadge,
  StatusBadge,
  TypeIcon,
} from "@/components/tickets/badges";
import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ENVIRONMENT_LABEL,
  ENVIRONMENTS,
  labels,
  PRIORITY_LABEL,
  SEVERITY_LABEL,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
  TYPE_LABEL,
  users,
  type Project,
} from "@/lib/mock";
import { SEARCH_PLACEHOLDER } from "@/lib/search";
import { useViewState } from "@/lib/store/view-state";
import { cn } from "@/lib/utils";

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

const severityOptions: FacetOption[] = TICKET_SEVERITIES.map((severity) => ({
  value: severity,
  label: SEVERITY_LABEL[severity],
  render: <SeverityBadge severity={severity} />,
}));

const typeOptions: FacetOption[] = TICKET_TYPES.map((type) => ({
  value: type,
  label: TYPE_LABEL[type],
  render: (
    <span className="flex items-center gap-2">
      <TypeIcon type={type} />
      {TYPE_LABEL[type]}
    </span>
  ),
}));

const environmentOptions: FacetOption[] = ENVIRONMENTS.map((environment) => ({
  value: environment,
  label: ENVIRONMENT_LABEL[environment],
}));

const labelOptions: FacetOption[] = labels.map((label) => ({
  value: label.id,
  label: label.name,
}));

const chipBase =
  "flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-small transition-colors";
const chipIdle =
  "border-grey-200 text-grey-600 hover:border-grey-300 hover:text-grey-900";
const chipOn = "border-accent-200 bg-accent-50 text-accent-700";

function ToggleChip({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(chipBase, active ? chipOn : chipIdle)}
    >
      <Icon className="size-3.5" strokeWidth={1.75} />
      {children}
    </button>
  );
}

export function FilterBar({
  project,
  resultCount,
  totalCount,
  /** The board hides status, since its columns already are the statuses. */
  hideStatus = false,
  extra,
}: {
  project?: Project;
  resultCount: number;
  totalCount: number;
  hideStatus?: boolean;
  extra?: React.ReactNode;
}) {
  const {
    filters,
    setFilters,
    clearFilters,
    activeCount,
    density,
    setDensity,
    saveCurrentView,
  } = useViewState();

  const [naming, setNaming] = React.useState(false);
  const [viewName, setViewName] = React.useState("");

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

  return (
    <div className="hairline-b flex items-center gap-2 overflow-x-auto overscroll-x-contain px-4 py-2.5 sm:px-6">
      <div className="relative shrink-0">
        <Search
          className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-grey-400"
          strokeWidth={1.75}
        />
        <input
          type="search"
          value={filters.search}
          onChange={(event) =>
            setFilters({ ...filters, search: event.target.value })
          }
          placeholder={SEARCH_PLACEHOLDER}
          aria-label="Search tickets"
          className="h-7 w-72 rounded-md border border-grey-200 pr-2 pl-7 text-small text-grey-900 transition-colors placeholder:text-grey-400 hover:border-grey-300 focus:border-accent-600 focus:outline-none"
        />
      </div>

      {hideStatus ? null : (
        <FacetFilter
          title="Status"
          options={statusOptions}
          selected={filters.statuses}
          onChange={(statuses) => setFilters({ ...filters, statuses })}
        />
      )}
      <FacetFilter
        title="Assignee"
        options={assigneeOptions}
        selected={filters.assignees}
        onChange={(assignees) => setFilters({ ...filters, assignees })}
        searchable
      />
      <FacetFilter
        title="Priority"
        options={priorityOptions}
        selected={filters.priorities}
        onChange={(priorities) => setFilters({ ...filters, priorities })}
      />
      <FacetFilter
        title="Severity"
        options={severityOptions}
        selected={filters.severities}
        onChange={(severities) => setFilters({ ...filters, severities })}
      />
      <FacetFilter
        title="Type"
        options={typeOptions}
        selected={filters.types}
        onChange={(types) => setFilters({ ...filters, types })}
      />
      <FacetFilter
        title="Label"
        options={labelOptions}
        selected={filters.labels}
        onChange={(next) => setFilters({ ...filters, labels: next })}
        searchable
      />
      <FacetFilter
        title="Env"
        options={environmentOptions}
        selected={filters.environments}
        onChange={(environments) => setFilters({ ...filters, environments })}
      />

      <ToggleChip
        active={filters.overdueOnly}
        onClick={() => setFilters({ ...filters, overdueOnly: !filters.overdueOnly })}
        icon={CalendarClock}
      >
        Overdue
      </ToggleChip>
      <ToggleChip
        active={filters.staleOnly}
        onClick={() => setFilters({ ...filters, staleOnly: !filters.staleOnly })}
        icon={Hourglass}
      >
        Stale
      </ToggleChip>
      {project?.kind === "service" ? (
        <ToggleChip
          active={filters.breachedOnly}
          onClick={() =>
            setFilters({ ...filters, breachedOnly: !filters.breachedOnly })
          }
          icon={AlarmClock}
        >
          SLA breached
        </ToggleChip>
      ) : null}

      {activeCount > 0 ? (
        <>
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-small text-grey-600 transition-colors hover:bg-grey-100 hover:text-grey-900"
          >
            <X className="size-3.5" strokeWidth={1.75} />
            Clear
          </button>

          {naming ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveCurrentView(viewName);
                setViewName("");
                setNaming(false);
              }}
              className="flex items-center gap-1"
            >
              <input
                autoFocus
                value={viewName}
                onChange={(event) => setViewName(event.target.value)}
                onBlur={() => setNaming(false)}
                placeholder="View name"
                aria-label="Name this view"
                className="h-7 w-32 rounded-md border border-accent-600 px-2 text-small focus:outline-none"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setNaming(true)}
              className={cn(chipBase, chipIdle)}
            >
              <Star className="size-3.5" strokeWidth={1.75} />
              Save view
            </button>
          )}
        </>
      ) : null}

      <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
        {extra}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={
                density === "compact" ? "Comfortable rows" : "Compact rows"
              }
              onClick={() =>
                setDensity(density === "compact" ? "comfortable" : "compact")
              }
              className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              {density === "compact" ? (
                <Rows3 className="size-4" strokeWidth={1.75} />
              ) : (
                <Rows2 className="size-4" strokeWidth={1.75} />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            {density === "compact" ? "Comfortable rows" : "Compact rows"}
          </TooltipContent>
        </Tooltip>

        <span className="tnum text-small text-grey-500">
          {resultCount === totalCount
            ? `${totalCount} tickets`
            : `${resultCount} of ${totalCount}`}
        </span>
      </div>
    </div>
  );
}
