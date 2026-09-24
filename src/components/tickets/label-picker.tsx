"use client";

import * as React from "react";
import { Check } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LabelChip } from "@/components/tickets/badges";
import { labels } from "@/lib/mock";
import { cn } from "@/lib/utils";

/**
 * Labels were display-only: you could see them on a ticket and filter by them,
 * but there was no way to put one on. Same searchable multi-select shape as
 * the assignee picker, because they are the same interaction.
 */
export function LabelPicker({
  value,
  onChange,
  className,
  align = "start",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = React.useState(false);
  const listId = React.useId();

  const toggle = (id: string) =>
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id],
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label="Labels"
          className={cn(
            "flex min-h-7 w-full flex-wrap items-center gap-1 rounded-md px-1.5 py-1 text-left text-small transition-colors hover:bg-grey-100 data-[state=open]:bg-grey-100",
            className,
          )}
        >
          {value.length === 0 ? (
            <span className="text-grey-500">Add a label</span>
          ) : (
            value.map((id) => {
              const label = labels.find((item) => item.id === id);
              return label ? <LabelChip key={id} name={label.name} /> : null;
            })
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent id={listId} align={align} className="w-56 p-0">
        <Command>
          <CommandInput placeholder="Find a label…" />
          <CommandList>
            <CommandEmpty>No label by that name.</CommandEmpty>
            <CommandGroup>
              {labels.map((label) => {
                const picked = value.includes(label.id);
                return (
                  <CommandItem
                    key={label.id}
                    value={label.name}
                    onSelect={() => toggle(label.id)}
                    className="gap-2"
                  >
                    <LabelChip name={label.name} />
                    {picked ? (
                      <Check
                        aria-hidden
                        className="ml-auto size-3.5 text-accent-600"
                        strokeWidth={2.25}
                      />
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
