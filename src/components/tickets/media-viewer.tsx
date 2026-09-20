"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, X } from "lucide-react";

import { formatBytes } from "@/lib/format";
import { useTicketStore } from "@/lib/store/ticket-store";
import type { Attachment } from "@/lib/mock";

/**
 * The open attachment lives in the URL as ?asset=<id>, for the same reason the
 * open ticket does: a screenshot somebody wants a second opinion on is a thing
 * you send, and browser-back should close it rather than leave the page.
 */
export function useMediaViewer() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openAssetId = params.get("asset");

  const setParam = React.useCallback(
    (id: string | null) => {
      const query = new URLSearchParams(params.toString());
      if (id) query.set("asset", id);
      else query.delete("asset");
      const search = query.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    },
    [params, pathname, router],
  );

  return {
    openAssetId,
    openAsset: React.useCallback((id: string) => setParam(id), [setParam]),
    closeAsset: React.useCallback(() => setParam(null), [setParam]),
  };
}

/** Every attachment on every ticket and comment, by id. */
function useAllAttachments() {
  const { tickets, comments } = useTicketStore();
  return React.useMemo(() => {
    const byId = new Map<string, Attachment>();
    for (const ticket of tickets) {
      for (const file of ticket.attachments) byId.set(file.id, file);
    }
    for (const comment of comments) {
      for (const file of comment.attachments) byId.set(file.id, file);
    }
    return byId;
  }, [tickets, comments]);
}

export function MediaViewer() {
  const { openAssetId, closeAsset } = useMediaViewer();
  const byId = useAllAttachments();
  const file = openAssetId ? byId.get(openAssetId) : undefined;

  React.useEffect(() => {
    if (!file) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeAsset();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [file, closeAsset]);

  if (!file) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={file.name}
      onClick={closeAsset}
      className="fixed inset-0 z-[60] flex flex-col bg-[oklch(0.08_0_0/0.86)] p-4 backdrop-blur-sm"
    >
      <header
        onClick={(event) => event.stopPropagation()}
        className="flex shrink-0 items-center gap-3 pb-3"
      >
        <div className="min-w-0">
          <p className="truncate text-small font-medium text-grey-900">
            {file.name}
          </p>
          <p className="text-caption text-grey-500">
            {formatBytes(file.size)} · {file.kind}
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {file.url ? (
            <a
              href={file.url}
              download={file.name}
              className="flex h-8 items-center gap-1.5 rounded-md border border-grey-300 px-2.5 text-small text-grey-900 transition-colors hover:bg-grey-100"
            >
              <Download className="size-3.5" strokeWidth={1.75} />
              Download
            </a>
          ) : null}
          <button
            type="button"
            onClick={closeAsset}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div
        onClick={(event) => event.stopPropagation()}
        className="flex min-h-0 flex-1 items-center justify-center"
      >
        {file.kind === "image" && file.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.name}
            className="max-h-full max-w-full rounded-md object-contain"
          />
        ) : file.kind === "video" && file.url ? (
          <video
            src={file.url}
            controls
            className="max-h-full max-w-full rounded-md"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <span aria-hidden className="text-3xl">
              📄
            </span>
            <p className="text-small text-grey-500">
              No preview for a {file.kind}. Download it to open it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
