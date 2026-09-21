"use client";

import * as React from "react";
import { GitBranch, GitPullRequest, Paperclip, Upload, X } from "lucide-react";

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

import { formatBytes } from "@/lib/format";
import { kindOf } from "@/components/tickets/comment-composer";
import { useMediaViewer } from "@/components/tickets/media-viewer";
import type { Attachment } from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

export function AttachmentsBlock({
  ticketId,
  attachments,
  canEdit,
}: {
  ticketId: string;
  attachments: Attachment[];
  canEdit: boolean;
}) {
  const { addAttachment, removeAttachment } = useTicketStore();
  const { openAsset } = useMediaViewer();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  // A heading over nothing, on a ticket you have no way to add to.
  if (attachments.length === 0 && !canEdit) return null;

  // Counts dragenter/dragleave pairs; see the drop zone below.
  const dragDepth = React.useRef(0);

  const accept = (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const kind = kindOf(file);
      addAttachment(ticketId, {
        name: file.name,
        size: file.size,
        kind,
        // Object URLs live as long as the document, which for a prototype
        // with no upload endpoint is exactly as long as they are useful.
        url:
          kind === "image" || kind === "video"
            ? URL.createObjectURL(file)
            : undefined,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3 className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
          Attachments
        </h3>
        {canEdit ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="tap ml-auto flex h-6 items-center gap-1 rounded-md border border-grey-200 px-1.5 text-caption text-grey-600 transition-colors hover:border-grey-300 hover:text-grey-900"
          >
            <Upload className="size-3" strokeWidth={2} />
            Add
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(event) => {
          accept(event.target.files);
          event.target.value = "";
        }}
      />

      <AttachmentGroup className="flex flex-wrap gap-2">
        {attachments.map((file) => (
          <AttachmentCard key={file.id} size="sm" className="min-w-[172px] flex-1 basis-[172px] sm:max-w-[264px]">
            {/* A screenshot you cannot see is a filename. */}
            <AttachmentMedia
              variant={file.url ? "image" : "icon"}
              className="rounded-md"
            >
              {file.url && file.kind === "image" ? (
                <button
                  type="button"
                  onClick={() => openAsset(file.id)}
                  aria-label={`Open ${file.name}`}
                  className="size-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.url} alt="" />
                </button>
              ) : file.url && file.kind === "video" ? (
                <button
                  type="button"
                  onClick={() => openAsset(file.id)}
                  aria-label={`Open ${file.name}`}
                  className="size-full"
                >
                  <video src={file.url} muted />
                </button>
              ) : (
                <Paperclip className="size-3.5 text-grey-400" strokeWidth={1.75} />
              )}
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>
                <button
                  type="button"
                  onClick={() => openAsset(file.id)}
                  className="tap max-w-full truncate text-left hover:text-accent-700"
                >
                  {file.name}
                </button>
              </AttachmentTitle>
              <AttachmentDescription className="tnum">
                {formatBytes(file.size)}
              </AttachmentDescription>
            </AttachmentContent>
            {canEdit ? (
              <AttachmentActions>
                <AttachmentAction
                  onClick={() => removeAttachment(ticketId, file.id)}
                  aria-label={`Remove ${file.name}`}
                  className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover/attachment:opacity-100"
                >
                  <X className="size-3" strokeWidth={2} />
                </AttachmentAction>
              </AttachmentActions>
            ) : null}
          </AttachmentCard>
        ))}
      </AttachmentGroup>

      {canEdit ? (
        /*
         * A button, not a div. It looked like a drop zone and behaved like
         * one, but the obvious thing to do with it is click it — and clicking
         * did nothing at all, which is what "it doesn't work" meant.
         *
         * dragenter is counted rather than toggled: dragging across a child
         * element fires dragleave on the parent, so a plain boolean flickered
         * the highlight off while the pointer was still inside.
         */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(event) => {
            // Without this the browser treats the drop as navigation and the
            // drop handler never runs.
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={() => {
            dragDepth.current -= 1;
            if (dragDepth.current <= 0) {
              dragDepth.current = 0;
              setDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            accept(event.dataTransfer.files);
          }}
          className={cn(
            "w-full rounded-md border border-dashed px-2.5 py-3 text-center text-caption transition-colors",
            dragging
              ? "border-accent-600 bg-accent-50 text-accent-700"
              : "border-grey-200 text-grey-500 hover:border-grey-300 hover:text-grey-700",
          )}
        >
          {dragging ? "Drop to attach" : "Drop a screenshot or log here, or click to browse"}
        </button>
      ) : null}
    </div>
  );
}
