"use client";

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
          className="rounded-full transition-opacity hover:opacity-80"
        >
          {children}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuLabel>Assignee</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => updateTicket(ticket.id, { assigneeId: null })}>
          <span className="flex items-center gap-2">
            <UserAvatar userId={null} />
            Unassigned
          </span>
        </DropdownMenuItem>
        {members.map((id) => (
          <DropdownMenuItem
            key={id}
            onClick={() => updateTicket(ticket.id, { assigneeId: id })}
          >
            <span className="flex items-center gap-2">
              <UserAvatar userId={id} />
              {getUser(id)?.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function QuickStatus({ ticket }: { ticket: Ticket }) {
  const { updateTicket } = useTicketStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Status: ${STATUS_LABEL[ticket.status]}`}
          onClick={(event) => event.stopPropagation()}
          className="transition-opacity hover:opacity-80"
        >
          <StatusBadge status={ticket.status} />
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
            onClick={() =>
              updateTicket(ticket.id, { status: status as TicketStatus })
            }
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
