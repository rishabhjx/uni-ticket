"use client";

import * as React from "react";
import { Paperclip, Send } from "lucide-react";

import { UserAvatar } from "@/components/tickets/user-avatar";
import { CURRENT_USER_ID } from "@/lib/mock";
import { useChatStore } from "@/lib/store/chat-store";
import { cn } from "@/lib/utils";

export function ChatComposer({
  conversationId,
  parentId = null,
  placeholder,
  autoFocusKey,
}: {
  conversationId: string;
  parentId?: string | null;
  placeholder: string;
  /** Refocuses the box when this changes — switching channel or thread. */
  autoFocusKey?: string;
}) {
  const { sendMessage } = useChatStore();
  const [body, setBody] = React.useState("");
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    ref.current?.focus();
  }, [autoFocusKey]);

  const submit = () => {
    if (!body.trim()) return;
    sendMessage(conversationId, body, { parentId });
    setBody("");
  };

  return (
    <div className="hairline-t flex items-end gap-2 px-4 py-3">
      <UserAvatar userId={CURRENT_USER_ID} size="md" className="mb-1" />
      <div className="flex min-w-0 flex-1 items-end gap-1.5 rounded-md border border-grey-200 bg-grey-0 px-2.5 py-1.5 transition-colors focus-within:border-accent-600">
        <textarea
          ref={ref}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={placeholder}
          aria-label="Message"
          className="max-h-32 min-h-6 w-full resize-none bg-transparent text-small text-grey-900 placeholder:text-grey-500 focus:outline-none"
        />
        <button
          type="button"
          disabled
          title="Attachments aren't wired up in this thread — drop a file into Files and link it instead"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-grey-400"
        >
          <Paperclip className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!body.trim()}
        aria-label="Send"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
          body.trim()
            ? "bg-accent-600 text-grey-0 hover:bg-accent-700"
            : "bg-grey-100 text-grey-400",
        )}
      >
        <Send className="size-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
