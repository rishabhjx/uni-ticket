"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useViewState } from "@/lib/store/view-state";
import { cn } from "@/lib/utils";

/**
 * Saved views were write-only: you could name one and nothing ever showed it
 * again. A view is the whole URL — conditions, grouping, density — so
 * recalling one is a link, and the browser does the rest.
 *
 * Only views saved on this screen are offered. A board's grouping means
 * nothing on Insights, and a list of every view ever saved anywhere is a list
 * nobody reads.
 */
export function SavedViews() {
  const pathname = usePathname();
  const { savedViews, removeSavedView } = useViewState();
  const mine = savedViews.filter((view) => view.path === pathname);

  if (mine.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-grey-200 px-2 text-small text-grey-600 transition-colors",
            "hover:border-grey-300 hover:text-grey-900",
          )}
        >
          <Bookmark className="size-3.5" strokeWidth={1.75} />
          Views
          <span className="tnum text-caption text-grey-400">{mine.length}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Saved views</DropdownMenuLabel>
        {mine.map((view) => (
          <DropdownMenuItem key={view.id} asChild className="gap-2">
            <Link href={view.query ? `${view.path}?${view.query}` : view.path}>
              <span className="min-w-0 flex-1 truncate">{view.name}</span>
              <button
                type="button"
                aria-label={`Delete ${view.name}`}
                onClick={(event) => {
                  // Without this the menu item navigates as it deletes.
                  event.preventDefault();
                  event.stopPropagation();
                  removeSavedView(view.id);
                }}
                className="shrink-0 text-grey-400 transition-colors hover:text-[color:var(--danger)]"
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </button>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
