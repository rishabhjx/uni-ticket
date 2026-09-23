"use client";

import * as React from "react";

import { calendarEvents as seedEvents } from "@/lib/calendar";
import type { CalendarEvent, EventDraft, RsvpResponse } from "@/lib/calendar";

const CREATED_KEY = "uni.calendar.created";
const EDITED_KEY = "uni.calendar.edited";
const DELETED_KEY = "uni.calendar.deleted";

type Overrides = {
  created: CalendarEvent[];
  edited: Record<string, CalendarEvent>;
  deletedIds: string[];
};

const EMPTY_OVERRIDES: Overrides = { created: [], edited: {}, deletedIds: [] };

/**
 * A tiny external store over localStorage, the same shape as useShell's
 * sidebarOpen: reads are synchronous, so useSyncExternalStore — not an
 * effect — is what lets the server-rendered (empty-overrides) markup and
 * the client's first paint agree, with the real, possibly non-empty value
 * arriving the instant after without ever being "loading".
 */
const listeners = new Set<() => void>();
let cache: Overrides | null = null;

function readOverrides(): Overrides {
  try {
    return {
      created: JSON.parse(window.localStorage.getItem(CREATED_KEY) ?? "[]") as CalendarEvent[],
      edited: JSON.parse(window.localStorage.getItem(EDITED_KEY) ?? "{}") as Record<string, CalendarEvent>,
      deletedIds: JSON.parse(window.localStorage.getItem(DELETED_KEY) ?? "[]") as string[],
    };
  } catch {
    return EMPTY_OVERRIDES;
  }
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot(): Overrides {
  if (!cache) cache = readOverrides();
  return cache;
}

function getServerSnapshot(): Overrides {
  return EMPTY_OVERRIDES;
}

function writeOverrides(next: Overrides) {
  cache = next;
  try {
    window.localStorage.setItem(CREATED_KEY, JSON.stringify(next.created));
    window.localStorage.setItem(EDITED_KEY, JSON.stringify(next.edited));
    window.localStorage.setItem(DELETED_KEY, JSON.stringify(next.deletedIds));
  } catch {
    // Storage full or unavailable: the session still works, it just won't survive a refresh.
  }
  for (const listener of listeners) listener();
}

let idSequence = 0;
function nextId() {
  idSequence += 1;
  return `ev-local-${Date.now().toString(36)}-${idSequence}`;
}

function draftToEvent(draft: EventDraft, id: string, createdAt: string): CalendarEvent {
  return {
    id,
    title: draft.title,
    description: draft.description,
    location: draft.location,
    start: draft.start,
    end: draft.end,
    allDay: draft.allDay,
    organizerId: draft.organizerId,
    attendees: draft.attendeeIds.map((userId) => ({
      userId,
      response: userId === draft.organizerId ? "accepted" : "needsAction",
    })),
    videoLink: draft.videoLink,
    createdAt,
    updatedAt: createdAt,
  };
}

function patchAttendees(base: CalendarEvent, userId: string, response: RsvpResponse) {
  return base.attendees.some((attendee) => attendee.userId === userId)
    ? base.attendees.map((attendee) =>
        attendee.userId === userId ? { ...attendee, response } : attendee,
      )
    : [...base.attendees, { userId, response }];
}

type CalendarStoreValue = {
  events: CalendarEvent[];
  createEvent: (draft: EventDraft) => CalendarEvent;
  updateEvent: (id: string, draft: EventDraft) => void;
  deleteEvent: (id: string) => void;
  respond: (id: string, userId: string, response: RsvpResponse) => void;
};

const CalendarStoreContext = React.createContext<CalendarStoreValue | null>(null);

export function CalendarStoreProvider({ children }: { children: React.ReactNode }) {
  const overrides = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const events = React.useMemo(() => {
    const deleted = new Set(overrides.deletedIds);
    const withEdits = (event: CalendarEvent) => overrides.edited[event.id] ?? event;
    return [...seedEvents, ...overrides.created]
      .filter((event) => !deleted.has(event.id))
      .map(withEdits)
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [overrides]);

  const createEvent = React.useCallback((draft: EventDraft) => {
    const now = new Date().toISOString();
    const event = draftToEvent(draft, nextId(), now);
    writeOverrides({ ...getSnapshot(), created: [...getSnapshot().created, event] });
    return event;
  }, []);

  /**
   * An edit to a locally-created event stays in `created` (there is nothing
   * to diff it against); an edit to a seed event is recorded as an override
   * in `edited`, seed data itself being read-only module state.
   */
  const updateEvent = React.useCallback((id: string, draft: EventDraft) => {
    const current = getSnapshot();
    const createdIndex = current.created.findIndex((event) => event.id === id);
    if (createdIndex !== -1) {
      const next = [...current.created];
      next[createdIndex] = draftToEvent(draft, id, next[createdIndex].createdAt);
      writeOverrides({ ...current, created: next });
      return;
    }
    const existing = current.edited[id] ?? seedEvents.find((event) => event.id === id);
    const base = draftToEvent(draft, id, existing?.createdAt ?? new Date().toISOString());
    writeOverrides({
      ...current,
      edited: { ...current.edited, [id]: { ...base, updatedAt: new Date().toISOString() } },
    });
  }, []);

  const deleteEvent = React.useCallback((id: string) => {
    const current = getSnapshot();
    if (current.deletedIds.includes(id)) return;
    writeOverrides({ ...current, deletedIds: [...current.deletedIds, id] });
  }, []);

  const respond = React.useCallback((id: string, userId: string, response: RsvpResponse) => {
    const current = getSnapshot();
    const createdIndex = current.created.findIndex((event) => event.id === id);
    if (createdIndex !== -1) {
      const next = [...current.created];
      next[createdIndex] = {
        ...next[createdIndex],
        attendees: patchAttendees(next[createdIndex], userId, response),
        updatedAt: new Date().toISOString(),
      };
      writeOverrides({ ...current, created: next });
      return;
    }
    const base = current.edited[id] ?? seedEvents.find((event) => event.id === id);
    if (!base) return;
    writeOverrides({
      ...current,
      edited: {
        ...current.edited,
        [id]: {
          ...base,
          attendees: patchAttendees(base, userId, response),
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }, []);

  const value = React.useMemo(
    () => ({ events, createEvent, updateEvent, deleteEvent, respond }),
    [events, createEvent, updateEvent, deleteEvent, respond],
  );

  return <CalendarStoreContext value={value}>{children}</CalendarStoreContext>;
}

export function useCalendarStore() {
  const context = React.use(CalendarStoreContext);
  if (!context) throw new Error("useCalendarStore must be used inside <CalendarStoreProvider>");
  return context;
}
