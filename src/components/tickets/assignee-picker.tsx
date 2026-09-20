"use client";

import * as React from "react";

import { AvatarStack, UserAvatar } from "@/components/tickets/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getUser } from "@/lib/mock";
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
 */
export function AssigneePicker({
  value,
  memberIds,
  onChange,
  className,
  align = "start",
}: {
  value: string[];
  memberIds: string[];
  onChange: (next: string[]) => void;
  className?: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = React.useState(false);

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id],
    );
  };

  const label =
    value.length === 0
      ? "Unassigned"
      : value.length === 1
        ? (getUser(value[0])?.name ?? value[0])
        : `${getUser(value[0])?.name ?? value[0]} +${value.length - 1}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
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
      <PopoverContent align={align} className="w-60 p-0">
        <Command>
          <CommandInput placeholder="Assign to…" />
          <CommandList>
            <CommandEmpty>Nobody by that name.</CommandEmpty>
            <CommandGroup>
              {value.length > 0 ? (
                <CommandItem
                  value="unassign clear"
                  onSelect={() => onChange([])}
                  className="gap-2"
                >
                  <UserAvatar userId={null} />
                  <span className="text-grey-500">Clear assignees</span>
                </CommandItem>
              ) : null}
              {memberIds.map((id) => {
                const user = getUser(id);
                const picked = value.includes(id);
                return (
                  <CommandItem
                    key={id}
                    value={`${user?.name ?? id} ${user?.email ?? ""}`}
                    onSelect={() => toggle(id)}
                    className="gap-2"
                  >
                    <UserAvatar userId={id} />
                    <span className="min-w-0 flex-1 truncate">
                      {user?.name ?? id}
                    </span>
                    {picked ? (
                      <span aria-hidden className="text-accent-600">
                        ✓
                      </span>
                    ) : null}
                    {picked && value[0] === id && value.length > 1 ? (
                      <span className="text-caption text-grey-500">lead</span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
