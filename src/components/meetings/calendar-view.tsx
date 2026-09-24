"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { MEETING_KIND_ICON } from "@/components/meetings/meeting-icon";
import { formatTime } from "@/lib/format";
import { getProject, meetingStatus, startOfWeek, TODAY, type Meeting } from "@/lib/mock";
import { cn } from "@/lib/utils";

/** The window a day column draws — wide enough for everything the seed data
 * schedules (9am standups through 4:30pm 1:1s), with an hour of air either
 * side so nothing touches the grid's edge. */
const GRID_START_HOUR = 7;
const GRID_END_HOUR = 19;
const HOUR_HEIGHT = 56;
const GRID_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT;

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", { month: "short" });
const RANGE_MONTH_YEAR = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minutesSinceGridStart(date: Date) {
  return (date.getHours() - GRID_START_HOUR) * 60 + date.getMinutes();
}

/**
 * Greedy lane packing, per overlap CLUSTER rather than for the whole day: a
 * 9am standup and a 3pm review never touch, so sizing both against the
 * day's peak concurrency squeezed every block on a busy day into a sliver,
 * whether or not it actually overlapped anything. A cluster breaks wherever
 * a meeting starts at or after every earlier meeting has already ended.
 */
function layoutDay(dayMeetings: Meeting[]) {
  const sorted = [...dayMeetings].sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
  );

  const placed: { meeting: Meeting; lane: number; totalLanes: number }[] = [];
  let cluster: { meeting: Meeting; start: number; end: number }[] = [];
  let clusterEnd = -Infinity;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const laneEndsAt: number[] = [];
    const withLanes = cluster.map(({ meeting, start, end }) => {
      let lane = laneEndsAt.findIndex((endsAt) => endsAt <= start);
      if (lane === -1) {
        lane = laneEndsAt.length;
        laneEndsAt.push(end);
      } else {
        laneEndsAt[lane] = end;
      }
      return { meeting, lane };
    });
    const totalLanes = Math.max(laneEndsAt.length, 1);
    for (const { meeting, lane } of withLanes) {
      placed.push({ meeting, lane, totalLanes });
    }
    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const meeting of sorted) {
    const start = Date.parse(meeting.startsAt);
    const end = Date.parse(meeting.endsAt);
    if (start >= clusterEnd) flushCluster();
    cluster.push({ meeting, start, end });
    clusterEnd = Math.max(clusterEnd, end);
  }
  flushCluster();

  return placed;
}

function MeetingBlock({
  meeting,
  lane,
  totalLanes,
  onOpen,
}: {
  meeting: Meeting;
  lane: number;
  totalLanes: number;
  onOpen: () => void;
}) {
  const start = new Date(meeting.startsAt);
  const end = new Date(meeting.endsAt);
  const rawTop = (minutesSinceGridStart(start) / 60) * HOUR_HEIGHT;
  const durationMinutes = Math.max(
    (end.getTime() - start.getTime()) / 60_000,
    15,
  );
  const rawHeight = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 22);
  // A meeting before GRID_START_HOUR or after GRID_END_HOUR would otherwise
  // draw with a negative top (behind the sticky day header) or past the
  // bottom of the grid, both unreachable. Clamped into the visible grid, it
  // stays a click away instead of vanishing off either edge.
  const top = Math.min(Math.max(rawTop, 0), GRID_HEIGHT - 4);
  const height = Math.min(rawHeight, GRID_HEIGHT - top);
  const timeRange = `${formatTime(meeting.startsAt)} – ${formatTime(meeting.endsAt)}`;
  const status = meetingStatus(meeting);
  const Icon = MEETING_KIND_ICON[meeting.kind];
  const project = meeting.projectId ? getProject(meeting.projectId) : undefined;
  const short = height < 40;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${meeting.title}, ${timeRange}${status === "cancelled" ? ", cancelled" : ""}`}
      style={{
        top,
        height,
        left: `calc(${(lane / totalLanes) * 100}% + 2px)`,
        width: `calc(${100 / totalLanes}% - 4px)`,
        minWidth: 46,
      }}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-md border px-1.5 py-1 text-left transition-colors",
        status === "cancelled"
          ? "border-dashed border-grey-200 bg-grey-50 text-grey-500 opacity-70"
          : status === "live"
            ? "border-accent-500 bg-accent-50 text-accent-700 hover:border-accent-600"
            : "border-grey-200 bg-grey-100 text-grey-800 hover:border-grey-300",
      )}
    >
      <span className="flex min-w-0 items-center gap-1">
        <Icon className="size-3 shrink-0" strokeWidth={1.75} />
        <span
          className={cn(
            "min-w-0 truncate text-caption font-medium",
            status === "cancelled" && "line-through",
          )}
        >
          {meeting.title}
        </span>
      </span>
      {!short ? (
        <span className="truncate text-[10px] text-current opacity-80">
          {timeRange}
          {project ? ` · ${project.name}` : ""}
        </span>
      ) : null}
    </button>
  );
}

export function CalendarView({
  meetings,
  onOpenDetail,
}: {
  meetings: Meeting[];
  onOpenDetail: (id: string) => void;
}) {
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(TODAY));

  const days = React.useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const byDay = React.useMemo(() => {
    const buckets = days.map((day) =>
      meetings.filter((meeting) => isSameDay(new Date(meeting.startsAt), day)),
    );
    return buckets.map(layoutDay);
  }, [meetings, days]);

  const rangeLabel = React.useMemo(() => {
    const start = days[0];
    const end = days[6];
    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = sameMonth
      ? `${start.getDate()}`
      : `${MONTH_LABEL.format(start)} ${start.getDate()}`;
    return `${startLabel} – ${MONTH_LABEL.format(end)} ${end.getDate()}, ${end.getFullYear()}`;
  }, [days]);

  const now = new Date();
  const nowOffset =
    now >= days[0] && now < addDays(days[6], 1)
      ? (minutesSinceGridStart(now) / 60) * HOUR_HEIGHT
      : null;

  const hours = Array.from(
    { length: GRID_END_HOUR - GRID_START_HOUR },
    (_, index) => GRID_START_HOUR + index,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="hairline-b flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6">
        <button
          type="button"
          onClick={() => setWeekStart(startOfWeek(TODAY))}
          className="flex h-7 items-center rounded-md border border-grey-200 px-2.5 text-small font-medium text-grey-700 transition-colors hover:border-grey-300 hover:text-grey-900"
        >
          Today
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => setWeekStart((current) => addDays(current, -7))}
            className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => setWeekStart((current) => addDays(current, 7))}
            className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
          >
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </button>
        </div>
        <h2 className="text-heading font-semibold text-grey-900">{rangeLabel}</h2>
        <span className="text-caption text-grey-500">{RANGE_MONTH_YEAR.format(days[0])}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid grid-cols-[56px_repeat(7,minmax(120px,1fr))]">
          {/* Day headers, sticky so they stay put while the hours scroll. */}
          <div className="glass hairline-b sticky top-0 z-10" />
          {days.map((day) => {
            const today = isSameDay(day, TODAY);
            return (
              <div
                key={day.toISOString()}
                className="glass hairline-b hairline-l sticky top-0 z-10 flex flex-col items-center gap-0.5 py-2"
              >
                <span className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
                  {DAY_LABEL.format(day)}
                </span>
                <span
                  className={cn(
                    "tnum flex size-6 items-center justify-center rounded-full text-small font-semibold",
                    today ? "bg-accent-600 text-grey-0" : "text-grey-800",
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
            );
          })}

          {/* Time gutter */}
          <div className="relative" style={{ height: GRID_HEIGHT }}>
            {hours.map((hour) => (
              <span
                key={hour}
                style={{ top: (hour - GRID_START_HOUR) * HOUR_HEIGHT - 6 }}
                className="tnum absolute right-2 text-[10px] text-grey-500"
              >
                {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </span>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIndex) => {
            const today = isSameDay(day, TODAY);
            return (
              <div
                key={day.toISOString()}
                className="hairline-l relative"
                style={{ height: GRID_HEIGHT }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="hairline-b absolute inset-x-0"
                    style={{ top: (hour - GRID_START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  />
                ))}
                {today && nowOffset !== null ? (
                  <div
                    aria-hidden
                    className="absolute inset-x-0 z-[5] flex items-center gap-1"
                    style={{ top: nowOffset }}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-[color:var(--danger)]" />
                    <span className="h-px flex-1 bg-[color:var(--danger)]" />
                  </div>
                ) : null}
                {byDay[dayIndex].map(({ meeting, lane, totalLanes }) => (
                  <MeetingBlock
                    key={meeting.id}
                    meeting={meeting}
                    lane={lane}
                    totalLanes={totalLanes}
                    onOpen={() => onOpenDetail(meeting.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
