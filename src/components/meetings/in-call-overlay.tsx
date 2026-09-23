"use client";

import * as React from "react";
import { Mic, MicOff, PhoneOff, Ticket as TicketIcon, Video, VideoOff } from "lucide-react";

import { MEETING_KIND_ICON } from "@/components/meetings/meeting-icon";
import { getUser } from "@/lib/mock";
import { useMeetingsStore } from "@/lib/store/meetings-store";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { cn } from "@/lib/utils";

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Mounted fresh — via `key={meeting.id}` below — every time a different
 * meeting is joined, so it always starts counting from zero without any
 * reset logic of its own to get wrong.
 */
function CallTimer() {
  const [seconds, setSeconds] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tnum text-caption text-grey-400">{formatElapsed(seconds)}</span>;
}

/**
 * The screen you land on after pressing Join, anywhere in the workspace. No
 * real audio or video — this prototype has no signalling server to connect
 * to — so what it demonstrates honestly is the same handoff CallButton
 * describes: the room and its context (title, attendees, linked ticket)
 * travel here, muted/camera controls are visual only.
 */
export function InCallOverlay() {
  const { meetings, joinedMeetingId, leaveMeeting } = useMeetingsStore();
  const { openTicket } = useTicketPanel();
  const [muted, setMuted] = React.useState(false);
  const [videoOff, setVideoOff] = React.useState(false);

  const meeting = joinedMeetingId
    ? meetings.find((item) => item.id === joinedMeetingId)
    : undefined;
  if (!meeting) return null;

  const Icon = MEETING_KIND_ICON[meeting.kind];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#161513]">
      <header className="flex h-topbar shrink-0 items-center gap-2 px-5 text-grey-0">
        <Icon className="size-4 text-grey-300" strokeWidth={1.75} />
        <h1 className="text-small font-medium">{meeting.title}</h1>
        <CallTimer key={meeting.id} />
        {meeting.ticketRefs.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => openTicket(key)}
            className="tnum ml-2 flex items-center gap-1 rounded-md bg-grey-0/10 px-1.5 py-0.5 text-caption font-medium text-grey-0 hover:bg-grey-0/20"
          >
            <TicketIcon className="size-3" strokeWidth={2} />
            {key}
          </button>
        ))}
      </header>

      <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-3 md:grid-cols-4">
        {meeting.attendeeIds.map((id) => {
          const user = getUser(id);
          return (
            <div
              key={id}
              className="flex aspect-video flex-col items-center justify-center gap-2 rounded-md bg-grey-800"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-grey-700 text-heading font-semibold text-grey-0">
                {user?.initials}
              </span>
              <span className="text-small text-grey-300">{user?.name}</span>
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-3 pb-6">
        <button
          type="button"
          onClick={() => setMuted((v) => !v)}
          aria-label={muted ? "Unmute" : "Mute"}
          className={cn(
            "flex size-10 items-center justify-center rounded-full transition-colors",
            muted ? "bg-grey-0 text-grey-900" : "bg-grey-0/15 text-grey-0 hover:bg-grey-0/25",
          )}
        >
          {muted ? <MicOff className="size-4" strokeWidth={1.75} /> : <Mic className="size-4" strokeWidth={1.75} />}
        </button>
        <button
          type="button"
          onClick={() => setVideoOff((v) => !v)}
          aria-label={videoOff ? "Turn camera on" : "Turn camera off"}
          className={cn(
            "flex size-10 items-center justify-center rounded-full transition-colors",
            videoOff ? "bg-grey-0 text-grey-900" : "bg-grey-0/15 text-grey-0 hover:bg-grey-0/25",
          )}
        >
          {videoOff ? (
            <VideoOff className="size-4" strokeWidth={1.75} />
          ) : (
            <Video className="size-4" strokeWidth={1.75} />
          )}
        </button>
        <button
          type="button"
          onClick={leaveMeeting}
          aria-label="Leave call"
          className="flex h-10 items-center gap-2 rounded-full bg-[var(--priority-urgent-fg)] px-4 text-small font-medium text-grey-0 transition-colors hover:opacity-90"
        >
          <PhoneOff className="size-4" strokeWidth={1.75} />
          Leave
        </button>
      </div>
    </div>
  );
}
