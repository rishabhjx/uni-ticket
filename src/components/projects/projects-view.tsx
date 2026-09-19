"use client";

import Link from "next/link";
import { Columns3, FolderOpen, Rows3 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { CardsSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  getUser,
  projectMonogram,
  projects,
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

function ProjectCard({
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
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-grey-200 text-caption font-semibold text-grey-600">
          {projectMonogram(project)}
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

export function ProjectsView() {
  const { tickets, isLoading } = useTicketStore();

  if (isLoading) return <CardsSkeleton count={5} />;

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No projects yet"
        description="Projects group tickets, boards and the people working on them. Create one to start organising work."
      />
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="grid gap-3 px-6 py-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            stats={projectStats(tickets, project.id)}
          />
        ))}
      </div>
    </div>
  );
}
