"use client";

import * as React from "react";
import { Paperclip, Send, X } from "lucide-react";

import {
  Attachment as AttachmentCard,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/reui/attachment";
import { attachmentIcon, kindOf } from "@/components/tickets/comment-composer";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { formatBytes } from "@/lib/format";
import { CURRENT_USER_ID, type Attachment } from "@/lib/mock";
import { useChatStore } from "@/lib/store/chat-store";
import { cn } from "@/lib/utils";

type Draft = Omit<Attachment, "id"> & { url?: string };

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
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const pending = React.useRef<string[]>([]);

  React.useEffect(() => {
    ref.current?.focus();
  }, [autoFocusKey]);

  React.useEffect(() => {
    const urls = pending.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const accept = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next = Array.from(files).map((file) => {
      const kind = kindOf(file);
      return {
        name: file.name,
        size: file.size,
        kind,
        url:
          kind === "image" || kind === "video"
            ? URL.createObjectURL(file)
            : undefined,
      };
    });
    for (const draft of next) {
      if (draft.url) pending.current.push(draft.url);
    }
    setDrafts((current) => [...current, ...next]);
  };

  const removeDraft = (index: number) => {
    setDrafts((current) => {
      const gone = current[index];
      if (gone?.url) {
        URL.revokeObjectURL(gone.url);
        pending.current = pending.current.filter((url) => url !== gone.url);
      }
      return current.filter((_, i) => i !== index);
    });
  };

  const submit = () => {
    if (!body.trim() && drafts.length === 0) return;
    sendMessage(conversationId, body, {
      parentId,
      attachments: drafts.map(({ name, size, kind, url }) => ({ name, size, kind, url })),
    });
    setBody("");
    setDrafts([]);
  };

  return (
    <div className="hairline-t flex flex-col gap-2 px-4 py-3">
      {drafts.length > 0 ? (
        <AttachmentGroup className="flex flex-wrap pl-10">
          {drafts.map((draft, index) => {
            const Icon = attachmentIcon[draft.kind];
            return (
              <AttachmentCard key={`${draft.name}-${index}`} size="sm" className="w-[210px]">
                <AttachmentMedia variant={draft.url ? "image" : "icon"} className="rounded-md">
                  {draft.url && draft.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draft.url} alt={draft.name} />
                  ) : draft.url && draft.kind === "video" ? (
                    <video src={draft.url} muted />
                  ) : (
                    <Icon className="size-4 text-grey-400" strokeWidth={1.75} />
                  )}
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{draft.name}</AttachmentTitle>
                  <AttachmentDescription>{formatBytes(draft.size)}</AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction onClick={() => removeDraft(index)} aria-label={`Remove ${draft.name}`}>
                    <X className="size-3" strokeWidth={2.25} />
                  </AttachmentAction>
                </AttachmentActions>
              </AttachmentCard>
            );
          })}
        </AttachmentGroup>
      ) : null}

      <div className="flex items-end gap-2">
        <UserAvatar userId={CURRENT_USER_ID} size="md" className="mb-1" />
        <div
          className={cn(
            "flex min-w-0 flex-1 items-end gap-1.5 rounded-md border bg-grey-0 px-2.5 py-1.5 transition-colors focus-within:border-accent-600",
            dragging ? "border-accent-600 bg-accent-50" : "border-grey-200",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            accept(event.dataTransfer.files);
          }}
        >
          <textarea
            ref={ref}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onPaste={(event) => {
              const files = event.clipboardData?.files;
              if (files && files.length > 0) {
                event.preventDefault();
                accept(files);
              }
            }}
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
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*,.log,.txt,.har,.json,.pdf"
            className="sr-only"
            onChange={(event) => {
              accept(event.target.files);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach a file"
            title="Attach a file"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
          >
            <Paperclip className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!body.trim() && drafts.length === 0}
          aria-label="Send"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
            body.trim() || drafts.length > 0
              ? "bg-accent-600 text-grey-0 hover:bg-accent-700"
              : "bg-grey-100 text-grey-400",
          )}
        >
          <Send className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
