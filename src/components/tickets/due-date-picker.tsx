"use client";

import * as React from "react";

import {
  DateSelector,
  type DateSelectorValue,
} from "@/components/reui/date-selector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDueDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The due date used to be read-only in the panel, which meant the one field
 * people most often want to push by a day was the one they could not touch
 * without reopening the ticket somewhere else.
 *
 * ReUI's DateSelector can also do ranges, quarters and before/after operators;
 * none of that applies to a single deadline, so it is pinned to a day and a
 * single month. Five o'clock is the implied hour - a ticket due "Friday" is
 * not due at midnight, and picking a time for every ticket is a tax nobody
 * pays willingly.
 */
export function DueDatePicker({
  value,
  onChange,
  overdue,
  className,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  overdue?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo<DateSelectorValue>(
    () => ({
      period: "day",
      operator: "is",
      startDate: value ? new Date(value) : undefined,
    }),
    [value],
  );

  const year = new Date().getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Due date"
          className={cn(
            "flex h-7 w-full items-center rounded-md px-1.5 text-left text-small transition-colors hover:bg-grey-100 data-[state=open]:bg-grey-100",
            value ? "text-grey-700" : "text-grey-400",
            className,
          )}
          style={
            value && overdue ? { color: "var(--priority-urgent-fg)" } : undefined
          }
        >
          {value ? (
            <>
              {formatDueDate(value)}
              {overdue ? " · overdue" : ""}
            </>
          ) : (
            "Set a due date"
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <DateSelector
          value={selected}
          onChange={(next) => {
            onChange(
              next.startDate
                ? new Date(
                    next.startDate.getFullYear(),
                    next.startDate.getMonth(),
                    next.startDate.getDate(),
                    17,
                  ).toISOString()
                : null,
            );
            setOpen(false);
          }}
          allowRange={false}
          periodTypes={["day"]}
          defaultPeriodType="day"
          showTwoMonths={false}
          dayDateFormat="dd/MM/yyyy"
          weekStartsOn={1}
          // The component's own default stops at 2026, which would put next
          // year's deadlines out of reach.
          minYear={year - 2}
          maxYear={year + 3}
        />
        {value ? (
          <div className="border-t border-grey-200 p-2">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="h-7 w-full rounded-md text-small text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              Clear the due date
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
