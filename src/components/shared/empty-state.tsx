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
 * One emoji sets the tone; the words still do the work.
 *
 * ReUI's Empty supplies the structure - the centring, the max-width on the
 * header so a long sentence wraps before it gets unreadable, the media slot.
 * Its own typography rides on `cn-*` classes that live in ReUI's stylesheet,
 * which this project does not ship, so the type comes from our tokens
 * instead. That is the arrangement everywhere: their layout, our skin.
 */
export function EmptyState({
  emoji,
  title,
  description,
  action,
  className,
}: {
  emoji: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <Empty className={cn("px-6 py-16", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="text-3xl">
          <span aria-hidden>{emoji}</span>
        </EmptyMedia>
        <EmptyTitle className="mt-3 text-heading font-semibold text-grey-900">
          {title}
        </EmptyTitle>
        <EmptyDescription className="mt-1 max-w-xs text-small text-grey-500">
          {description}
        </EmptyDescription>
      </EmptyHeader>
      {action ? (
        <EmptyContent className="mt-4">
          <Link
            href={action.href}
            className="flex h-8 items-center rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-[background-color,transform] hover:bg-accent-700 active:scale-95"
          >
            {action.label}
          </Link>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
