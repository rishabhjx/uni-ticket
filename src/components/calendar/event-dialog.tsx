"use client";

import * as React from "react";
import { MapPin, Trash2, Users, Video } from "lucide-react";

import { AttendeePicker } from "@/components/calendar/attendee-picker";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CURRENT_USER_ID, getUser } from "@/lib/mock";
import { useCalendarStore } from "@/lib/store/calendar-store";
import type { CalendarEvent, EventDraft } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-8 w-full rounded-md border border-grey-200 bg-grey-0 px-2.5 text-small text-grey-900 transition-colors placeholder:text-grey-500 hover:border-grey-300 focus:border-accent-600 focus:outline-none";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeValue(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function combine(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0);
}

function fakeMeetLink() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const chunk = (length: number) =>
    Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `https://meet.uni.example/${chunk(3)}-${chunk(4)}-${chunk(3)}`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[92px_1fr] items-start gap-3">
      <span className="pt-1.5 text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </label>
  );
}

/**
 * One form for both create and edit: an event's shape doesn't change once
 * it exists, only which store call the submit ends up making.
 */
export function EventDialog({
  open,
  onOpenChange,
  mode,
  event,
  defaultStart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  /** Required for edit; ignored for create. */
  event?: CalendarEvent;
  /** Where a new event's fields start from — the slot the user clicked. */
  defaultStart?: Date;
}) {
  const { createEvent, updateEvent, deleteEvent } = useCalendarStore();

  const seedFrom = React.useCallback((): {
    title: string;
    allDay: boolean;
    date: string;
    endDate: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    attendeeIds: string[];
    withVideo: boolean;
  } => {
    if (mode === "edit" && event) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      return {
        title: event.title,
        allDay: event.allDay,
        date: toDateValue(start),
        endDate: toDateValue(event.allDay ? new Date(end.getTime() - 86_400_000) : end),
        startTime: toTimeValue(start),
        endTime: toTimeValue(end),
        location: event.location,
        description: event.description,
        attendeeIds: event.attendees
          .map((attendee) => attendee.userId)
          .filter((id) => id !== event.organizerId),
        withVideo: Boolean(event.videoLink),
      };
    }
    const start = defaultStart ?? new Date();
    const end = new Date(start.getTime() + 30 * 60_000);
    return {
      title: "",
      allDay: false,
      date: toDateValue(start),
      endDate: toDateValue(start),
      startTime: toTimeValue(start),
      endTime: toTimeValue(end),
      location: "",
      description: "",
      attendeeIds: [],
      withVideo: false,
    };
  }, [mode, event, defaultStart]);

  const [fields, setFields] = React.useState(seedFrom);

  /*
   * Re-seeds whenever the dialog opens onto a new subject — a different
   * event to edit, or a new create slot — comparing against what it last
   * seeded rather than doing it in an effect, so a reopen of the very same
   * subject doesn't clobber whatever the person was mid-typing.
   */
  const seedKey = open
    ? `${mode}:${event?.id ?? "new"}:${defaultStart?.getTime() ?? ""}`
    : null;
  const [lastSeedKey, setLastSeedKey] = React.useState(seedKey);
  if (seedKey !== null && seedKey !== lastSeedKey) {
    setLastSeedKey(seedKey);
    setFields(seedFrom());
  }

  const organizerId = mode === "edit" && event ? event.organizerId : CURRENT_USER_ID;
  const organizer = getUser(organizerId);
  const isOrganizer = organizerId === CURRENT_USER_ID;

  const startDate = combine(fields.date, fields.allDay ? "00:00" : fields.startTime);
  const endDate = fields.allDay
    ? combine(fields.endDate, "00:00")
    : combine(fields.date, fields.endTime);
  const timesValid = fields.allDay ? endDate >= startDate : endDate > startDate;
  const canSubmit = fields.title.trim().length > 0 && timesValid;

  const submit = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!canSubmit) return;

    const draft: EventDraft = {
      title: fields.title.trim(),
      description: fields.description,
      location: fields.location,
      allDay: fields.allDay,
      start: startDate.toISOString(),
      end: (fields.allDay
        ? new Date(endDate.getTime() + 86_400_000)
        : endDate
      ).toISOString(),
      organizerId,
      attendeeIds: fields.attendeeIds,
      videoLink: fields.withVideo ? (event?.videoLink ?? fakeMeetLink()) : null,
    };

    if (mode === "edit" && event) {
      updateEvent(event.id, draft);
    } else {
      createEvent(draft);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="hairline-b px-5 py-4">
          <DialogTitle className="text-heading font-semibold">
            {mode === "edit" ? "Edit event" : "New event"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit}>
          <div className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto px-5 py-4">
            <input
              autoFocus
              value={fields.title}
              onChange={(inputEvent) =>
                setFields((current) => ({ ...current, title: inputEvent.target.value }))
              }
              placeholder="Add title"
              className="h-9 w-full rounded-md border border-transparent px-1 text-heading font-medium text-grey-900 outline-none placeholder:text-grey-400 focus:border-grey-200"
            />

            <label className="flex items-center gap-2 text-small text-grey-700">
              <Checkbox
                checked={fields.allDay}
                onCheckedChange={(next) =>
                  setFields((current) => ({ ...current, allDay: next === true }))
                }
              />
              All day
            </label>

            <Row label="Date">
              {fields.allDay ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={fields.date}
                    onChange={(inputEvent) =>
                      setFields((current) => ({ ...current, date: inputEvent.target.value }))
                    }
                    className={fieldClass}
                  />
                  <span className="shrink-0 text-grey-400">to</span>
                  <input
                    type="date"
                    value={fields.endDate}
                    min={fields.date}
                    onChange={(inputEvent) =>
                      setFields((current) => ({ ...current, endDate: inputEvent.target.value }))
                    }
                    className={fieldClass}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={fields.date}
                    onChange={(inputEvent) =>
                      setFields((current) => ({ ...current, date: inputEvent.target.value }))
                    }
                    className={cn(fieldClass, "flex-[1.4]")}
                  />
                  <input
                    type="time"
                    value={fields.startTime}
                    onChange={(inputEvent) =>
                      setFields((current) => ({ ...current, startTime: inputEvent.target.value }))
                    }
                    className={fieldClass}
                  />
                  <span className="shrink-0 text-grey-400">–</span>
                  <input
                    type="time"
                    value={fields.endTime}
                    onChange={(inputEvent) =>
                      setFields((current) => ({ ...current, endTime: inputEvent.target.value }))
                    }
                    className={fieldClass}
                  />
                </div>
              )}
              {!timesValid ? (
                <p className="mt-1 text-caption text-[var(--priority-urgent-fg)]">
                  End has to be after the start.
                </p>
              ) : null}
            </Row>

            <Row label="Guests">
              <AttendeePicker
                value={fields.attendeeIds}
                onChange={(next) => setFields((current) => ({ ...current, attendeeIds: next }))}
              />
              {!isOrganizer ? (
                <p className="mt-1.5 flex items-center gap-1 text-caption text-grey-500">
                  <Users className="size-3" strokeWidth={1.75} />
                  Organised by {organizer?.name ?? "someone else"}
                </p>
              ) : null}
            </Row>

            <Row label="Where">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
                <input
                  value={fields.location}
                  onChange={(inputEvent) =>
                    setFields((current) => ({ ...current, location: inputEvent.target.value }))
                  }
                  placeholder="Add a location"
                  className={fieldClass}
                />
              </div>
            </Row>

            <Row label="Video">
              <label className="flex items-center gap-2 text-small text-grey-700">
                <Checkbox
                  checked={fields.withVideo}
                  onCheckedChange={(next) =>
                    setFields((current) => ({ ...current, withVideo: next === true }))
                  }
                />
                <Video className="size-3.5 text-grey-400" strokeWidth={1.75} />
                Add video conferencing
              </label>
            </Row>

            <Row label="Notes">
              <Textarea
                value={fields.description}
                onChange={(textareaEvent) =>
                  setFields((current) => ({ ...current, description: textareaEvent.target.value }))
                }
                placeholder="Add a description"
                className="min-h-20 resize-none text-small"
              />
            </Row>
          </div>

          <DialogFooter className="hairline-t px-5 py-3">
            {mode === "edit" && event ? (
              <button
                type="button"
                onClick={() => {
                  deleteEvent(event.id);
                  onOpenChange(false);
                }}
                className="mr-auto flex h-8 items-center gap-1.5 rounded-md px-2.5 text-small text-grey-600 transition-colors hover:bg-[var(--priority-urgent-bg)] hover:text-[var(--priority-urgent-fg)]"
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
                Delete
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 rounded-md px-3 text-small text-grey-600 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-8 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-100 disabled:text-grey-600"
            >
              {mode === "edit" ? "Save" : "Create"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
