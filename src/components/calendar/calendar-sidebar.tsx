"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Calendar as MiniCalendar } from "@/components/reui/calendar";
import { personToneClass } from "@/components/tickets/user-avatar";
import { CURRENT_USER_ID, getUser, users } from "@/lib/mock";
import { startOfMonth } from "@/lib/mock/dates";
import { cn } from "@/lib/utils";

export function CalendarSidebar({
  anchor,
  onAnchorChange,
  visibleUserIds,
  onToggleUser,
  onCreateClick,
}: {
  anchor: Date;
  onAnchorChange: (date: Date) => void;
  visibleUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
  onCreateClick: () => void;
}) {
  /*
   * The mini picker browses its own month independently once open (its own
   * prev/next), but should snap back to whatever month the main view just
   * jumped to (Today, prev/next, a typed date). Comparing against the last
   * anchor seen and adjusting right here — not in an effect — is the
   * documented way to reset state in response to a prop change without an
   * extra render.
   */
  const [pickerMonth, setPickerMonth] = React.useState(() => startOfMonth(anchor));
  const [lastAnchor, setLastAnchor] = React.useState(anchor);
  if (anchor !== lastAnchor) {
    setLastAnchor(anchor);
    setPickerMonth(startOfMonth(anchor));
  }

  const others = users.filter((user) => user.id !== CURRENT_USER_ID);
  const me = getUser(CURRENT_USER_ID);

  return (
    <aside className="hairline-r flex w-64 shrink-0 flex-col gap-4 overflow-y-auto px-3 py-3">
      <button
        type="button"
        onClick={onCreateClick}
        className="flex h-10 items-center gap-2 self-start rounded-full bg-grey-0 pr-4 pl-3 text-small font-medium text-grey-900 shadow-[0_1px_2px_rgb(0_0_0/0.12),0_1px_3px_rgb(0_0_0/0.08)] transition-shadow hover:shadow-[0_1px_3px_rgb(0_0_0/0.16),0_2px_6px_rgb(0_0_0/0.1)]"
      >
        <Plus className="size-4 text-accent-600" strokeWidth={2.25} />
        Create
      </button>

      <MiniCalendar
        mode="single"
        selected={anchor}
        month={pickerMonth}
        onMonthChange={setPickerMonth}
        weekStartsOn={1}
        onSelect={(next) => {
          if (next) onAnchorChange(next);
        }}
        className="w-full px-0"
      />

      <div className="flex flex-col gap-1">
        <h3 className="px-1 text-caption font-semibold tracking-[0.02em] text-grey-500 uppercase">
          My calendar
        </h3>
        <CalendarRow
          userId={CURRENT_USER_ID}
          label={`${me?.name ?? "Me"} (you)`}
          checked={visibleUserIds.has(CURRENT_USER_ID)}
          onToggle={() => onToggleUser(CURRENT_USER_ID)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="px-1 text-caption font-semibold tracking-[0.02em] text-grey-500 uppercase">
          Other calendars
        </h3>
        {others.map((user) => (
          <CalendarRow
            key={user.id}
            userId={user.id}
            label={user.name}
            checked={visibleUserIds.has(user.id)}
            onToggle={() => onToggleUser(user.id)}
          />
        ))}
      </div>
    </aside>
  );
}

function CalendarRow({
  userId,
  label,
  checked,
  onToggle,
}: {
  userId: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex h-7 items-center gap-2.5 rounded-md px-1 text-small text-grey-700 transition-colors hover:bg-grey-100">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "flex size-3.5 shrink-0 items-center justify-center rounded-[4px]",
          checked ? personToneClass(userId) : "border border-grey-300",
        )}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </label>
  );
}
