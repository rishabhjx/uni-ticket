"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { AvatarStack, UserAvatar } from "@/components/tickets/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DISCIPLINE_LABEL,
  DISCIPLINES,
  getUser,
  users,
  type Discipline,
} from "@/lib/mock";
import { cn } from "@/lib/utils";

/**
 * A ticket can be owned by more than one person, so a Select - which is a
 * one-of-n control - no longer fits. This is a searchable multi-select: every
 * row toggles, nothing closes the popover, and the trigger shows the stack so
 * the field reads the same as the avatars everywhere else.
 *
 * Order matters. The first person in the list is the lead, which is what the
 * board groups and the table sorts on, so a newly ticked person is appended
 * rather than inserted.
 *
 * Three groups, in the order you actually reach for them:
 *
 *  1. BY STAGE. The common case is not "which of nine people" but "whoever
 *     picks up QA" -- that is the same question routing answers when a ticket
 *     crosses a discipline, and the project already names an owner per stage.
 *     Picking from here is how you assign without knowing the org chart.
 *  2. PROJECT MEMBERS, which is who it usually ends up with.
 *  3. EVERYONE, behind a toggle, because a ticket does sometimes need somebody
 *     outside the project and a picker that cannot reach them is a dead end.
 */
export function AssigneePicker({
  value,
  memberIds,
  team,
  onChange,
  className,
  align = "start",
}: {
  value: string[];
  memberIds: string[];
  /** The project's owner per discipline, which drives the "by stage" group. */
  team?: Partial<Record<Discipline, string>>;
  onChange: (next: string[]) => void;
  className?: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const listId = React.useId();

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id],
    );
  };

  const stages = DISCIPLINES.flatMap((discipline) => {
    const userId = team?.[discipline];
    return userId ? [{ discipline, userId }] : [];
  });

  const others = users.filter(
    (user) => !memberIds.includes(user.id) && !value.includes(user.id),
  );

  const label =
    value.length === 0
      ? "Unassigned"
      : value.length === 1
        ? (getUser(value[0])?.name ?? value[0])
        : `${getUser(value[0])?.name ?? value[0]} +${value.length - 1}`;

  const row = (id: string, trailing?: React.ReactNode) => {
    const user = getUser(id);
    const picked = value.includes(id);
    return (
      <CommandItem
        key={id}
        value={`${user?.name ?? id} ${user?.email ?? ""} ${user?.role ?? ""}`}
        onSelect={() => toggle(id)}
        className="gap-2"
      >
        <UserAvatar userId={id} />
        <span className="min-w-0 flex-1 truncate">{user?.name ?? id}</span>
        {trailing}
        {picked && value[0] === id && value.length > 1 ? (
          <span className="text-caption text-grey-500">lead</span>
        ) : null}
        {picked ? (
          <Check aria-hidden className="size-3.5 text-accent-600" strokeWidth={2.25} />
        ) : null}
      </CommandItem>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label="Assignees"
          className={cn(
            "h-7 w-full justify-start gap-2 px-1.5 text-small font-normal hover:bg-grey-100 data-[state=open]:bg-grey-100",
            className,
          )}
        >
          <AvatarStack userIds={value} max={3} />
          <span className="min-w-0 truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent id={listId} align={align} className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search people, or a stage…" />
          <CommandList className="max-h-[340px]">
            <CommandEmpty>Nobody by that name.</CommandEmpty>

            {value.length > 0 ? (
              <CommandGroup heading="Assigned">
                {value.map((id) => row(id))}
                <CommandItem
                  value="unassign clear nobody"
                  onSelect={() => onChange([])}
                  className="gap-2"
                >
                  <UserAvatar userId={null} />
                  <span className="text-grey-600">Clear assignees</span>
                </CommandItem>
              </CommandGroup>
            ) : null}

            {stages.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="By stage">
                  {stages.map(({ discipline, userId }) =>
                    row(
                      userId,
                      <span className="shrink-0 text-caption text-grey-500">
                        {DISCIPLINE_LABEL[discipline]}
                      </span>,
                    ),
                  )}
                </CommandGroup>
              </>
            ) : null}

            <CommandSeparator />
            <CommandGroup heading="Project members">
              {memberIds
                .filter((id) => !value.includes(id))
                .map((id) =>
                  row(
                    id,
                    <span className="shrink-0 text-caption text-grey-500">
                      {getUser(id)?.role}
                    </span>,
                  ),
                )}
            </CommandGroup>

            {others.length > 0 ? (
              <>
                <CommandSeparator />
                {showAll ? (
                  <CommandGroup heading="Everyone else">
                    {others.map((user) =>
                      row(
                        user.id,
                        <span className="shrink-0 text-caption text-grey-500">
                          {user.role}
                        </span>,
                      ),
                    )}
                  </CommandGroup>
                ) : (
                  <CommandGroup>
                    <CommandItem
                      value="show everyone all people directory"
                      onSelect={() => setShowAll(true)}
                      className="gap-2 text-grey-600"
                    >
                      <span aria-hidden className="text-grey-500">
                        ＋
                      </span>
                      View all {others.length} others
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
