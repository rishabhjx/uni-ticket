"use client";

import { SmilePlus } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CURRENT_USER_ID, getUser, REACTIONS, type Comment } from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

export function Reactions({ comment }: { comment: Comment }) {
  const { toggleReaction } = useTicketStore();
  const entries = Object.entries(comment.reactions);

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {entries.map(([emoji, userIds]) => {
        const mine = userIds.includes(CURRENT_USER_ID);
        const names = userIds
          .map((id) => getUser(id)?.name ?? id)
          .join(", ");

        return (
          <button
            key={emoji}
            type="button"
            title={`${names} reacted with ${emoji}`}
            onClick={() => toggleReaction(comment.id, emoji)}
            className={cn(
              "flex h-6 items-center gap-1 rounded-md border px-1.5 text-caption transition-[background-color,border-color,transform] active:scale-95",
              mine
                ? "border-accent-200 bg-accent-50 text-accent-700"
                : "border-grey-200 text-grey-600 hover:border-grey-300",
            )}
          >
            <span aria-hidden>{emoji}</span>
            <span className="tnum">{userIds.length}</span>
          </button>
        );
      })}

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Add reaction"
            className={cn(
              "flex size-6 items-center justify-center rounded-md border border-grey-200 text-grey-400 transition-colors hover:border-grey-300 hover:text-grey-700",
              entries.length === 0 &&
                "opacity-0 group-hover/comment:opacity-100 focus-visible:opacity-100",
            )}
          >
            <SmilePlus className="size-3.5" strokeWidth={1.75} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-auto gap-0.5 p-1">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => toggleReaction(comment.id, emoji)}
              className="flex size-8 items-center justify-center rounded-md text-base transition-transform hover:bg-grey-100 active:scale-90"
            >
              <span aria-hidden>{emoji}</span>
              <span className="sr-only">React with {emoji}</span>
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
