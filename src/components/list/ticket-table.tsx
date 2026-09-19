"use client";

import * as React from "react";
import { GitPullRequest, Hourglass, Paperclip } from "lucide-react";

import {
  AlertChip,
  LabelChip,
  PriorityBadge,
  SeverityBadge,
  StatusBadge,
  TypeIcon,
} from "@/components/tickets/badges";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TableCell,
  TableColumnHeader,
  TableHead,
  TableHeader,
  TableHeaderGroup,
  TableProvider,
  TableRow,
  TableVirtualBody,
  type ColumnDef,
} from "@/components/ui/data-table";
import { formatDueDate, formatRelative } from "@/lib/format";
import {
  daysInColumn,
  getLabel,
  getProject,
  getUser,
  isOverdue,
  isSlaBreached,
  isStale,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  TICKET_STATUSES,
  type Ticket,
} from "@/lib/mock";
import { ROW_HEIGHT, useViewState } from "@/lib/store/view-state";
import { cn } from "@/lib/utils";

const statusRank = new Map(TICKET_STATUSES.map((status, index) => [status, index]));
const priorityRank = new Map(
  TICKET_PRIORITIES.map((priority, index) => [priority, index]),
);
const severityRank = new Map(
  TICKET_SEVERITIES.map((severity, index) => [severity, index]),
);

export type ColumnId =
  | "select"
  | "key"
  | "title"
  | "project"
  | "status"
  | "priority"
  | "severity"
  | "assignee"
  | "labels"
  | "dueAt"
  | "age"
  | "updatedAt";

export const OPTIONAL_COLUMNS: { id: ColumnId; label: string }[] = [
  { id: "project", label: "Project" },
  { id: "status", label: "Status" },
  { id: "priority", label: "Priority" },
  { id: "severity", label: "Severity" },
  { id: "assignee", label: "Assignee" },
  { id: "labels", label: "Labels" },
  { id: "dueAt", label: "Due" },
  { id: "age", label: "Age in column" },
  { id: "updatedAt", label: "Updated" },
];

const widthFor: Record<string, string> = {
  select: "w-[40px]",
  key: "w-[108px]",
  title: "w-auto",
  project: "w-[72px]",
  status: "w-[116px]",
  priority: "w-[112px]",
  severity: "w-[72px]",
  assignee: "w-[176px]",
  labels: "w-[184px]",
  dueAt: "w-[104px]",
  age: "w-[84px]",
  updatedAt: "w-[96px]",
};

const noTruncate = new Set(["select", "status", "priority", "severity", "labels", "dueAt"]);

function buildColumns(visible: Set<ColumnId>): ColumnDef<Ticket>[] {
  const all: Record<ColumnId, ColumnDef<Ticket>> = {
    select: {
      id: "select",
      enableSorting: false,
      header: () => <span className="sr-only">Select</span>,
      cell: () => null,
    },
    key: {
      accessorKey: "key",
      header: ({ column }) => <TableColumnHeader column={column} title="Key" />,
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5">
          <TypeIcon type={row.original.type} />
          <span className="tnum text-small font-medium text-grey-600">
            {row.original.key}
          </span>
        </span>
      ),
    },
    title: {
      accessorKey: "title",
      header: ({ column }) => <TableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5">
          <span className="truncate text-small text-grey-900">
            {row.original.title}
          </span>
          {row.original.development ? (
            <GitPullRequest
              className="size-3 shrink-0 text-grey-400"
              strokeWidth={2}
              aria-label={`PR #${row.original.development.prNumber}`}
            />
          ) : null}
          {row.original.attachments.length > 0 ? (
            <Paperclip
              className="size-3 shrink-0 text-grey-400"
              strokeWidth={2}
              aria-label={`${row.original.attachments.length} attachments`}
            />
          ) : null}
        </span>
      ),
    },
    project: {
      id: "project",
      accessorFn: (ticket) => ticket.projectId,
      header: ({ column }) => <TableColumnHeader column={column} title="Project" />,
      cell: ({ row }) => (
        <span className="truncate text-small text-grey-600">
          {getProject(row.original.projectId)?.key}
        </span>
      ),
    },
    status: {
      accessorKey: "status",
      header: ({ column }) => <TableColumnHeader column={column} title="Status" />,
      sortingFn: (a, b) =>
        (statusRank.get(a.original.status) ?? 0) -
        (statusRank.get(b.original.status) ?? 0),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    priority: {
      accessorKey: "priority",
      header: ({ column }) => <TableColumnHeader column={column} title="Priority" />,
      sortingFn: (a, b) =>
        (priorityRank.get(a.original.priority) ?? 0) -
        (priorityRank.get(b.original.priority) ?? 0),
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
    },
    severity: {
      accessorKey: "severity",
      header: ({ column }) => <TableColumnHeader column={column} title="Sev" />,
      sortingFn: (a, b) =>
        (severityRank.get(a.original.severity ?? "s4") ?? 9) -
        (severityRank.get(b.original.severity ?? "s4") ?? 9),
      cell: ({ row }) =>
        row.original.severity ? (
          <SeverityBadge severity={row.original.severity} short />
        ) : (
          <span className="text-small text-grey-300">—</span>
        ),
    },
    assignee: {
      id: "assignee",
      accessorFn: (ticket) => getUser(ticket.assigneeId)?.name ?? "￿",
      header: ({ column }) => <TableColumnHeader column={column} title="Assignee" />,
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <UserAvatar userId={row.original.assigneeId} />
          <span className="truncate text-small text-grey-700">
            {getUser(row.original.assigneeId)?.name ?? "Unassigned"}
          </span>
        </span>
      ),
    },
    labels: {
      id: "labels",
      enableSorting: false,
      header: () => <span>Labels</span>,
      cell: ({ row }) => (
        <span className="flex gap-1 overflow-hidden">
          {row.original.labelIds.slice(0, 2).map((id) => {
            const label = getLabel(id);
            return label ? (
              <LabelChip key={id} name={label.name} className="max-w-[76px] truncate" />
            ) : null;
          })}
          {row.original.labelIds.length > 2 ? (
            <span className="tnum text-caption text-grey-400">
              +{row.original.labelIds.length - 2}
            </span>
          ) : null}
        </span>
      ),
    },
    dueAt: {
      accessorKey: "dueAt",
      header: ({ column }) => <TableColumnHeader column={column} title="Due" />,
      cell: ({ row }) => {
        const ticket = row.original;
        if (isSlaBreached(ticket)) return <AlertChip>SLA breached</AlertChip>;
        if (!ticket.dueAt) return <span className="text-small text-grey-300">—</span>;
        return isOverdue(ticket) ? (
          <AlertChip>{formatDueDate(ticket.dueAt)}</AlertChip>
        ) : (
          <span className="text-small text-grey-500">
            {formatDueDate(ticket.dueAt)}
          </span>
        );
      },
    },
    age: {
      id: "age",
      accessorFn: (ticket) => daysInColumn(ticket),
      header: ({ column }) => <TableColumnHeader column={column} title="Age" />,
      cell: ({ row }) => {
        const days = daysInColumn(row.original);
        const stale = isStale(row.original);
        return (
          <span
            className={cn(
              "tnum flex items-center gap-1 text-small",
              stale ? "font-medium text-grey-900" : "text-grey-500",
            )}
          >
            {stale ? (
              <Hourglass className="size-3" strokeWidth={2} aria-label="Stale" />
            ) : null}
            {days}d
          </span>
        );
      },
    },
    updatedAt: {
      accessorKey: "updatedAt",
      header: ({ column }) => <TableColumnHeader column={column} title="Updated" />,
      cell: ({ row }) => (
        <span className="text-small text-grey-500">
          {formatRelative(row.original.updatedAt)}
        </span>
      ),
    },
  };

  const order: ColumnId[] = [
    "select",
    "key",
    "title",
    "project",
    "status",
    "priority",
    "severity",
    "assignee",
    "labels",
    "dueAt",
    "age",
    "updatedAt",
  ];
  return order.filter((id) => visible.has(id)).map((id) => all[id]);
}

export function TicketTable({
  tickets,
  visibleColumns,
  onOpenTicket,
  empty,
}: {
  tickets: Ticket[];
  visibleColumns: Set<ColumnId>;
  onOpenTicket?: (ticketId: string) => void;
  empty?: React.ReactNode;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { density, selection, toggleSelected } = useViewState();
  const columns = React.useMemo(
    () => buildColumns(visibleColumns),
    [visibleColumns],
  );
  const selected = React.useMemo(() => new Set(selection), [selection]);
  const rowHeight = ROW_HEIGHT[density];

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
      <TableProvider
        columns={columns}
        data={tickets}
        defaultSorting={[{ id: "updatedAt", desc: true }]}
        className="border-separate border-spacing-0"
      >
        <TableHeader className="sticky top-0 z-10">
          {({ headerGroup }) => (
            <TableHeaderGroup headerGroup={headerGroup} key={headerGroup.id}>
              {({ header }) => (
                <TableHead
                  key={header.id}
                  header={header}
                  className={cn(
                    "glass-strong h-9 border-b border-grey-200 px-3 text-caption font-medium tracking-wide text-grey-500 uppercase",
                    widthFor[header.column.id],
                  )}
                />
              )}
            </TableHeaderGroup>
          )}
        </TableHeader>

        <TableVirtualBody rowHeight={rowHeight} scrollRef={scrollRef} empty={empty}>
          {({ row }) => {
            const ticket = row.original as Ticket;
            const isSelected = selected.has(ticket.id);
            return (
              <TableRow
                key={row.id}
                row={row}
                data-ticket-row={ticket.id}
                onClick={onOpenTicket ? () => onOpenTicket(ticket.id) : undefined}
                className={cn(
                  "cursor-pointer border-b border-grey-150 transition-colors",
                  isSelected ? "bg-accent-50" : "hover:bg-grey-50",
                )}
                style={{ height: rowHeight }}
              >
                {({ cell }) =>
                  cell.column.id === "select" ? (
                    <td
                      key={cell.id}
                      className="w-[40px] px-3 py-0"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelected(ticket.id)}
                        aria-label={`Select ${ticket.key}`}
                      />
                    </td>
                  ) : (
                    <TableCell
                      key={cell.id}
                      cell={cell}
                      className={cn(
                        "px-3 py-0",
                        noTruncate.has(cell.column.id)
                          ? "whitespace-nowrap"
                          : "max-w-0 truncate",
                        widthFor[cell.column.id],
                      )}
                    />
                  )
                }
              </TableRow>
            );
          }}
        </TableVirtualBody>
      </TableProvider>
    </div>
  );
}
