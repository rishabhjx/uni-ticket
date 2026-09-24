"use client";

import * as React from "react";

import { meetings as seedMeetings, CURRENT_USER_ID, type Meeting } from "@/lib/mock";

export type NewMeetingInput = {
  title: string;
  kind: Meeting["kind"];
  attendeeIds: string[];
  projectId: string | null;
  sprintId: string | null;
  ticketRefs: string[];
  startsAt: string;
  endsAt: string;
  notes: string;
};

type MeetingsStoreValue = {
  meetings: Meeting[];
  scheduleMeeting: (input: NewMeetingInput) => Meeting;
  cancelMeeting: (id: string) => void;
  /** Undoes a cancellation — the one-level-back every destructive action here gets. */
  uncancelMeeting: (id: string) => void;
  /** The meeting the current user is "in", for the join screen. Null when not in one. */
  joinedMeetingId: string | null;
  joinMeeting: (id: string) => void;
  leaveMeeting: () => void;
};

const MeetingsStoreContext = React.createContext<MeetingsStoreValue | null>(null);

export function MeetingsStoreProvider({ children }: { children: React.ReactNode }) {
  const [meetings, setMeetings] = React.useState<Meeting[]>(seedMeetings);
  const [joinedMeetingId, setJoinedMeetingId] = React.useState<string | null>(null);
  const seq = React.useRef(0);

  const scheduleMeeting = React.useCallback((input: NewMeetingInput) => {
    seq.current += 1;
    const meeting: Meeting = {
      id: `meet-new-${seq.current}`,
      title: input.title.trim() || "Untitled meeting",
      kind: input.kind,
      organizerId: CURRENT_USER_ID,
      attendeeIds: [...new Set([CURRENT_USER_ID, ...input.attendeeIds])],
      projectId: input.projectId,
      sprintId: input.sprintId,
      ticketRefs: input.ticketRefs,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      recurring: "none",
      notes: input.notes,
      cancelled: false,
    };
    setMeetings((current) =>
      [...current, meeting].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    );
    return meeting;
  }, []);

  const cancelMeeting = React.useCallback((id: string) => {
    setMeetings((current) =>
      current.map((meeting) =>
        meeting.id === id ? { ...meeting, cancelled: true } : meeting,
      ),
    );
  }, []);

  const uncancelMeeting = React.useCallback((id: string) => {
    setMeetings((current) =>
      current.map((meeting) =>
        meeting.id === id ? { ...meeting, cancelled: false } : meeting,
      ),
    );
  }, []);

  const joinMeeting = React.useCallback((id: string) => setJoinedMeetingId(id), []);
  const leaveMeeting = React.useCallback(() => setJoinedMeetingId(null), []);

  const value = React.useMemo(
    () => ({
      meetings,
      scheduleMeeting,
      cancelMeeting,
      uncancelMeeting,
      joinedMeetingId,
      joinMeeting,
      leaveMeeting,
    }),
    [
      meetings,
      scheduleMeeting,
      cancelMeeting,
      uncancelMeeting,
      joinedMeetingId,
      joinMeeting,
      leaveMeeting,
    ],
  );

  return <MeetingsStoreContext value={value}>{children}</MeetingsStoreContext>;
}

export function useMeetingsStore() {
  const context = React.use(MeetingsStoreContext);
  if (!context) {
    throw new Error("useMeetingsStore must be used inside <MeetingsStoreProvider>");
  }
  return context;
}
