import { GitBranch, GitPullRequest, Paperclip } from "lucide-react";

import { formatBytes } from "@/lib/format";
import type { Attachment, Development } from "@/lib/mock";
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

export function AttachmentsBlock({ attachments }: { attachments: Attachment[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-caption font-medium tracking-wide text-grey-500 uppercase">
        Attachments
      </h3>
      <ul className="flex flex-col gap-1">
        {attachments.map((file) => (
          <li
            key={file.id}
            className="flex items-center gap-2 rounded-md border border-grey-200 px-2.5 py-1.5"
          >
            <Paperclip className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
            <span className="truncate text-small text-grey-800">{file.name}</span>
            <span className="tnum ml-auto shrink-0 text-caption text-grey-500">
              {formatBytes(file.size)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
