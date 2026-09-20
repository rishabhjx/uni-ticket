"use client";

import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { CardsSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  countByStatus,
  STATUS_LABEL,
  TICKET_STATUSES,
  ticketsForProject,
} from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";

export function BoardsView() {
  const { projects, tickets, isLoading } = useTicketStore();

  if (isLoading) return <CardsSkeleton count={5} />;

  if (projects.length === 0) {
    return (
      <EmptyState
        emoji="🗃️"
        title="No boards yet"
        description="Every project gets a board. Create a project and its board appears here."
        action={{ label: "Go to projects", href: "/projects" }}
      />
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="grid gap-3 px-6 py-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const scoped = ticketsForProject(tickets, project.id);
          const counts = countByStatus(scoped);
          const busiest = Math.max(...Object.values(counts), 1);

          return (
            <Link
              key={project.id}
              href={`/projects/${project.slug}/board`}
              className="flex flex-col gap-4 rounded-md border border-grey-200 p-4 transition-colors hover:border-grey-300"
            >
              <div className="flex items-center gap-2.5">
                <span aria-hidden className="shrink-0 text-lg leading-6">
                  {project.emoji}
                </span>
                <span className="truncate text-heading font-semibold text-grey-900">
                  {project.name}
                </span>
                <span className="tnum ml-auto text-small text-grey-500">
                  {scoped.length}
                </span>
              </div>

              {/* A glance at how the work is distributed across the columns. */}
              <div className="flex items-end gap-1.5">
                {TICKET_STATUSES.map((status) => (
                  <div key={status} className="flex flex-1 flex-col gap-1.5">
                    <div className="flex h-12 items-end rounded-md bg-grey-100">
                      <div
                        className="w-full rounded-md bg-grey-700"
                        style={{
                          height: `${Math.max(
                            4,
                            (counts[status] / busiest) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="tnum text-center text-caption text-grey-600">
                      {counts[status]}
                    </span>
                    <span className="truncate text-center text-[10px] text-grey-400">
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="flex gap-1">
                  {project.memberIds.slice(0, 4).map((id) => (
                    <UserAvatar key={id} userId={id} />
                  ))}
                </span>
                <span className="ml-auto text-small text-grey-500">
                  Open board
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
