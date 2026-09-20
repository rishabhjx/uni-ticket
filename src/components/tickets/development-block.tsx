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
import type { Attachment, Development } from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

const checkTone: Record<Development["checks"], string> = {
  passing: "bg-[var(--status-done-bg)] text-[var(--status-done-fg)]",
  failing: "bg-[var(--priority-urgent-bg)] text-[var(--priority-urgent-fg)]",
  running: "bg-grey-100 text-grey-600",
};

const stateLabel: Record<Development["prState"], string> = {
  open: "Open",
  merged: "Merged",
  draft: "Draft",
};

/** Why a developer opens the ticket at all: where is the code. */
export function DevelopmentBlock({ development }: { development: Development }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-caption font-medium tracking-wide text-grey-500 uppercase">
        Development
      </h3>

      <div className="flex flex-col gap-2 rounded-md border border-grey-200 p-3">
        <div className="flex items-center gap-2">
          <GitBranch className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
          <code className="truncate font-mono text-[12px] text-grey-700">
            {development.branch}
          </code>
        </div>

        <div className="flex items-center gap-2">
          <GitPullRequest
            className="size-3.5 shrink-0 text-grey-400"
            strokeWidth={1.75}
          />
          <span className="tnum text-small text-grey-900">
            #{development.prNumber}
          </span>
          <span className="rounded-md bg-grey-100 px-1.5 py-0.5 text-caption text-grey-600">
            {stateLabel[development.prState]}
          </span>
          <span
            className={cn(
              "ml-auto rounded-md px-1.5 py-0.5 text-caption font-medium",
              checkTone[development.checks],
            )}
          >
            Checks {development.checks}
          </span>
        </div>
      </div>
    </div>
  );
}

function kindOf(name: string): Attachment["kind"] {
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return "image";
  if (/\.(log|txt|har|json)$/i.test(name)) return "log";
  if (/\.(mp4|mov|webm)$/i.test(name)) return "video";
  return "document";
}

/**
 * A screenshot is most of a bug report's value, so QA has to be able to add
 * one. Nothing is uploaded anywhere — the file's name and size are recorded,
 * which is what the prototype needs to show.
 */
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
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  // Counts dragenter/dragleave pairs; see the drop zone below.
  const dragDepth = React.useRef(0);

  const accept = (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      addAttachment(ticketId, {
        name: file.name,
        size: file.size,
        kind: kindOf(file.name),
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3 className="text-caption font-medium tracking-wide text-grey-500 uppercase">
          Attachments
        </h3>
        {canEdit ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ml-auto flex h-6 items-center gap-1 rounded-md border border-grey-200 px-1.5 text-caption text-grey-600 transition-colors hover:border-grey-300 hover:text-grey-900"
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

      <AttachmentGroup className="flex flex-col">
        {attachments.map((file) => (
          <AttachmentCard key={file.id} size="sm" className="w-full">
            <AttachmentMedia className="rounded-md">
              <Paperclip className="size-3.5 text-grey-400" strokeWidth={1.75} />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{file.name}</AttachmentTitle>
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
              : "border-grey-200 text-grey-400 hover:border-grey-300 hover:text-grey-600",
          )}
        >
          {dragging ? "Drop to attach" : "Drop a screenshot or log here, or click to browse"}
        </button>
      ) : null}
    </div>
  );
}
