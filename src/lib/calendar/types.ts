export type RsvpResponse = "accepted" | "declined" | "tentative" | "needsAction";

export type EventAttendee = {
  userId: string;
  response: RsvpResponse;
};

/**
 * Deliberately not a Ticket. This calendar has no relation to the ticketing
 * data model — it is its own domain, the way Google Calendar doesn't know
 * what a Jira issue is. A later pass can link the two; nothing here assumes
 * it will.
 */
export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  /** ISO datetime. For an all-day event, the wall-clock date at midnight. */
  start: string;
  /** ISO datetime, exclusive. For an all-day event, the day after the last day. */
  end: string;
  allDay: boolean;
  organizerId: string;
  attendees: EventAttendee[];
  /** A fake, cosmetic conferencing link — nothing dials it. */
  videoLink: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventDraft = {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
  organizerId: string;
  attendeeIds: string[];
  videoLink: string | null;
};
