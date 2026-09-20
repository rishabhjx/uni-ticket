"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLine,
  ChevronDown,
  ChevronRight,
  Columns3,
  FolderPlus,
  LayoutDashboard,
  Layers,
  Plus,
  Rows3,
  Search,
  TicketPlus,
  UserRound,
} from "lucide-react";

import { Kbd, KbdGroup } from "@/components/reui/kbd";
import { useCommandPalette } from "@/components/shell/command-palette";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { useShell } from "@/hooks/use-shell";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

const link =
  "flex h-7 items-center gap-1.5 rounded-md px-2 text-small font-medium transition-colors";
const linkIdle = "text-grey-600 hover:bg-grey-100 hover:text-grey-900";
const linkActive = "bg-grey-100 text-grey-900";

/**
 * Everything that used to live in the section sidebar, in one bar.
 *
 * The sidebar made sense for an app that owns the whole window. This one is a
 * tenant of a unified workspace — the rail on the left is the workspace's, not
 * ours — so a second permanent column spent 248px restating a nav that fits in
 * a row. The hierarchy it used to draw (workspace > project > view) is a
 * breadcrumb now, which is the shape that actually survives three levels.
 */
export function TopNav() {
  const pathname = usePathname();
  const { workspaces, projects, tickets } = useTicketStore();
  const { openCreate, openCreateProject, openCreateWorkspace } = useShell();
  const { open: openPalette } = useCommandPalette();

  const match = pathname.match(/^\/projects\/([^/]+)(?:\/([^/]+))?/);
  const projectSlug = match?.[1];
  const view = match?.[2];

  // A ticket page is inside a project too, so the breadcrumb should say so
  // rather than falling back to "All workspaces".
  const ticketMatch = pathname.match(/^\/tickets\/([^/]+)/);
  const ticket = ticketMatch
    ? tickets.find(
        (item) => item.key.toLowerCase() === ticketMatch[1].toLowerCase(),
      )
    : undefined;

  const project =
    projects.find((item) => item.slug === projectSlug) ??
    (ticket ? projects.find((item) => item.id === ticket.projectId) : undefined);
  const workspace = workspaces.find((item) => item.id === project?.workspaceId);

  const wsMatch = pathname.match(/^\/workspaces\/([^/]+)/);
  const openWorkspace =
    workspace ?? workspaces.find((item) => item.slug === wsMatch?.[1]);

  const is = (href: string) => pathname === href;

  return (
    <header className="hairline-b flex h-topbar shrink-0 items-center gap-1 bg-grey-0 px-3 sm:px-4">
      {/* Top-level destinations. Three, because there were only ever three. */}
      <nav className="flex items-center gap-0.5">
        <Link href="/" className={cn(link, is("/") ? linkActive : linkIdle)}>
          <LayoutDashboard className="size-3.5" strokeWidth={1.75} />
          Overview
        </Link>
        <Link
          href="/my-work"
          className={cn(link, is("/my-work") ? linkActive : linkIdle)}
        >
          <UserRound className="size-3.5" strokeWidth={1.75} />
          My work
        </Link>
        <Link
          href="/insights"
          className={cn(link, is("/insights") ? linkActive : linkIdle)}
        >
          <ChartLine className="size-3.5" strokeWidth={1.75} />
          Insights
        </Link>
      </nav>

      <span aria-hidden className="mx-1 h-4 w-px bg-grey-200" />

      {/* Workspace > project > view, as a breadcrumb of pickers. */}
      <WorkspacePicker current={openWorkspace?.id ?? null} />

      {openWorkspace ? (
        <>
          <ChevronRight
            aria-hidden
            className="size-3.5 shrink-0 text-grey-400"
            strokeWidth={2}
          />
          <ProjectPicker workspaceId={openWorkspace.id} current={project?.id ?? null} />
        </>
      ) : null}

      {project ? (
        <>
          <ChevronRight
            aria-hidden
            className="size-3.5 shrink-0 text-grey-400"
            strokeWidth={2}
          />
          <div className="flex items-center gap-0.5 rounded-md bg-grey-100 p-0.5">
            {(
              [
                { segment: "board", label: "Board", icon: Columns3 },
                { segment: "list", label: "List", icon: Rows3 },
                { segment: "roadmap", label: "Roadmap", icon: Layers },
              ] as const
            ).map(({ segment, label, icon: Icon }) => (
              <Link
                key={segment}
                href={`/projects/${project.slug}/${segment}`}
                aria-current={view === segment ? "page" : undefined}
                className={cn(
                  "flex h-6 items-center gap-1.5 rounded-md px-2 text-caption font-medium transition-colors",
                  view === segment
                    ? "bg-grey-0 text-grey-900"
                    : "text-grey-600 hover:text-grey-900",
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.75} />
                {label}
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ThemeToggle />

        <button
          type="button"
          onClick={openPalette}
          className="flex h-7 items-center gap-2 rounded-md border border-grey-200 px-2 text-small text-grey-500 transition-colors hover:border-grey-300"
        >
          <Search className="size-3.5 shrink-0" strokeWidth={1.75} />
          <span className="max-lg:hidden">Search</span>
          <KbdGroup className="max-lg:hidden">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-7 items-center gap-1 rounded-md bg-accent-600 pr-2 pl-1.5 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700"
            >
              <Plus className="size-3.5" strokeWidth={2.25} />
              New
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={openCreate} className="gap-2">
              <TicketPlus className="size-3.5 text-grey-400" strokeWidth={1.75} />
              New ticket
              <Kbd className="ml-auto">C</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openCreateProject} className="gap-2">
              <FolderPlus className="size-3.5 text-grey-400" strokeWidth={1.75} />
              New project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openCreateWorkspace} className="gap-2">
              <Layers className="size-3.5 text-grey-400" strokeWidth={1.75} />
              New workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function WorkspacePicker({ current }: { current: string | null }) {
  const { workspaces } = useTicketStore();
  const { openCreateWorkspace } = useShell();
  const active = workspaces.find((item) => item.id === current);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(link, active ? linkActive : linkIdle, "max-w-[220px]")}
        >
          <span aria-hidden>{active?.emoji ?? "🗂️"}</span>
          <span className="min-w-0 truncate">
            {active?.name ?? "All workspaces"}
          </span>
          <ChevronDown className="size-3 shrink-0 text-grey-400" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem key={workspace.id} asChild>
            <Link href={`/workspaces/${workspace.slug}`} className="gap-2">
              <span aria-hidden>{workspace.emoji}</span>
              <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
              {workspace.id === current ? (
                <span aria-hidden className="text-accent-600">
                  ✓
                </span>
              ) : null}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/projects" className="gap-2">
            <LayoutDashboard className="size-3.5 text-grey-400" strokeWidth={1.75} />
            All projects
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openCreateWorkspace} className="gap-2">
          <Plus className="size-3.5 text-grey-400" strokeWidth={2} />
          New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectPicker({
  workspaceId,
  current,
}: {
  workspaceId: string;
  current: string | null;
}) {
  const { projects } = useTicketStore();
  const { openCreateProject } = useShell();
  const scoped = projects.filter((item) => item.workspaceId === workspaceId);
  const active = scoped.find((item) => item.id === current);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(link, active ? linkActive : linkIdle, "max-w-[220px]")}
        >
          <span aria-hidden>{active?.emoji ?? "📁"}</span>
          <span className="min-w-0 truncate">
            {active?.name ?? "Pick a project"}
          </span>
          <ChevronDown className="size-3 shrink-0 text-grey-400" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Projects</DropdownMenuLabel>
        {scoped.length === 0 ? (
          <p className="px-2 py-3 text-small text-grey-500">
            No projects in this workspace yet.
          </p>
        ) : (
          scoped.map((project) => (
            <DropdownMenuItem key={project.id} asChild>
              <Link href={`/projects/${project.slug}/board`} className="gap-2">
                <span aria-hidden>{project.emoji}</span>
                <span className="min-w-0 flex-1 truncate">{project.name}</span>
                {project.id === current ? (
                  <span aria-hidden className="text-accent-600">
                    ✓
                  </span>
                ) : null}
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={openCreateProject} className="gap-2">
          <Plus className="size-3.5 text-grey-400" strokeWidth={2} />
          New project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
