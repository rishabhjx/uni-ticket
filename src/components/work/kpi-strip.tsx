"use client";

import { cn } from "@/lib/utils";
import type { PersonalKpis } from "@/lib/mock";
import { useViewState, type TicketFilters } from "@/lib/store/view-state";

type Tile = {
  key: keyof PersonalKpis;
  label: string;
  filter: Partial<TicketFilters>;
  /** Overdue and stale mean something is wrong, so they get the alert tint. */
  alert?: boolean;
};

const tiles: Tile[] = [
  { key: "total", label: "Total", filter: {} },
  { key: "pending", label: "Pending", filter: { statuses: ["backlog", "todo"] } },
  {
    key: "inProgress",
    label: "In progress",
    filter: { statuses: ["in_progress", "in_review"] },
  },
  { key: "overdue", label: "Overdue", filter: { overdueOnly: true }, alert: true },
  { key: "stale", label: "Stale", filter: { staleOnly: true }, alert: true },
  { key: "assignedThisWeek", label: "This week", filter: {} },
];

/**
 * The KPI row sits above the list and filters it in place, so the numbers and
 * the rows below them can never disagree.
 */
export function KpiStrip({ kpis }: { kpis: PersonalKpis }) {
  const { filters, setFilters } = useViewState();

  const isActive = (tile: Tile) => {
    const entries = Object.entries(tile.filter);
    if (entries.length === 0) return false;
    return entries.every(([key, value]) =>
      Array.isArray(value)
        ? value.every((item) => filters[key as "statuses"].includes(item))
        : filters[key as "overdueOnly"] === value,
    );
  };

  return (
    <div className="hairline-b grid grid-cols-3 gap-2 px-6 py-3 lg:grid-cols-6">
      {tiles.map((tile) => {
        const active = isActive(tile);
        const value = kpis[tile.key];

        return (
          <button
            key={tile.key}
            type="button"
            aria-pressed={active}
            onClick={() =>
              setFilters(
                active
                  ? { ...filters, ...emptyOf(tile) }
                  : { ...filters, ...tile.filter },
              )
            }
            className={cn(
              "flex flex-col items-start rounded-md border px-3 py-2 text-left transition-colors",
              active
                ? "border-accent-200 bg-accent-50"
                : "border-grey-200 hover:border-grey-300",
            )}
          >
            <span className="text-caption font-medium tracking-wide text-grey-500 uppercase">
              {tile.label}
            </span>
            <span
              className={cn(
                "tnum text-[22px] leading-7 font-semibold",
                tile.alert && value > 0
                  ? "text-[var(--priority-urgent-fg)]"
                  : "text-grey-900",
              )}
            >
              {value}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Turning a tile off clears only the keys that tile set. */
function emptyOf(tile: Tile): Partial<TicketFilters> {
  const cleared: Partial<TicketFilters> = {};
  for (const key of Object.keys(tile.filter) as (keyof TicketFilters)[]) {
    if (key === "overdueOnly" || key === "staleOnly" || key === "breachedOnly") {
      cleared[key] = false;
    } else if (key !== "search") {
      cleared[key] = [] as never;
    }
  }
  return cleared;
}
