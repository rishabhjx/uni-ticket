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
import { CURRENT_USER_ID, getUser, users } from "@/lib/mock";
import { cn } from "@/lib/utils";

/** A searchable multi-select over the whole directory — an event's guest list isn't scoped to a project. */
export function AttendeePicker({
  value,
  onChange,
  className,
}: {
  /** Attendees other than the organiser, who is always implicitly invited. */
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  };

  const label =
    value.length === 0
      ? "Add guests"
      : value.length === 1
        ? (getUser(value[0])?.name ?? value[0])
        : `${value.length} guests`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label="Guests"
          className={cn(
            "h-8 w-full justify-start gap-2 border border-grey-200 px-2.5 text-small font-normal hover:bg-grey-100 data-[state=open]:bg-grey-100",
            className,
          )}
        >
          {value.length > 0 ? <AvatarStack userIds={value} max={4} /> : null}
          <span className="min-w-0 truncate text-grey-700">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search people…" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>Nobody by that name.</CommandEmpty>
            <CommandGroup>
              {users
                .filter((user) => user.id !== CURRENT_USER_ID)
                .map((user) => {
                  const picked = value.includes(user.id);
                  return (
                    <CommandItem
                      key={user.id}
                      value={`${user.name} ${user.email} ${user.role}`}
                      onSelect={() => toggle(user.id)}
                      className="gap-2"
                    >
                      <UserAvatar userId={user.id} />
                      <span className="min-w-0 flex-1 truncate">{user.name}</span>
                      <span className="shrink-0 text-caption text-grey-500">{user.role}</span>
                      {picked ? (
                        <span aria-hidden className="text-accent-600">
                          ✓
                        </span>
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
