"use client";

import { SmilePlus } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CURRENT_USER_ID, getUser, REACTIONS, type ChatMessage } from "@/lib/mock";
import { useChatStore } from "@/lib/store/chat-store";
import { cn } from "@/lib/utils";

export function ChatReactions({ message }: { message: ChatMessage }) {
  const { toggleReaction } = useChatStore();
  const entries = Object.entries(message.reactions);

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {entries.map(([emoji, userIds]) => {
        const mine = userIds.includes(CURRENT_USER_ID);
        const names = userIds.map((id) => getUser(id)?.name ?? id).join(", ");
        return (
          <button
            key={emoji}
            type="button"
            title={`${names} reacted with ${emoji}`}
            onClick={() => toggleReaction(message.id, emoji)}
            className={cn(
              "flex h-5.5 items-center gap-1 rounded-md border px-1.5 text-caption transition-[background-color,border-color,transform] active:scale-95",
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
              "flex size-5.5 items-center justify-center rounded-md border border-grey-200 text-grey-500 opacity-0 transition-colors group-hover/message:opacity-100 hover:border-grey-300 hover:text-grey-900 focus-visible:opacity-100",
              entries.length > 0 && "opacity-100",
            )}
          >
            <SmilePlus className="size-3" strokeWidth={1.75} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-auto gap-0.5 p-1">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => toggleReaction(message.id, emoji)}
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
