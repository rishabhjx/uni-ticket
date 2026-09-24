"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { useCelebrate } from "@/components/shared/celebrate";
import { PriorityBadge, StatusBadge } from "@/components/tickets/badges";
import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getProject,
  getUser,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";

/**
 * Changing an assignee used to be four actions: open the card, open the panel,
 * choose, close. On the card it is one.
 */
export function QuickAssign({
  ticket,
  children,
}: {
  ticket: Ticket;
  children: React.ReactNode;
}) {
  const { updateTicket } = useTicketStore();
  const members = getProject(ticket.projectId)?.memberIds ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Change assignee"
          onClick={(event) => event.stopPropagation()}
          className="tap rounded-full transition-opacity hover:opacity-80"
        >
          {children}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuLabel>Assignees</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => updateTicket(ticket.id, { assigneeIds: [] })}
        >
          <span className="flex items-center gap-2">
            <UserAvatar userId={null} />
            Unassigned
          </span>
        </DropdownMenuItem>
        {members.map((id) => {
          const picked = ticket.assigneeIds.includes(id);
          return (
            <DropdownMenuItem
              key={id}
              // Several people can hold one ticket, so a row toggles rather
              // than replaces. closeOnSelect stays on: ticking two people from
              // a card is rare enough that keeping the menu open would feel
              // stickier than it is worth.
              onClick={() =>
                updateTicket(ticket.id, {
                  assigneeIds: picked
                    ? ticket.assigneeIds.filter((item) => item !== id)
                    : [...ticket.assigneeIds, id],
                })
              }
            >
              <span className="flex w-full items-center gap-2">
                <UserAvatar userId={id} />
                <span className="flex-1">{getUser(id)?.name}</span>
                {picked ? (
                  <Check aria-hidden className="size-3.5 text-accent-600" strokeWidth={2.25} />
                ) : null}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function QuickStatus({ ticket }: { ticket: Ticket }) {
  const { updateTicket, updateMany, previewRouting } = useTicketStore();
  const celebrate = useCelebrate();

  /*
   * Routing hands the ticket to another team's owner when work crosses a
   * discipline boundary. That is the right behaviour and it used to happen in
   * silence: the person who had it lost it with no signal and no way back.
   * `updateMany` rather than `updateTicket` because it is what takes the undo
   * snapshot -- an action the product performs on your behalf has to be
   * reversible.
   */
  const setStatus = React.useCallback(
    (status: TicketStatus) => {
      const routedTo = previewRouting(ticket, { status });
      const before = { status: ticket.status, assigneeIds: ticket.assigneeIds };
      updateMany([ticket.id], { status });
      if (routedTo) {
        celebrate(
          "→",
          `${STATUS_LABEL[status]} · reassigned to ${getUser(routedTo)?.name ?? routedTo}`,
          // Put the exact previous values back rather than leaning on the
          // store's snapshot: that snapshot is taken in the same render this
          // callback closed over, so `undo` reads null the first time.
          () => updateMany([ticket.id], before),
        );
      }
    },
    [celebrate, previewRouting, ticket, updateMany],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Status: ${STATUS_LABEL[ticket.status]}`}
          onClick={(event) => event.stopPropagation()}
          className="flex min-w-0 transition-opacity hover:opacity-80"
        >
          <StatusBadge status={ticket.status} className="min-w-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {TICKET_STATUSES.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => setStatus(status as TicketStatus)}
          >
            <StatusBadge status={status} />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Priority</DropdownMenuLabel>
        {TICKET_PRIORITIES.map((priority) => (
          <DropdownMenuItem
            key={priority}
            onClick={() =>
              updateTicket(ticket.id, { priority: priority as TicketPriority })
            }
          >
            <PriorityBadge priority={priority} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
