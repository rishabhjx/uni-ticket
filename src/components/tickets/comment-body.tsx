"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";

import {
  // Aliased: `Attachment` is also this app's model type for a stored file.
  Attachment as AttachmentCard,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/reui/attachment";
import { attachmentIcon } from "@/components/tickets/comment-composer";
import { useMediaViewer } from "@/components/tickets/media-viewer";
import { formatBytes } from "@/lib/format";
import { CURRENT_USER_ID, users, type Comment } from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

const handles = new Map(
  users.map((user) => [user.email.split("@")[0].toLowerCase(), user]),
);

/** Renders @handles as a highlight so a mention reads as a mention. */
function withMentions(body: string) {
  return body.split(/(@[a-z0-9._-]+)/gi).map((part, index) => {
    if (!part.startsWith("@")) return part;
    const user = handles.get(part.slice(1).toLowerCase());
    if (!user) return part;
    return (
      <span
        key={`${part}-${index}`}
        className="rounded-md bg-accent-50 px-1 font-medium text-accent-700"
      >
        @{user.name.split(" ")[0]}
      </span>
    );
  });
}

export function CommentBody({ comment }: { comment: Comment }) {
  const { editComment, deleteComment } = useTicketStore();
  const { openAsset } = useMediaViewer();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(comment.body);
  const mine = comment.authorId === CURRENT_USER_ID;

  if (editing) {
    return (
      <div className="mt-1 flex flex-col gap-2">
        <textarea
          autoFocus
          value={draft}
          rows={3}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setDraft(comment.body);
              setEditing(false);
            }
          }}
          className="w-full resize-none rounded-md border border-accent-600 px-2 py-1.5 text-small focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              editComment(comment.id, draft);
              setEditing(false);
            }}
            className="tap h-6 rounded-md bg-accent-600 px-2 text-caption font-medium text-grey-0 transition-colors hover:bg-accent-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(comment.body);
              setEditing(false);
            }}
            className="tap h-6 rounded-md px-2 text-caption text-grey-600 transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-0.5 flex items-start gap-1">
      <div className="min-w-0 flex-1">
        {comment.body ? (
          <p className="text-small leading-[20px] text-grey-700">
            {withMentions(comment.body)}
          </p>
        ) : null}

        {comment.attachments.length > 0 ? (
          <AttachmentGroup className="mt-1.5 flex flex-wrap">
            {comment.attachments.map((file) => {
              const Icon = attachmentIcon[file.kind];
              return (
                <AttachmentCard
                  key={file.id}
                  size="xs"
                  className="w-[190px] cursor-pointer"
                  onClick={() => openAsset(file.id)}
                >
                  <AttachmentMedia
                    variant={file.url ? "image" : "icon"}
                    className="rounded-md"
                  >
                    {file.url && file.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file.url} alt="" />
                    ) : file.url && file.kind === "video" ? (
                      <video src={file.url} muted />
                    ) : (
                      <Icon className="size-3.5 text-grey-400" strokeWidth={2} />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{file.name}</AttachmentTitle>
                    <AttachmentDescription>
                      {formatBytes(file.size)}
                    </AttachmentDescription>
                  </AttachmentContent>
                </AttachmentCard>
              );
            })}
          </AttachmentGroup>
        ) : null}
      </div>

      {mine ? (
        <span
          className={cn(
            "flex shrink-0 gap-0.5 opacity-0 transition-opacity",
            "group-hover/comment:opacity-100 focus-within:opacity-100",
          )}
        >
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit comment"
            className="tap flex size-5 items-center justify-center rounded-md text-grey-400 hover:bg-grey-100 hover:text-grey-700"
          >
            <Pencil className="size-3" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => deleteComment(comment.id)}
            aria-label="Delete comment"
            className="tap flex size-5 items-center justify-center rounded-md text-grey-400 hover:bg-grey-100 hover:text-grey-700"
          >
            <Trash2 className="size-3" strokeWidth={2} />
          </button>
        </span>
      ) : null}
    </div>
  );
}
