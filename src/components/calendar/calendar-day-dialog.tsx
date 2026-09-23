"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";

import { StatusDot, TicketKey, TypeIcon } from "@/components/tickets/badges";
import { isOverdue, type Ticket } from "@/lib/mock";
import { cn } from "@/lib/utils";

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/**
 * Bypasses the shared DialogContent on purpose: that one's entrance/exit is
 * tw-animate-css's generic zoom, and this dialog is where transitions.dev's
 * "Modal open/close" recipe (`.t-modal`, in transitions-dev.css) actually
 * gets used, so it wires the Radix primitives directly instead.
 */
export function CalendarDayDialog({
  day,
  tickets,
  onOpenChange,
  onOpenTicket,
}: {
  day: Date | null;
  tickets: Ticket[];
  onOpenChange: (open: boolean) => void;
  onOpenTicket: (ticketKey: string) => void;
}) {
  return (
    <DialogPrimitive.Root open={day !== null} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="t-modal fixed top-1/2 left-1/2 z-50 flex max-h-[70vh] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-1 rounded-lg border border-grey-200 bg-grey-0 p-2 shadow-[var(--shadow-overlay)] outline-none">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <DialogPrimitive.Title className="text-small font-semibold text-grey-900">
              {day ? DAY_LABEL.format(day) : "Tickets"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="flex size-6 shrink-0 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900">
              <XIcon className="size-3.5" strokeWidth={1.75} />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">
            {tickets.length} ticket{tickets.length === 1 ? "" : "s"} due{" "}
            {day ? DAY_LABEL.format(day) : ""}
          </DialogPrimitive.Description>

          <div className="flex flex-col gap-0.5 overflow-y-auto px-1 pb-1">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => {
                  onOpenTicket(ticket.key);
                  onOpenChange(false);
                }}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-small transition-colors hover:bg-grey-100"
              >
                <StatusDot status={ticket.status} />
                <TypeIcon type={ticket.type} className="size-3.5 shrink-0" />
                <TicketKey value={ticket.key} className="shrink-0" />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-grey-700",
                    isOverdue(ticket) && "text-[var(--priority-urgent-fg)]",
                  )}
                >
                  {ticket.title}
                </span>
              </button>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
