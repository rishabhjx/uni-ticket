import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Every empty area says what it is, why it is empty, and what to do next.
 * One emoji sets the tone; the words still do the work.
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
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <span aria-hidden className="text-3xl">
        {emoji}
      </span>
      <p className="mt-3 text-heading font-semibold text-grey-900">{title}</p>
      <p className="mt-1 max-w-xs text-small text-grey-500">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-4 flex h-8 items-center rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-[background-color,transform] hover:bg-accent-700 active:scale-95"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
