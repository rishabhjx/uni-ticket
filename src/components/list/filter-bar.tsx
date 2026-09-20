"use client";

import * as React from "react";
import {
  AlarmClock,
  CalendarClock,
  CircleDot,
  Flame,
  Hourglass,
  Rows2,
  Rows3,
  Search,
  Server,
  Shapes,
  Star,
  Tag,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import {
  Filters,
  FiltersRow,
  type FilterField,
  type FilterQuery,
  type FilterRule,
} from "@/components/reui/filters/filters";
import {
  PriorityDot,
  SeverityDot,
  StatusDot,
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
import { emptyFilters, useViewState, type TicketFilters } from "@/lib/store/view-state";
import { cn } from "@/lib/utils";

/**
 * Which TicketFilters key each field writes. The whole bar is driven by this
 * one table: the schema below, the query built out of the filters and the
 * filters read back out of the query all walk it, so adding a facet is one
 * entry rather than three edits that can disagree.
 */
const LIST_FIELDS = {
  status: "statuses",
  assignee: "assignees",
  priority: "priorities",
  severity: "severities",
  type: "types",
  label: "labels",
  env: "environments",
} as const satisfies Record<string, keyof TicketFilters>;

const FLAG_FIELDS = {
  overdue: "overdueOnly",
  stale: "staleOnly",
  breached: "breachedOnly",
} as const satisfies Record<string, keyof TicketFilters>;

type ListFieldId = keyof typeof LIST_FIELDS;
type FlagFieldId = keyof typeof FLAG_FIELDS;

const icon = (node: React.ReactNode) => node;

function optionsFor(id: ListFieldId, project?: Project) {
  switch (id) {
    case "status":
      return TICKET_STATUSES.map((status) => ({
        value: status as string,
        label: STATUS_LABEL[status],
        icon: icon(<StatusDot status={status} />),
      }));
    case "priority":
      return TICKET_PRIORITIES.map((priority) => ({
        value: priority as string,
        label: PRIORITY_LABEL[priority],
        icon: icon(<PriorityDot priority={priority} />),
      }));
    case "severity":
      return TICKET_SEVERITIES.map((severity) => ({
        value: severity as string,
        label: SEVERITY_LABEL[severity],
        icon: icon(<SeverityDot severity={severity} />),
      }));
    case "type":
      return TICKET_TYPES.map((type) => ({
        value: type as string,
        label: TYPE_LABEL[type],
        icon: icon(<TypeIcon type={type} />),
      }));
    case "label":
      return labels.map((label) => ({ value: label.id, label: label.name }));
    case "env":
      return ENVIRONMENTS.map((environment) => ({
        value: environment as string,
        label: ENVIRONMENT_LABEL[environment],
      }));
    case "assignee":
      return [
        {
          value: "unassigned",
          label: "Unassigned",
          icon: icon(<UserAvatar userId={null} />),
          // Their own convention for the none-of-the-above row: picking it
          // clears the rest, which is what "unassigned AND Priya" should do.
          exclusive: true,
        },
        ...(project ? project.memberIds : users.map((user) => user.id)).map(
          (id) => {
            const user = users.find((item) => item.id === id);
            return {
              value: id,
              label: user?.name ?? id,
              icon: icon(<UserAvatar userId={id} />),
            };
          },
        ),
      ];
  }
}

const FIELD_ICONS: Record<ListFieldId, React.ReactNode> = {
  status: <CircleDot className="size-3.5" strokeWidth={1.75} />,
  assignee: <UserRound className="size-3.5" strokeWidth={1.75} />,
  priority: <Flame className="size-3.5" strokeWidth={1.75} />,
  severity: <TriangleAlert className="size-3.5" strokeWidth={1.75} />,
  type: <Shapes className="size-3.5" strokeWidth={1.75} />,
  label: <Tag className="size-3.5" strokeWidth={1.75} />,
  env: <Server className="size-3.5" strokeWidth={1.75} />,
};

const FIELD_LABELS: Record<ListFieldId, string> = {
  status: "Status",
  assignee: "Assignee",
  priority: "Priority",
  severity: "Severity",
  type: "Type",
  label: "Label",
  env: "Env",
};

const FLAG_LABELS: Record<FlagFieldId, { label: string; icon: React.ReactNode }> =
  {
    overdue: {
      label: "Overdue",
      icon: <CalendarClock className="size-3.5" strokeWidth={1.75} />,
    },
    stale: {
      label: "Stale",
      icon: <Hourglass className="size-3.5" strokeWidth={1.75} />,
    },
    breached: {
      label: "SLA breached",
      icon: <AlarmClock className="size-3.5" strokeWidth={1.75} />,
    },
  };

function buildFields(project: Project | undefined, hideStatus: boolean) {
  const fields: FilterField<string[] | boolean>[] = [];

  for (const id of Object.keys(LIST_FIELDS) as ListFieldId[]) {
    if (id === "status" && hideStatus) continue;
    fields.push({
      id,
      label: FIELD_LABELS[id],
      icon: FIELD_ICONS[id],
      type: "select",
      // "is any of" rather than "is": every facet here has always been a
      // multi-pick, and dropping to one value would be a regression dressed
      // up as a new component.
      defaultOperator: "is_any_of",
      operators: [
        { value: "is_any_of", label: "is any of", arity: "many" },
      ],
      options: optionsFor(id, project),
      searchable: id === "assignee" || id === "label",
    });
  }

  for (const id of Object.keys(FLAG_FIELDS) as FlagFieldId[]) {
    if (id === "breached" && project?.kind !== "service") continue;
    fields.push({
      id,
      label: FLAG_LABELS[id].label,
      icon: FLAG_LABELS[id].icon,
      type: "boolean",
      defaultOperator: "is",
      operators: [{ value: "is", label: "is" }],
      options: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
    });
  }

  return fields;
}

/** TicketFilters (which live in the URL) -> the tree ReUI's bar renders. */
function toQuery(filters: TicketFilters): FilterQuery<string[] | boolean> {
  const rules: FilterRule<string[] | boolean>[] = [];

  for (const [id, key] of Object.entries(LIST_FIELDS) as [
    ListFieldId,
    keyof TicketFilters,
  ][]) {
    const picked = filters[key] as string[];
    if (picked.length === 0) continue;
    rules.push({
      // A stable id per field, so re-deriving the tree on every URL change
      // does not remount the chip the user is pointing at.
      id: `rule-${id}`,
      type: "rule",
      path: [id],
      operator: "is_any_of",
      value: picked,
    });
  }

  for (const [id, key] of Object.entries(FLAG_FIELDS) as [
    FlagFieldId,
    keyof TicketFilters,
  ][]) {
    if (!filters[key]) continue;
    rules.push({
      id: `rule-${id}`,
      type: "rule",
      path: [id],
      operator: "is",
      value: true,
    });
  }

  return { id: "root", type: "group", combinator: "and", rules };
}

/** …and back. Anything the bar cannot express is left at its empty value. */
function fromQuery(query: FilterQuery<string[] | boolean>, search: string) {
  const next: TicketFilters = { ...emptyFilters, search };

  for (const node of query.rules) {
    if (node.type !== "rule") continue;
    const id = node.path[0];

    if (id in LIST_FIELDS) {
      const key = LIST_FIELDS[id as ListFieldId];
      (next[key] as string[]) = Array.isArray(node.value)
        ? node.value
        : node.value === undefined
          ? []
          : [String(node.value)];
      continue;
    }

    if (id in FLAG_FIELDS) {
      const key = FLAG_FIELDS[id as FlagFieldId];
      // An unset boolean rule is a chip mid-creation, not "off".
      (next[key] as boolean) = node.value !== false;
    }
  }

  return next;
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
    activeCount,
    density,
    setDensity,
    saveCurrentView,
  } = useViewState();

  const [naming, setNaming] = React.useState(false);
  const [viewName, setViewName] = React.useState("");

  const fields = React.useMemo(
    () => buildFields(project, hideStatus),
    [project, hideStatus],
  );

  const query = React.useMemo(() => toQuery(filters), [filters]);

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

      {/*
        ReUI's filter bar in its "basic" variant: a flat chip row joined by an
        implicit AND. Each chip is field / operator / value with its own kebab,
        which is a strict superset of the facet dropdowns this replaced - the
        picker lets you add a facet by typing its name, and a chip can be
        negated or removed without opening it.

        The query is derived from the URL on every render and written straight
        back, so the URL stays the single source of truth and a shared link
        still restores the exact view. Search stays a plain input beside it:
        it is free text with its own `field:value` grammar, and folding that
        into a chip would hide the one control people type into first.
      */}
      <Filters
        fields={fields}
        query={query}
        onQueryChange={(next) => setFilters(fromQuery(next, filters.search))}
        variant="basic"
        size="sm"
        className="shrink-0"
      >
        {/* showClear lives on the row, not on Filters: the row is what draws
            the chips and therefore the Clear that follows them. */}
        <FiltersRow showClear />
      </Filters>

      {activeCount > 0 ? (
        naming ? (
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
            className={cn(
              "flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-grey-200 px-2 text-small text-grey-600 transition-colors",
              "hover:border-grey-300 hover:text-grey-900",
            )}
          >
            <Star className="size-3.5" strokeWidth={1.75} />
            Save view
          </button>
        )
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
