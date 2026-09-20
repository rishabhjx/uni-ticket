import Link from "next/link";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/reui/empty";
import { cn } from "@/lib/utils";

/**
 * Every empty area says what it is, why it is empty, and what to do next.
 *
 * The last clause used to be optional and usually skipped, which made the
 * most common empty state in the product -- "no tickets match your filters"
 * -- a dead end: the only way out was to find the filter you had set and
 * undo it by hand. An empty state without an action is a wall.
 *
 * ReUI's Empty supplies the structure: the centring, the max-width on the
 * header so a long sentence wraps before it gets unreadable, the media slot.
 */
type Action =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

export function EmptyState({
  emoji,
  title,
  description,
  action,
  secondary,
  className,
}: {
  emoji: string;
  title: string;
  description: string;
  action?: Action;
  secondary?: Action;
  className?: string;
}) {
  return (
    <Empty className={cn("px-6 py-16", className)}>
      <EmptyHeader>
        {/*
         * A ring around the glyph rather than a bare emoji floating in space:
         * it reads as a designed mark instead of as a character someone
         * forgot to replace, and it gives the block a centre of gravity.
         */}
        <EmptyMedia
          variant="icon"
          className="flex size-14 items-center justify-center rounded-full bg-grey-50 text-2xl ring-1 ring-grey-200 ring-inset"
        >
          <span aria-hidden>{emoji}</span>
        </EmptyMedia>
        <EmptyTitle className="mt-4 text-heading font-semibold text-grey-900">
          {title}
        </EmptyTitle>
        <EmptyDescription className="mt-1.5 max-w-xs text-small text-grey-600">
          {description}
        </EmptyDescription>
      </EmptyHeader>
      {action || secondary ? (
        <EmptyContent className="mt-5 flex flex-row items-center gap-2">
          {action ? <ActionButton action={action} primary /> : null}
          {secondary ? <ActionButton action={secondary} /> : null}
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

function ActionButton({
  action,
  primary = false,
}: {
  action: Action;
  primary?: boolean;
}) {
  const className = cn(
    "flex h-8 items-center rounded-md px-3 text-small font-medium transition-[background-color,border-color,transform] active:scale-[0.98]",
    primary
      ? "bg-accent-600 text-grey-0 hover:bg-accent-700"
      : "border border-grey-200 text-grey-700 hover:border-grey-300 hover:text-grey-900",
  );
  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}
