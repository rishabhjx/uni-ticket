import Link from "next/link";

import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  href,
  emphasis = false,
}: {
  label: string;
  value: number;
  hint: string;
  href: string;
  /** Overdue carries weight rather than colour, which is reserved elsewhere. */
  emphasis?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-md border border-grey-200 p-4 transition-colors hover:border-grey-300"
    >
      <span className="text-caption font-medium tracking-wide text-grey-500 uppercase">
        {label}
      </span>
      <span
        className={cn(
          "tnum mt-2 text-metric font-semibold",
          emphasis && value > 0 ? "text-grey-900" : "text-grey-800",
        )}
      >
        {value}
      </span>
      <span className="mt-1 text-small text-grey-500">{hint}</span>
    </Link>
  );
}
