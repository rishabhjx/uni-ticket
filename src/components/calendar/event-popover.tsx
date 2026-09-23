"use client";

import * as React from "react";
import { Check, Clock, HelpCircle, MapPin, Pencil, Trash2, Users, Video, X } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { attendeeResponse, type CalendarEvent } from "@/lib/calendar";
import { CURRENT_USER_ID, getUser } from "@/lib/mock";
import { useCalendarStore } from "@/lib/store/calendar-store";
import { cn } from "@/lib/utils";

const dateLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeLabel = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

const RESPONSE_LABEL: Record<string, string> = {
  accepted: "Going",
  declined: "Not going",
  tentative: "Maybe",
  needsAction: "Awaiting your response",
};

/**
 * Google Calendar's own pattern: a click never jumps straight to the editor.
 * It opens a small read view first — when, where, who else — with Edit one
 * click further for whoever actually wants to change something.
 */
export function EventPopover({
  event,
  children,
  onEdit,
}: {
  event: CalendarEvent;
  children: React.ReactElement;
  onEdit: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const { deleteEvent, respond } = useCalendarStore();

  const start = new Date(event.start);
  const end = new Date(event.end);
  const myResponse = attendeeResponse(event, CURRENT_USER_ID);
  const isOrganizer = event.organizerId === CURRENT_USER_ID;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="flex items-start gap-2 px-4 pt-3.5 pb-2">
          <h3 className="min-w-0 flex-1 text-small font-semibold text-grey-900">
            {event.title || "(No title)"}
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
          >
            <X className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 px-4 pb-3.5 text-small text-grey-700">
          <div className="flex items-start gap-2.5">
            <Clock className="mt-0.5 size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
            <span>
              {dateLabel.format(start)}
              {event.allDay ? null : (
                <>
                  {" · "}
                  {timeLabel.format(start)}–{timeLabel.format(end)}
                </>
              )}
            </span>
          </div>

          {event.location ? (
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
              <span className="min-w-0 truncate">{event.location}</span>
            </div>
          ) : null}

          {event.videoLink ? (
            <div className="flex items-start gap-2.5">
              <Video className="mt-0.5 size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
              <a
                href={event.videoLink}
                onClick={(clickEvent) => clickEvent.preventDefault()}
                className="min-w-0 truncate text-accent-600 hover:underline"
              >
                {event.videoLink.replace("https://", "")}
              </a>
            </div>
          ) : null}

          <div className="flex items-start gap-2.5">
            <Users className="mt-0.5 size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
            <div className="flex min-w-0 flex-col gap-1">
              {event.attendees.map((attendee) => {
                const person = getUser(attendee.userId);
                return (
                  <div key={attendee.userId} className="flex items-center gap-1.5">
                    <UserAvatar userId={attendee.userId} size="sm" />
                    <span className="min-w-0 truncate">
                      {person?.name ?? attendee.userId}
                      {attendee.userId === event.organizerId ? (
                        <span className="text-grey-400"> · organiser</span>
                      ) : null}
                    </span>
                    <ResponseGlyph response={attendee.response} />
                  </div>
                );
              })}
            </div>
          </div>

          {event.description ? (
            <p className="whitespace-pre-wrap text-grey-600">{event.description}</p>
          ) : null}
        </div>

        {!isOrganizer && myResponse !== null ? (
          <div className="hairline-t flex items-center gap-1 px-3 py-2">
            <span className="px-1.5 text-caption text-grey-500">
              {RESPONSE_LABEL[myResponse]} ·
            </span>
            {(
              [
                { value: "accepted" as const, label: "Yes" },
                { value: "tentative" as const, label: "Maybe" },
                { value: "declined" as const, label: "No" },
              ]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => respond(event.id, CURRENT_USER_ID, option.value)}
                className={cn(
                  "h-7 rounded-md px-2 text-caption font-medium transition-colors",
                  myResponse === option.value
                    ? "bg-grey-900 text-grey-0"
                    : "text-grey-600 hover:bg-grey-100 hover:text-grey-900",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="hairline-t flex items-center justify-end gap-1 px-3 py-2">
          <button
            type="button"
            onClick={() => {
              deleteEvent(event.id);
              setOpen(false);
            }}
            className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-[var(--priority-urgent-bg)] hover:text-[var(--priority-urgent-fg)]"
            aria-label="Delete event"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            aria-label="Edit event"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ResponseGlyph({ response }: { response: string }) {
  if (response === "accepted")
    return <Check className="size-3 shrink-0 text-[var(--success)]" strokeWidth={2.5} />;
  if (response === "declined")
    return <X className="size-3 shrink-0 text-[var(--priority-urgent-fg)]" strokeWidth={2.5} />;
  if (response === "tentative")
    return <HelpCircle className="size-3 shrink-0 text-grey-400" strokeWidth={2} />;
  return null;
}
