"use client";

import { Check, X } from "lucide-react";

import { PriorityBadge, StatusBadge } from "@/components/tickets/badges";
import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getUser,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  users,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { useViewState } from "@/lib/store/view-state";

/**
 * After a release QA closes tickets in batches, and doing that one panel at a
 * time is the difference between a minute and twenty.
 */
export function BulkBar() {
  const { selection, clearSelection } = useViewState();
  const { updateMany } = useTicketStore();

  if (selection.length === 0) return null;

  const apply = (patch: Parameters<typeof updateMany>[1]) => {
    updateMany(selection, patch);
    clearSelection();
  };

  const triggerClass =
    "flex h-7 items-center gap-1.5 rounded-md border border-grey-300 bg-grey-0 px-2.5 text-small text-grey-800 transition-colors hover:border-grey-400";

  return (
    <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center px-6">
      <div className="flex items-center gap-2 rounded-md border border-grey-200 bg-grey-0 px-3 py-2 shadow-overlay">
        <span className="tnum text-small font-medium text-grey-900">
          {selection.length} selected
        </span>

        <span className="mx-1 h-4 w-px bg-grey-200" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={triggerClass}>
              Status
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {TICKET_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => apply({ status: status as TicketStatus })}
              >
                <StatusBadge status={status} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={triggerClass}>
              Priority
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {TICKET_PRIORITIES.map((priority) => (
              <DropdownMenuItem
                key={priority}
                onClick={() => apply({ priority: priority as TicketPriority })}
              >
                <PriorityBadge priority={priority} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={triggerClass}>
              Assignee
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="max-h-72 overflow-y-auto">
            <DropdownMenuItem onClick={() => apply({ assigneeId: null })}>
              <span className="flex items-center gap-2">
                <UserAvatar userId={null} />
                Unassigned
              </span>
            </DropdownMenuItem>
            {users.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => apply({ assigneeId: user.id })}
              >
                <span className="flex items-center gap-2">
                  <UserAvatar userId={user.id} />
                  {getUser(user.id)?.name}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={() => apply({ status: "done" })}
          className="flex h-7 items-center gap-1.5 rounded-md bg-accent-600 px-2.5 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700"
        >
          <Check className="size-3.5" strokeWidth={2.25} />
          Mark {STATUS_LABEL.done}
        </button>

        <button
          type="button"
          onClick={clearSelection}
          aria-label="Clear selection"
          className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
