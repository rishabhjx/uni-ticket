"use client";

import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectIcon } from "@/components/shared/entity-icon";
import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  CURRENT_USER_ID,
  MEETING_KINDS,
  projects,
  users,
  type MeetingKind,
} from "@/lib/mock";
import { useMeetingsStore } from "@/lib/store/meetings-store";
import { useTicketStore } from "@/lib/store/ticket-store";
import { MEETING_KIND_LABEL } from "@/components/meetings/meeting-icon";
import { cn } from "@/lib/utils";

// Matches the field treatment create-ticket/-project/-workspace dialogs use,
// so this dialog's inputs hover and focus the same way theirs do.
const fieldClass =
  "border-grey-200 shadow-none transition-colors placeholder:text-grey-500 hover:border-grey-300 focus-visible:border-accent-600 focus-visible:ring-0";
const labelClass =
  "mb-1 text-caption font-medium tracking-[0.07em] text-grey-500 uppercase";

function defaultStart() {
  const in30 = new Date(Date.now() + 30 * 60_000);
  in30.setMinutes(Math.ceil(in30.getMinutes() / 15) * 15, 0, 0);
  return in30;
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ScheduleDialog({
  open,
  onOpenChange,
  onScheduled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled?: (meetingId: string) => void;
}) {
  const { scheduleMeeting } = useMeetingsStore();
  const { tickets } = useTicketStore();

  const [title, setTitle] = React.useState("");
  const [kind, setKind] = React.useState<MeetingKind>("sync");
  const [attendeeIds, setAttendeeIds] = React.useState<string[]>([]);
  const [projectId, setProjectId] = React.useState<string>("none");
  const [ticketKey, setTicketKey] = React.useState("");
  const [start, setStart] = React.useState(() => toLocalInputValue(defaultStart()));
  const [duration, setDuration] = React.useState(30);
  const [notes, setNotes] = React.useState("");

  const reset = () => {
    setTitle("");
    setKind("sync");
    setAttendeeIds([]);
    setProjectId("none");
    setTicketKey("");
    setStart(toLocalInputValue(defaultStart()));
    setDuration(30);
    setNotes("");
  };

  const toggleAttendee = (id: string) => {
    setAttendeeIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  // Read here rather than only inside submit(), so a typo that matches
  // nothing can tell the person before they schedule, not after.
  const matchedTicket = tickets.find(
    (ticket) => ticket.key.toLowerCase() === ticketKey.trim().toLowerCase(),
  );

  const submit = () => {
    if (!title.trim()) return;
    const startsAt = new Date(start).toISOString();
    const endsAt = new Date(new Date(start).getTime() + duration * 60_000).toISOString();

    const meeting = scheduleMeeting({
      title,
      kind,
      attendeeIds,
      projectId: projectId === "none" ? null : projectId,
      sprintId: null,
      ticketRefs: matchedTicket ? [matchedTicket.key] : [],
      startsAt,
      endsAt,
      notes,
    });

    reset();
    onOpenChange(false);
    onScheduled?.(meeting.id);
  };

  // A dialog abandoned via Cancel, Escape or the overlay must not leave its
  // draft behind for the next "Schedule a meeting".
  const closeAndReset = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  return (
    <Dialog open={open} onOpenChange={closeAndReset}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule a meeting</DialogTitle>
          <DialogDescription className="text-small text-grey-500">
            Invites go out to everyone you add below, and it opens in Meetings
            when its time comes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Meeting title"
            aria-label="Meeting title"
            className={cn(fieldClass, "h-8 text-small")}
          />

          <div className="grid grid-cols-2 gap-2">
            <Select value={kind} onValueChange={(value) => setKind(value as MeetingKind)}>
              <SelectTrigger className="h-8 text-small">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_KINDS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {MEETING_KIND_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-8 text-small">
                <SelectValue placeholder="Project (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <span className="flex items-center gap-2">
                      <ProjectIcon project={project} size="xs" />
                      {project.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className={labelClass}>Starts</Label>
              <Input
                type="datetime-local"
                value={start}
                onChange={(event) => setStart(event.target.value)}
                className={cn(fieldClass, "h-8 text-small")}
              />
            </div>
            <div>
              <Label className={labelClass}>Duration</Label>
              <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                <SelectTrigger className="h-8 text-small">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[15, 30, 45, 60, 90].map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {minutes} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Input
              value={ticketKey}
              onChange={(event) => setTicketKey(event.target.value)}
              placeholder="Link a ticket, e.g. APO-142 (optional)"
              aria-label="Link a ticket"
              className={cn(fieldClass, "h-8 text-small")}
            />
            {ticketKey.trim() && !matchedTicket ? (
              <p className="mt-1 text-caption text-grey-500">
                No ticket by that key — it will not be linked.
              </p>
            ) : null}
          </div>

          <div>
            <Label className={cn(labelClass, "mb-1.5")}>
              Attendees {attendeeIds.length > 0 ? `(${attendeeIds.length})` : ""}
            </Label>
            <div className="grid max-h-36 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-grey-200 p-1.5">
              {users
                .filter((user) => user.id !== CURRENT_USER_ID)
                .map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-small text-grey-700 hover:bg-grey-50"
                  >
                    <Checkbox
                      checked={attendeeIds.includes(user.id)}
                      onCheckedChange={() => toggleAttendee(user.id)}
                    />
                    <UserAvatar userId={user.id} />
                    <span className="truncate">{user.name}</span>
                  </label>
                ))}
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="Notes (optional)"
            className="w-full resize-none rounded-md border border-grey-200 px-2.5 py-1.5 text-small text-grey-900 placeholder:text-grey-500 focus:border-accent-600 focus:outline-none"
          />
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => closeAndReset(false)}
            className="h-8 rounded-md px-3 text-small text-grey-600 transition-colors hover:bg-grey-100 hover:text-grey-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim()}
            className="h-8 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-100 disabled:text-grey-400"
          >
            Schedule
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
