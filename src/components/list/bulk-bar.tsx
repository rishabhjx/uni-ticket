"use client";

import * as React from "react";

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
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/mock";
import { randomCheer, useCelebrate } from "@/components/shared/celebrate";
import { useTicketStore } from "@/lib/store/ticket-store";
import { useViewState } from "@/lib/store/view-state";

/**
 * After a release QA closes tickets in batches, and doing that one panel at a
 * time is the difference between a minute and twenty.
 */
export function BulkBar() {
  const { selection, clearSelection } = useViewState();
  const { tickets, updateMany } = useTicketStore();
  const celebrate = useCelebrate();

  if (selection.length === 0) return null;

  /**
   * Only "Mark done" used to offer a way back — reassigning or bulk-changing
   * the status/priority of a dozen tickets is just as hard to eyeball your
   * way out of, and got no undo at all. Each ticket keeps its OWN prior
   * value, snapshotted here before the patch lands: a mixed selection
   * restores to what it actually was, not to whatever the first ticket in it
   * happened to hold.
   */
  const applyWithUndo = (patch: Partial<Ticket>) => {
    const keys = Object.keys(patch) as (keyof Ticket)[];
    const before = tickets
      .filter((ticket) => selection.includes(ticket.id))
      .map((ticket) => ({
        id: ticket.id,
        prior: Object.fromEntries(
          keys.map((key) => [key, ticket[key]]),
        ) as Partial<Ticket>,
      }));
    const count = selection.length;

    updateMany(selection, patch);
    clearSelection();
    return {
      count,
      restore: () => {
        for (const entry of before) updateMany([entry.id], entry.prior);
      },
    };
  };

  const apply = (patch: Partial<Ticket>, label: string) => {
    const { count, restore } = applyWithUndo(patch);
    celebrate(
      "→",
      `${label} · ${count} ${count === 1 ? "ticket" : "tickets"}`,
      restore,
    );
  };

  const triggerClass =
    "flex h-7 items-center gap-1.5 rounded-md border border-grey-300 bg-grey-0 px-2.5 text-small text-grey-800 transition-colors hover:border-grey-400";

  return (
    <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center px-6">
      {/*
        The bar appearing IS the announcement -- a bulk action changes a lot
        of rows at once and used to do it silently. role="status" on the count
        means ticking a box says how many are now selected.
      */}
      <div
        role="status"
        aria-live="polite"
        className="glass-strong flex items-center gap-2 rounded-md border border-grey-200 px-3 py-2 shadow-overlay"
      >
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
                onClick={() =>
                  apply(
                    { status: status as TicketStatus },
                    `Moved to ${STATUS_LABEL[status]}`,
                  )
                }
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
                onClick={() =>
                  apply(
                    { priority: priority as TicketPriority },
                    "Priority changed",
                  )
                }
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
            <DropdownMenuItem onClick={() => apply({ assigneeIds: [] }, "Unassigned")}>
              <span className="flex items-center gap-2">
                <UserAvatar userId={null} />
                Unassigned
              </span>
            </DropdownMenuItem>
            {users.map((user) => (
              <DropdownMenuItem
                key={user.id}
                // A bulk action sets the whole list rather than adding to it:
                // "assign these twelve to Priya" should not silently keep
                // whoever happened to be on each one.
                onClick={() =>
                  apply(
                    { assigneeIds: [user.id] },
                    `Assigned to ${getUser(user.id)?.name ?? user.id}`,
                  )
                }
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
          onClick={() => {
            const { count, restore } = applyWithUndo({ status: "done" });
            celebrate(
              randomCheer(),
              count === 1 ? "One down" : `${count} tickets closed`,
              // Closing twenty tickets with no way back is not a safe action.
              restore,
            );
          }}
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
