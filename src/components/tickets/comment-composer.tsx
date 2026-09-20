"use client";

import * as React from "react";
import { FileText, Film, ImageIcon, Paperclip, X } from "lucide-react";

import {
  // Aliased: `Attachment` is also this app's model type for a stored file.
  Attachment as AttachmentCard,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/reui/attachment";
import { Kbd, KbdGroup } from "@/components/reui/kbd";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { formatBytes } from "@/lib/format";
import { CURRENT_USER_ID, type Attachment } from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

type Draft = Omit<Attachment, "id"> & { url?: string };

export function kindOf(file: File): Attachment["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (/\.(log|txt|har|json)$/i.test(file.name)) return "log";
  return "document";
}

export const attachmentIcon: Record<Attachment["kind"], React.ElementType> = {
  image: ImageIcon,
  video: Film,
  log: FileText,
  document: FileText,
};

export function CommentComposer({ ticketId }: { ticketId: string }) {
  const { addComment } = useTicketStore();
  const [body, setBody] = React.useState("");
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // A new ticket means a fresh draft.
  const [lastTicketId, setLastTicketId] = React.useState(ticketId);
  if (ticketId !== lastTicketId) {
    setLastTicketId(ticketId);
    setBody("");
    setDrafts([]);
  }

  // Object URLs are only previews; release them when the draft goes away.
  React.useEffect(() => {
    return () => {
      for (const draft of drafts) {
        if (draft.url) URL.revokeObjectURL(draft.url);
      }
    };
  }, [drafts]);

  const accept = (files: FileList | null) => {
    if (!files) return;
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
    setDrafts((current) => [...current, ...next]);
  };

  const submit = () => {
    if (!body.trim() && drafts.length === 0) return;
    addComment(
      ticketId,
      body,
      drafts.map(({ name, size, kind }) => ({ name, size, kind })),
    );
    setBody("");
    setDrafts([]);
    ref.current?.focus();
  };

  return (
    <div className="glass-strong hairline-t px-5 py-3">
      <div className="flex gap-2.5">
        <UserAvatar userId={CURRENT_USER_ID} size="md" className="mt-0.5" />

        <div
          className="min-w-0 flex-1"
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
              // Pasting a screenshot straight into the box is how people
              // actually attach one.
              const files = event.clipboardData?.files;
              if (files && files.length > 0) {
                event.preventDefault();
                accept(files);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Leave a comment, or drop a screenshot in"
            aria-label="Comment"
            className={cn(
              "w-full resize-none rounded-md border px-2.5 py-1.5 text-small text-grey-900 transition-colors placeholder:text-grey-400 focus:border-accent-600 focus:outline-none",
              dragging
                ? "border-accent-600 bg-accent-50"
                : "border-grey-200 hover:border-grey-300",
            )}
          />

          {drafts.length > 0 ? (
            /*
             * ReUI's Attachment is the shape a pending upload takes here and
             * on the ticket: media, then title and size, then the actions that
             * hover in. Using it for the draft row means what you see before
             * sending matches what the posted comment renders.
             */
            <AttachmentGroup className="mt-2 flex flex-wrap">
              {drafts.map((draft, index) => {
                const Icon = attachmentIcon[draft.kind];
                return (
                  <AttachmentCard
                    key={`${draft.name}-${index}`}
                    size="sm"
                    className="w-[210px]"
                  >
                    <AttachmentMedia
                      variant={draft.url ? "image" : "icon"}
                      className="rounded-md"
                    >
                      {draft.url && draft.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={draft.url} alt={draft.name} />
                      ) : draft.url && draft.kind === "video" ? (
                        <video src={draft.url} muted />
                      ) : (
                        <Icon
                          className="size-4 text-grey-400"
                          strokeWidth={1.75}
                        />
                      )}
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{draft.name}</AttachmentTitle>
                      <AttachmentDescription>
                        {formatBytes(draft.size)}
                      </AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction
                        onClick={() =>
                          setDrafts((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                        aria-label={`Remove ${draft.name}`}
                      >
                        <X className="size-3" strokeWidth={2.25} />
                      </AttachmentAction>
                    </AttachmentActions>
                  </AttachmentCard>
                );
              })}
            </AttachmentGroup>
          ) : null}

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

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={!body.trim() && drafts.length === 0}
              className="h-7 rounded-md bg-accent-600 px-2.5 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-200 disabled:text-grey-400"
            >
              Comment
            </button>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Attach a photo, video or log"
              className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              <Paperclip className="size-4" strokeWidth={1.75} />
            </button>

            <span className="flex items-center gap-1.5 text-caption text-grey-400">
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd>
              </KbdGroup>
              to send
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
