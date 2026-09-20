"use client";

import * as React from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EMOJI_GROUPS, searchEmoji } from "@/lib/emoji";
import { cn } from "@/lib/utils";

/**
 * The picker every "pick an icon" field uses. It replaced a hard-coded row of
 * twelve emoji that were the only twelve a project could ever have.
 *
 * Search is over keywords rather than Unicode names, because nobody types
 * "grinning face with sweat" — they type "bug", "release", "qa".
 */
export function EmojiPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const hits = searchEmoji(query);

  const pick = (emoji: string) => {
    onChange(emoji);
    setQuery("");
    setOpen(false);
  };

  const cell =
    "flex size-8 items-center justify-center rounded-md text-[18px] leading-none transition-colors hover:bg-grey-100 focus-visible:bg-grey-100 focus-visible:outline-none";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Pick an emoji"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md border border-grey-200 text-[18px] leading-none transition-colors hover:border-grey-300 data-[state=open]:border-accent-600",
            className,
          )}
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[296px] p-0">
        <div className="border-b border-grey-200 p-2">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search — try bug, release, qa…"
            aria-label="Search emoji"
            className="h-7 w-full rounded-md border border-grey-200 px-2 text-small text-grey-900 placeholder:text-grey-500 focus:border-accent-600 focus:outline-none"
          />
        </div>

        <div className="max-h-[280px] overflow-y-auto p-2">
          {hits ? (
            hits.length === 0 ? (
              <p className="px-1 py-6 text-center text-small text-grey-500">
                Nothing matches “{query}”.
              </p>
            ) : (
              <div className="grid grid-cols-8 gap-0.5">
                {hits.map((entry) => (
                  <button
                    key={entry.c}
                    type="button"
                    title={entry.n.split(" ").slice(0, 3).join(", ")}
                    onClick={() => pick(entry.c)}
                    className={cell}
                  >
                    {entry.c}
                  </button>
                ))}
              </div>
            )
          ) : (
            EMOJI_GROUPS.map((group) => (
              <section key={group.name} className="mb-2 last:mb-0">
                <h4 className="px-1 pb-1 text-caption font-semibold tracking-[0.07em] text-grey-500 uppercase">
                  {group.name}
                </h4>
                <div className="grid grid-cols-8 gap-0.5">
                  {group.emoji.map((entry) => (
                    <button
                      key={entry.c}
                      type="button"
                      title={entry.n.split(" ").slice(0, 3).join(", ")}
                      onClick={() => pick(entry.c)}
                      className={cell}
                    >
                      {entry.c}
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
