"use client";

import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { CardsSkeleton, KpiSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  kpisFor,
  myProjects,
  personalKpis,
  reporteesOf,
  ticketsForTeam,
  type ProjectStats,
} from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

function KpiCard({
  label,
  value,
  hint,
  href,
  alert = false,
}: {
  label: string;
  value: number;
  hint: string;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-md border border-grey-200 p-4 transition-colors hover:border-grey-300"
    >
      <span className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
        {label}
      </span>
      <span
        className={cn(
          "tnum mt-2 text-metric font-semibold",
          alert && value > 0
            ? "text-[var(--priority-urgent-fg)]"
            : "text-grey-900",
        )}
      >
        {value}
      </span>
      <span className="mt-1 text-small text-grey-500">{hint}</span>
    </Link>
  );
}

function Stat({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption tracking-[0.07em] text-grey-500 uppercase">
        {label}
      </span>
      <span
        className={cn(
          "tnum text-small font-medium",
          alert && Number(value) > 0
            ? "text-[var(--priority-urgent-fg)]"
            : "text-grey-900",
        )}
      >
        {value}
      </span>
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
        <span aria-hidden className="text-base leading-5">
          {monogram}
        </span>
        <span className="truncate text-heading font-medium text-grey-900">
          {name}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Stat label="Mine" value={stats.mine} />
        <Stat label="Open" value={stats.open} />
        <Stat label="Overdue" value={stats.overdue} alert />
        <Stat label="Done" value={`${stats.completion}%`} />
      </div>

      <div
        className="h-1 overflow-hidden rounded-md bg-grey-150"
        role="img"
        aria-label={`${stats.completion}% complete`}
      >
        <div
          className="h-full rounded-md bg-grey-700 transition-[width] duration-300"
          style={{ width: `${stats.completion}%` }}
        />
      </div>
    </Link>
  );
}

export function OverviewView() {
  const { projects: allProjects, tickets, isLoading } = useTicketStore();

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
  const team = kpisFor(ticketsForTeam(tickets));
  const reportees = reporteesOf();
  const projects = myProjects(tickets, undefined, allProjects);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <section className="px-6 py-5">
        <h2 className="mb-3 text-heading font-semibold text-grey-900">My work</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiCard
            label="Pending"
            value={kpis.pending}
            hint="Backlog and To Do"
            href="/my-work?status=backlog,todo"
          />
          <KpiCard
            label="In progress"
            value={kpis.inProgress}
            hint="Being worked on or reviewed"
            href="/my-work?status=in_progress,in_review"
          />
          <KpiCard
            label="Overdue"
            value={kpis.overdue}
            hint="Past their due date"
            href="/my-work?overdue=1"
            alert
          />
          <KpiCard
            label="Stale"
            value={kpis.stale}
            hint="A week or more in one column"
            href="/my-work?stale=1"
            alert
          />
          <KpiCard
            label="Updated this week"
            value={kpis.assignedThisWeek}
            hint="Touched since Monday"
            href="/my-work"
          />
        </div>
      </section>

      {reportees.length > 0 ? (
        <section className="px-6 pb-5">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-heading font-semibold text-grey-900">My team</h2>
            <span className="flex gap-1">
              {reportees.map((user) => (
                <UserAvatar key={user.id} userId={user.id} />
              ))}
            </span>
            <Link
              href="/my-work?scope=team"
              className="ml-auto text-small text-grey-500 transition-colors hover:text-grey-900"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KpiCard
              label="Team total"
              value={team.total}
              hint={`${reportees.length} people reporting to you`}
              href="/my-work?scope=team"
            />
            <KpiCard
              label="Pending"
              value={team.pending}
              hint="Not started yet"
              href="/my-work?scope=team&status=backlog,todo"
            />
            <KpiCard
              label="In progress"
              value={team.inProgress}
              hint="Being worked on or reviewed"
              href="/my-work?scope=team&status=in_progress,in_review"
            />
            <KpiCard
              label="Overdue"
              value={team.overdue}
              hint="Past their due date"
              href="/my-work?scope=team&overdue=1"
              alert
            />
            <KpiCard
              label="Stale"
              value={team.stale}
              hint="A week or more in one column"
              href="/my-work?scope=team&stale=1"
              alert
            />
          </div>
        </section>
      ) : null}

      <section className="px-6 pb-8">
        <h2 className="mb-3 text-heading font-semibold text-grey-900">
          My projects
        </h2>

        {projects.length === 0 ? (
          <EmptyState
            emoji="🗂️"
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
                monogram={project.emoji}
                stats={stats}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
