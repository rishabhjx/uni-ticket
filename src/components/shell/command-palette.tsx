"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Columns3,
  FolderOpen,
  FolderPlus,
  Hash,
  Layers,
  Mail,
  Plus,
  Rows3,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import { PriorityBadge, StatusBadge, TypeIcon } from "@/components/tickets/badges";
import { ProjectIcon } from "@/components/shared/entity-icon";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { formatRelative } from "@/lib/format";
import { conversationName, threadDisplayName } from "@/lib/mock";
import { matchesSearch, parseSearch, SEARCH_HINTS, SEARCH_PLACEHOLDER } from "@/lib/search";
import { useChatStore } from "@/lib/store/chat-store";
import { useFilesStore } from "@/lib/store/files-store";
import { useMailStore } from "@/lib/store/mail-store";
import { useMeetingsStore } from "@/lib/store/meetings-store";
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
  const { projects, tickets } = useTicketStore();
  const { openCreate, openCreateProject, openCreateWorkspace } = useShell();
  const { openTicket } = useTicketPanel();
  const { conversations, messages: chatMessages } = useChatStore();
  const { threads: mailThreads } = useMailStore();
  const { meetings } = useMeetingsStore();
  const { files } = useFilesStore();

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

  // Every other app in the workspace, searched the same box — the point of a
  // unified ⌘K is that "where did I see that" never depends on remembering
  // which app it was in.
  const term = query.trim().toLowerCase();

  const chatMatches = React.useMemo(() => {
    if (!term) return [];
    const channels = conversations
      .filter((c) => c.kind !== "dm" && c.name.toLowerCase().includes(term))
      .map((c) => ({
        kind: "channel" as const,
        id: c.id,
        label: conversationName(c),
        at: "",
      }));
    const inMessages = chatMessages
      .filter((m) => m.body.toLowerCase().includes(term))
      .slice(0, 4)
      .map((m) => ({
        kind: "message" as const,
        id: m.id,
        conversationId: m.conversationId,
        threadId: m.parentId,
        label: `${conversationName(
          conversations.find((c) => c.id === m.conversationId)!,
        )}: ${m.body}`,
        at: m.createdAt,
      }));
    return [...channels.slice(0, 3), ...inMessages].slice(0, 5);
  }, [term, conversations, chatMessages]);

  const mailMatches = React.useMemo(() => {
    if (!term) return [];
    return mailThreads
      .filter(
        (t) =>
          t.subject.toLowerCase().includes(term) ||
          threadDisplayName(t).toLowerCase().includes(term),
      )
      .slice(0, 5);
  }, [term, mailThreads]);

  const meetingMatches = React.useMemo(() => {
    if (!term) return [];
    return meetings.filter((m) => m.title.toLowerCase().includes(term)).slice(0, 5);
  }, [term, meetings]);

  const fileMatches = React.useMemo(() => {
    if (!term) return [];
    return files
      .filter((f) => f.kind !== "folder" && f.name.toLowerCase().includes(term))
      .slice(0, 5);
  }, [term, files]);

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
            <span className="flex items-center gap-1.5">
              <Search className="size-3.5 text-grey-400" strokeWidth={1.75} />
              {query.trim()
                ? "Nothing matches, in tickets, chat, mail, meetings or files."
                : "Type to search."}
            </span>
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

          {chatMatches.length > 0 ? (
            <CommandGroup heading="Chat">
              {chatMatches.map((item) =>
                item.kind === "channel" ? (
                  <CommandItem
                    key={`chat-${item.id}`}
                    value={`chat ${item.label}`}
                    onSelect={() => run(() => router.push(`/chat?c=${item.id}`))}
                    className="gap-2"
                  >
                    <Hash className="size-3.5 text-grey-400" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </CommandItem>
                ) : (
                  <CommandItem
                    key={`chat-${item.id}`}
                    value={`chat ${item.label}`}
                    onSelect={() =>
                      run(() => {
                        const q = new URLSearchParams({ c: item.conversationId! });
                        if (item.threadId) q.set("thread", item.threadId);
                        router.push(`/chat?${q.toString()}`);
                      })
                    }
                    className="gap-2"
                  >
                    <Hash className="size-3.5 text-grey-400" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span className="shrink-0 text-caption text-grey-500">
                      {formatRelative(item.at)}
                    </span>
                  </CommandItem>
                ),
              )}
            </CommandGroup>
          ) : null}

          {mailMatches.length > 0 ? (
            <CommandGroup heading="Mail">
              {mailMatches.map((thread) => (
                <CommandItem
                  key={thread.id}
                  value={`mail ${thread.subject}`}
                  onSelect={() =>
                    run(() => router.push(`/mail?folder=${thread.folder}&t=${thread.id}`))
                  }
                  className="gap-2"
                >
                  <Mail className="size-3.5 text-grey-400" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate">
                    {threadDisplayName(thread)} — {thread.subject}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {meetingMatches.length > 0 ? (
            <CommandGroup heading="Meetings">
              {meetingMatches.map((meeting) => (
                <CommandItem
                  key={meeting.id}
                  value={`meeting ${meeting.title}`}
                  onSelect={() => run(() => router.push(`/meetings?open=${meeting.id}`))}
                  className="gap-2"
                >
                  <CalendarDays className="size-3.5 text-grey-400" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate">{meeting.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {fileMatches.length > 0 ? (
            <CommandGroup heading="Files">
              {fileMatches.map((file) => (
                <CommandItem
                  key={file.id}
                  value={`file ${file.name}`}
                  onSelect={() =>
                    run(() => {
                      const q = new URLSearchParams({ drive: file.projectId ?? "mine" });
                      if (file.parentId) q.set("folder", file.parentId);
                      router.push(`/files?${q.toString()}`);
                    })
                  }
                  className="gap-2"
                >
                  <FolderOpen className="size-3.5 text-grey-400" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
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
              value="new project create"
              onSelect={() => run(openCreateProject)}
              className="gap-2"
            >
              <FolderPlus className="size-3.5 text-grey-400" strokeWidth={1.75} />
              New project
            </CommandItem>
            <CommandItem
              value="new workspace create"
              onSelect={() => run(openCreateWorkspace)}
              className="gap-2"
            >
              <Layers className="size-3.5 text-grey-400" strokeWidth={1.75} />
              New workspace
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
                  <ProjectIcon project={project} size="xs" />
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
                  <ProjectIcon project={project} size="xs" />
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
