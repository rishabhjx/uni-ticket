"use client";

/**
 * Kibo UI table (packages/table), vendored because the registry host is
 * blocked here, with three changes:
 *
 * - Sorting lived in a module-level jotai atom, so every table in the app
 *   shared one sort order. It is local state now, which also drops the jotai
 *   dependency.
 * - TableColumnHeader opened a dropdown to choose a direction. In a dense
 *   tool the header itself should just toggle, so it does.
 * - TableVirtualBody is added: 150+ rows are windowed against a fixed row
 *   height so the list stays smooth.
 */

import type {
  Cell,
  Column,
  ColumnDef,
  Header,
  HeaderGroup,
  Row,
  SortingState,
  Table,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { HTMLAttributes, ReactNode, RefObject } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Table as TableRaw,
  TableBody as TableBodyRaw,
  TableCell as TableCellRaw,
  TableHead as TableHeadRaw,
  TableHeader as TableHeaderRaw,
  TableRow as TableRowRaw,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type { ColumnDef } from "@tanstack/react-table";

export const TableContext = createContext<{
  data: unknown[];
  columns: ColumnDef<unknown, unknown>[];
  table: Table<unknown> | null;
}>({
  data: [],
  columns: [],
  table: null,
});

export type TableProviderProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  children: ReactNode;
  className?: string;
  defaultSorting?: SortingState;
};

export function TableProvider<TData, TValue>({
  columns,
  data,
  children,
  className,
  defaultSorting = [],
}: TableProviderProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <TableContext.Provider
      value={{ data, columns: columns as never, table: table as never }}
    >
      <TableRaw className={className}>{children}</TableRaw>
    </TableContext.Provider>
  );
}

export function useDataTable() {
  return useContext(TableContext);
}

export type TableHeadProps = {
  header: Header<unknown, unknown>;
  className?: string;
};

/**
 * Not memoized, though Kibo's original was. TanStack keeps header objects
 * stable across sort changes, so the memo never invalidated: the header kept
 * rendering with a stale sort state, its arrow never moved, and a
 * click-to-toggle header could only ever sort ascending. A handful of header
 * cells is not worth memoizing anyway.
 */
export const TableHead = ({ header, className }: TableHeadProps) => (
  <TableHeadRaw className={className} key={header.id}>
    {header.isPlaceholder
      ? null
      : flexRender(header.column.columnDef.header, header.getContext())}
  </TableHeadRaw>
);

export type TableHeaderGroupProps = {
  headerGroup: HeaderGroup<unknown>;
  children: (props: { header: Header<unknown, unknown> }) => ReactNode;
};

export const TableHeaderGroup = ({
  headerGroup,
  children,
}: TableHeaderGroupProps) => (
  <TableRowRaw key={headerGroup.id}>
    {headerGroup.headers.map((header) => children({ header }))}
  </TableRowRaw>
);

export type TableHeaderProps = {
  className?: string;
  children: (props: { headerGroup: HeaderGroup<unknown> }) => ReactNode;
};

export const TableHeader = ({ className, children }: TableHeaderProps) => {
  const { table } = useContext(TableContext);

  return (
    <TableHeaderRaw className={className}>
      {table?.getHeaderGroups().map((headerGroup) => children({ headerGroup }))}
    </TableHeaderRaw>
  );
};

export interface TableColumnHeaderProps<TData, TValue>
  extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

/** Click to sort ascending, again for descending, again to clear. */
export function TableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: TableColumnHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted();

  const handleToggle = useCallback(() => {
    if (sorted === false) column.toggleSorting(false);
    else if (sorted === "asc") column.toggleSorting(true);
    else column.clearSorting();
  }, [column, sorted]);

  if (!column.getCanSort()) {
    return <span className={cn(className)}>{title}</span>;
  }

  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Sort by ${title}`}
      className={cn(
        "group -mx-1 flex items-center gap-1 rounded-md px-1 py-0.5 tracking-wide uppercase transition-colors hover:text-grey-900",
        sorted ? "text-grey-900" : "text-grey-500",
        className,
      )}
    >
      {title}
      <Icon
        className={cn(
          "size-3 transition-opacity",
          sorted ? "opacity-100" : "opacity-0 group-hover:opacity-60",
        )}
        strokeWidth={2}
      />
    </button>
  );
}

export type TableCellProps = {
  cell: Cell<unknown, unknown>;
  className?: string;
};

export const TableCell = ({ cell, className }: TableCellProps) => (
  <TableCellRaw className={className}>
    {flexRender(cell.column.columnDef.cell, cell.getContext())}
  </TableCellRaw>
);

export type TableRowProps = {
  row: Row<unknown>;
  children: (props: { cell: Cell<unknown, unknown> }) => ReactNode;
  className?: string;
  onClick?: () => void;
};

export const TableRow = ({ row, children, className, onClick }: TableRowProps) => (
  <TableRowRaw
    className={className}
    data-state={row.getIsSelected() && "selected"}
    key={row.id}
    onClick={onClick}
  >
    {row.getVisibleCells().map((cell) => children({ cell }))}
  </TableRowRaw>
);

export type TableBodyProps = {
  children: (props: { row: Row<unknown> }) => ReactNode;
  className?: string;
  empty?: ReactNode;
};

export const TableBody = ({ children, className, empty }: TableBodyProps) => {
  const { columns, table } = useContext(TableContext);
  const rows = table?.getRowModel().rows;

  return (
    <TableBodyRaw className={className}>
      {rows?.length ? (
        rows.map((row) => children({ row }))
      ) : (
        <TableRowRaw>
          <TableCellRaw colSpan={columns.length}>{empty ?? "No results."}</TableCellRaw>
        </TableRowRaw>
      )}
    </TableBodyRaw>
  );
};

/**
 * Renders only the rows in view, padded above and below by spacer rows so the
 * scrollbar still reflects the full list. Rows are a fixed height, which is
 * what makes the arithmetic exact.
 */
export function useVirtualRows({
  count,
  rowHeight,
  overscan = 8,
  scrollRef,
}: {
  count: number;
  rowHeight: number;
  overscan?: number;
  scrollRef: RefObject<HTMLElement | null>;
}) {
  const [viewport, setViewport] = useState({ top: 0, height: 0 });

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Both handlers are callbacks, so no state is set during the effect body.
    const sync = () =>
      setViewport({ top: element.scrollTop, height: element.clientHeight });

    element.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(element);

    return () => {
      element.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [scrollRef]);

  // Before the first measurement, render a screenful so SSR and the initial
  // paint are not empty.
  const visibleCount =
    viewport.height > 0 ? Math.ceil(viewport.height / rowHeight) : 24;
  const start = Math.max(0, Math.floor(viewport.top / rowHeight) - overscan);
  const end = Math.min(count, start + visibleCount + overscan * 2);

  return {
    start,
    end,
    padTop: start * rowHeight,
    padBottom: Math.max(0, (count - end) * rowHeight),
  };
}

export type TableVirtualBodyProps = {
  children: (props: { row: Row<unknown> }) => ReactNode;
  rowHeight: number;
  scrollRef: RefObject<HTMLElement | null>;
  className?: string;
  empty?: ReactNode;
};

export const TableVirtualBody = ({
  children,
  rowHeight,
  scrollRef,
  className,
  empty,
}: TableVirtualBodyProps) => {
  const { columns, table } = useContext(TableContext);
  const rows = table?.getRowModel().rows ?? [];
  const { start, end, padTop, padBottom } = useVirtualRows({
    count: rows.length,
    rowHeight,
    scrollRef,
  });

  if (rows.length === 0) {
    return (
      <TableBodyRaw className={className}>
        <TableRowRaw className="hover:bg-transparent">
          <TableCellRaw colSpan={columns.length}>{empty ?? "No results."}</TableCellRaw>
        </TableRowRaw>
      </TableBodyRaw>
    );
  }

  return (
    <TableBodyRaw className={className}>
      {padTop > 0 ? (
        <tr aria-hidden style={{ height: padTop }} />
      ) : null}
      {rows.slice(start, end).map((row) => children({ row }))}
      {padBottom > 0 ? (
        <tr aria-hidden style={{ height: padBottom }} />
      ) : null}
    </TableBodyRaw>
  );
};
