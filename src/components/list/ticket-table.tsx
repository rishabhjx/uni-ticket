"use client";

import * as React from "react";
import { GitPullRequest, Hourglass, Paperclip } from "lucide-react";
import {
  useTable,
  type ColumnDef,
  type HeaderContext,
} from "@tanstack/react-table";

import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridTableVirtual } from "@/components/reui/data-grid/data-grid-table-virtual";
import {
  AlertChip,
  LabelChip,
  PriorityBadge,
  SeverityBadge,
  StatusBadge,
  TypeIcon,
} from "@/components/tickets/badges";
import {
  AvatarStack,
  assigneeNames,
} from "@/components/tickets/user-avatar";
import { Checkbox } from "@/components/ui/checkbox";
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

/**
 * Pixel widths rather than the Tailwind classes this used to carry: the grid
 * lays out with a fixed table layout and a colgroup, so it wants numbers.
 *
 * Title is deliberately absent, but leaving it unsized is NOT what makes it
 * flexible - TanStack hands an unsized column a default 150px, which is why
 * the title clipped at "Split invoices by c..." while Status sat on 116px of
 * a two-word badge. It gets `meta.fillWidth` below instead, ReUI's flag for
 * the one column that absorbs the leftover width.
 *
 * The rest are sized to their actual content: a status badge is never wider
 * than "In Progress", a due cell has to hold "SLA breached" without clipping,
 * and the label column needs room for two chips plus a "+1".
 */
const SIZES: Partial<Record<ColumnId, number>> = {
  select: 44,
  key: 108,
  project: 76,
  // Sized to the longest badge each will ever hold ("Ready for QA",
  // "Medium"), plus the cell's own 32px of padding. At 124/108 both clipped
  // to "Ready for QA .." and "Medium ..".
  status: 148,
  priority: 124,
  severity: 68,
  assignee: 168,
  labels: 172,
  dueAt: 128,
  age: 84,
  updatedAt: 96,
};

/** Below this the title stops being readable, so the grid scrolls instead. */
const TITLE_MIN = 280;

/** Cells whose content is a badge or a chip row, which must not be clipped. */
const NO_TRUNCATE = new Set<ColumnId>([
  "select",
  "status",
  "priority",
  "severity",
  "labels",
  "dueAt",
]);

type Column = ColumnDef<DataGridFeatures, Ticket, unknown>;

function cellClass(id: ColumnId) {
  return cn(
    // px-4, not px-3: at 12px the columns read as one block of text with
    // vertical lines through it rather than as separate fields.
    "px-4 py-1.5",
    NO_TRUNCATE.has(id) ? "whitespace-nowrap" : "truncate",
  );
}

function SelectCell({ ticket }: { ticket: Ticket }) {
  const { selection, toggleSelected } = useViewState();

  return (
    <span
      className="flex items-center"
      // The row opens the ticket; ticking a box must not also open it.
      onClick={(event) => event.stopPropagation()}
    >
      <Checkbox
        checked={selection.includes(ticket.id)}
        onCheckedChange={() => toggleSelected(ticket.id)}
        aria-label={`Select ${ticket.key}`}
      />
    </span>
  );
}

function buildColumns(visible: Set<ColumnId>): Column[] {
  // A sortable header, with their menu: sort, pin, move, hide.
  const header = (title: string) => {
    const Header = ({
      column,
    }: HeaderContext<DataGridFeatures, Ticket, unknown>) => (
      <DataGridColumnHeader column={column} title={title} />
    );
    Header.displayName = `Header(${title})`;
    return Header;
  };

  const all: Record<ColumnId, Column> = {
    select: {
      id: "select",
      enableSorting: false,
      header: () => <span className="sr-only">Select</span>,
      cell: ({ row }) => <SelectCell ticket={row.original} />,
    },
    key: {
      accessorKey: "key",
      header: header("Key"),
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
      header: header("Title"),
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-1.5">
          {/* min-w-0 on both: a flex child will not shrink below its content
              width without it, so the title would never ellipsis. */}
          <span className="min-w-0 flex-1 truncate text-small text-grey-900">
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
      header: header("Project"),
      cell: ({ row }) => (
        <span className="truncate text-small text-grey-600">
          {getProject(row.original.projectId)?.key}
        </span>
      ),
    },
    status: {
      accessorKey: "status",
      header: header("Status"),
      // Alphabetical order on a status is meaningless; these sort by where the
      // column sits on the board.
      sortFn: (a, b) =>
        (statusRank.get(a.original.status) ?? 0) -
        (statusRank.get(b.original.status) ?? 0),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    priority: {
      accessorKey: "priority",
      header: header("Priority"),
      sortFn: (a, b) =>
        (priorityRank.get(a.original.priority) ?? 0) -
        (priorityRank.get(b.original.priority) ?? 0),
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
    },
    severity: {
      accessorKey: "severity",
      header: header("Sev"),
      sortFn: (a, b) =>
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
      // Sorts on the lead; the tail is a tie-breaker so a pair is stable.
      accessorFn: (ticket) =>
        ticket.assigneeIds.length === 0
          ? "￿"
          : ticket.assigneeIds.map((id) => getUser(id)?.name ?? id).join(", "),
      header: header("Assignee"),
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-2">
          <AvatarStack userIds={row.original.assigneeIds} max={2} />
          <span
            className="min-w-0 truncate text-small text-grey-700"
            title={assigneeNames(row.original.assigneeIds)}
          >
            {assigneeNames(row.original.assigneeIds)}
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
      header: header("Due"),
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
      header: header("Age"),
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
      header: header("Updated"),
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

  return order
    .filter((id) => visible.has(id))
    .map((id) => ({
      ...all[id],
      ...(SIZES[id] === undefined
        ? { size: TITLE_MIN, minSize: TITLE_MIN }
        : { size: SIZES[id] }),
      meta: {
        cellClassName: cellClass(id),
        headerClassName: cellClass(id),
        // Title takes whatever is left over, so it is the column that grows
        // with the window instead of the one that clips first.
        ...(SIZES[id] === undefined ? { fillWidth: true } : {}),
      },
    }));
}

/**
 * The list is ReUI's data-grid on TanStack Table v9. It replaces a
 * hand-rolled virtualiser built out of spacer rows, which held up at 150
 * tickets but had no answer for a column that is pinned, resized or hidden.
 * DataGridTableVirtual runs @tanstack/react-virtual over the same rows and
 * keeps the header, the colgroup and the measured row heights in step.
 */
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
  const { density } = useViewState();
  const columns = React.useMemo(
    () => buildColumns(visibleColumns),
    [visibleColumns],
  );
  const rowHeight = ROW_HEIGHT[density];

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: tickets,
    getRowId: (ticket) => ticket.id,
    initialState: { sorting: [{ id: "updatedAt", desc: true }] },
    // dataGridFeatures registers rowPaginationFeature, which defaults to a
    // 10-row page — so the grid silently truncated a 150-ticket project to
    // ten. This list virtualises instead of paging, so the page is every row.
    state: { pagination: { pageIndex: 0, pageSize: Math.max(tickets.length, 1) } },
  });

  return (
    <DataGrid
      table={table}
      recordCount={tickets.length}
      onRowClick={onOpenTicket ? (ticket) => onOpenTicket(ticket.key) : undefined}
      emptyMessage={empty}
      tableLayout={{
        headerSticky: true,
        rowBorder: true,
        width: "fixed",
        columnsResizable: true,
        columnsPinnable: true,
        columnsMovable: true,
      }}
      tableClassNames={{
        /*
         * z-30, not the default z-40. The ticket panel sits at z-50 and this
         * header was painting straight over it, so the list's column headings
         * showed through the ticket description.
         *
         * Opaque rather than translucent: rows scrolling under a see-through
         * header put text on top of text.
         */
        headerSticky: "sticky top-0 z-30 bg-grey-0",
        headerRow: "h-10",
        /*
         * The row height has to be set in CSS, not only handed to the
         * virtualiser. `estimateSize` positions rows; it does not size them.
         * With no vertical padding the rows collapsed to 25px of content while
         * the virtualiser spaced them 48px apart — which is both why the table
         * read as a solid block and why scrolling it jumped.
         */
        bodyRow:
          "h-[var(--grid-row-h)] cursor-pointer border-b border-grey-150 transition-colors",
      }}
    >
      {/* The var rides a wrapper because DataGridContainer takes no style. */}
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{ "--grid-row-h": `${rowHeight}px` } as React.CSSProperties}
      >
      <DataGridContainer className="min-h-0 flex-1">
        <DataGridTableVirtual
          height="100%"
          estimateSize={rowHeight}
          overscan={8}
        />
      </DataGridContainer>
      </div>
    </DataGrid>
  );
}
