"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Kbd, KbdGroup } from "@/components/reui/kbd";
import {
  ChartLine,
  ChevronRight,
  Columns3,
  LayoutDashboard,
  LayoutGrid,
  Rows3,
  Search,
  Star,
  UserRound,
  X,
} from "lucide-react";

import { useCommandPalette } from "@/components/shell/command-palette";
import { type Project } from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { useViewState } from "@/lib/store/view-state";
import { useShell } from "@/hooks/use-shell";
import { cn } from "@/lib/utils";

const itemBase =
  "group flex h-7 items-center gap-2 rounded-md px-2 text-small transition-colors";
const itemIdle = "text-grey-700 hover:bg-grey-150 hover:text-grey-900";
const itemActive = "bg-accent-50 font-medium text-accent-700";

function NavItem({
  href,
  icon: Icon,
  children,
  active,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(itemBase, active ? itemActive : itemIdle)}
    >
      <Icon
        className={cn("size-4 shrink-0", active ? "text-accent-600" : "text-grey-400")}
        strokeWidth={1.75}
      />
      <span className="truncate">{children}</span>
    </Link>
  );
}

function ProjectItem({
  project,
  pathname,
}: {
  project: Project;
  pathname: string;
}) {
  const base = `/projects/${project.slug}`;
  const active = pathname.startsWith(base);

  // Navigating into a project expands it; adjusting during render rather than
  // in an effect keeps it to a single pass.
  const [open, setOpen] = React.useState(active);
  const [wasActive, setWasActive] = React.useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setOpen(true);
  }

  return (
    <li>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${project.name}`}
          className="flex size-5 shrink-0 items-center justify-center rounded-md text-grey-400 transition-colors hover:bg-grey-150 hover:text-grey-700"
        >
          <ChevronRight
            className={cn("size-3.5 transition-transform duration-150", open && "rotate-90")}
            strokeWidth={2}
          />
        </button>
        <Link
          href={`${base}/board`}
          className={cn(
            itemBase,
            "min-w-0 flex-1",
            active ? "font-medium text-grey-900" : itemIdle,
          )}
        >
            <span aria-hidden className="w-4 shrink-0 text-center text-[13px] leading-4">
              {project.emoji}
            </span>
          <span className="truncate">{project.name}</span>
        </Link>
      </div>

      {open ? (
        <ul className="mt-px ml-5 flex flex-col gap-px border-l border-grey-200 pl-2">
          <li>
            <Link
              href={`${base}/board`}
              aria-current={pathname === `${base}/board` ? "page" : undefined}
              className={cn(
                itemBase,
                pathname === `${base}/board` ? itemActive : itemIdle,
              )}
            >
              <Columns3 className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
              Board
            </Link>
          </li>
          <li>
            <Link
              href={`${base}/list`}
              aria-current={pathname === `${base}/list` ? "page" : undefined}
              className={cn(
                itemBase,
                pathname === `${base}/list` ? itemActive : itemIdle,
              )}
            >
              <Rows3 className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
              List
            </Link>
          </li>
        </ul>
      ) : null}
    </li>
  );
}

export function SectionSidebar() {
  const pathname = usePathname();
  const { sidebarOpen } = useShell();
  const { open: openCommandPalette } = useCommandPalette();
  const { savedViews, removeSavedView } = useViewState();
  const { projects } = useTicketStore();

  return (
    <div
      className={cn(
        // Below lg the sidebar floats over the content instead of pushing it,
        // because there is not enough width to do both.
        "shrink-0 overflow-hidden bg-grey-50 transition-[width,transform] duration-[--duration-slow]",
        "max-lg:absolute max-lg:inset-y-0 max-lg:left-rail max-lg:z-30 max-lg:shadow-overlay",
        sidebarOpen
          ? "w-sidebar hairline-r max-lg:translate-x-0"
          : "w-0 max-lg:w-sidebar max-lg:-translate-x-full",
      )}
    >
      <nav
        aria-label="Tickets"
        inert={!sidebarOpen}
        className="flex h-full w-sidebar flex-col"
      >
        <div className="flex h-topbar shrink-0 items-center px-4">
          <span className="text-heading font-semibold text-grey-900">Tickets</span>
        </div>

        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={openCommandPalette}
            className="flex h-8 w-full items-center gap-2 rounded-md bg-grey-0 px-2.5 text-small text-grey-500 ring-1 ring-grey-200 transition-colors hover:ring-grey-300"
          >
            <Search className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span>Search tickets</span>
            <KbdGroup className="ml-auto">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4">
          <ul className="flex flex-col gap-px">
            <li>
              <NavItem href="/" icon={LayoutDashboard} active={pathname === "/"}>
                Overview
              </NavItem>
            </li>
            <li>
              <NavItem
                href="/my-work"
                icon={UserRound}
                active={pathname === "/my-work"}
              >
                My work
              </NavItem>
            </li>
            <li>
              <NavItem href="/boards" icon={LayoutGrid} active={pathname === "/boards"}>
                Boards
              </NavItem>
            </li>
            <li>
              <NavItem
                href="/insights"
                icon={ChartLine}
                active={pathname === "/insights"}
              >
                Insights
              </NavItem>
            </li>
          </ul>

          {savedViews.length > 0 ? (
            <>
              <div className="mt-6 mb-1 px-2">
                <span className="text-caption font-medium tracking-wide text-grey-500 uppercase">
                  Saved views
                </span>
              </div>
              <ul className="flex flex-col gap-px">
                {savedViews.map((view) => (
                  <li key={view.id} className="group/view flex items-center">
                    <Link
                      href={view.query ? `${view.path}?${view.query}` : view.path}
                      className={cn(itemBase, itemIdle, "min-w-0 flex-1")}
                    >
                      <Star
                        className="size-3.5 shrink-0 text-grey-400"
                        strokeWidth={1.75}
                      />
                      <span className="truncate">{view.name}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeSavedView(view.id)}
                      aria-label={`Remove ${view.name}`}
                      className="flex size-5 shrink-0 items-center justify-center rounded-md text-grey-400 opacity-0 transition-opacity hover:bg-grey-150 hover:text-grey-700 focus-visible:opacity-100 group-hover/view:opacity-100"
                    >
                      <X className="size-3" strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <div className="mt-6 mb-1 flex items-center justify-between px-2">
            <span className="text-caption font-medium tracking-wide text-grey-500 uppercase">
              Projects
            </span>
            <Link
              href="/projects"
              className="text-caption text-grey-500 transition-colors hover:text-grey-900"
            >
              All
            </Link>
          </div>

          <ul className="flex flex-col gap-px">
            {projects.map((project) => (
              <ProjectItem key={project.id} project={project} pathname={pathname} />
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}
