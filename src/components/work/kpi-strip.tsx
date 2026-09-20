"use client";

import { cn } from "@/lib/utils";
import type { PersonalKpis } from "@/lib/mock";
import { useViewState } from "@/lib/store/view-state";
import type { FilterRule } from "@/components/reui/filters/filters-types";

/**
 * Each tile is one condition in the query language the bar speaks, so clicking
 * a tile and building the same thing by hand produce the same URL — and the
 * chip it adds is removable from the bar like any other.
 */
type Tile = {
  key: keyof PersonalKpis;
  label: string;
  rule: FilterRule<unknown> | null;
  /** Overdue and stale mean something is wrong, so they get the alert tint. */
  alert?: boolean;
};

const rule = (
  id: string,
  field: string,
  operator: string,
  value: unknown,
): FilterRule<unknown> => ({
  // A stable id per tile, so toggling one twice does not stack two chips.
  id: `kpi-${id}`,
  type: "rule",
  path: [field],
  operator,
  value,
});

const tiles: Tile[] = [
  { key: "total", label: "Total", rule: null },
  {
    key: "pending",
    label: "Pending",
    rule: rule("pending", "status", "is_any_of", [
      "backlog",
      "triage",
      "design_todo",
      "todo",
      "ready_for_qa",
    ]),
  },
  {
    key: "inProgress",
    label: "In progress",
    rule: rule("inProgress", "status", "is_any_of", [
      "in_design",
      "design_review",
      "in_progress",
      "code_review",
      "in_qa",
      "product_review",
    ]),
  },
  {
    key: "overdue",
    label: "Overdue",
    rule: rule("overdue", "overdue", "is", true),
    alert: true,
  },
  {
    key: "stale",
    label: "Stale",
    rule: rule("stale", "stale", "is", true),
    alert: true,
  },
  { key: "assignedThisWeek", label: "This week", rule: null },
];

/**
 * The KPI row sits above the list and filters it in place, so the numbers and
 * the rows below them can never disagree.
 */
export function KpiStrip({ kpis }: { kpis: PersonalKpis }) {
  const { filters, setFilters } = useViewState();

  const isActive = (tile: Tile) =>
    tile.rule
      ? filters.query.rules.some(
          (node) => node.type === "rule" && node.id === tile.rule!.id,
        )
      : false;

  const toggle = (tile: Tile) => {
    if (!tile.rule) return;
    const without = filters.query.rules.filter(
      (node) => !(node.type === "rule" && node.id === tile.rule!.id),
    );
    setFilters({
      ...filters,
      query: {
        ...filters.query,
        rules: isActive(tile) ? without : [...without, tile.rule],
      },
    });
  };

  return (
    <div className="hairline-b grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-3 sm:px-6 lg:grid-cols-6">
      {tiles.map((tile) => {
        const active = isActive(tile);
        const value = kpis[tile.key];

        return (
          <button
            key={tile.key}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(tile)}
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
