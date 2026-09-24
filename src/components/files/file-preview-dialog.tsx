"use client";

import * as React from "react";
import { Download, Users } from "lucide-react";

import { FILE_KIND_ICON } from "@/components/files/file-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { formatBytes, formatDateTime } from "@/lib/format";
import { ownerName, type DriveFile } from "@/lib/mock";

/**
 * There is no backend to actually serve these bytes, so "preview" means
 * showing what a real drive's preview pane would tell you about the file —
 * kind, size, owner, who it's shared with — rather than pretending to render
 * content that was never uploaded anywhere.
 */
export function FilePreviewDialog({
  file,
  open,
  onOpenChange,
}: {
  file: DriveFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const Icon = FILE_KIND_ICON[file.kind];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-grey-400" strokeWidth={1.75} />
            <span className="truncate">{file.name}</span>
          </DialogTitle>
          <DialogDescription className="text-small text-grey-500">
            {file.sizeBytes !== null ? formatBytes(file.sizeBytes) : "—"} · Updated{" "}
            {formatDateTime(file.updatedAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex aspect-video items-center justify-center rounded-md bg-grey-50">
            <Icon className="size-10 text-grey-300" strokeWidth={1.25} />
          </div>

          <div className="flex items-center gap-2 text-small text-grey-700">
            <UserAvatar userId={file.ownerId} size="sm" />
            Owned by {ownerName(file)}
          </div>

          {file.sharedWithIds.length > 0 ? (
            <div className="flex items-center gap-2 text-small text-grey-700">
              <Users className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
              Shared with {file.sharedWithIds.length}{" "}
              {file.sharedWithIds.length === 1 ? "person" : "people"}
            </div>
          ) : null}

          <p className="flex items-center gap-1.5 rounded-md bg-grey-50 px-2.5 py-2 text-caption text-grey-500">
            <Download className="size-3.5 shrink-0" strokeWidth={1.75} />
            This is a prototype — there is nothing behind this file to download.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
