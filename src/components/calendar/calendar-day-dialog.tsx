"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";

import { personToneClass, UserAvatar } from "@/components/tickets/user-avatar";
import type { CalendarEvent } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeLabel = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit" });

/**
 * Bypasses the shared DialogContent on purpose, same as the ticketing
 * calendar's day dialog before it: this is where transitions.dev's
 * "Modal open/close" recipe (`.t-modal`, in transitions-dev.css) is used.
 */
export function CalendarDayDialog({
  day,
  events,
  onOpenChange,
  onEventClick,
}: {
  day: Date | null;
  events: CalendarEvent[];
  onOpenChange: (open: boolean) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  return (
    <DialogPrimitive.Root open={day !== null} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="t-modal fixed top-1/2 left-1/2 z-50 flex max-h-[70vh] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-1 rounded-lg border border-grey-200 bg-grey-0 p-2 shadow-[var(--shadow-overlay)] outline-none">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <DialogPrimitive.Title className="text-small font-semibold text-grey-900">
              {day ? DAY_LABEL.format(day) : "Events"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="flex size-6 shrink-0 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900">
              <XIcon className="size-3.5" strokeWidth={1.75} />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">
            {events.length} event{events.length === 1 ? "" : "s"} on {day ? DAY_LABEL.format(day) : ""}
          </DialogPrimitive.Description>

          <div className="flex flex-col gap-0.5 overflow-y-auto px-1 pb-1">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onEventClick(event)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-small transition-colors hover:bg-grey-100"
              >
                <span
                  aria-hidden
                  className={cn("size-2 shrink-0 rounded-full", personToneClass(event.organizerId))}
                />
                {!event.allDay ? (
                  <span className="tnum shrink-0 text-caption text-grey-500">
                    {timeLabel.format(new Date(event.start))}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 truncate text-grey-700">{event.title}</span>
                <UserAvatar userId={event.organizerId} size="sm" />
              </button>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
