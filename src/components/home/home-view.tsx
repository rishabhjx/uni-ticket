"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";

import { KpiCard } from "@/components/home/kpi-card";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiSkeleton, CardsSkeleton } from "@/components/shared/skeletons";
import { useTicketStore } from "@/lib/store/ticket-store";
import {
  myProjects,
  personalKpis,
  projectMonogram,
  type ProjectStats,
} from "@/lib/mock";

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

function ProjectSummary({
  name,
  slug,
  monogram,
  stats,
}: {
  name: string;
  slug: string;
  monogram: string;
  stats: ProjectStats;
}) {
  return (
    <Link
      href={`/projects/${slug}/board`}
      className="flex flex-col gap-3 rounded-md border border-grey-200 p-4 transition-colors hover:border-grey-300"
    >
      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-md bg-grey-200 text-[10px] font-semibold text-grey-600">
          {monogram}
        </span>
        <span className="truncate text-heading font-medium text-grey-900">
          {name}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Stat label="Mine" value={stats.mine} />
        <Stat label="Open" value={stats.open} />
        <Stat label="Overdue" value={stats.overdue} />
        <Stat label="Done" value={`${stats.completion}%`} />
      </div>

      <div
        className="h-1 overflow-hidden rounded-md bg-grey-150"
        role="img"
        aria-label={`${stats.completion}% complete`}
      >
        <div
          className="h-full rounded-md bg-grey-700"
          style={{ width: `${stats.completion}%` }}
        />
      </div>
    </Link>
  );
}

export function HomeView() {
  const { tickets, isLoading } = useTicketStore();

  if (isLoading) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-6 py-5">
          <KpiSkeleton />
        </div>
        <CardsSkeleton count={5} />
      </div>
    );
  }

  const kpis = personalKpis(tickets);
  const projects = myProjects(tickets);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <section className="px-6 py-5">
        <h2 className="sr-only">My work</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Pending"
            value={kpis.pending}
            hint="Backlog and To Do"
            href="/my-tickets?view=pending"
          />
          <KpiCard
            label="In progress"
            value={kpis.inProgress}
            hint="Being worked on or reviewed"
            href="/my-tickets?view=active"
          />
          <KpiCard
            label="Overdue"
            value={kpis.overdue}
            hint="Past their due date"
            href="/my-tickets?view=overdue"
            emphasis
          />
          <KpiCard
            label="Updated this week"
            value={kpis.assignedThisWeek}
            hint="Touched since Monday"
            href="/my-tickets"
          />
        </div>
      </section>

      <section className="px-6 pb-8">
        <h2 className="mb-3 text-heading font-semibold text-grey-900">
          My projects
        </h2>

        {projects.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No projects assigned"
            description="Once tickets are assigned to you, the projects they belong to show up here."
            action={{ label: "Browse projects", href: "/projects" }}
            className="rounded-md border border-grey-200"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projects.map(({ project, stats }) => (
              <ProjectSummary
                key={project.id}
                name={project.name}
                slug={project.slug}
                monogram={projectMonogram(project)}
                stats={stats}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
