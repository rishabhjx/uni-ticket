"use client";

import {
  AlertChip,
  LabelChip,
  PriorityBadge,
  SeverityBadge,
  StatusBadge,
} from "@/components/tickets/badges";
import { AssigneePicker } from "@/components/tickets/assignee-picker";
import { DueDatePicker } from "@/components/tickets/due-date-picker";
import { LabelPicker } from "@/components/tickets/label-picker";
import {
  AvatarStack,
  assigneeNames,
  UserAvatar,
} from "@/components/tickets/user-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatDueDate, formatRelative } from "@/lib/format";
import {
  daysInColumn,
  ENVIRONMENT_LABEL,
  ENVIRONMENTS,
  isDefect,
  isSlaBreached,
  isStale,
  SEVERITY_LABEL,
  TICKET_SEVERITIES,
  getLabel,
  getProject,
  getUser,
  isOverdue,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
  type Environment,
  type TicketPriority,
  type TicketSeverity,
  type TicketStatus,
} from "@/lib/mock";
import { randomCheer, useCelebrate } from "@/components/shared/celebrate";
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
      <span className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** A viewer sees the value without the affordance to change it. */
function ReadOnlyValue({ children }: { children: React.ReactNode }) {
  return <span className="flex items-center gap-2 px-1.5 text-small">{children}</span>;
}

/** Compact, borderless until hovered — the value is the thing, not the control. */
const triggerClass =
  "h-7 w-full justify-between border-transparent bg-transparent px-1.5 text-small shadow-none hover:bg-grey-100 focus:border-accent-600 data-[state=open]:bg-grey-100";

export function TicketFields({
  ticket,
  canEdit = true,
  sprintName,
}: {
  ticket: Ticket;
  canEdit?: boolean;
  sprintName?: string;
}) {
  const { updateTicket } = useTicketStore();
  const celebrate = useCelebrate();
  const project = getProject(ticket.projectId);
  const reporter = getUser(ticket.reporterId);
  const overdue = isOverdue(ticket);

  return (
    <div className="flex flex-col gap-2">
      <Field label="Status">
        {!canEdit ? (
          <ReadOnlyValue>
            <StatusBadge status={ticket.status} />
          </ReadOnlyValue>
        ) : (
        <Select
          value={ticket.status}
          onValueChange={(status) => {
            updateTicket(ticket.id, { status: status as TicketStatus });
            if (status === "done" && ticket.status !== "done") {
              celebrate(randomCheer(), "Nice — that's done");
            }
          }}
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
        )}
      </Field>

      <Field label="Priority">
        {!canEdit ? (
          <ReadOnlyValue>
            <PriorityBadge priority={ticket.priority} />
          </ReadOnlyValue>
        ) : (
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
        )}
      </Field>

      <Field label={ticket.assigneeIds.length > 1 ? "Assignees" : "Assignee"}>
        {!canEdit ? (
          <ReadOnlyValue>
            <AvatarStack userIds={ticket.assigneeIds} />
            {assigneeNames(ticket.assigneeIds)}
          </ReadOnlyValue>
        ) : (
          <AssigneePicker
            value={ticket.assigneeIds}
            memberIds={project?.memberIds ?? []}
            team={project?.team}
            onChange={(next) => updateTicket(ticket.id, { assigneeIds: next })}
          />
        )}
      </Field>

      {isDefect(ticket.type) ? (
        <>
          <Field label="Severity">
            <Select
              value={ticket.severity ?? "s3"}
              onValueChange={(severity) =>
                updateTicket(ticket.id, { severity: severity as TicketSeverity })
              }
            >
              <SelectTrigger className={triggerClass} aria-label="Severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TICKET_SEVERITIES.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    <SeverityBadge severity={severity} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Environment">
            <Select
              value={ticket.environment ?? "unknown"}
              onValueChange={(environment) =>
                updateTicket(ticket.id, {
                  environment: environment as Environment,
                })
              }
            >
              <SelectTrigger className={triggerClass} aria-label="Environment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENVIRONMENTS.map((environment) => (
                  <SelectItem key={environment} value={environment}>
                    {ENVIRONMENT_LABEL[environment]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Build">
            <span className="px-1.5 font-mono text-[12px] text-grey-700">
              {ticket.buildVersion ?? "—"}
            </span>
          </Field>
        </>
      ) : null}

      {ticket.requesterId ? (
        <Field label="Requester">
          <span className="flex items-center gap-2 px-1.5 text-small text-grey-700">
            <UserAvatar userId={ticket.requesterId} />
            {getUser(ticket.requesterId)?.name}
          </span>
        </Field>
      ) : null}

      {ticket.slaDueAt ? (
        <Field label="SLA">
          {isSlaBreached(ticket) ? (
            <span className="px-1.5">
              <AlertChip tone="breached">Breached {formatDueDate(ticket.slaDueAt)}</AlertChip>
            </span>
          ) : (
            <span className="px-1.5 text-small text-grey-700">
              Respond by {formatDueDate(ticket.slaDueAt)}
            </span>
          )}
        </Field>
      ) : null}

      <Field label="Labels" className="items-start">
        {!canEdit ? (
          ticket.labelIds.length > 0 ? (
            <div className="flex flex-wrap gap-1 py-1.5">
              {ticket.labelIds.map((id) => {
                const label = getLabel(id);
                return label ? <LabelChip key={id} name={label.name} /> : null;
              })}
            </div>
          ) : (
            <span className="px-1.5 py-1.5 text-small text-grey-500">None</span>
          )
        ) : (
          <LabelPicker
            value={ticket.labelIds}
            onChange={(labelIds) => updateTicket(ticket.id, { labelIds })}
          />
        )}
      </Field>

      <Field label="Due">
        {!canEdit ? (
          ticket.dueAt && overdue ? (
            <span className="px-1.5">
              <AlertChip>{formatDueDate(ticket.dueAt)} · overdue</AlertChip>
            </span>
          ) : (
            <span className="px-1.5 text-small text-grey-700">
              {ticket.dueAt ? formatDueDate(ticket.dueAt) : "—"}
            </span>
          )
        ) : (
          <DueDatePicker
            value={ticket.dueAt}
            overdue={overdue}
            onChange={(dueAt) => updateTicket(ticket.id, { dueAt })}
          />
        )}
      </Field>

      <Field label="Age">
        <span
          className={cn(
            "tnum px-1.5 text-small",
            isStale(ticket) ? "font-medium text-grey-900" : "text-grey-700",
          )}
        >
          {daysInColumn(ticket)}d in {STATUS_LABEL[ticket.status].toLowerCase()}
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

      {sprintName ? (
        <Field label="Sprint">
          <span className="px-1.5 text-small text-grey-700">{sprintName}</span>
        </Field>
      ) : null}

      <Field label="Project">
        <span className="px-1.5 text-small text-grey-700">{project?.name}</span>
      </Field>
    </div>
  );
}

export { STATUS_LABEL, PRIORITY_LABEL };
