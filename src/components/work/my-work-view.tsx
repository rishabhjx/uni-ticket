"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";

import { ListView } from "@/components/list/list-view";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiStrip } from "@/components/work/kpi-strip";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { CURRENT_USER_ID, kpisFor, reporteesOf, ticketsForTeam } from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

type Scope = "mine" | "team";

/**
 * Mine and my team's work on one page: the tabs swap the rows underneath while
 * the KPI strip and every filter stay where they are.
 */
export function MyWorkView() {
  const router = useRouter();
  const params = useSearchParams();
  const { tickets } = useTicketStore();

  const scope: Scope = params.get("scope") === "team" ? "team" : "mine";
  const reportees = React.useMemo(() => reporteesOf(), []);

  const mine = React.useMemo(
    () => tickets.filter((ticket) => ticket.assigneeIds.includes(CURRENT_USER_ID)),
    [tickets],
  );
  const team = React.useMemo(() => ticketsForTeam(tickets), [tickets]);

  const scoped = scope === "team" ? team : mine;
  const kpis = React.useMemo(() => kpisFor(scoped), [scoped]);

  const setScope = (next: Scope) => {
    const query = new URLSearchParams(params.toString());
    if (next === "mine") query.delete("scope");
    else query.set("scope", next);
    const search = query.toString();
    router.replace(search ? `/my-work?${search}` : "/my-work", { scroll: false });
  };

  const tabClass = (active: boolean) =>
    cn(
      "flex h-7 items-center gap-2 rounded-md px-2.5 text-small font-medium transition-colors",
      active ? "bg-grey-0 text-grey-900" : "text-grey-600 hover:text-grey-900",
    );

  return (
    <>
      <div className="hairline-b flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-0.5 rounded-md bg-grey-100 p-0.5">
          <button
            type="button"
            onClick={() => setScope("mine")}
            aria-current={scope === "mine" ? "page" : undefined}
            className={tabClass(scope === "mine")}
          >
            <UserAvatar userId={CURRENT_USER_ID} />
            Assigned to me
            <span className="tnum text-caption text-grey-500">{mine.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setScope("team")}
            aria-current={scope === "team" ? "page" : undefined}
            className={tabClass(scope === "team")}
          >
            <Users className="size-3.5" strokeWidth={1.75} />
            My team
            <span className="tnum text-caption text-grey-500">{team.length}</span>
          </button>
        </div>

        {scope === "team" ? (
          <span className="flex items-center gap-1.5 text-small text-grey-500">
            <span className="flex gap-1">
              {reportees.map((user) => (
                <UserAvatar key={user.id} userId={user.id} />
              ))}
            </span>
            {reportees.length} reporting to you
          </span>
        ) : null}
      </div>

      <KpiStrip kpis={kpis} />

      <ListView
        tickets={scoped}
        showProject
        emptyState={
          scope === "team" ? (
            <EmptyState
              emoji="🧑‍🤝‍🧑"
              title="Your team has nothing assigned"
              description="Work assigned to the people reporting to you shows up here, so you can see load at a glance."
              action={{ label: "Go to projects", href: "/projects" }}
            />
          ) : (
            <EmptyState
              emoji="🎯"
              title="Nothing assigned to you"
              description="Tickets assigned to you across every project land here. Pick one up from a board to get started."
              action={{ label: "Go to projects", href: "/projects" }}
            />
          )
        }
      />
    </>
  );
}
