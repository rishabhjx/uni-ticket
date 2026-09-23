"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CalendarDayDialog } from "@/components/calendar/calendar-day-dialog";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar";
import { CalendarTimeGridView } from "@/components/calendar/calendar-time-grid-view";
import { EventDialog } from "@/components/calendar/event-dialog";
import type { CalendarEvent } from "@/lib/calendar";
import { CURRENT_USER_ID } from "@/lib/mock";
import { addDays, addMonths, isSameDay, startOfMonth, startOfWeek, TODAY, weekDays } from "@/lib/mock/dates";
import { useCalendarStore } from "@/lib/store/calendar-store";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month";

const VISIBLE_CALENDARS_KEY = "uni.calendar.visibleCalendars";
const DEFAULT_VISIBLE = [CURRENT_USER_ID];

/** Which "other calendars" are toggled on, the same useSyncExternalStore shape as useShell's sidebarOpen. */
const visibilityListeners = new Set<() => void>();
let visibilityCache: string[] | null = null;

function readVisibleUserIds(): string[] {
  try {
    const stored = window.localStorage.getItem(VISIBLE_CALENDARS_KEY);
    return stored ? (JSON.parse(stored) as string[]) : DEFAULT_VISIBLE;
  } catch {
    return DEFAULT_VISIBLE;
  }
}

function subscribeVisibility(onStoreChange: () => void) {
  visibilityListeners.add(onStoreChange);
  return () => visibilityListeners.delete(onStoreChange);
}

function getVisibilitySnapshot() {
  if (!visibilityCache) visibilityCache = readVisibleUserIds();
  return visibilityCache;
}

function getVisibilityServerSnapshot() {
  return DEFAULT_VISIBLE;
}

function writeVisibleUserIds(next: string[]) {
  visibilityCache = next;
  try {
    window.localStorage.setItem(VISIBLE_CALENDARS_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable: the toggle still works this session.
  }
  for (const listener of visibilityListeners) listener();
}

const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const dayLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const weekEndpoint = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

function labelFor(view: ViewMode, anchor: Date) {
  if (view === "month") return monthLabel.format(anchor);
  if (view === "day") return dayLabel.format(anchor);
  const [start, end] = [startOfWeek(anchor), addDays(startOfWeek(anchor), 6)];
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${start.getDate()} – ${weekEndpoint.format(end)}`
    : `${weekEndpoint.format(start)} – ${weekEndpoint.format(end)}`;
}

export function CalendarView() {
  const { events } = useCalendarStore();

  const [view, setView] = React.useState<ViewMode>("week");
  const [anchor, setAnchor] = React.useState(() => TODAY);

  const visibleList = React.useSyncExternalStore(
    subscribeVisibility,
    getVisibilitySnapshot,
    getVisibilityServerSnapshot,
  );
  const visibleUserIds = React.useMemo(() => new Set(visibleList), [visibleList]);

  const toggleUser = (userId: string) => {
    const current = getVisibilitySnapshot();
    writeVisibleUserIds(
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  };

  const visibleEvents = React.useMemo(
    () =>
      events.filter((event) =>
        [event.organizerId, ...event.attendees.map((attendee) => attendee.userId)].some((id) =>
          visibleUserIds.has(id),
        ),
      ),
    [events, visibleUserIds],
  );

  const days = view === "day" ? [anchor] : weekDays(anchor);

  const navigate = (direction: 1 | -1) => {
    setAnchor((current) => {
      if (view === "month") return addMonths(startOfMonth(current), direction);
      if (view === "week") return addDays(current, direction * 7);
      return addDays(current, direction);
    });
  };
  const goToday = () => setAnchor(TODAY);
  const isToday =
    view === "month" ? isSameDay(startOfMonth(anchor), startOfMonth(TODAY)) : isSameDay(anchor, TODAY);

  const [dialog, setDialog] = React.useState<
    | { mode: "create"; defaultStart: Date }
    | { mode: "edit"; event: CalendarEvent }
    | null
  >(null);
  const [overflowDay, setOverflowDay] = React.useState<{ day: Date; events: CalendarEvent[] } | null>(null);

  return (
    <div className="flex min-h-0 flex-1">
      <CalendarSidebar
        anchor={anchor}
        onAnchorChange={setAnchor}
        visibleUserIds={visibleUserIds}
        onToggleUser={toggleUser}
        onCreateClick={() => setDialog({ mode: "create", defaultStart: anchorWithDefaultTime(anchor) })}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="hairline-b flex items-center gap-1 px-4 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={goToday}
            disabled={isToday}
            className="flex h-7 items-center rounded-md px-2 text-small font-medium text-grey-600 transition-colors hover:bg-grey-100 hover:text-grey-900 disabled:pointer-events-none disabled:opacity-50"
          >
            Today
          </button>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Previous"
              className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              <ChevronLeft className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => navigate(1)}
              aria-label="Next"
              className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              <ChevronRight className="size-4" strokeWidth={1.75} />
            </button>
          </div>
          <span className="text-small font-medium text-grey-900">{labelFor(view, anchor)}</span>

          <div className="ml-auto flex items-center gap-0.5 rounded-md bg-grey-100 p-0.5">
            {(["day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                aria-current={view === mode ? "page" : undefined}
                className={cn(
                  "h-6 rounded-md px-2.5 text-caption font-medium capitalize transition-colors",
                  view === mode ? "bg-grey-0 text-grey-900" : "text-grey-600 hover:text-grey-900",
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {view === "month" ? (
          <CalendarMonthView
            month={anchor}
            events={visibleEvents}
            onSlotClick={(day) => setDialog({ mode: "create", defaultStart: anchorWithDefaultTime(day) })}
            onEditRequest={(event) => setDialog({ mode: "edit", event })}
            onOverflowClick={(day, dayEvents) => setOverflowDay({ day, events: dayEvents })}
          />
        ) : (
          <CalendarTimeGridView
            days={days}
            events={visibleEvents}
            onSlotClick={(start) => setDialog({ mode: "create", defaultStart: start })}
            onEditRequest={(event) => setDialog({ mode: "edit", event })}
          />
        )}
      </div>

      <EventDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        mode={dialog?.mode ?? "create"}
        event={dialog?.mode === "edit" ? dialog.event : undefined}
        defaultStart={dialog?.mode === "create" ? dialog.defaultStart : undefined}
      />

      <CalendarDayDialog
        day={overflowDay?.day ?? null}
        events={overflowDay?.events ?? []}
        onOpenChange={(open) => {
          if (!open) setOverflowDay(null);
        }}
        onEventClick={(event) => {
          setOverflowDay(null);
          setDialog({ mode: "edit", event });
        }}
      />
    </div>
  );
}

/** A day clicked with no time attached (month view, the mini picker) starts at 9am rather than midnight. */
function anchorWithDefaultTime(day: Date) {
  const start = new Date(day);
  start.setHours(9, 0, 0, 0);
  return start;
}
