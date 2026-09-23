import { generateCalendarEvents } from "./generate";
import type { CalendarEvent } from "./types";

export * from "./types";
export * from "./layout";

export const calendarEvents: CalendarEvent[] = generateCalendarEvents();

/** Organiser or invited — either makes it "their" event for display purposes. */
export function isOnCalendar(event: CalendarEvent, userId: string) {
  return (
    event.organizerId === userId ||
    event.attendees.some((attendee) => attendee.userId === userId)
  );
}

export function eventsForUser(events: CalendarEvent[], userId: string) {
  return events.filter((event) => isOnCalendar(event, userId));
}

/** Half-open interval overlap: [event.start, event.end) vs [rangeStart, rangeEnd). */
export function overlapsRange(event: CalendarEvent, rangeStart: Date, rangeEnd: Date) {
  const start = new Date(event.start).getTime();
  const end = new Date(event.end).getTime();
  return start < rangeEnd.getTime() && end > rangeStart.getTime();
}

export function attendeeResponse(event: CalendarEvent, userId: string) {
  return event.attendees.find((attendee) => attendee.userId === userId)?.response ?? null;
}

export function durationMinutes(event: CalendarEvent) {
  return (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60_000;
}
