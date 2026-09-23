"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Hash, Lock, Users } from "lucide-react";

import { CallButton } from "@/components/shared/call-button";
import { ChatComposer } from "@/components/chat/composer";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { MessageList } from "@/components/chat/message-list";
import { ThreadPanel } from "@/components/chat/thread-panel";
import { AvatarStack } from "@/components/tickets/user-avatar";
import {
  chatConversationsForUser,
  conversationName,
  getChatConversation,
  lastMessageOf,
  CURRENT_USER_ID,
} from "@/lib/mock";
import { useChatStore } from "@/lib/store/chat-store";

function defaultConversationId() {
  const all = chatConversationsForUser();
  const withActivity = all
    .map((conversation) => ({ conversation, last: lastMessageOf(conversation.id) }))
    .filter((entry) => entry.last)
    .sort((a, b) => b.last!.createdAt.localeCompare(a.last!.createdAt));
  return withActivity[0]?.conversation.id ?? all[0]?.id ?? "chan-general";
}

export function ChatView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const conversationId = params.get("c") ?? defaultConversationId();
  const threadId = params.get("thread");
  const conversation = getChatConversation(conversationId);
  const { markRead } = useChatStore();

  React.useEffect(() => {
    markRead(conversationId);
  }, [conversationId, markRead]);

  const setParam = React.useCallback(
    (next: URLSearchParams) => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname],
  );

  const selectConversation = (id: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("c", id);
    next.delete("thread");
    setParam(next);
  };

  const openThread = (messageId: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("thread", messageId);
    setParam(next);
  };

  const closeThread = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("thread");
    setParam(next);
  };

  return (
    <div className="flex min-h-0 flex-1">
      <ChatSidebar activeId={conversationId} onSelect={selectConversation} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {conversation ? (
          <>
            <header className="hairline-b flex h-topbar shrink-0 items-center gap-2 px-4">
              {conversation.kind === "dm" ? null : conversation.kind === "team" ? (
                <Users className="size-4 shrink-0 text-grey-400" strokeWidth={1.75} />
              ) : conversation.name === "incidents" ? (
                <Lock className="size-4 shrink-0 text-grey-400" strokeWidth={1.75} />
              ) : (
                <Hash className="size-4 shrink-0 text-grey-400" strokeWidth={1.75} />
              )}
              <h1 className="text-small font-semibold text-grey-900">
                {conversationName(conversation)}
              </h1>
              {conversation.topic ? (
                <>
                  <span aria-hidden className="h-4 w-px bg-grey-200" />
                  <p className="min-w-0 flex-1 truncate text-small text-grey-500">
                    {conversation.topic}
                  </p>
                </>
              ) : (
                <span className="flex-1" />
              )}

              {conversation.kind !== "dm" ? (
                <AvatarStack userIds={conversation.memberIds} size="sm" max={4} />
              ) : null}

              <CallButton
                subject={conversationName(conversation)}
                participantIds={conversation.memberIds.filter((id) => id !== CURRENT_USER_ID)}
              />
            </header>

            <div className="flex min-h-0 flex-1">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <MessageList conversationId={conversation.id} onOpenThread={openThread} />
                <ChatComposer
                  conversationId={conversation.id}
                  placeholder={`Message ${conversationName(conversation)}`}
                  autoFocusKey={conversation.id}
                />
              </div>

              {threadId ? (
                <ThreadPanel
                  rootId={threadId}
                  conversationId={conversation.id}
                  onClose={closeThread}
                />
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-small text-grey-500">
            Pick a conversation to get started.
          </div>
        )}
      </div>
    </div>
  );
}
