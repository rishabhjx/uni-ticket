import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Every empty area says what it is, why it is empty, and what to do next.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ElementType;
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
      <Icon className="size-6 text-grey-300" strokeWidth={1.5} />
      <p className="mt-3 text-heading font-semibold text-grey-900">{title}</p>
      <p className="mt-1 max-w-xs text-small text-grey-500">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-4 flex h-8 items-center rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
