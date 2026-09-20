"use client";

import { Check, ListFilter } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type FacetOption = {
  value: string;
  label: string;
  /** Rendered instead of the plain label — used for status/priority badges. */
  render?: React.ReactNode;
};

export function FacetFilter({
  title,
  options,
  selected,
  onChange,
  searchable = false,
}: {
  title: string;
  options: FacetOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
}) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-small transition-colors",
            selected.length > 0
              ? "border-accent-200 bg-accent-50 text-accent-700"
              : "border-grey-200 text-grey-600 hover:border-grey-300 hover:text-grey-900",
          )}
        >
          <ListFilter className="size-3.5" strokeWidth={1.75} />
          {title}
          {selected.length > 0 ? (
            <span className="tnum rounded-md bg-accent-100 px-1 text-caption font-medium">
              {selected.length}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          {searchable ? <CommandInput placeholder={`Filter ${title.toLowerCase()}`} /> : null}
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const active = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                    className="gap-2"
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-md border",
                        active
                          ? "border-accent-600 bg-accent-600 text-grey-0"
                          : "border-grey-300",
                      )}
                    >
                      {active ? <Check className="size-3" strokeWidth={3} /> : null}
                    </span>
                    {option.render ?? option.label}
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
