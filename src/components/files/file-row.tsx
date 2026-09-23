"use client";

import * as React from "react";
import { Link2, Star, Trash2, X } from "lucide-react";

import { FILE_KIND_ICON } from "@/components/files/file-icon";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatBytes, formatRelative } from "@/lib/format";
import { ownerName, type DriveFile } from "@/lib/mock";
import { useFilesStore } from "@/lib/store/files-store";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

export function FileRow({
  file,
  onOpenFolder,
}: {
  file: DriveFile;
  onOpenFolder: (id: string) => void;
}) {
  const { toggleStar, linkToTicket, unlinkFromTicket, deleteFile } = useFilesStore();
  const { tickets } = useTicketStore();
  const { openTicket } = useTicketPanel();
  const [query, setQuery] = React.useState("");
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

      <button
        type="button"
        onClick={() => (file.kind === "folder" ? onOpenFolder(file.id) : undefined)}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <Icon
          className={cn("size-4 shrink-0", file.kind === "folder" ? "text-accent-600" : "text-grey-400")}
          strokeWidth={1.75}
        />
        <span className="min-w-0 flex-1 truncate text-small text-grey-900">{file.name}</span>
      </button>

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
      </div>

      <span className="w-28 shrink-0 truncate text-caption text-grey-500">{ownerName(file)}</span>
      <span className="w-20 shrink-0 text-right text-caption text-grey-500">
        {file.sizeBytes !== null ? formatBytes(file.sizeBytes) : "—"}
      </span>
      <span className="w-16 shrink-0 text-right text-caption text-grey-500">
        {formatRelative(file.updatedAt)}
      </span>

      <button
        type="button"
        onClick={() => deleteFile(file.id)}
        aria-label={`Delete ${file.name}`}
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-grey-400 opacity-0 transition-[opacity,background-color,color] hover:bg-grey-150 hover:text-grey-700 group-hover/file:opacity-100"
      >
        <Trash2 className="size-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
