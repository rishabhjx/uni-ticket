"use client";

import * as React from "react";

import { Gantt } from "@/components/reui/gantt/gantt";
import type { GanttApi } from "@/components/reui/gantt/gantt";
import type {
  GanttEvent,
  GanttResource,
} from "@/components/reui/gantt/gantt-types";
import { GanttNav } from "@/components/reui/gantt/gantt-nav";
import { GanttView } from "@/components/reui/gantt/gantt-view";
import { EmptyState } from "@/components/shared/empty-state";
import { BoardSkeleton } from "@/components/shared/skeletons";
import {
  sprintsForProject,
  type Project,
  type Ticket,
} from "@/lib/mock";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";

/**
 * Each epic is a row and each of its children a bar, which is the one view
 * the board and the list cannot give you: they both answer "what state is
 * this ticket in" and neither answers "does this land before the quarter
 * ends". Tickets with no epic collect under one row rather than vanishing.
 */
const UNPARENTED = "loose";

/** A ticket only has a due date, so the bar runs from its start to that. */
function windowFor(ticket: Ticket): { start: Date; end: Date } {
  const created = new Date(ticket.createdAt);
  const due = ticket.dueAt ? new Date(ticket.dueAt) : null;

  if (due && due > created) return { start: created, end: due };

  // No due date, or one already behind its creation: show the work that has
  // actually happened rather than inventing a plan. A same-day bar would be
  // invisible, so it gets a day of width.
  const day = 86_400_000;
  const touched = new Date(ticket.updatedAt).getTime();
  return {
    start: created,
    end: new Date(Math.max(touched, created.getTime() + day)),
  };
}

const BAR_COLOUR: Record<string, string> = {
  backlog: "var(--status-backlog-fg)",
  todo: "var(--status-todo-fg)",
  in_progress: "var(--status-progress-fg)",
  in_review: "var(--status-review-fg)",
  resolved: "var(--status-resolved-fg)",
  done: "var(--status-done-fg)",
};

export function RoadmapView({ project }: { project: Project }) {
  const { tickets, isLoading } = useTicketStore();
  const { openTicket } = useTicketPanel();
  const api = React.useRef<GanttApi<Ticket> | null>(null);

  const scoped = React.useMemo(
    () => tickets.filter((ticket) => ticket.projectId === project.id),
    [tickets, project.id],
  );

  const { resources, events } = React.useMemo(() => {
    const epics = scoped.filter((ticket) => ticket.type === "epic");
    const epicIds = new Set(epics.map((epic) => epic.id));

    const rows: GanttResource[] = epics.map((epic) => ({
      id: epic.id,
      title: `${epic.key} · ${epic.title}`,
      color: BAR_COLOUR[epic.status],
    }));

    const children = scoped.filter((ticket) => ticket.type !== "epic");
    const loose = children.filter(
      (ticket) => ticket.parentId === null || !epicIds.has(ticket.parentId),
    );
    if (loose.length > 0) {
      rows.push({ id: UNPARENTED, title: "Not under an epic" });
    }

    const bars: GanttEvent<Ticket>[] = children.map((ticket) => {
      const { start, end } = windowFor(ticket);
      return {
        id: ticket.id,
        title: `${ticket.key} · ${ticket.title}`,
        start,
        end,
        allDay: true,
        color: BAR_COLOUR[ticket.status],
        resourceId:
          ticket.parentId && epicIds.has(ticket.parentId)
            ? ticket.parentId
            : UNPARENTED,
        data: ticket,
      };
    });

    return { resources: rows, events: bars };
  }, [scoped]);

  /**
   * The running sprint is drawn as a baseline band behind every row rather
   * than as a row of its own: a cycle is a window work is measured against,
   * and giving it a row would double the height of the chart to say it.
   */
  const cycle = React.useMemo(() => {
    const active = sprintsForProject(project.id).find(
      (sprint) => sprint.state === "active",
    );
    return active
      ? { start: new Date(active.startsOn), end: new Date(active.endsOn) }
      : null;
  }, [project.id]);

  const withBaselines = React.useMemo(
    () =>
      cycle
        ? resources.map((row) => ({
            ...row,
            baselineStart: cycle.start,
            baselineEnd: cycle.end,
          }))
        : resources,
    [resources, cycle],
  );

  /*
   * The timeline scrolls infinitely either side of its anchor and opens well
   * behind today - 718px into a 5120px track, which lands in May. Nobody opens
   * a roadmap to look at May, so press Today for them.
   *
   * Two frames, not zero: the api exists as soon as the provider mounts, but
   * `today()` scrolls a viewport the view has not measured yet, so calling it
   * synchronously is a no-op. One frame gets the pane laid out, the second
   * gets its width committed.
   */
  const ready = !isLoading && events.length > 0;
  React.useEffect(() => {
    if (!ready) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => api.current?.today());
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [ready]);

  if (isLoading) return <BoardSkeleton />;

  if (events.length === 0) {
    return (
      <EmptyState
        emoji="🗓️"
        title="Nothing to schedule yet"
        description={`No tickets in ${project.name} carry dates, so there is no roadmap to draw.`}
      />
    );
  }

  return (
    <Gantt
      /*
       * The timeline scrolls infinitely either side of its anchor and opens at
       * the left edge of what it has rendered, which is weeks behind today.
       * Nobody opens a roadmap to look at April, so jump to now on mount.
       */
      apiRef={api}
      events={events}
      resources={withBaselines}
      // Quarter, not week or month. A bar runs from a ticket's creation to
      // its due date, which is usually weeks, so a day-column scale starts
      // almost every bar off the left edge and shows no labels at all.
      defaultScale="quarter"
      // Epic titles are long; the default 288px panel cut most of them at the
      // key. Still draggable, this is only where it starts.
      treePanel={{ width: 380, nameColumnWidth: 340 }}
      weekStartsOn={1}
      /*
       * Read-only. A bar's dates come from createdAt and dueAt, so letting
       * someone drag one would silently rewrite a field the rest of the app
       * treats as fact — the panel's date picker is where a due date changes.
       */
      defaultInteractions={{ drag: false, resize: false, selectSlot: false }}
      // The callback hands back an occurrence, not the event: a recurring
      // series has many of the former per one of the latter.
      onEventClick={(occurrence) => {
        const ticket = occurrence.event.data;
        if (ticket) openTicket(ticket.key);
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* GanttNav already composes Today, the scale switcher, prev/next and
          the title; adding those again beside it printed the date range and
          the scale menu twice. */}
      <GanttNav className="px-4 py-2.5 sm:px-6" />
      <GanttView className="min-h-0 flex-1" />
    </Gantt>
  );
}
