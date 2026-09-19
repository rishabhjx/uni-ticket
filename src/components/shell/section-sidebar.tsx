"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Columns3,
  LayoutGrid,
  Rows3,
  Search,
  UserRound,
} from "lucide-react";

import { navProjects, type NavProject } from "@/components/shell/nav-data";
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
  project: NavProject;
  pathname: string;
}) {
  const base = `/projects/${project.key}`;
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
          <span className="flex size-4 shrink-0 items-center justify-center rounded-md bg-grey-200 text-[9px] font-semibold text-grey-600">
            {project.monogram}
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

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden bg-grey-50 transition-[width] duration-150 ease-out",
        sidebarOpen ? "w-sidebar hairline-r" : "w-0",
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
            className="flex h-8 w-full items-center gap-2 rounded-md bg-grey-0 px-2.5 text-small text-grey-500 ring-1 ring-grey-200 transition-colors hover:ring-grey-300"
          >
            <Search className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span>Search tickets</span>
            <kbd className="ml-auto text-caption text-grey-400">⌘K</kbd>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4">
          <ul className="flex flex-col gap-px">
            <li>
              <NavItem href="/my-tickets" icon={UserRound} active={pathname === "/my-tickets"}>
                My tickets
              </NavItem>
            </li>
            <li>
              <NavItem href="/boards" icon={LayoutGrid} active={pathname === "/boards"}>
                Boards
              </NavItem>
            </li>
          </ul>

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
            {navProjects.map((project) => (
              <ProjectItem key={project.key} project={project} pathname={pathname} />
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}
