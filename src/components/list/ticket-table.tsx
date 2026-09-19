"use client";

import * as React from "react";

import {
  LabelChip,
  PriorityBadge,
  StatusBadge,
  TypeIcon,
} from "@/components/tickets/badges";
import { UserAvatar } from "@/components/tickets/user-avatar";
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
  getLabel,
  getUser,
  isOverdue,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
} from "@/lib/mock";
import { cn } from "@/lib/utils";

/** Rows are a fixed height so the window arithmetic is exact. */
const ROW_HEIGHT = 44;

// Sorting status and priority alphabetically would be meaningless, so both
// sort by their real rank.
const statusRank = new Map(TICKET_STATUSES.map((status, index) => [status, index]));
const priorityRank = new Map(
  TICKET_PRIORITIES.map((priority, index) => [priority, index]),
);

function buildColumns(showProject: boolean): ColumnDef<Ticket>[] {
  const columns: ColumnDef<Ticket>[] = [
    {
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
    {
      accessorKey: "title",
      header: ({ column }) => <TableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <span className="block truncate text-small text-grey-900">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <TableColumnHeader column={column} title="Status" />,
      sortingFn: (a, b) =>
        (statusRank.get(a.original.status) ?? 0) -
        (statusRank.get(b.original.status) ?? 0),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "priority",
      header: ({ column }) => <TableColumnHeader column={column} title="Priority" />,
      sortingFn: (a, b) =>
        (priorityRank.get(a.original.priority) ?? 0) -
        (priorityRank.get(b.original.priority) ?? 0),
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
    },
    {
      id: "assignee",
      accessorFn: (ticket) => getUser(ticket.assigneeId)?.name ?? "￿",
      header: ({ column }) => <TableColumnHeader column={column} title="Assignee" />,
      cell: ({ row }) => {
        const user = getUser(row.original.assigneeId);
        return (
          <span className="flex items-center gap-2">
            <UserAvatar userId={row.original.assigneeId} />
            <span className="truncate text-small text-grey-700">
              {user?.name ?? "Unassigned"}
            </span>
          </span>
        );
      },
    },
    {
      id: "labels",
      enableSorting: false,
      header: () => <span>Labels</span>,
      cell: ({ row }) => (
        <span className="flex gap-1 overflow-hidden">
          {row.original.labelIds.slice(0, 2).map((id) => {
            const label = getLabel(id);
            return label ? (
              <LabelChip
                key={id}
                name={label.name}
                className="max-w-[76px] truncate"
              />
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
    {
      accessorKey: "dueAt",
      header: ({ column }) => <TableColumnHeader column={column} title="Due" />,
      cell: ({ row }) =>
        row.original.dueAt ? (
          <span
            className={cn(
              "text-small",
              isOverdue(row.original)
                ? "font-medium text-grey-800"
                : "text-grey-500",
            )}
          >
            {formatDueDate(row.original.dueAt)}
            {isOverdue(row.original) ? (
              <span className="sr-only"> — overdue</span>
            ) : null}
          </span>
        ) : (
          <span className="text-small text-grey-300">—</span>
        ),
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => <TableColumnHeader column={column} title="Updated" />,
      cell: ({ row }) => (
        <span className="text-small text-grey-500">
          {formatRelative(row.original.updatedAt)}
        </span>
      ),
    },
  ];

  if (showProject) {
    columns.splice(2, 0, {
      id: "project",
      accessorFn: (ticket) => ticket.projectId,
      header: ({ column }) => <TableColumnHeader column={column} title="Project" />,
      cell: ({ row }) => (
        <span className="truncate text-small text-grey-600">
          {row.original.key.split("-")[0]}
        </span>
      ),
    });
  }

  return columns;
}

/** Column widths, kept in one place so header and body stay aligned. */
const widthFor: Record<string, string> = {
  key: "w-[108px]",
  title: "w-auto",
  project: "w-[72px]",
  status: "w-[116px]",
  priority: "w-[112px]",
  assignee: "w-[176px]",
  labels: "w-[184px]",
  dueAt: "w-[96px]",
  updatedAt: "w-[96px]",
};

/** Badge cells size to their content instead of truncating mid-pill. */
const noTruncate = new Set(["status", "priority", "labels"]);

export function TicketTable({
  tickets,
  showProject = false,
  onOpenTicket,
  empty,
}: {
  tickets: Ticket[];
  showProject?: boolean;
  onOpenTicket?: (ticketId: string) => void;
  empty?: React.ReactNode;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const columns = React.useMemo(() => buildColumns(showProject), [showProject]);

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
                    "h-9 border-b border-grey-200 bg-grey-0 px-3 text-caption font-medium tracking-wide text-grey-500 uppercase",
                    widthFor[header.column.id],
                  )}
                />
              )}
            </TableHeaderGroup>
          )}
        </TableHeader>

        <TableVirtualBody
          rowHeight={ROW_HEIGHT}
          scrollRef={scrollRef}
          empty={empty}
        >
          {({ row }) => (
            <TableRow
              key={row.id}
              row={row}
              onClick={
                onOpenTicket
                  ? () => onOpenTicket((row.original as Ticket).id)
                  : undefined
              }
              className="h-row cursor-pointer border-b border-grey-150 transition-colors hover:bg-grey-50"
            >
              {({ cell }) => (
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
              )}
            </TableRow>
          )}
        </TableVirtualBody>
      </TableProvider>
    </div>
  );
}
