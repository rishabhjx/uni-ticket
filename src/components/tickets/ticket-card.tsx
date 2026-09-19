"use client";

import { CalendarClock } from "lucide-react";

import {
  LabelChip,
  PriorityBadge,
  TicketKey,
  TypeIcon,
} from "@/components/tickets/badges";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { formatDueDate } from "@/lib/format";
import { getLabel, isOverdue, type Ticket } from "@/lib/mock";
import { cn } from "@/lib/utils";

export function TicketCard({
  ticket,
  onOpen,
}: {
  ticket: Ticket;
  onOpen?: (ticketId: string) => void;
}) {
  const overdue = isOverdue(ticket);

  return (
    <div
      className="flex flex-col gap-2 p-3"
      onClick={onOpen ? () => onOpen(ticket.id) : undefined}
    >
      <div className="flex items-center gap-1.5">
        <TypeIcon type={ticket.type} />
        <TicketKey value={ticket.key} />
        <PriorityBadge priority={ticket.priority} className="ml-auto" />
      </div>

      <p className="line-clamp-2 text-small leading-[18px] font-medium text-grey-900">
        {ticket.title}
      </p>

      {ticket.labelIds.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {ticket.labelIds.map((id) => {
            const label = getLabel(id);
            return label ? <LabelChip key={id} name={label.name} /> : null;
          })}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        {ticket.dueAt ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-caption",
              // Colour is reserved for status and priority, so an overdue date
              // leans on weight and an icon instead of turning red.
              overdue ? "font-medium text-grey-800" : "text-grey-500",
            )}
          >
            <CalendarClock className="size-3" strokeWidth={1.75} />
            {formatDueDate(ticket.dueAt)}
            {overdue ? <span className="sr-only"> — overdue</span> : null}
          </span>
        ) : null}

        {ticket.estimate !== null ? (
          <span className="tnum text-caption text-grey-500">
            {ticket.estimate} pt
          </span>
        ) : null}

        <UserAvatar userId={ticket.assigneeId} className="ml-auto" />
      </div>
    </div>
  );
}
