"use client";

import * as React from "react";
import { X } from "lucide-react";

import { ChatComposer } from "@/components/chat/composer";
import { MessageRow } from "@/components/chat/message-row";
import { useChatStore } from "@/lib/store/chat-store";

export function ThreadPanel({
  rootId,
  conversationId,
  onClose,
}: {
  rootId: string;
  conversationId: string;
  onClose: () => void;
}) {
  const { messages } = useChatStore();

  const root = messages.find((m) => m.id === rootId);
  const replies = React.useMemo(
    () =>
      messages
        .filter((m) => m.parentId === rootId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages, rootId],
  );

  if (!root) return null;

  return (
    <div className="hairline-l flex w-[360px] shrink-0 flex-col bg-grey-0">
      <div className="hairline-b flex h-topbar shrink-0 items-center gap-2 px-3">
        <h2 className="text-small font-semibold text-grey-900">Thread</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close thread"
          className="ml-auto flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        <MessageRow message={root} compact />

        {replies.length > 0 ? (
          <div className="mt-2 flex items-center gap-2 px-2">
            <span className="h-px flex-1 bg-grey-200" />
            <span className="text-caption text-grey-500">
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </span>
            <span className="h-px flex-1 bg-grey-200" />
          </div>
        ) : null}

        {replies.map((reply) => (
          <MessageRow key={reply.id} message={reply} compact />
        ))}
      </div>

      <ChatComposer
        conversationId={conversationId}
        parentId={rootId}
        placeholder="Reply in thread"
        autoFocusKey={rootId}
      />
    </div>
  );
}
