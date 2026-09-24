"use client";

import * as React from "react";
import { FolderInput, Link2, MoreHorizontal, Pencil, Share2, Star, Trash2, X } from "lucide-react";

import { FILE_KIND_ICON } from "@/components/files/file-icon";
import { FilePreviewDialog } from "@/components/files/file-preview-dialog";
import { MemberPicker } from "@/components/shared/member-picker";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatBytes, formatRelative } from "@/lib/format";
import { ownerName, type DriveFile } from "@/lib/mock";
import { useFilesStore } from "@/lib/store/files-store";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

export function FileRow({
  file,
  siblingFolders,
  onOpenFolder,
}: {
  file: DriveFile;
  /** Every folder in this same drive, for the "Move to" submenu. */
  siblingFolders: DriveFile[];
  onOpenFolder: (id: string) => void;
}) {
  const { toggleStar, linkToTicket, unlinkFromTicket, deleteFile, renameFile, moveFile, setSharedWith } =
    useFilesStore();
  const { tickets } = useTicketStore();
  const { openTicket } = useTicketPanel();
  const [query, setQuery] = React.useState("");
  const [renaming, setRenaming] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(file.name);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const Icon = FILE_KIND_ICON[file.kind];

  const candidates = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return tickets
      .filter(
        (ticket) =>
          !file.ticketRefs.includes(ticket.key) &&
          (ticket.key.toLowerCase().includes(term) ||
            ticket.title.toLowerCase().includes(term)),
      )
      .slice(0, 6);
  }, [tickets, query, file.ticketRefs]);

  const moveTargets = siblingFolders.filter((folder) => folder.id !== file.id);

  const commitRename = () => {
    renameFile(file.id, nameDraft);
    setRenaming(false);
  };

  const open = () => {
    if (file.kind === "folder") onOpenFolder(file.id);
    else setPreviewOpen(true);
  };

  return (
    <div className="group/file hairline-b flex items-center gap-3 px-4 py-2 transition-colors hover:bg-grey-50">
      <button
        type="button"
        onClick={() => toggleStar(file.id)}
        aria-label={file.starred ? "Unstar" : "Star"}
        className={cn(
          "shrink-0 text-grey-400 opacity-0 transition-opacity hover:text-grey-700 group-hover/file:opacity-100",
          file.starred && "opacity-100",
        )}
      >
        <Star className={cn("size-3.5", file.starred && "fill-current text-accent-600")} strokeWidth={1.75} />
      </button>

      {renaming ? (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Icon
            className={cn("size-4 shrink-0", file.kind === "folder" ? "text-accent-600" : "text-grey-400")}
            strokeWidth={1.75}
          />
          <input
            autoFocus
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            onFocus={(event) => event.target.select()}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitRename();
              if (event.key === "Escape") {
                setNameDraft(file.name);
                setRenaming(false);
              }
            }}
            onBlur={commitRename}
            aria-label="File name"
            className="min-w-0 flex-1 rounded-md border border-accent-600 bg-grey-0 px-1.5 py-0.5 text-small text-grey-900 focus:outline-none"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={open}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <Icon
            className={cn("size-4 shrink-0", file.kind === "folder" ? "text-accent-600" : "text-grey-400")}
            strokeWidth={1.75}
          />
          <span className="min-w-0 flex-1 truncate text-small text-grey-900">{file.name}</span>
        </button>
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        {file.ticketRefs.map((key) => (
          <span
            key={key}
            className="tnum flex items-center gap-1 rounded-md bg-accent-50 px-1.5 py-0.5 text-caption font-medium text-accent-700"
          >
            <button type="button" onClick={() => openTicket(key)} className="hover:underline">
              {key}
            </button>
            <button
              type="button"
              onClick={() => unlinkFromTicket(file.id, key)}
              aria-label={`Unlink ${key}`}
              className="text-accent-700/60 hover:text-accent-700"
            >
              <X className="size-2.5" strokeWidth={2.5} />
            </button>
          </span>
        ))}

        {file.kind !== "folder" ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Link to a ticket"
                className="flex size-6 items-center justify-center rounded-md text-grey-400 opacity-0 transition-[opacity,background-color,color] hover:bg-grey-150 hover:text-grey-700 group-hover/file:opacity-100"
              >
                <Link2 className="size-3.5" strokeWidth={1.75} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-2">
              <Command shouldFilter={false}>
                <CommandInput
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Find a ticket by key or title"
                />
                <CommandList>
                  <CommandEmpty>{query.trim() ? "No matches." : "Type to search."}</CommandEmpty>
                  <CommandGroup>
                    {candidates.map((ticket) => (
                      <CommandItem
                        key={ticket.id}
                        value={ticket.key}
                        onSelect={() => {
                          linkToTicket(file.id, ticket.key);
                          setQuery("");
                        }}
                        className="gap-2"
                      >
                        <span className="tnum shrink-0 text-caption text-grey-500">{ticket.key}</span>
                        <span className="truncate">{ticket.title}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : null}

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              title="Share"
              className={cn(
                "flex size-6 items-center justify-center rounded-md text-grey-400 opacity-0 transition-[opacity,background-color,color] hover:bg-grey-150 hover:text-grey-700 group-hover/file:opacity-100",
                file.sharedWithIds.length > 0 && "opacity-100 text-accent-600",
              )}
            >
              <Share2 className="size-3.5" strokeWidth={1.75} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-2.5">
            <p className="mb-1.5 text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
              Shared with
            </p>
            <MemberPicker
              value={file.sharedWithIds}
              onChange={(next) => setSharedWith(file.id, next)}
              placeholder="Add people"
            />
          </PopoverContent>
        </Popover>
      </div>

      <span className="w-28 shrink-0 truncate text-caption text-grey-500">{ownerName(file)}</span>
      <span className="w-20 shrink-0 text-right text-caption text-grey-500">
        {file.sizeBytes !== null ? formatBytes(file.sizeBytes) : "—"}
      </span>
      <span className="w-16 shrink-0 text-right text-caption text-grey-500">
        {formatRelative(file.updatedAt)}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`More actions for ${file.name}`}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-grey-400 opacity-0 transition-[opacity,background-color,color] hover:bg-grey-150 hover:text-grey-700 group-hover/file:opacity-100"
          >
            <MoreHorizontal className="size-3.5" strokeWidth={1.75} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onSelect={() => {
              setNameDraft(file.name);
              setRenaming(true);
            }}
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
            Rename
          </DropdownMenuItem>
          {moveTargets.length > 0 || file.parentId ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput className="size-3.5" strokeWidth={1.75} />
                Move to
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {file.parentId ? (
                    <DropdownMenuItem onSelect={() => moveFile(file.id, null)}>
                      Drive root
                    </DropdownMenuItem>
                  ) : null}
                  {moveTargets.map((folder) => (
                    <DropdownMenuItem key={folder.id} onSelect={() => moveFile(file.id, folder.id)}>
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => deleteFile(file.id)}>
            <Trash2 className="size-3.5" strokeWidth={1.75} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {file.kind !== "folder" ? (
        <FilePreviewDialog file={file} open={previewOpen} onOpenChange={setPreviewOpen} />
      ) : null}
    </div>
  );
}
