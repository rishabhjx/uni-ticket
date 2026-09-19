"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Columns3, Rows3 } from "lucide-react";

import { cn } from "@/lib/utils";

const views = [
  { segment: "board", label: "Board", icon: Columns3 },
  { segment: "list", label: "List", icon: Rows3 },
] as const;

export function ViewSwitcher({ projectSlug }: { projectSlug: string }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-grey-100 p-0.5">
      {views.map(({ segment, label, icon: Icon }) => {
        const href = `/projects/${projectSlug}/${segment}`;
        const active = pathname === href;
        return (
          <Link
            key={segment}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-6 items-center gap-1.5 rounded-md px-2 text-caption font-medium transition-colors",
              active
                ? "bg-grey-0 text-grey-900"
                : "text-grey-600 hover:text-grey-900",
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.75} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
