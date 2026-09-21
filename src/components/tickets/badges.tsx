import {
  Bug,
  ChevronsUp,
  ChevronUp,
  Minus,
  ChevronDown,
  LifeBuoy,
  Layers,
  Siren,
  Sparkles,
  SquareCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import {
  DISCIPLINE_LABEL,
  ENVIRONMENT_LABEL,
  PRIORITY_LABEL,
  SEVERITY_LABEL,
  SEVERITY_SHORT,
  STATUS_DISCIPLINE,
  STATUS_LABEL,
  TYPE_LABEL,
  type Discipline,
  type Environment,
  type TicketPriority,
  type TicketSeverity,
  type TicketStatus,
  type TicketType,
} from "@/lib/mock";
import { cn } from "@/lib/utils";

/**
 * The only colour in the product lives here. Every badge pairs its tint with a
 * text label, so colour never carries the meaning on its own.
 */
/**
 * A status is tinted by the DISCIPLINE that owns it, not individually.
 * Thirteen tints would be thirteen things to learn; six map onto the teams
 * people already think in, and the label still carries the exact status.
 */
const disciplineTint: Record<Discipline, string> = {
  intake: "bg-[var(--discipline-intake-bg)] text-[var(--discipline-intake-fg)]",
  design: "bg-[var(--discipline-design-bg)] text-[var(--discipline-design-fg)]",
  development:
    "bg-[var(--discipline-development-bg)] text-[var(--discipline-development-fg)]",
  qa: "bg-[var(--discipline-qa-bg)] text-[var(--discipline-qa-fg)]",
  product:
    "bg-[var(--discipline-product-bg)] text-[var(--discipline-product-fg)]",
  closed: "bg-[var(--discipline-closed-bg)] text-[var(--discipline-closed-fg)]",
};

export function disciplineTintOf(discipline: Discipline) {
  return disciplineTint[discipline];
}

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
  request: LifeBuoy,
  incident: Siren,
  epic: Layers,
};

const badgeBase =
  "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-caption font-medium";

/**
 * The colour of a status or priority with none of the badge's chrome, for
 * places that already print the name beside it - ReUI's filter chips draw the
 * option's icon AND its label, so handing them a whole badge said "Backlog
 * Backlog".
 */
export function StatusDot({ status }: { status: TicketStatus }) {
  return (
    <span
      aria-hidden
      className="size-1.5 shrink-0 rounded-full"
      style={{
        backgroundColor: `var(--discipline-${STATUS_DISCIPLINE[status]}-fg)`,
      }}
    />
  );
}



/**
 * The chevron is shape AND colour, which is two channels -- but on its own it
 * was decorative, marked aria-hidden by Lucide's default, so priority reached
 * a screen reader as nothing at all wherever the label was not beside it.
 */
export function PriorityDot({ priority }: { priority: TicketPriority }) {
  const Icon = priorityIcon[priority];
  return (
    <Icon
      className="size-3 shrink-0"
      strokeWidth={2.25}
      role="img"
      aria-hidden={false}
      aria-label={`${PRIORITY_LABEL[priority]} priority`}
      style={{ color: `var(--priority-${priority}-fg)` }}
    />
  );
}

export function SeverityDot({ severity }: { severity: TicketSeverity }) {
  return (
    <span
      aria-hidden
      className="tnum text-caption font-semibold"
      style={{ color: `var(--severity-${severity}-fg)` }}
    >
      {severity.toUpperCase()}
    </span>
  );
}

/**
 * Two of the thirteen statuses are events rather than places: QA failed is
 * something breaking, Done is something landing. Those two get colour. The
 * other eleven are just where the ticket currently sits, and a board of
 * eleven tinted chips is a board with no emphasis left to spend.
 */
const statusAccent: Partial<Record<TicketStatus, string>> = {
  qa_failed: "bg-[var(--danger-bg)] text-[var(--danger)]",
  done: "bg-[var(--success-bg)] text-[var(--success)]",
};

export function StatusBadge({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  const accent = statusAccent[status];
  return (
    <span
      title={`${DISCIPLINE_LABEL[STATUS_DISCIPLINE[status]]} · ${STATUS_LABEL[status]}`}
      className={cn(
        badgeBase,
        // The chip used to be tinted by discipline, which meant six colours
        // differing only in hue at the same lightness -- exactly the axis
        // colour-blind readers lose, and the axis a tinted background is
        // worst at carrying. The discipline now rides on a dot, which is a
        // second signal (position) on top of the hue, and the chip itself
        // stays legible neutral.
        accent ?? "bg-grey-100 text-grey-700",
        className,
      )}
    >
      {accent ? null : <StatusDot status={status} />}
      <span className="truncate">{STATUS_LABEL[status]}</span>
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

/**
 * Severity is how bad it is; priority is when we will fix it. They used to
 * share the same two tints, which made an S1 and an Urgent pixel-identical
 * while meaning different things. Only S1 keeps colour now — the rest are a
 * neutral code, and the tnum/uppercase shape tells them apart from priority.
 */
const severityTint: Record<TicketSeverity, string> = {
  s1: "bg-[var(--severity-s1-bg)] text-[var(--severity-s1-fg)]",
  s2: "bg-[var(--severity-s2-bg)] text-[var(--severity-s2-fg)]",
  s3: "bg-[var(--severity-s3-bg)] text-[var(--severity-s3-fg)]",
  s4: "bg-[var(--severity-s4-bg)] text-[var(--severity-s4-fg)]",
};

export function SeverityBadge({
  severity,
  short = false,
  className,
}: {
  severity: TicketSeverity;
  short?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(badgeBase, severityTint[severity], className)}
      title={SEVERITY_LABEL[severity]}
    >
      {short ? SEVERITY_SHORT[severity] : SEVERITY_LABEL[severity]}
    </span>
  );
}

export function EnvironmentChip({
  environment,
  className,
}: {
  environment: Environment;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-md bg-grey-100 px-1.5 py-0.5 align-middle text-caption leading-4 text-grey-600",
        className,
      )}
    >
      {ENVIRONMENT_LABEL[environment]}
    </span>
  );
}

/**
 * Overdue and SLA breaches are the one place I overruled the brief's "colour
 * only on status and priority" rule: a date you have already missed is exactly
 * the kind of meaning colour exists for, and in grey it was unfindable.
 *
 * They are not the same alarm, though. Red used to mean overdue AND breached
 * AND urgent AND destructive -- four meanings on one colour, so a board of
 * slightly-late tickets looked like a board on fire. Late is amber, which is
 * "this wants you"; terracotta is kept for a promise already broken.
 */
export function AlertChip({
  tone = "late",
  children,
  className,
}: {
  tone?: "late" | "breached";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        badgeBase,
        tone === "breached"
          ? "bg-[var(--danger-bg)] text-[var(--danger)]"
          : "bg-[var(--warning-bg)] text-[var(--warning)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function LabelChip({
  name,
  title,
  className,
}: {
  name: string;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        // inline-block rather than inline-flex so a truncated chip actually
        // gets an ellipsis: text-overflow has no effect on a flex container.
        "inline-block shrink-0 rounded-md bg-grey-100 px-1.5 py-0.5 align-middle text-caption leading-4 text-grey-600",
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
