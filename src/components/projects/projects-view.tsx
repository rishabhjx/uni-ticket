"use client";

import * as React from "react";
import Link from "next/link";
import { Columns3, Rows3, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { CardsSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  getUser,
  projectStats,
  type Project,
} from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import type { ProjectStats } from "@/lib/mock";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption tracking-wide text-grey-500 uppercase">
        {label}
      </span>
      <span className="tnum text-small font-medium text-grey-900">{value}</span>
    </div>
  );
}

export function ProjectCard({
  project,
  stats,
}: {
  project: Project;
  stats: ProjectStats;
}) {
  const lead = getUser(project.leadId);

  return (
    <div className="flex flex-col gap-4 rounded-md border border-grey-200 p-4 transition-colors hover:border-grey-300">
      <div className="flex items-start gap-2.5">
        <span aria-hidden className="mt-0.5 shrink-0 text-lg leading-6">
          {project.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/projects/${project.slug}/board`}
            className="text-heading font-semibold text-grey-900 hover:text-accent-700"
          >
            {project.name}
          </Link>
          <p className="mt-0.5 text-small text-grey-500">{project.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Stat label="Tickets" value={stats.total} />
        <Stat label="Open" value={stats.open} />
        <Stat label="Overdue" value={stats.overdue} />
        <Stat label="Done" value={`${stats.completion}%`} />
      </div>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-small text-grey-500">
          Lead
          <UserAvatar userId={project.leadId} />
          <span className="text-grey-700">{lead?.name}</span>
        </span>
        <span className="ml-auto flex gap-1">
          {project.memberIds.slice(0, 4).map((id) => (
            <UserAvatar key={id} userId={id} />
          ))}
          {project.memberIds.length > 4 ? (
            <span className="tnum flex size-5 items-center justify-center rounded-full bg-grey-100 text-[9px] font-medium text-grey-600">
              +{project.memberIds.length - 4}
            </span>
          ) : null}
        </span>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/projects/${project.slug}/board`}
          className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-grey-200 text-small text-grey-700 transition-colors hover:border-grey-300 hover:text-grey-900"
        >
          <Columns3 className="size-3.5" strokeWidth={1.75} />
          Board
        </Link>
        <Link
          href={`/projects/${project.slug}/list`}
          className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-grey-200 text-small text-grey-700 transition-colors hover:border-grey-300 hover:text-grey-900"
        >
          <Rows3 className="size-3.5" strokeWidth={1.75} />
          List
        </Link>
      </div>
    </div>
  );
}

export function ProjectsView({ workspaceId }: { workspaceId?: string } = {}) {
  const { projects, tickets, isLoading } = useTicketStore();
  const [query, setQuery] = React.useState("");

  const scoped = React.useMemo(
    () =>
      workspaceId
        ? projects.filter((project) => project.workspaceId === workspaceId)
        : projects,
    [projects, workspaceId],
  );

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter(
      (project) =>
        project.name.toLowerCase().includes(q) ||
        project.key.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q),
    );
  }, [scoped, query]);

  if (isLoading) return <CardsSkeleton count={5} />;

  if (scoped.length === 0) {
    return (
      <EmptyState
        emoji="📁"
        title="No projects yet"
        description="Projects group tickets, boards and the people working on them. Create one to start organising work."
      />
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {/* Six projects fit on a screen; sixty do not, and this is the level
          that grows fastest once workspaces exist. */}
      <div className="hairline-b flex items-center gap-2 px-6 py-2.5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-grey-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
            className="h-7 w-64 rounded-md border border-grey-200 pr-2 pl-7 text-small text-grey-900 transition-colors placeholder:text-grey-500 hover:border-grey-300 focus:border-accent-600 focus:outline-none"
          />
        </div>
        <span className="tnum ml-auto text-small text-grey-500">
          {shown.length === scoped.length
            ? `${scoped.length} projects`
            : `${shown.length} of ${scoped.length}`}
        </span>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="No project matches that"
          description={`Nothing in this list matches “${query}”.`}
        />
      ) : (
        <div className="grid gap-3 px-6 py-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              stats={projectStats(tickets, project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
