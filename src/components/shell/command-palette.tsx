"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Columns3, Plus, Rows3, UserRound, Users } from "lucide-react";

import { PriorityBadge, StatusBadge, TypeIcon } from "@/components/tickets/badges";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { projects } from "@/lib/mock";
import { matchesSearch, parseSearch, SEARCH_HINTS, SEARCH_PLACEHOLDER } from "@/lib/search";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { useShell } from "@/hooks/use-shell";

type CommandPaletteValue = {
  open: () => void;
};

const CommandPaletteContext = React.createContext<CommandPaletteValue | null>(null);

export function useCommandPalette() {
  const context = React.use(CommandPaletteContext);
  if (!context) {
    throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>");
  }
  return context;
}

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();
  const { tickets } = useTicketStore();
  const { openCreate } = useShell();
  const { openTicket } = useTicketPanel();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // 228 tickets is too many to render at once, and nobody scrolls a palette.
  const matches = React.useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const parsed = parseSearch(trimmed);
    return tickets.filter((ticket) => matchesSearch(ticket, parsed)).slice(0, 8);
  }, [tickets, query]);

  const value = React.useMemo(
    () => ({ open: () => setOpen(true) }),
    [],
  );

  const run = (action: () => void) => {
    setOpen(false);
    setQuery("");
    action();
  };

  return (
    <CommandPaletteContext value={value}>
      {children}

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search tickets and jump to a board or list"
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={SEARCH_PLACEHOLDER}
        />
        <CommandList>
          <CommandEmpty>
            {query.trim() ? "🔍 No tickets match." : "Type to search tickets."}
          </CommandEmpty>

          {query.trim() === "" ? (
            <CommandGroup heading="Try">
              {SEARCH_HINTS.map((hint) => (
                <CommandItem
                  key={hint}
                  value={hint}
                  onSelect={() => setQuery(`${hint} `)}
                  className="gap-2"
                >
                  <code className="font-mono text-[12px] text-grey-600">{hint}</code>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {matches.length > 0 ? (
            <CommandGroup heading="Tickets">
              {matches.map((ticket) => (
                <CommandItem
                  key={ticket.id}
                  value={`${ticket.key} ${ticket.title}`}
                  onSelect={() => run(() => openTicket(ticket.key))}
                  className="gap-2"
                >
                  <TypeIcon type={ticket.type} />
                  <span className="tnum shrink-0 text-caption font-medium text-grey-500">
                    {ticket.key}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{ticket.title}</span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          <CommandGroup heading="Actions">
            <CommandItem
              value="new ticket create"
              onSelect={() => run(openCreate)}
              className="gap-2"
            >
              <Plus className="size-3.5 text-grey-400" strokeWidth={2} />
              New ticket
            </CommandItem>
            <CommandItem
              value="my work assigned to me"
              onSelect={() => run(() => router.push("/my-work"))}
              className="gap-2"
            >
              <UserRound className="size-3.5 text-grey-400" strokeWidth={1.75} />
              My work
            </CommandItem>
            <CommandItem
              value="my team reportees"
              onSelect={() => run(() => router.push("/my-work?scope=team"))}
              className="gap-2"
            >
              <Users className="size-3.5 text-grey-400" strokeWidth={1.75} />
              My team&apos;s work
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Go to">
            {projects.map((project) => (
              <React.Fragment key={project.id}>
                <CommandItem
                  value={`${project.name} board`}
                  onSelect={() =>
                    run(() => router.push(`/projects/${project.slug}/board`))
                  }
                  className="gap-2"
                >
                  <span aria-hidden className="w-4 shrink-0 text-center">
                    {project.emoji}
                  </span>
                  <Columns3 className="size-3.5 text-grey-400" strokeWidth={1.75} />
                  {project.name} board
                </CommandItem>
                <CommandItem
                  value={`${project.name} list`}
                  onSelect={() =>
                    run(() => router.push(`/projects/${project.slug}/list`))
                  }
                  className="gap-2"
                >
                  <span aria-hidden className="w-4 shrink-0 text-center">
                    {project.emoji}
                  </span>
                  <Rows3 className="size-3.5 text-grey-400" strokeWidth={1.75} />
                  {project.name} list
                </CommandItem>
              </React.Fragment>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext>
  );
}
