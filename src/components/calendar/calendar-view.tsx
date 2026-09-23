"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CalendarDayDialog } from "@/components/calendar/calendar-day-dialog";
import { FilterBar } from "@/components/list/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarSkeleton } from "@/components/shared/skeletons";
import { StatusDot, TypeIcon } from "@/components/tickets/badges";
import {
  addMonths,
  dayKey,
  isOverdue,
  isSameDay,
  monthGridDays,
  startOfMonth,
  TODAY,
  type Project,
  type Ticket,
} from "@/lib/mock";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { applyFilters, useViewState } from "@/lib/store/view-state";
import { cn } from "@/lib/utils";

const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_PER_DAY = 3;

type PaneKey = "a" | "b";

export function CalendarView({ project }: { project: Project }) {
  const { tickets, isLoading } = useTicketStore();
  const { openTicket } = useTicketPanel();
  const { filters, clearFilters } = useViewState();

  const scoped = React.useMemo(
    () => tickets.filter((ticket) => ticket.projectId === project.id),
    [tickets, project.id],
  );
  const filtered = React.useMemo(
    () => applyFilters(scoped, filters),
    [scoped, filters],
  );
  const dated = React.useMemo(
    () => filtered.filter((ticket) => ticket.dueAt !== null),
    [filtered],
  );

  const byDay = React.useMemo(() => {
    const map = new Map<string, Ticket[]>();
    for (const ticket of dated) {
      // dated only keeps tickets with a dueAt, so the assertion holds.
      const key = dayKey(new Date(ticket.dueAt as string));
      const list = map.get(key);
      if (list) list.push(ticket);
      else map.set(key, [ticket]);
    }
    return map;
  }, [dated]);

  /*
   * Two panes, ping-ponged: transitions.dev's page-side-by-side recipe is
   * written for exactly two named panels (id 1 exits/enters left, id 2
   * exits/enters right), toggled by one data-page attribute. Month
   * navigation is unbounded, so each step re-assigns which physical pane is
   * "1" and which is "2" — the outgoing pane always takes the id matching
   * the direction just navigated, the incoming (currently hidden) pane
   * takes the other, and its content is swapped to the new month before the
   * flip. That keeps every consecutive click in the same direction sliding
   * the same way, rather than alternating forward/back after the first one.
   */
  const initialMonth = React.useMemo(() => startOfMonth(TODAY), []);
  const [panes, setPanes] = React.useState<Record<PaneKey, Date>>({
    a: initialMonth,
    b: initialMonth,
  });
  const [visiblePane, setVisiblePane] = React.useState<PaneKey>("a");
  const [pageIds, setPageIds] = React.useState<Record<PaneKey, 1 | 2>>({
    a: 1,
    b: 2,
  });
  const [dataPage, setDataPage] = React.useState<1 | 2>(1);

  const currentMonth = panes[visiblePane];

  const navigate = React.useCallback(
    (direction: 1 | -1) => {
      const hidden: PaneKey = visiblePane === "a" ? "b" : "a";
      const enteringId = direction === 1 ? 2 : 1;
      const exitingId = direction === 1 ? 1 : 2;
      setPanes((current) => ({
        ...current,
        [hidden]: addMonths(current[visiblePane], direction),
      }));
      setPageIds({ [visiblePane]: exitingId, [hidden]: enteringId } as Record<
        PaneKey,
        1 | 2
      >);
      setDataPage(enteringId);
      setVisiblePane(hidden);
    },
    [visiblePane],
  );

  const isCurrentMonth = isSameDay(
    startOfMonth(TODAY),
    startOfMonth(currentMonth),
  );
  const goToday = React.useCallback(() => {
    setPanes((current) => ({ ...current, [visiblePane]: startOfMonth(TODAY) }));
  }, [visiblePane]);

  const [openDay, setOpenDay] = React.useState<Date | null>(null);

  if (isLoading) return <CalendarSkeleton />;

  return (
    <>
      <FilterBar
        project={project}
        resultCount={dated.length}
        totalCount={scoped.length}
        extra={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToday}
              disabled={isCurrentMonth}
              className="flex h-7 items-center rounded-md px-2 text-small font-medium text-grey-600 transition-colors hover:bg-grey-100 hover:text-grey-900 disabled:pointer-events-none disabled:opacity-50"
            >
              Today
            </button>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Previous month"
                className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
              >
                <ChevronLeft className="size-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => navigate(1)}
                aria-label="Next month"
                className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
              >
                <ChevronRight className="size-4" strokeWidth={1.75} />
              </button>
            </div>
            <span className="tnum min-w-[124px] text-small font-medium text-grey-900">
              {MONTH_LABEL.format(currentMonth)}
            </span>
          </div>
        }
      />

      {scoped.length === 0 ? (
        <EmptyState
          emoji="🗓️"
          title="This calendar is empty"
          description={`Nothing in ${project.name} yet. The first ticket you add can carry a due date.`}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="No tickets match these filters"
          description={`All ${scoped.length} tickets in ${project.name} are hidden by the conditions you have set.`}
          action={{ label: "Clear filters", onClick: clearFilters }}
        />
      ) : dated.length === 0 ? (
        <EmptyState
          emoji="🗓️"
          title="Nothing carries a due date"
          description={`${filtered.length} ticket${filtered.length === 1 ? "" : "s"} match, but none has a due date to place on a calendar.`}
        />
      ) : (
        <div
          className="t-page-slide relative min-h-0 flex-1"
          data-page={dataPage}
        >
          {(["a", "b"] as const).map((pane) => (
            <div
              key={pane}
              className="t-page"
              data-page-id={pageIds[pane]}
              inert={pane !== visiblePane}
            >
              <MonthGrid
                month={panes[pane]}
                byDay={byDay}
                onOpenTicket={openTicket}
                onOpenDay={setOpenDay}
              />
            </div>
          ))}
        </div>
      )}

      <CalendarDayDialog
        day={openDay}
        tickets={openDay ? (byDay.get(dayKey(openDay)) ?? []) : []}
        onOpenChange={(open) => {
          if (!open) setOpenDay(null);
        }}
        onOpenTicket={openTicket}
      />
    </>
  );
}

function MonthGrid({
  month,
  byDay,
  onOpenTicket,
  onOpenDay,
}: {
  month: Date;
  byDay: Map<string, Ticket[]>;
  onOpenTicket: (ticketKey: string) => void;
  onOpenDay: (day: Date) => void;
}) {
  const days = React.useMemo(() => monthGridDays(month), [month]);

  return (
    <div className="flex h-full min-h-0 flex-col px-4 py-3 sm:px-6">
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="pb-2 text-center text-caption font-medium text-grey-500"
          >
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
            tickets={byDay.get(dayKey(date)) ?? []}
            onOpenTicket={onOpenTicket}
            onOpenDay={onOpenDay}
          />
        ))}
      </div>
    </div>
  );
}

function DayCell({
  date,
  inMonth,
  tickets,
  onOpenTicket,
  onOpenDay,
}: {
  date: Date;
  inMonth: boolean;
  tickets: Ticket[];
  onOpenTicket: (ticketKey: string) => void;
  onOpenDay: (day: Date) => void;
}) {
  const today = isSameDay(date, TODAY);
  const visible = tickets.slice(0, MAX_VISIBLE_PER_DAY);
  const overflow = tickets.length - visible.length;

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col gap-0.5 border-r border-b border-grey-150 p-1.5",
        !inMonth && "bg-grey-25",
      )}
    >
      <span
        className={cn(
          "tnum self-start rounded-full px-1.5 text-caption",
          today
            ? "bg-accent-600 font-semibold text-grey-0"
            : inMonth
              ? "text-grey-600"
              : "text-grey-400",
        )}
      >
        {date.getDate()}
      </span>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
        {visible.map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            onClick={() => onOpenTicket(ticket.key)}
            className="flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:bg-grey-100"
          >
            <StatusDot status={ticket.status} />
            <TypeIcon type={ticket.type} className="size-3 shrink-0" />
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-caption",
                isOverdue(ticket) ? "text-[var(--priority-urgent-fg)]" : "text-grey-700",
              )}
            >
              {ticket.title}
            </span>
          </button>
        ))}
        {overflow > 0 ? (
          <button
            type="button"
            onClick={() => onOpenDay(date)}
            className="rounded px-1 py-0.5 text-left text-caption text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
          >
            +{overflow} more
          </button>
        ) : null}
      </div>
    </div>
  );
}
