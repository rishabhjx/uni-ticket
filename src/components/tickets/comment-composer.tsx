"use client";

import * as React from "react";

import { UserAvatar } from "@/components/tickets/user-avatar";
import { CURRENT_USER_ID } from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";

export function CommentComposer({ ticketId }: { ticketId: string }) {
  const { addComment } = useTicketStore();
  const [body, setBody] = React.useState("");
  const ref = React.useRef<HTMLTextAreaElement>(null);

  // A new ticket means a fresh draft.
  const [lastTicketId, setLastTicketId] = React.useState(ticketId);
  if (ticketId !== lastTicketId) {
    setLastTicketId(ticketId);
    setBody("");
  }

  const submit = () => {
    if (!body.trim()) return;
    addComment(ticketId, body);
    setBody("");
    ref.current?.focus();
  };

  return (
    <div className="hairline-t bg-grey-0 px-5 py-3">
      <div className="flex gap-2.5">
        <UserAvatar userId={CURRENT_USER_ID} size="md" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <textarea
            ref={ref}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Leave a comment"
            aria-label="Comment"
            className="w-full resize-none rounded-md border border-grey-200 px-2.5 py-1.5 text-small text-grey-900 transition-colors placeholder:text-grey-400 hover:border-grey-300 focus:border-accent-600 focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={!body.trim()}
              className="h-7 rounded-md bg-accent-600 px-2.5 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-200 disabled:text-grey-400"
            >
              Comment
            </button>
            <span className="text-caption text-grey-400">⌘↵ to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}
