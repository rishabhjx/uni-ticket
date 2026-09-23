"use client";

import * as React from "react";
import { Phone, Video } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { getUser } from "@/lib/mock";
import { useMeetingsStore } from "@/lib/store/meetings-store";
import { cn } from "@/lib/utils";

/**
 * Start a call about this project or ticket, Slack-style.
 *
 * Meetings is a real app in this workspace now, so the handoff this used to
 * only describe actually happens: pressing Join schedules a short ad-hoc
 * meeting — same title, same invite list, the ticket carried along as a
 * ticketRef — and drops you straight into it. Still no real audio or video
 * (there is no signalling server here to place a call with); that boundary is
 * now InCallOverlay's to describe, not this button's.
 */
export function CallButton({
  subject,
  participantIds,
  ticketRefs,
  className,
}: {
  subject: string;
  participantIds: string[];
  ticketRefs?: string[];
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const { scheduleMeeting, joinMeeting } = useMeetingsStore();

  const startCall = () => {
    const now = new Date();
    const meeting = scheduleMeeting({
      title: subject,
      kind: "sync",
      attendeeIds: participantIds,
      projectId: null,
      sprintId: null,
      ticketRefs: ticketRefs ?? [],
      startsAt: now.toISOString(),
      endsAt: new Date(now.getTime() + 30 * 60_000).toISOString(),
      notes: "",
    });
    setOpen(false);
    joinMeeting(meeting.id);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Start a call about ${subject}`}
        title={`Start a call about ${subject}`}
        className={cn(
          "flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900",
          className,
        )}
      >
        <Phone className="size-4" strokeWidth={1.75} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="size-4 text-grey-500" strokeWidth={1.75} />
              Start a call
            </DialogTitle>
            <DialogDescription className="text-small text-grey-500">
              About <span className="text-grey-900">{subject}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <p className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
                Invites {participantIds.length}
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {participantIds.map((id) => (
                  <li
                    key={id}
                    className="flex h-7 items-center gap-1.5 rounded-md border border-grey-200 px-1.5 text-small text-grey-700"
                  >
                    <UserAvatar userId={id} />
                    {getUser(id)?.name.split(" ")[0]}
                  </li>
                ))}
              </ul>
            </div>

            <p className="rounded-md bg-grey-50 px-2.5 py-2 text-caption text-grey-500">
              This schedules a 30-minute meeting in Meetings and joins it now —
              the same handoff you&apos;d get pulling a thread into a call anywhere
              else in the workspace.
            </p>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={startCall}
              className="flex h-8 items-center gap-1.5 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700"
            >
              <Video className="size-3.5" strokeWidth={1.75} />
              Join now
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
