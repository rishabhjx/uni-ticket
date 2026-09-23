"use client";

import * as React from "react";

import { MessageRow } from "@/components/chat/message-row";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/reui/empty";
import { formatDueDate } from "@/lib/format";
import { useChatStore } from "@/lib/store/chat-store";
import { MessagesSquare } from "lucide-react";

export function MessageList({
  conversationId,
  onOpenThread,
}: {
  conversationId: string;
  onOpenThread: (messageId: string) => void;
}) {
  const { messages } = useChatStore();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const topLevel = React.useMemo(
    () =>
      messages
        .filter((m) => m.conversationId === conversationId && m.parentId === null)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages, conversationId],
  );

  const repliesByRoot = React.useMemo(() => {
    const map = new Map<string, typeof messages>();
    for (const message of messages) {
      if (message.conversationId !== conversationId || !message.parentId) continue;
      const bucket = map.get(message.parentId);
      if (bucket) bucket.push(message);
      else map.set(message.parentId, [message]);
    }
    return map;
  }, [messages, conversationId]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conversationId, topLevel.length]);

  if (topLevel.length === 0) {
    return (
      <Empty className="flex-1">
        <EmptyMedia variant="icon">
          <MessagesSquare className="size-5 text-grey-400" strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyTitle>Nothing here yet</EmptyTitle>
        <EmptyDescription>Say something to get the conversation going.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
      {topLevel.map((message, index) => {
        const day = formatDueDate(message.createdAt);
        const previousDay = index > 0 ? formatDueDate(topLevel[index - 1].createdAt) : null;
        const showDivider = day !== previousDay;

        return (
          <React.Fragment key={message.id}>
            {showDivider ? (
              <div className="my-2 flex items-center gap-2 px-2 first:mt-0">
                <span className="h-px flex-1 bg-grey-200" />
                <span className="text-caption text-grey-500">{day}</span>
                <span className="h-px flex-1 bg-grey-200" />
              </div>
            ) : null}
            <MessageRow
              message={message}
              replies={repliesByRoot.get(message.id) ?? []}
              onOpenThread={onOpenThread}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
