"use client";

import { CalendarClock, GitPullRequest, Hourglass, Paperclip } from "lucide-react";

import {
  AlertChip,
  LabelChip,
  PriorityBadge,
  SeverityBadge,
  TicketKey,
  TypeIcon,
} from "@/components/tickets/badges";
import { QuickAssign, QuickStatus } from "@/components/tickets/quick-actions";
import { AvatarStack } from "@/components/tickets/user-avatar";
import { formatDueDate } from "@/lib/format";
import {
  daysInColumn,
  getLabel,
  isOverdue,
  isSlaBreached,
  isStale,
  type Ticket,
} from "@/lib/mock";
import { cn } from "@/lib/utils";

export function TicketCard({
  ticket,
  onOpen,
  /** False when the column already is the status, which most boards are. */
  showStatus = true,
}: {
  ticket: Ticket;
  onOpen?: (ticketId: string) => void;
  showStatus?: boolean;
}) {
  const overdue = isOverdue(ticket);
  const breached = isSlaBreached(ticket);
  const stale = isStale(ticket);

  return (
    <div
      className="group/card flex flex-col gap-2 p-3"
      onClick={onOpen ? () => onOpen(ticket.key) : undefined}
    >
      <div className="flex items-center gap-1.5">
        <TypeIcon type={ticket.type} />
        <TicketKey value={ticket.key} />
        {ticket.severity ? (
          <SeverityBadge severity={ticket.severity} short />
        ) : null}
        <span
          className={cn(
            "ml-auto",
            // Repeating the column name on every card is noise; the control
            // is still there on hover for changing it.
            !showStatus &&
              "opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100",
          )}
        >
          <QuickStatus ticket={ticket} />
        </span>
      </div>

      <p className="truncate text-small leading-[18px] font-medium text-grey-900">
        {ticket.title}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <PriorityBadge priority={ticket.priority} />
        {ticket.labelIds.slice(0, 2).map((id) => {
          const label = getLabel(id);
          return label ? <LabelChip key={id} name={label.name} /> : null;
        })}
        {ticket.labelIds.length > 2 ? (
          <span className="tnum text-caption text-grey-400">
            +{ticket.labelIds.length - 2}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {breached ? (
          <AlertChip>SLA breached</AlertChip>
        ) : overdue && ticket.dueAt ? (
          <AlertChip>{formatDueDate(ticket.dueAt)}</AlertChip>
        ) : ticket.dueAt ? (
          <span className="inline-flex items-center gap-1 text-caption text-grey-500">
            <CalendarClock className="size-3" strokeWidth={1.75} />
            {formatDueDate(ticket.dueAt)}
          </span>
        ) : null}

        {stale ? (
          <span
            className="inline-flex items-center gap-1 text-caption font-medium text-grey-700"
            title={`${daysInColumn(ticket)} days in this column`}
          >
            <Hourglass className="size-3" strokeWidth={2} />
            {daysInColumn(ticket)}d
          </span>
        ) : null}

        {ticket.development ? (
          <GitPullRequest
            className={cn(
              "size-3",
              ticket.development.checks === "failing"
                ? "text-[var(--priority-urgent-fg)]"
                : "text-grey-400",
            )}
            strokeWidth={2}
            aria-label={`PR #${ticket.development.prNumber}`}
          />
        ) : null}

        {ticket.attachments.length > 0 ? (
          <span className="inline-flex items-center gap-0.5 text-caption text-grey-500">
            <Paperclip className="size-3" strokeWidth={2} />
            {ticket.attachments.length}
          </span>
        ) : null}

        <span className="ml-auto">
          <QuickAssign ticket={ticket}>
            <AvatarStack userIds={ticket.assigneeIds} />
          </QuickAssign>
        </span>
      </div>
    </div>
  );
}
