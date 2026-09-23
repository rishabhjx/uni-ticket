"use client";

import { Ticket as TicketIcon, Video } from "lucide-react";

import { MEETING_KIND_ICON, MEETING_KIND_LABEL } from "@/components/meetings/meeting-icon";
import { AvatarStack } from "@/components/tickets/user-avatar";
import { formatTime } from "@/lib/format";
import { getProject, meetingStatus, type Meeting } from "@/lib/mock";
import { useMeetingsStore } from "@/lib/store/meetings-store";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { cn } from "@/lib/utils";

export function MeetingCard({
  meeting,
  onOpenDetail,
}: {
  meeting: Meeting;
  onOpenDetail: (id: string) => void;
}) {
  const { joinMeeting } = useMeetingsStore();
  const { openTicket } = useTicketPanel();
  const Icon = MEETING_KIND_ICON[meeting.kind];
  const status = meetingStatus(meeting);
  const project = meeting.projectId ? getProject(meeting.projectId) : undefined;

  return (
    <div
      className={cn(
        "hairline-b flex items-center gap-3 px-4 py-3 transition-colors hover:bg-grey-50",
        meeting.cancelled && "opacity-50",
      )}
    >
      <div className="flex w-16 shrink-0 flex-col items-end text-right">
        <span className="tnum text-small font-medium text-grey-800">
          {formatTime(meeting.startsAt)}
        </span>
        <span className="tnum text-caption text-grey-500">{formatTime(meeting.endsAt)}</span>
      </div>

      <span
        aria-hidden
        className={cn(
          "h-8 w-0.5 shrink-0 rounded-full",
          status === "live" ? "bg-accent-600" : "bg-grey-200",
        )}
      />

      <Icon className="size-4 shrink-0 text-grey-400" strokeWidth={1.75} />

      <button
        type="button"
        onClick={() => onOpenDetail(meeting.id)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="truncate text-small font-medium text-grey-900">
            {meeting.title}
          </span>
          {meeting.cancelled ? (
            <span className="shrink-0 text-caption text-grey-500">Cancelled</span>
          ) : status === "live" ? (
            <span className="shrink-0 rounded-md bg-accent-50 px-1.5 py-0.5 text-caption font-medium text-accent-700">
              Live
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-caption text-grey-500">
          <span>{MEETING_KIND_LABEL[meeting.kind]}</span>
          {project ? (
            <>
              <span aria-hidden>·</span>
              <span aria-hidden>{project.emoji}</span>
              <span>{project.name}</span>
            </>
          ) : null}
          {meeting.ticketRefs.map((key) => (
            <button
              key={key}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openTicket(key);
              }}
              className="tnum flex items-center gap-0.5 rounded-md bg-accent-50 px-1 py-px font-medium text-accent-700 hover:underline"
            >
              <TicketIcon className="size-2.5" strokeWidth={2} />
              {key}
            </button>
          ))}
        </div>
      </button>

      <AvatarStack userIds={meeting.attendeeIds} size="sm" max={4} />

      {!meeting.cancelled && status !== "past" ? (
        <button
          type="button"
          onClick={() => joinMeeting(meeting.id)}
          className={cn(
            "flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-caption font-medium transition-colors",
            status === "live"
              ? "bg-accent-600 text-grey-0 hover:bg-accent-700"
              : "border border-grey-200 text-grey-700 hover:border-grey-300",
          )}
        >
          <Video className="size-3.5" strokeWidth={1.75} />
          Join
        </button>
      ) : null}
    </div>
  );
}
