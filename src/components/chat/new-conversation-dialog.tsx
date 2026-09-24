"use client";

import * as React from "react";
import { Hash } from "lucide-react";

import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MemberPicker } from "@/components/shared/member-picker";
import { CURRENT_USER_ID, users } from "@/lib/mock";
import { useChatStore } from "@/lib/store/chat-store";
import { cn } from "@/lib/utils";

type Mode = "dm" | "channel";

export function NewConversationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversationId: string) => void;
}) {
  const { startDm, createChannel } = useChatStore();
  const [mode, setMode] = React.useState<Mode>("dm");
  const [channelName, setChannelName] = React.useState("");
  const [members, setMembers] = React.useState<string[]>([]);

  const reset = () => {
    setMode("dm");
    setChannelName("");
    setMembers([]);
  };

  const closeAndReset = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const pickDm = (userId: string) => {
    const id = startDm(userId);
    reset();
    onOpenChange(false);
    onCreated(id);
  };

  const createTheChannel = () => {
    if (!channelName.trim()) return;
    const conversation = createChannel(channelName, members);
    reset();
    onOpenChange(false);
    onCreated(conversation.id);
  };

  return (
    <Dialog open={open} onOpenChange={closeAndReset}>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="hairline-b px-5 py-4">
          <DialogTitle className="text-heading font-semibold">New message</DialogTitle>
          <DialogDescription className="text-small text-grey-500">
            Start a conversation with someone, or spin up a channel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex w-fit rounded-md border border-grey-200 p-0.5">
            {(
              [
                { id: "dm" as const, label: "Direct message" },
                { id: "channel" as const, label: "New channel" },
              ]
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setMode(option.id)}
                className={cn(
                  "h-7 rounded-[5px] px-2.5 text-caption font-medium transition-colors",
                  mode === option.id
                    ? "bg-grey-150 text-grey-900"
                    : "text-grey-600 hover:text-grey-900",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {mode === "dm" ? (
            <Command className="rounded-md border border-grey-200">
              <CommandInput placeholder="Search people…" />
              <CommandList className="max-h-64">
                <CommandEmpty>Nobody by that name.</CommandEmpty>
                <CommandGroup>
                  {users
                    .filter((user) => user.id !== CURRENT_USER_ID)
                    .map((user) => (
                      <CommandItem
                        key={user.id}
                        value={`${user.name} ${user.email} ${user.role}`}
                        onSelect={() => pickDm(user.id)}
                        className="gap-2"
                      >
                        <UserAvatar userId={user.id} />
                        <span className="min-w-0 flex-1 truncate">{user.name}</span>
                        <span className="shrink-0 text-caption text-grey-500">
                          {user.role}
                        </span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-md border border-grey-200 px-2.5 focus-within:border-accent-600">
                <Hash className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
                <Input
                  autoFocus
                  value={channelName}
                  onChange={(event) => setChannelName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") createTheChannel();
                  }}
                  placeholder="channel-name"
                  aria-label="Channel name"
                  className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <MemberPicker value={members} onChange={setMembers} placeholder="Add members" />
              <button
                type="button"
                onClick={createTheChannel}
                disabled={!channelName.trim()}
                className="h-8 self-start rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-100 disabled:text-grey-400"
              >
                Create channel
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
