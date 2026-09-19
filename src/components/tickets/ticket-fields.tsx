"use client";

import {
  LabelChip,
  PriorityBadge,
  StatusBadge,
} from "@/components/tickets/badges";
import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatDueDate, formatRelative } from "@/lib/format";
import {
  getLabel,
  getProject,
  getUser,
  isOverdue,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-[92px_1fr] items-center gap-3", className)}>
      <span className="text-caption font-medium tracking-wide text-grey-500 uppercase">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Compact, borderless until hovered — the value is the thing, not the control. */
const triggerClass =
  "h-7 w-full justify-between border-transparent bg-transparent px-1.5 text-small shadow-none hover:bg-grey-100 focus:border-accent-600 data-[state=open]:bg-grey-100";

export function TicketFields({ ticket }: { ticket: Ticket }) {
  const { updateTicket } = useTicketStore();
  const project = getProject(ticket.projectId);
  const reporter = getUser(ticket.reporterId);
  const overdue = isOverdue(ticket);

  return (
    <div className="flex flex-col gap-2">
      <Field label="Status">
        <Select
          value={ticket.status}
          onValueChange={(status) =>
            updateTicket(ticket.id, { status: status as TicketStatus })
          }
        >
          <SelectTrigger className={triggerClass} aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TICKET_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                <StatusBadge status={status} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Priority">
        <Select
          value={ticket.priority}
          onValueChange={(priority) =>
            updateTicket(ticket.id, { priority: priority as TicketPriority })
          }
        >
          <SelectTrigger className={triggerClass} aria-label="Priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TICKET_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                <PriorityBadge priority={priority} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Assignee">
        <Select
          value={ticket.assigneeId ?? "unassigned"}
          onValueChange={(value) =>
            updateTicket(ticket.id, {
              assigneeId: value === "unassigned" ? null : value,
            })
          }
        >
          <SelectTrigger className={triggerClass} aria-label="Assignee">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">
              <span className="flex items-center gap-2 text-small text-grey-500">
                <UserAvatar userId={null} />
                Unassigned
              </span>
            </SelectItem>
            {(project?.memberIds ?? []).map((id) => (
              <SelectItem key={id} value={id}>
                <span className="flex items-center gap-2 text-small">
                  <UserAvatar userId={id} />
                  {getUser(id)?.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Labels" className="items-start">
        {ticket.labelIds.length > 0 ? (
          <div className="flex flex-wrap gap-1 py-1.5">
            {ticket.labelIds.map((id) => {
              const label = getLabel(id);
              return label ? <LabelChip key={id} name={label.name} /> : null;
            })}
          </div>
        ) : (
          <span className="px-1.5 py-1.5 text-small text-grey-400">None</span>
        )}
      </Field>

      <Field label="Due">
        <span
          className={cn(
            "px-1.5 text-small",
            overdue ? "font-medium text-grey-900" : "text-grey-700",
          )}
        >
          {ticket.dueAt ? formatDueDate(ticket.dueAt) : "—"}
          {overdue ? (
            <span className="ml-1.5 text-caption font-medium text-grey-500">
              Overdue
            </span>
          ) : null}
        </span>
      </Field>

      <Field label="Estimate">
        <span className="tnum px-1.5 text-small text-grey-700">
          {ticket.estimate !== null ? `${ticket.estimate} points` : "—"}
        </span>
      </Field>

      <Field label="Reporter">
        <span className="flex items-center gap-2 px-1.5 text-small text-grey-700">
          <UserAvatar userId={ticket.reporterId} />
          {reporter?.name}
        </span>
      </Field>

      <Field label="Created">
        <span className="px-1.5 text-small text-grey-700">
          {formatDate(ticket.createdAt)}
        </span>
      </Field>

      <Field label="Updated">
        <span className="px-1.5 text-small text-grey-700">
          {formatRelative(ticket.updatedAt)}
        </span>
      </Field>

      <Field label="Project">
        <span className="px-1.5 text-small text-grey-700">{project?.name}</span>
      </Field>
    </div>
  );
}

export { STATUS_LABEL, PRIORITY_LABEL };
