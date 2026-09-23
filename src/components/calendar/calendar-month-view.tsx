"use client";

import * as React from "react";

import { EventPopover } from "@/components/calendar/event-popover";
import { personToneClass } from "@/components/tickets/user-avatar";
import { overlapsRange, type CalendarEvent } from "@/lib/calendar";
import { dayKey, isSameDay, monthGridDays, TODAY } from "@/lib/mock/dates";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_PER_DAY = 3;

const timeLabel = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit" });

export function CalendarMonthView({
  month,
  events,
  onSlotClick,
  onEditRequest,
  onOverflowClick,
}: {
  month: Date;
  events: CalendarEvent[];
  onSlotClick: (day: Date) => void;
  onEditRequest: (event: CalendarEvent) => void;
  onOverflowClick: (day: Date, dayEvents: CalendarEvent[]) => void;
}) {
  const days = React.useMemo(() => monthGridDays(month), [month]);

  const byDay = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days) {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);
      const matches = events
        .filter((event) => overlapsRange(event, dayStart, dayEnd))
        .sort((a, b) => (a.allDay === b.allDay ? a.start.localeCompare(b.start) : a.allDay ? -1 : 1));
      if (matches.length > 0) map.set(dayKey(day), matches);
    }
    return map;
  }, [days, events]);

  return (
    <div className="flex h-full min-h-0 flex-col px-4 py-3 sm:px-6">
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="pb-2 text-center text-caption font-medium text-grey-500">
            {label}
          </span>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6 overflow-hidden rounded-md border-t border-l border-grey-150">
        {days.map((date) => (
          <DayCell
            key={dayKey(date)}
            date={date}
            inMonth={date.getMonth() === month.getMonth()}
            events={byDay.get(dayKey(date)) ?? []}
            onSlotClick={onSlotClick}
            onEditRequest={onEditRequest}
            onOverflowClick={onOverflowClick}
          />
        ))}
      </div>
    </div>
  );
}

function DayCell({
  date,
  inMonth,
  events,
  onSlotClick,
  onEditRequest,
  onOverflowClick,
}: {
  date: Date;
  inMonth: boolean;
  events: CalendarEvent[];
  onSlotClick: (day: Date) => void;
  onEditRequest: (event: CalendarEvent) => void;
  onOverflowClick: (day: Date, dayEvents: CalendarEvent[]) => void;
}) {
  const today = isSameDay(date, TODAY);
  const visible = events.slice(0, MAX_VISIBLE_PER_DAY);
  const overflow = events.length - visible.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSlotClick(date)}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === "Enter") onSlotClick(date);
      }}
      className={cn(
        "flex min-h-0 min-w-0 flex-col gap-0.5 border-r border-b border-grey-150 p-1.5 text-left transition-colors hover:bg-grey-25",
        !inMonth && "bg-grey-25",
      )}
    >
      <span
        className={cn(
          "tnum self-start rounded-full px-1.5 text-caption",
          today ? "bg-accent-600 font-semibold text-grey-0" : inMonth ? "text-grey-600" : "text-grey-400",
        )}
      >
        {date.getDate()}
      </span>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
        {visible.map((event) => (
          <EventPopover key={event.id} event={event} onEdit={() => onEditRequest(event)}>
            <button
              type="button"
              onClick={(clickEvent) => clickEvent.stopPropagation()}
              className={cn(
                "flex min-w-0 items-center gap-1.5 rounded px-1 py-0.5 text-left text-caption transition-colors",
                personToneClass(event.organizerId),
              )}
            >
              {!event.allDay ? (
                <span className="tnum shrink-0 opacity-80">{timeLabel.format(new Date(event.start))}</span>
              ) : null}
              <span className="min-w-0 flex-1 truncate font-medium">{event.title}</span>
            </button>
          </EventPopover>
        ))}
        {overflow > 0 ? (
          <button
            type="button"
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onOverflowClick(date, events);
            }}
            className="rounded px-1 py-0.5 text-left text-caption text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
          >
            +{overflow} more
          </button>
        ) : null}
      </div>
    </div>
  );
}
