"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useViewState,
  type GroupBy,
  type Swimlane,
} from "@/lib/store/view-state";

const options: { value: GroupBy; label: string }[] = [
  { value: "discipline", label: "Stage" },
  { value: "status", label: "Status" },
  { value: "assignee", label: "Assignee" },
  { value: "priority", label: "Priority" },
  { value: "severity", label: "Severity" },
  { value: "type", label: "Type" },
];

export const GROUP_BY_LABEL: Record<GroupBy, string> = Object.fromEntries(
  options.map((option) => [option.value, option.label]),
) as Record<GroupBy, string>;

const lanes: { value: Swimlane; label: string }[] = [
  { value: "none", label: "None" },
  { value: "assignee", label: "Assignee" },
  { value: "priority", label: "Priority" },
  { value: "epic", label: "Epic" },
];

/** A PM wants the same board grouped by assignee to spot who is overloaded. */
export function GroupBySelect() {
  const { groupBy, setGroupBy, swimlane, setSwimlane } = useViewState();

  return (
    <>
    <label className="flex shrink-0 items-center gap-1.5">
      <span className="text-caption tracking-[0.07em] text-grey-500 uppercase">
        Group
      </span>
      <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
        <SelectTrigger
          className="h-7 w-[112px] border-grey-200 text-small"
          aria-label="Group board by"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>

    <label className="flex shrink-0 items-center gap-1.5">
      <span className="text-caption tracking-[0.07em] text-grey-500 uppercase">
        Lanes
      </span>
      <Select
        value={swimlane}
        onValueChange={(value) => setSwimlane(value as Swimlane)}
      >
        <SelectTrigger
          className="h-7 w-[104px] border-grey-200 text-small"
          aria-label="Swimlanes"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {lanes.map((lane) => (
            <SelectItem key={lane.value} value={lane.value}>
              {lane.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
    </>
  );
}
