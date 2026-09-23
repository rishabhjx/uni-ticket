"use client";

import * as React from "react";

import { EventPopover } from "@/components/calendar/event-popover";
import { personToneClass } from "@/components/tickets/user-avatar";
import { layoutOverlaps, overlapsRange, type CalendarEvent } from "@/lib/calendar";
import { addDays, dayKey, isSameDay, TODAY } from "@/lib/mock/dates";
import { cn } from "@/lib/utils";

const HOUR_HEIGHT = 48;
const MIN_BLOCK_HEIGHT = 18;
const DAY_MINUTES = 24 * 60;

const dayHeaderLabel = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric" });
const hourLabel = (hour: number) => {
  if (hour === 0) return "";
  const period = hour < 12 ? "AM" : "PM";
  const value = hour % 12 === 0 ? 12 : hour % 12;
  return `${value} ${period}`;
};
const timeLabel = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit" });

function minutesSinceMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function CalendarTimeGridView({
  days,
  events,
  onSlotClick,
  onEditRequest,
}: {
  days: Date[];
  events: CalendarEvent[];
  onSlotClick: (start: Date) => void;
  onEditRequest: (event: CalendarEvent) => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const rangeStart = days[0];

  const allDayByDay = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days) {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = addDays(dayStart, 1);
      const matches = events.filter((event) => event.allDay && overlapsRange(event, dayStart, dayEnd));
      if (matches.length > 0) map.set(dayKey(day), matches);
    }
    return map;
  }, [days, events]);

  const timedByDay = React.useMemo(() => {
    const map = new Map<string, { event: CalendarEvent; top: number; height: number; column: number; columns: number }[]>();
    for (const day of days) {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = addDays(dayStart, 1);
      const dayEvents = events.filter((event) => !event.allDay && overlapsRange(event, dayStart, dayEnd));

      const spans = dayEvents.map((event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const startMinutes = start < dayStart ? 0 : minutesSinceMidnight(start);
        const endMinutes = end > dayEnd ? DAY_MINUTES : minutesSinceMidnight(end);
        return { id: event.id, start: startMinutes, end: Math.max(endMinutes, startMinutes + 15) };
      });
      const layout = layoutOverlaps(spans);

      map.set(
        dayKey(day),
        dayEvents.map((event) => {
          const span = spans.find((item) => item.id === event.id)!;
          const placement = layout.get(event.id) ?? { column: 0, columns: 1 };
          return {
            event,
            top: (span.start / 60) * HOUR_HEIGHT,
            height: Math.max(MIN_BLOCK_HEIGHT, ((span.end - span.start) / 60) * HOUR_HEIGHT),
            column: placement.column,
            columns: placement.columns,
          };
        }),
      );
    }
    return map;
  }, [days, events]);

  // Business hours start the scroll position, not the top of the grid.
  const rangeStartTime = rangeStart.getTime();
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 7 * HOUR_HEIGHT });
  }, [rangeStartTime]);

  const now = new Date();
  const todayIndex = days.findIndex((day) => isSameDay(day, TODAY));
  const nowTop = (minutesSinceMidnight(now) / 60) * HOUR_HEIGHT;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="hairline-b flex">
        <div className="w-14 shrink-0" />
        {days.map((day) => (
          <div key={dayKey(day)} className="flex flex-1 flex-col items-center gap-0.5 py-1.5">
            <span className="text-caption font-medium text-grey-500">
              {dayHeaderLabel.format(day).split(" ")[0]}
            </span>
            <span
              className={cn(
                "tnum flex size-6 items-center justify-center rounded-full text-small font-medium",
                isSameDay(day, TODAY) ? "bg-accent-600 text-grey-0" : "text-grey-900",
              )}
            >
              {day.getDate()}
            </span>
          </div>
        ))}
      </div>

      {allDayByDay.size > 0 ? (
        <div className="hairline-b flex min-h-8 items-stretch py-1">
          <div className="flex w-14 shrink-0 items-center justify-end pr-2 text-caption text-grey-400">
            All day
          </div>
          {days.map((day) => (
            <div key={dayKey(day)} className="flex flex-1 flex-col gap-0.5 px-1">
              {(allDayByDay.get(dayKey(day)) ?? []).map((event) => (
                <EventPopover key={event.id} event={event} onEdit={() => onEditRequest(event)}>
                  <button
                    type="button"
                    className={cn(
                      "truncate rounded px-1.5 py-0.5 text-left text-caption font-medium",
                      personToneClass(event.organizerId),
                    )}
                  >
                    {event.title}
                  </button>
                </EventPopover>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative flex" style={{ height: 24 * HOUR_HEIGHT }}>
          <div className="w-14 shrink-0">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} style={{ height: HOUR_HEIGHT }} className="relative">
                <span className="absolute -top-2 right-2 text-caption text-grey-400">{hourLabel(hour)}</span>
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => (
            <div key={dayKey(day)} className="relative flex-1 border-l border-grey-150">
              {Array.from({ length: 24 }, (_, hour) => (
                <React.Fragment key={hour}>
                  <button
                    type="button"
                    onClick={() => {
                      const start = new Date(day);
                      start.setHours(hour, 0, 0, 0);
                      onSlotClick(start);
                    }}
                    style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT / 2 }}
                    className="absolute inset-x-0 border-t border-grey-100 outline-none transition-colors hover:bg-grey-50 focus-visible:bg-grey-100"
                    aria-label={`Create an event at ${hour}:00`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const start = new Date(day);
                      start.setHours(hour, 30, 0, 0);
                      onSlotClick(start);
                    }}
                    style={{ top: hour * HOUR_HEIGHT + HOUR_HEIGHT / 2, height: HOUR_HEIGHT / 2 }}
                    className="absolute inset-x-0 outline-none transition-colors hover:bg-grey-50 focus-visible:bg-grey-100"
                    aria-label={`Create an event at ${hour}:30`}
                  />
                </React.Fragment>
              ))}

              {(timedByDay.get(dayKey(day)) ?? []).map(({ event, top, height, column, columns }) => (
                <EventPopover key={event.id} event={event} onEdit={() => onEditRequest(event)}>
                  <button
                    type="button"
                    style={{
                      top,
                      height,
                      left: `calc(${(column / columns) * 100}% + 2px)`,
                      width: `calc(${100 / columns}% - 4px)`,
                    }}
                    className={cn(
                      "absolute z-10 overflow-hidden rounded px-1.5 py-0.5 text-left text-caption shadow-sm ring-1 ring-grey-0/40",
                      personToneClass(event.organizerId),
                    )}
                  >
                    <span className="block truncate font-medium">{event.title}</span>
                    {height > 32 ? (
                      <span className="block truncate opacity-80">{timeLabel.format(new Date(event.start))}</span>
                    ) : null}
                  </button>
                </EventPopover>
              ))}

              {dayIndex === todayIndex ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 z-20 h-px bg-[var(--priority-urgent-fg)]"
                  style={{ top: nowTop }}
                >
                  <span className="absolute top-1/2 left-0 size-1.5 -translate-y-1/2 rounded-full bg-[var(--priority-urgent-fg)]" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
