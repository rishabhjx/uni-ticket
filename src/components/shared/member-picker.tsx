"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

import { UserAvatar } from "@/components/tickets/user-avatar";
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
import { getUser, users } from "@/lib/mock";
import { cn } from "@/lib/utils";

/**
 * Picks people from a searchable list rather than a wall of toggle buttons —
 * fine for eight seeded users, unusable once a workspace has sixty. Picked
 * people show as removable chips above the field, same shape the assignee
 * picker uses, so "who's in this" reads the same everywhere it is asked.
 */
export function MemberPicker({
  value,
  onChange,
  /** Can't be removed — e.g. the person creating this owns it. */
  lockedIds = [],
  placeholder = "Add people",
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  lockedIds?: string[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const toggle = (id: string) => {
    if (lockedIds.includes(id)) return;
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id],
    );
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {value.map((id) => {
            const user = getUser(id);
            const locked = lockedIds.includes(id);
            return (
              <span
                key={id}
                className="flex h-7 items-center gap-1.5 rounded-md border border-grey-200 py-0.5 pr-1.5 pl-1 text-small text-grey-700"
              >
                <UserAvatar userId={id} />
                {user?.name.split(" ")[0] ?? id}
                {locked ? (
                  <span className="text-caption text-grey-500">you</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    aria-label={`Remove ${user?.name ?? id}`}
                    className="tap flex size-3.5 items-center justify-center rounded-full text-grey-400 transition-colors hover:text-grey-900"
                  >
                    <X className="size-3" strokeWidth={2} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-7 w-fit justify-start gap-1.5 px-2 text-small font-normal text-grey-600 shadow-none hover:bg-grey-100"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search people…" />
            <CommandList className="max-h-64">
              <CommandEmpty>Nobody by that name.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => {
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
                      <span className="shrink-0 text-caption text-grey-500">
                        {user.role}
                      </span>
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
    </div>
  );
}
