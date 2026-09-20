"use client";

import * as React from "react";
import {
  AlarmClock,
  CalendarClock,
  CircleDot,
  Flame,
  FolderOpen,
  Gauge,
  Hourglass,
  Layers,
  Paperclip,
  Rows2,
  Rows3,
  Search,
  Server,
  Shapes,
  Sparkles,
  Star,
  Tag,
  Timer,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react";

import { Filters } from "@/components/reui/filters/filters";
import { SavedViews } from "@/components/list/saved-views";
import type {
  FilterField,
  FilterQuery,
} from "@/components/reui/filters/filters-types";
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
  DISCIPLINE_LABEL,
  DISCIPLINES,
  ENVIRONMENT_LABEL,
  ENVIRONMENTS,
  labels,
  PRIORITY_LABEL,
  SEVERITY_LABEL,
  sprintsForProject,
  STATUS_LABEL,
  statusesForDiscipline,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  TICKET_TYPES,
  TYPE_LABEL,
  users,
  type Project,
} from "@/lib/mock";
import { SEARCH_PLACEHOLDER } from "@/lib/search";
import { useViewState } from "@/lib/store/view-state";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

const icon = (node: React.ReactNode) => node;

/**
 * Every field a ticket can be filtered on. The old bar offered seven; the gap
 * people hit was the long tail — reporter, sprint, epic, project, estimate,
 * age, "has attachments" — so the schema is the full set and the picker's
 * search is how you get to it. Adding one is an entry here and a case in
 * `valuesOf`, nothing else.
 */
function buildFields(project: Project | undefined, projects: Project[]) {
  const selectField = (
    id: string,
    label: string,
    node: React.ReactNode,
    options: { value: string; label: string; icon?: React.ReactNode }[],
    searchable = false,
  ): FilterField<unknown> => ({
    id,
    label,
    icon: node,
    type: "select",
    defaultOperator: "is_any_of",
    operators: [
      { value: "is_any_of", label: "is any of", arity: "many" },
      // The negative operator is what makes NOR possible on a chip: an OR
      // group of "is none of" rules is exactly "none of these".
      { value: "is_none_of", label: "is none of", arity: "many" },
      { value: "empty", label: "is empty", arity: "none" },
      { value: "not_empty", label: "is set", arity: "none" },
    ],
    options,
    searchable,
  });

  const boolField = (
    id: string,
    label: string,
    node: React.ReactNode,
  ): FilterField<unknown> => ({
    id,
    label,
    icon: node,
    type: "boolean",
    defaultOperator: "is",
    operators: [{ value: "is", label: "is" }],
    options: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ],
  });

  const memberIds = project ? project.memberIds : users.map((user) => user.id);

  const fields: FilterField<unknown>[] = [
    selectField(
      "status",
      "Status",
      icon(<CircleDot className="size-3.5" strokeWidth={1.75} />),
      DISCIPLINES.flatMap((discipline) =>
        statusesForDiscipline(discipline).map((status) => ({
          value: status as string,
          label: STATUS_LABEL[status],
          description: DISCIPLINE_LABEL[discipline],
          icon: icon(<StatusDot status={status} />),
        })),
      ),
      true,
    ),
    selectField(
      "discipline",
      "Stage",
      icon(<Layers className="size-3.5" strokeWidth={1.75} />),
      DISCIPLINES.map((discipline) => ({
        value: discipline as string,
        label: DISCIPLINE_LABEL[discipline],
      })),
    ),
    selectField(
      "assignee",
      "Assignee",
      icon(<UserRound className="size-3.5" strokeWidth={1.75} />),
      [
        {
          value: "unassigned",
          label: "Unassigned",
          icon: icon(<UserAvatar userId={null} />),
        },
        ...memberIds.map((id) => ({
          value: id,
          label: users.find((user) => user.id === id)?.name ?? id,
          icon: icon(<UserAvatar userId={id} />),
        })),
      ],
      true,
    ),
    selectField(
      "reporter",
      "Reporter",
      icon(<Users className="size-3.5" strokeWidth={1.75} />),
      users.map((user) => ({
        value: user.id,
        label: user.name,
        icon: icon(<UserAvatar userId={user.id} />),
      })),
      true,
    ),
    selectField(
      "priority",
      "Priority",
      icon(<Flame className="size-3.5" strokeWidth={1.75} />),
      TICKET_PRIORITIES.map((priority) => ({
        value: priority as string,
        label: PRIORITY_LABEL[priority],
        icon: icon(<PriorityDot priority={priority} />),
      })),
    ),
    selectField(
      "severity",
      "Severity",
      icon(<TriangleAlert className="size-3.5" strokeWidth={1.75} />),
      [
        ...TICKET_SEVERITIES.map((severity) => ({
          value: severity as string,
          label: SEVERITY_LABEL[severity],
          icon: icon(<SeverityDot severity={severity} />),
        })),
        { value: "none", label: "No severity" },
      ],
    ),
    selectField(
      "type",
      "Type",
      icon(<Shapes className="size-3.5" strokeWidth={1.75} />),
      TICKET_TYPES.map((type) => ({
        value: type as string,
        label: TYPE_LABEL[type],
        icon: icon(<TypeIcon type={type} />),
      })),
    ),
    selectField(
      "label",
      "Label",
      icon(<Tag className="size-3.5" strokeWidth={1.75} />),
      [
        ...labels.map((label) => ({ value: label.id, label: label.name })),
        { value: "none", label: "No label" },
      ],
      true,
    ),
    selectField(
      "env",
      "Environment",
      icon(<Server className="size-3.5" strokeWidth={1.75} />),
      [
        ...ENVIRONMENTS.map((environment) => ({
          value: environment as string,
          label: ENVIRONMENT_LABEL[environment],
        })),
        { value: "none", label: "None" },
      ],
    ),
  ];

  // Scoped views already know their project; the cross-project ones do not.
  if (!project) {
    fields.push(
      selectField(
        "project",
        "Project",
        icon(<FolderOpen className="size-3.5" strokeWidth={1.75} />),
        projects.map((item) => ({
          value: item.id,
          label: `${item.emoji} ${item.name}`,
        })),
        true,
      ),
    );
  } else {
    const cycles = sprintsForProject(project.id);
    if (cycles.length > 0) {
      fields.push(
        selectField(
          "sprint",
          "Sprint",
          icon(<Timer className="size-3.5" strokeWidth={1.75} />),
          [
            ...cycles.map((sprint) => ({
              value: sprint.id,
              label: sprint.name,
              description: sprint.state,
            })),
            { value: "none", label: "No sprint" },
          ],
        ),
      );
    }
  }

  fields.push(
    {
      id: "estimate",
      label: "Estimate",
      icon: icon(<Gauge className="size-3.5" strokeWidth={1.75} />),
      type: "number",
      defaultOperator: "gte",
      placeholder: "points",
    },
    {
      id: "age",
      label: "Days in stage",
      icon: icon(<Hourglass className="size-3.5" strokeWidth={1.75} />),
      type: "number",
      defaultOperator: "gte",
      placeholder: "days",
    },
    boolField(
      "overdue",
      "Overdue",
      icon(<CalendarClock className="size-3.5" strokeWidth={1.75} />),
    ),
    boolField(
      "stale",
      "Stale",
      icon(<Hourglass className="size-3.5" strokeWidth={1.75} />),
    ),
    boolField(
      "hasAttachments",
      "Has attachments",
      icon(<Paperclip className="size-3.5" strokeWidth={1.75} />),
    ),
  );

  if (!project || project.kind === "service") {
    fields.push(
      boolField(
        "breached",
        "SLA breached",
        icon(<AlarmClock className="size-3.5" strokeWidth={1.75} />),
      ),
    );
  }

  // The project's own fields, filterable like any other. A select becomes a
  // pick list, a checkbox a yes/no, and the rest fall back to text.
  for (const field of project?.customFields ?? []) {
    const id = `custom:${field.id}`;
    if (field.type === "select") {
      fields.push(
        selectField(
          id,
          field.name,
          icon(<Sparkles className="size-3.5" strokeWidth={1.75} />),
          (field.options ?? []).map((option) => ({
            value: option,
            label: option,
          })),
        ),
      );
    } else if (field.type === "checkbox") {
      fields.push(
        boolField(
          id,
          field.name,
          icon(<Sparkles className="size-3.5" strokeWidth={1.75} />),
        ),
      );
    } else {
      fields.push({
        id,
        label: field.name,
        icon: icon(<Sparkles className="size-3.5" strokeWidth={1.75} />),
        type: field.type === "number" ? "number" : "text",
        defaultOperator: field.type === "number" ? "gte" : "contains",
      });
    }
  }

  return fields;
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
  const { projects } = useTicketStore();

  const [naming, setNaming] = React.useState(false);
  const [viewName, setViewName] = React.useState("");

  const fields = React.useMemo(() => {
    const all = buildFields(project, projects);
    return hideStatus ? all.filter((field) => field.id !== "status") : all;
  }, [project, projects, hideStatus]);

  return (
    /*
     * No horizontal scroll. The old bar laid every facet out as its own
     * dropdown and then scrolled sideways when they did not fit, which put
     * controls off screen and made "what is filtered?" unanswerable at a
     * glance. This is ReUI's ADVANCED builder in a popover: one button opens
     * a panel where conditions nest under AND / OR and can be negated, and
     * the bar itself only ever shows the chips for what is actually on. Chips
     * wrap onto a second line rather than scrolling, because a filter you
     * cannot see is a filter you will not remove.
     */
    <div className="hairline-b flex items-start gap-2 px-4 py-2.5 sm:px-6">
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
          className="h-7 w-64 rounded-md border border-grey-200 pr-2 pl-7 text-small text-grey-900 transition-colors placeholder:text-grey-500 hover:border-grey-300 focus:border-accent-600 focus:outline-none"
        />
      </div>

      <Filters
        fields={fields}
        query={filters.query as FilterQuery<unknown>}
        onQueryChange={(query) => setFilters({ ...filters, query })}
        variant="advanced"
        advancedMode="popover"
        advancedAlign="start"
        reorderable
        size="sm"
        showClear
        // No children: `Filters` renders its own chrome per variant, and
        // passing any overrides it — which is how the advanced builder ended
        // up replaced by the plain chip row.
        className="min-w-0 flex-1"
      />

      {activeCount > 0 ? (
        naming ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveCurrentView(viewName);
              setViewName("");
              setNaming(false);
            }}
            className="flex shrink-0 items-center gap-1"
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
        <SavedViews />
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
