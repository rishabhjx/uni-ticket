import { dataset } from "./dataset";
import { daysFromToday } from "./dates";
import { projects } from "./projects";
import { createRandom } from "./random";
import { activeSprint, sprintsForProject } from "./sprints";
import type { Meeting } from "./types";
import { CURRENT_USER_ID, reporteeIds, users } from "./users";

const SEED = 20260919 + 41;
const random = createRandom(SEED);

function at(dayOffset: number, hour: number, minute = 0) {
  return daysFromToday(dayOffset, hour * 60 + minute).toISOString();
}

let seq = 0;
function nextId() {
  seq += 1;
  return `meet-${seq}`;
}

const draft: Meeting[] = [];

// Daily standup, one project at a time so the calendar does not collapse into
// a wall of identical 15-minute blocks — each project's is offset by ten
// minutes, the way a real team's actually are so nobody double-books.
projects
  .filter((project) => project.kind === "software")
  .forEach((project, index) => {
    const hour = 9;
    const minute = index * 10;
    draft.push({
      id: nextId(),
      title: `${project.name} standup`,
      kind: "standup",
      organizerId: project.leadId,
      attendeeIds: project.memberIds,
      projectId: project.id,
      sprintId: activeSprint(project.id)?.id ?? null,
      ticketRefs: [],
      startsAt: at(0, hour, minute),
      endsAt: at(0, hour, minute + 15),
      recurring: "daily",
      notes: "What shipped, what's blocked, what's next.",
      cancelled: false,
    });
  });

// Sprint planning and review, tied to each project's real sprint dates.
projects
  .filter((project) => project.kind === "software")
  .forEach((project) => {
    for (const sprint of sprintsForProject(project.id)) {
      const startDay = Math.round(
        (Date.parse(sprint.startsOn) - Date.parse(new Date().toISOString())) /
          86_400_000,
      );
      const endDay = Math.round(
        (Date.parse(sprint.endsOn) - Date.parse(new Date().toISOString())) /
          86_400_000,
      );
      draft.push({
        id: nextId(),
        title: `${project.name} — ${sprint.name} planning`,
        kind: "planning",
        organizerId: project.leadId,
        attendeeIds: project.memberIds,
        projectId: project.id,
        sprintId: sprint.id,
        ticketRefs: [],
        startsAt: at(startDay, 10, 0),
        endsAt: at(startDay, 11, 0),
        recurring: "none",
        notes: `Plan the work for ${sprint.name}.`,
        cancelled: false,
      });
      draft.push({
        id: nextId(),
        title: `${project.name} — ${sprint.name} review`,
        kind: "review",
        organizerId: project.leadId,
        attendeeIds: project.memberIds,
        projectId: project.id,
        sprintId: sprint.id,
        ticketRefs: [],
        startsAt: at(endDay, 15, 0),
        endsAt: at(endDay, 16, 0),
        recurring: "none",
        notes: `Demo what shipped in ${sprint.name}.`,
        cancelled: false,
      });
    }
  });

// Weekly cross-team leads sync.
[-14, -7, 0, 7].forEach((offset) => {
  draft.push({
    id: nextId(),
    title: "Eng leads sync",
    kind: "sync",
    organizerId: "u-3",
    attendeeIds: ["u-1", "u-2", "u-3", "u-5", "u-6", "u-7"],
    projectId: null,
    sprintId: null,
    ticketRefs: [],
    startsAt: at(offset, 13, 0),
    endsAt: at(offset, 13, 30),
    recurring: "weekly",
    notes: "Cross-project blockers and headcount.",
    cancelled: offset === -7,
  });
});

// 1:1s — with the manager, and with each reportee.
const oneOnOnePartners = ["u-3", ...reporteeIds(CURRENT_USER_ID)];
oneOnOnePartners.forEach((partnerId, index) => {
  [-7, 0, 7].forEach((offset, weekIndex) => {
    draft.push({
      id: nextId(),
      title: `1:1 — ${users.find((u) => u.id === partnerId)?.name ?? "Teammate"}`,
      kind: "one_on_one",
      organizerId: CURRENT_USER_ID,
      attendeeIds: [CURRENT_USER_ID, partnerId],
      projectId: null,
      sprintId: null,
      ticketRefs: [],
      startsAt: at(offset + index, 14 + weekIndex, 0),
      endsAt: at(offset + index, 14 + weekIndex, 30),
      recurring: "weekly",
      notes: "",
      cancelled: false,
    });
  });
});

// Incident reviews, linked to a real S1/S2 ticket — this is the module's
// clearest cross-link: opening the ticket should show this meeting.
const severeTickets = random.sample(
  dataset.tickets.filter((ticket) => ticket.severity === "s1" || ticket.severity === "s2"),
  3,
);
severeTickets.forEach((ticket, index) => {
  const project = projects.find((item) => item.id === ticket.projectId);
  draft.push({
    id: nextId(),
    title: `Incident review — ${ticket.key}`,
    kind: "review",
    organizerId: project?.leadId ?? CURRENT_USER_ID,
    attendeeIds: project?.memberIds ?? [CURRENT_USER_ID],
    projectId: ticket.projectId,
    sprintId: null,
    ticketRefs: [ticket.key],
    startsAt: at(-3 - index * 2, 11, 0),
    endsAt: at(-3 - index * 2, 11, 30),
    recurring: "none",
    notes: `Root cause and follow-up actions for ${ticket.key}.`,
    cancelled: false,
  });
});

// A couple of one-off interviews, to round out the calendar with something
// that has nothing to do with a ticket at all.
["Backend Engineer — onsite", "Staff Designer — panel"].forEach((title, index) => {
  draft.push({
    id: nextId(),
    title,
    kind: "interview",
    organizerId: "u-3",
    attendeeIds: random.sample(users.map((u) => u.id), 3),
    projectId: null,
    sprintId: null,
    ticketRefs: [],
    startsAt: at(2 + index * 3, 10, 0),
    endsAt: at(2 + index * 3, 11, 0),
    recurring: "none",
    notes: "",
    cancelled: false,
  });
});

export const meetings: Meeting[] = draft.sort((a, b) =>
  a.startsAt.localeCompare(b.startsAt),
);

export const meetingsById = new Map(meetings.map((meeting) => [meeting.id, meeting]));

export function getMeeting(id: string | null | undefined) {
  return id ? meetingsById.get(id) : undefined;
}

export function meetingsForUser(userId: string = CURRENT_USER_ID) {
  return meetings.filter((meeting) => meeting.attendeeIds.includes(userId));
}

export type MeetingStatus = "live" | "upcoming" | "past" | "cancelled";

export function meetingStatus(meeting: Meeting, now: Date = new Date()): MeetingStatus {
  if (meeting.cancelled) return "cancelled";
  const start = Date.parse(meeting.startsAt);
  const end = Date.parse(meeting.endsAt);
  const nowMs = now.getTime();
  if (nowMs >= start && nowMs <= end) return "live";
  if (nowMs < start) return "upcoming";
  return "past";
}

export function upcomingMeetings(userId: string = CURRENT_USER_ID, now: Date = new Date()) {
  return meetingsForUser(userId)
    .filter((meeting) => meetingStatus(meeting, now) !== "past" && !meeting.cancelled)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function meetingsForTicket(ticketKey: string) {
  return meetings.filter((meeting) => meeting.ticketRefs.includes(ticketKey));
}

/** Not more than an hour in the past — what the Meetings agenda shows. */
export function isMeetingRecentOrUpcoming(meeting: Meeting, now: Date = new Date()) {
  return Date.parse(meeting.endsAt) >= now.getTime() - 3_600_000;
}

/** Live, or starting inside `withinMinutes` — what a bell or a badge cares about. */
export function isMeetingSoon(
  meeting: Meeting,
  withinMinutes = 30,
  now: Date = new Date(),
) {
  if (meeting.cancelled) return false;
  const status = meetingStatus(meeting, now);
  if (status === "live") return true;
  if (status !== "upcoming") return false;
  const minutesAway = (Date.parse(meeting.startsAt) - now.getTime()) / 60_000;
  return minutesAway <= withinMinutes;
}

export function meetingsOnDay(dayOffset: number, userId: string = CURRENT_USER_ID) {
  const dayStart = daysFromToday(dayOffset).getTime();
  const dayEnd = daysFromToday(dayOffset + 1).getTime();
  return meetingsForUser(userId)
    .filter((meeting) => {
      const start = Date.parse(meeting.startsAt);
      return start >= dayStart && start < dayEnd;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
