"use client";

import * as React from "react";
import { Pencil, Ticket as TicketIcon, Video, X } from "lucide-react";

import { MEETING_KIND_ICON, MEETING_KIND_LABEL } from "@/components/meetings/meeting-icon";
import { ScheduleDialog } from "@/components/meetings/schedule-dialog";
import { ProjectIcon } from "@/components/shared/entity-icon";
import { useCelebrate } from "@/components/shared/celebrate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { formatDateTime, formatTime } from "@/lib/format";
import { getProject, getSprint, getUser, CURRENT_USER_ID } from "@/lib/mock";
import { useMeetingsStore } from "@/lib/store/meetings-store";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { cn } from "@/lib/utils";

export function MeetingDetailDialog({
  meetingId,
  onClose,
}: {
  meetingId: string | null;
  onClose: () => void;
}) {
  const { meetings, cancelMeeting, uncancelMeeting, joinMeeting } = useMeetingsStore();
  const { openTicket } = useTicketPanel();
  const celebrate = useCelebrate();
  const meeting = meetingId ? meetings.find((item) => item.id === meetingId) : undefined;
  const [editOpen, setEditOpen] = React.useState(false);

  if (!meeting) return null;

  const project = meeting.projectId ? getProject(meeting.projectId) : undefined;
  const sprint = meeting.sprintId ? getSprint(meeting.sprintId) : undefined;
  const Icon = MEETING_KIND_ICON[meeting.kind];
  const isOrganizer = meeting.organizerId === CURRENT_USER_ID;
  const canCancel = isOrganizer && !meeting.cancelled;
  const canEdit = isOrganizer && !meeting.cancelled;

  return (
    <>
    <Dialog open={Boolean(meetingId) && !editOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle
            className={cn(
              "flex items-center gap-2",
              meeting.cancelled && "text-grey-500 line-through",
            )}
          >
            <Icon className="size-4 text-grey-500" strokeWidth={1.75} />
            {meeting.title}
          </DialogTitle>
          <DialogDescription className="text-small text-grey-500">
            {meeting.cancelled
              ? "This meeting was cancelled."
              : `${formatDateTime(meeting.startsAt)} – ${formatTime(meeting.endsAt)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-small">
          <div className="flex flex-wrap items-center gap-1.5 text-caption text-grey-500">
            {meeting.cancelled ? (
              <span className="rounded-md bg-[var(--danger-bg)] px-1.5 py-0.5 font-medium text-[color:var(--danger)]">
                Cancelled
              </span>
            ) : null}
            <span className="rounded-md bg-grey-100 px-1.5 py-0.5">
              {MEETING_KIND_LABEL[meeting.kind]}
            </span>
            {project ? (
              <span className="flex items-center gap-1.5 rounded-md bg-grey-100 px-1.5 py-0.5">
                <ProjectIcon project={project} size="xs" />
                {project.name}
              </span>
            ) : null}
            {sprint ? (
              <span className="rounded-md bg-grey-100 px-1.5 py-0.5">{sprint.name}</span>
            ) : null}
            {meeting.recurring !== "none" ? (
              <span className="rounded-md bg-grey-100 px-1.5 py-0.5">
                Repeats {meeting.recurring}
              </span>
            ) : null}
          </div>

          {meeting.ticketRefs.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {meeting.ticketRefs.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onClose();
                    openTicket(key);
                  }}
                  className="tnum flex items-center gap-1 rounded-md bg-accent-50 px-1.5 py-0.5 text-caption font-medium text-accent-700 hover:bg-accent-100"
                >
                  <TicketIcon className="size-3" strokeWidth={2} />
                  {key}
                </button>
              ))}
            </div>
          ) : null}

          {meeting.notes ? <p className="text-grey-700">{meeting.notes}</p> : null}

          <div>
            <p className="mb-1.5 text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
              Attendees ({meeting.attendeeIds.length})
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {meeting.attendeeIds.map((id) => (
                <li
                  key={id}
                  className="flex h-7 items-center gap-1.5 rounded-md border border-grey-200 px-1.5 text-small text-grey-700"
                >
                  <UserAvatar userId={id} />
                  {getUser(id)?.name.split(" ")[0]}
                  {id === meeting.organizerId ? (
                    <span className="text-caption text-grey-500">Organizer</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {canCancel ? (
            <button
              type="button"
              onClick={() => {
                cancelMeeting(meeting.id);
                onClose();
                // Cancelling drops it from everyone's calendar; a slip of the
                // mouse should not need re-scheduling from scratch to undo.
                celebrate("🗑", `"${meeting.title}" cancelled`, () =>
                  uncancelMeeting(meeting.id),
                );
              }}
              className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-small text-grey-600 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              <X className="size-3.5" strokeWidth={1.75} />
              Cancel meeting
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {canEdit ? (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex h-8 items-center gap-1.5 rounded-md border border-grey-200 px-2.5 text-small text-grey-700 transition-colors hover:border-grey-300"
              >
                <Pencil className="size-3.5" strokeWidth={1.75} />
                Edit
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-md px-3 text-small text-grey-600 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              Close
            </button>
            {!meeting.cancelled ? (
              <button
                type="button"
                onClick={() => {
                  joinMeeting(meeting.id);
                  onClose();
                }}
                className="flex h-8 items-center gap-1.5 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700"
              >
                <Video className="size-3.5" strokeWidth={1.75} />
                Join
              </button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ScheduleDialog open={editOpen} onOpenChange={setEditOpen} editing={meeting} />
    </>
  );
}
