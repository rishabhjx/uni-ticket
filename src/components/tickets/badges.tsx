import {
  Bug,
  ChevronsUp,
  ChevronUp,
  Minus,
  ChevronDown,
  Sparkles,
  SquareCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  type TicketPriority,
  type TicketStatus,
  type TicketType,
} from "@/lib/mock";
import { cn } from "@/lib/utils";

/**
 * The only colour in the product lives here. Every badge pairs its tint with a
 * text label, so colour never carries the meaning on its own.
 */
const statusTint: Record<TicketStatus, string> = {
  backlog: "bg-[var(--status-backlog-bg)] text-[var(--status-backlog-fg)]",
  todo: "bg-[var(--status-todo-bg)] text-[var(--status-todo-fg)]",
  in_progress: "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)]",
  in_review: "bg-[var(--status-review-bg)] text-[var(--status-review-fg)]",
  done: "bg-[var(--status-done-bg)] text-[var(--status-done-fg)]",
};

const priorityTint: Record<TicketPriority, string> = {
  urgent: "bg-[var(--priority-urgent-bg)] text-[var(--priority-urgent-fg)]",
  high: "bg-[var(--priority-high-bg)] text-[var(--priority-high-fg)]",
  // Medium is the default and carries no signal, so it stays neutral rather
  // than tinting half the board amber. Icon and label still tell them apart.
  medium: "bg-grey-100 text-grey-600",
  low: "bg-grey-50 text-grey-500",
};

const priorityIcon: Record<TicketPriority, LucideIcon> = {
  urgent: ChevronsUp,
  high: ChevronUp,
  medium: Minus,
  low: ChevronDown,
};

const typeIcon: Record<TicketType, LucideIcon> = {
  bug: Bug,
  feature: Sparkles,
  task: SquareCheck,
  chore: Wrench,
};

const badgeBase =
  "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-caption font-medium";

export function StatusBadge({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  return (
    <span className={cn(badgeBase, statusTint[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TicketPriority;
  className?: string;
}) {
  const Icon = priorityIcon[priority];
  return (
    <span className={cn(badgeBase, priorityTint[priority], className)}>
      <Icon className="size-3" strokeWidth={2.25} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

/** Type is structural, not status — it stays neutral. */
export function TypeIcon({
  type,
  className,
}: {
  type: TicketType;
  className?: string;
}) {
  const Icon = typeIcon[type];
  return (
    <Icon
      className={cn("size-3.5 shrink-0 text-grey-400", className)}
      strokeWidth={1.75}
      aria-label={TYPE_LABEL[type]}
    />
  );
}

export function LabelChip({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md bg-grey-100 px-1.5 py-0.5 text-caption text-grey-600",
        className,
      )}
    >
      {name}
    </span>
  );
}

export function TicketKey({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <span className={cn("tnum text-caption font-medium text-grey-500", className)}>
      {value}
    </span>
  );
}
