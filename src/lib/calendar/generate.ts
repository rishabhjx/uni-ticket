import { addDays, startOfWeek, TODAY } from "@/lib/mock/dates";
import { createRandom, type Random } from "@/lib/mock/random";
import { reporteesOf, users } from "@/lib/mock/users";

import type { CalendarEvent, EventAttendee, RsvpResponse } from "./types";

/** Independent of the ticket generator's seed — a different dataset, on purpose. */
const SEED = 91_017;

const PAST_WEEKS = 2;
const FUTURE_WEEKS = 6;

let sequence = 0;
function nextId() {
  sequence += 1;
  return `ev-${sequence}`;
}

function at(day: Date, hour: number, minute = 0) {
  const date = new Date(day);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function responseFor(random: Random, userId: string, organizerId: string): RsvpResponse {
  if (userId === organizerId) return "accepted";
  return random.weighted({
    accepted: 65,
    tentative: 15,
    needsAction: 15,
    declined: 5,
  });
}

function attendeesFor(random: Random, organizerId: string, userIds: string[]): EventAttendee[] {
  const ids = [organizerId, ...userIds.filter((id) => id !== organizerId)];
  return ids.map((userId) => ({ userId, response: responseFor(random, userId, organizerId) }));
}

const MEETING_TITLES = [
  "Sprint planning",
  "Roadmap sync",
  "Customer call: renewal",
  "Incident review",
  "Design critique",
  "Architecture review",
  "Hiring debrief",
  "Interview: Senior Engineer",
  "All-hands prep",
  "Budget review",
  "Vendor check-in",
  "Onboarding: new hire",
  "Postmortem: checkout latency",
  "Quarterly planning",
  "Retro",
];

const SOLO_TITLES = [
  "Focus time",
  "Deep work block",
  "Write the proposal",
  "Prep for tomorrow",
  "Read: RFCs",
  "Gym",
  "Dentist",
  "Lunch",
];

const LOCATIONS = [
  "Meeting Room 3B",
  "Zoom",
  "Google Meet",
  "Meeting Room 1A",
  "Phone",
  "",
  "",
];

const OOO_TITLES = ["Out of office", "PTO", "Working from home", "Conference: travel"];

function fakeMeetLink(random: Random) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const chunk = (length: number) =>
    Array.from({ length }, () => random.pick(chars.split(""))).join("");
  return `https://meet.uni.example/${chunk(3)}-${chunk(4)}-${chunk(3)}`;
}

function buildEvent(
  random: Random,
  input: {
    title: string;
    day: Date;
    startHour: number;
    startMinute?: number;
    durationMinutes: number;
    organizerId: string;
    attendeeIds?: string[];
    location?: string;
    description?: string;
    withVideo?: boolean;
  },
): CalendarEvent {
  const start = at(input.day, input.startHour, input.startMinute ?? 0);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const attendees = attendeesFor(random, input.organizerId, input.attendeeIds ?? []);
  const now = new Date().toISOString();
  return {
    id: nextId(),
    title: input.title,
    description: input.description ?? "",
    location: input.location ?? random.pick(LOCATIONS),
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: false,
    organizerId: input.organizerId,
    attendees,
    videoLink: input.withVideo ? fakeMeetLink(random) : null,
    createdAt: now,
    updatedAt: now,
  };
}

function buildAllDayEvent(
  random: Random,
  input: { title: string; day: Date; days?: number; organizerId: string },
): CalendarEvent {
  const start = new Date(input.day.getFullYear(), input.day.getMonth(), input.day.getDate());
  const end = addDays(start, input.days ?? 1);
  const now = new Date().toISOString();
  return {
    id: nextId(),
    title: input.title,
    description: "",
    location: "",
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: true,
    organizerId: input.organizerId,
    attendees: attendeesFor(random, input.organizerId, []),
    videoLink: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function generateCalendarEvents(): CalendarEvent[] {
  sequence = 0;
  const random = createRandom(SEED);
  const events: CalendarEvent[] = [];

  const rangeStart = startOfWeek(addDays(TODAY, -7 * PAST_WEEKS));
  const totalDays = 7 * (PAST_WEEKS + FUTURE_WEEKS + 1);
  const days = Array.from({ length: totalDays }, (_, index) => addDays(rangeStart, index));

  const managers = [...new Set(users.map((user) => user.managerId).filter((id): id is string => Boolean(id)))];

  for (const day of days) {
    const weekday = day.getDay();
    if (weekday === 0 || weekday === 6) {
      // Weekend: the occasional out-of-office, nothing else standing.
      if (random.chance(0.06)) {
        events.push(
          buildAllDayEvent(random, {
            title: random.pick(OOO_TITLES),
            day,
            organizerId: random.pick(users).id,
          }),
        );
      }
      continue;
    }

    // Standing team standup, one per manager who has reports, most weekdays.
    for (const managerId of managers) {
      const reports = reporteesOf(managerId).map((user) => user.id);
      if (reports.length === 0) continue;
      if (!random.chance(0.85)) continue;
      events.push(
        buildEvent(random, {
          title: "Team standup",
          day,
          startHour: 9,
          startMinute: 30,
          durationMinutes: 15,
          organizerId: managerId,
          attendeeIds: reports,
          location: "Zoom",
          withVideo: true,
        }),
      );
    }

    // A 1:1 lands on this day for a random manager/report pair, most days.
    if (random.chance(0.5)) {
      const managerId = random.pick(managers);
      const reports = reporteesOf(managerId).map((user) => user.id);
      if (reports.length > 0) {
        const reportId = random.pick(reports);
        events.push(
          buildEvent(random, {
            title: `1:1: ${users.find((user) => user.id === reportId)?.name.split(" ")[0]}`,
            day,
            startHour: random.pick([10, 11, 14, 15, 16]),
            durationMinutes: 30,
            organizerId: managerId,
            attendeeIds: [reportId],
            location: "Meeting Room 1A",
          }),
        );
      }
    }

    // A couple of ad-hoc meetings, sized and peopled at random.
    const meetingCount = random.int(1, 3);
    for (let i = 0; i < meetingCount; i += 1) {
      const organizer = random.pick(users);
      const attendeeCount = random.int(1, 4);
      const attendeeIds = random.sample(
        users.filter((user) => user.id !== organizer.id).map((user) => user.id),
        attendeeCount,
      );
      events.push(
        buildEvent(random, {
          title: random.pick(MEETING_TITLES),
          day,
          startHour: random.int(9, 16),
          startMinute: random.pick([0, 30]),
          durationMinutes: random.pick([30, 30, 45, 60, 60, 90]),
          organizerId: organizer.id,
          attendeeIds,
          withVideo: random.chance(0.5),
        }),
      );
    }

    // A solo block or two, per a handful of people.
    for (const user of random.sample(users, random.int(2, 5))) {
      if (!random.chance(0.6)) continue;
      events.push(
        buildEvent(random, {
          title: random.pick(SOLO_TITLES),
          day,
          startHour: random.pick([8, 12, 13, 17]),
          durationMinutes: random.pick([30, 45, 60]),
          organizerId: user.id,
          location: "",
        }),
      );
    }

    // The rare multi-day thing: a conference, a week of PTO.
    if (random.chance(0.03)) {
      events.push(
        buildAllDayEvent(random, {
          title: random.pick(OOO_TITLES),
          day,
          days: random.int(2, 5),
          organizerId: random.pick(users).id,
        }),
      );
    }
  }

  return events.sort((a, b) => a.start.localeCompare(b.start));
}
