"use client";

import * as React from "react";
import { Link2, Plus, X } from "lucide-react";

import { TypeIcon } from "@/components/tickets/badges";
import { StatusBadge } from "@/components/tickets/badges";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  childrenOf,
  LINK_LABEL,
  LINK_TYPES,
  type LinkType,
  type Ticket,
} from "@/lib/mock";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";

function TicketRow({
  ticket,
  onRemove,
}: {
  ticket: Ticket;
  onRemove?: () => void;
}) {
  const { openTicket } = useTicketPanel();

  return (
    <div className="group/link flex items-center gap-2 rounded-md border border-grey-200 px-2.5 py-1.5">
      <TypeIcon type={ticket.type} />
      <button
        type="button"
        onClick={() => openTicket(ticket.key)}
        className="tnum shrink-0 text-caption font-medium text-grey-500 hover:text-accent-700"
      >
        {ticket.key}
      </button>
      <button
        type="button"
        onClick={() => openTicket(ticket.key)}
        className="min-w-0 flex-1 truncate text-left text-small text-grey-800 hover:text-accent-700"
      >
        {ticket.title}
      </button>
      <StatusBadge status={ticket.status} />
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove link to ${ticket.key}`}
          className="tap flex size-5 shrink-0 items-center justify-center rounded-md text-grey-400 opacity-0 transition-opacity hover:bg-grey-150 hover:text-grey-700 focus-visible:opacity-100 group-hover/link:opacity-100"
        >
          <X className="size-3" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}

export function LinksBlock({ ticket, canEdit }: { ticket: Ticket; canEdit: boolean }) {
  const { tickets, linkTickets, unlinkTickets } = useTicketStore();
  const [linkType, setLinkType] = React.useState<LinkType>("blocked_by");
  const [query, setQuery] = React.useState("");

  const byId = React.useMemo(
    () => new Map(tickets.map((item) => [item.id, item])),
    [tickets],
  );

  const parent = ticket.parentId ? byId.get(ticket.parentId) : undefined;
  const children = React.useMemo(
    () => (ticket.type === "epic" ? childrenOf(tickets, ticket.id) : []),
    [tickets, ticket],
  );

  const grouped = React.useMemo(() => {
    const groups = new Map<LinkType, Ticket[]>();
    for (const link of ticket.links) {
      const other = byId.get(link.ticketId);
      if (!other) continue;
      const bucket = groups.get(link.type);
      if (bucket) bucket.push(other);
      else groups.set(link.type, [other]);
    }
    return groups;
  }, [ticket.links, byId]);

  const candidates = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    const linked = new Set(ticket.links.map((link) => link.ticketId));
    return tickets
      .filter(
        (item) =>
          item.id !== ticket.id &&
          !linked.has(item.id) &&
          (item.key.toLowerCase().includes(term) ||
            item.title.toLowerCase().includes(term)),
      )
      .slice(0, 6);
  }, [tickets, ticket, query]);

  const hasAnything =
    parent || children.length > 0 || grouped.size > 0 || canEdit;
  if (!hasAnything) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
          Relationships
        </h3>

        {canEdit ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="tap ml-auto flex h-6 items-center gap-1 rounded-md border border-grey-200 px-1.5 text-caption text-grey-600 transition-colors hover:border-grey-300 hover:text-grey-900"
              >
                <Plus className="size-3" strokeWidth={2.25} />
                Link
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-2">
              <Select
                value={linkType}
                onValueChange={(value) => setLinkType(value as LinkType)}
              >
                <SelectTrigger className="mb-2 h-7 text-small">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {LINK_LABEL[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Command shouldFilter={false}>
                <CommandInput
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Find a ticket by key or title"
                />
                <CommandList>
                  <CommandEmpty>
                    {query.trim() ? "No matches." : "Type to search."}
                  </CommandEmpty>
                  <CommandGroup>
                    {candidates.map((other) => (
                      <CommandItem
                        key={other.id}
                        value={other.key}
                        onSelect={() => {
                          linkTickets(ticket.id, other.id, linkType);
                          setQuery("");
                        }}
                        className="gap-2"
                      >
                        <span className="tnum shrink-0 text-caption text-grey-500">
                          {other.key}
                        </span>
                        <span className="truncate">{other.title}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      {parent ? (
        <div className="flex flex-col gap-1">
          <span className="text-caption text-grey-500">Epic</span>
          <TicketRow ticket={parent} />
        </div>
      ) : null}

      {children.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-caption text-grey-500">
            {children.length} child{children.length === 1 ? "" : "ren"} ·{" "}
            {children.filter((child) => child.status === "done").length} verified
          </span>
          {/*
           * Children sat flush with everything else, so the only thing saying
           * "these belong to that" was the heading above them. An inset and a
           * rule down the left make the containment visible, which is what
           * hierarchy is for.
           */}
          <div className="ml-2 flex flex-col gap-1 border-l border-grey-200 pl-3">
            {children.slice(0, 6).map((child) => (
              <TicketRow key={child.id} ticket={child} />
            ))}
          </div>
        </div>
      ) : null}

      {[...grouped.entries()].map(([type, items]) => (
        <div key={type} className="flex flex-col gap-1">
          <span className="text-caption text-grey-500">{LINK_LABEL[type]}</span>
          {items.map((other) => (
            <TicketRow
              key={other.id}
              ticket={other}
              onRemove={
                canEdit ? () => unlinkTickets(ticket.id, other.id) : undefined
              }
            />
          ))}
        </div>
      ))}

      {!parent && children.length === 0 && grouped.size === 0 ? (
        <p className="flex items-center gap-1.5 text-small text-grey-500">
          <Link2 className="size-3.5" strokeWidth={1.75} />
          Nothing linked yet.
        </p>
      ) : null}
    </div>
  );
}
