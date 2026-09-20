"use client";

import { Columns3Cog } from "lucide-react";

import { OPTIONAL_COLUMNS, type ColumnId } from "@/components/list/ticket-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ColumnChooser({
  visible,
  onChange,
}: {
  visible: Set<ColumnId>;
  onChange: (next: Set<ColumnId>) => void;
}) {
  const toggle = (id: ColumnId) => {
    const next = new Set(visible);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Choose columns"
          className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
        >
          <Columns3Cog className="size-4" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1.5">
        <p className="px-1.5 py-1 text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
          Columns
        </p>
        {OPTIONAL_COLUMNS.map((column) => (
          <label
            key={column.id}
            className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-small text-grey-800 transition-colors hover:bg-grey-100"
          >
            <Checkbox
              checked={visible.has(column.id)}
              onCheckedChange={() => toggle(column.id)}
            />
            {column.label}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}
