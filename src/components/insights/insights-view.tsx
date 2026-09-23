"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/reui/chart";
import { ProjectIcon } from "@/components/shared/entity-icon";
import { CardsSkeleton } from "@/components/shared/skeletons";
import { StatusBadge } from "@/components/tickets/badges";
import { AvatarStack } from "@/components/tickets/user-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  countByStatus,
  cycleTimeDays,
  weeklyFlow,
  daysInColumn,
  flowMetrics,
  isStale,
  STALE_AFTER_DAYS,
  STATUS_LABEL,
  TICKET_STATUSES,
  type Ticket,
  type TicketStatus,
} from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

/**
 * Two series, because either one alone lies. Throughput on its own looks
 * healthy while the backlog quietly doubles; the gap between opened and
 * verified is the number a PM actually argues about in a planning meeting.
 */
const flowChartConfig = {
  opened: { label: "Opened", color: "var(--grey-500)" },
  verified: { label: "Verified", color: "var(--accent-600)" },
} satisfies ChartConfig;

function Metric({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint: string;
}) {
  return (
    <div className="glass-soft shadow-card flex flex-col rounded-xl border border-grey-200 p-4 transition-colors hover:border-grey-300">
      <span className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
        {label}
      </span>
      <span className="tnum mt-2 text-metric font-semibold text-grey-900">
        {value}
        {unit ? (
          <span className="ml-1 text-heading font-medium text-grey-500">
            {unit}
          </span>
        ) : null}
      </span>
      <span className="mt-1 text-small text-grey-500">{hint}</span>
    </div>
  );
}

/**
 * Every status transition is already in the audit trail, so how long work
 * takes is known — this is the screen that turns it into something a PM can
 * act on. Nothing here is a new number; it is all derived from the history.
 */
export function InsightsView() {
  const { projects, tickets, events, isLoading } = useTicketStore();
  const [projectId, setProjectId] = React.useState("all");

  const scoped = React.useMemo(
    () =>
      projectId === "all"
        ? tickets
        : tickets.filter((ticket) => ticket.projectId === projectId),
    [tickets, projectId],
  );

  // Taken once per render pass so every number below agrees with the others.
  const now = React.useMemo(() => new Date(), [scoped]);

  const metrics = React.useMemo(
    () => flowMetrics(scoped, events, now),
    [scoped, events, now],
  );

  const counts = React.useMemo(() => countByStatus(scoped), [scoped]);
  const trend = React.useMemo(() => weeklyFlow(scoped, 12, now), [scoped, now]);
  const busiest = Math.max(...Object.values(counts), 1);

  const oldest = React.useMemo(
    () =>
      scoped
        .filter((ticket) => isStale(ticket, now))
        .sort(
          (a, b) =>
            new Date(a.statusChangedAt).getTime() -
            new Date(b.statusChangedAt).getTime(),
        )
        .slice(0, 8),
    [scoped, now],
  );

  const slowest = React.useMemo(() => {
    const withTime = scoped
      .map((ticket) => ({ ticket, days: cycleTimeDays(events, ticket) }))
      .filter((entry): entry is { ticket: Ticket; days: number } => entry.days !== null);
    return withTime.sort((a, b) => b.days - a.days).slice(0, 5);
  }, [scoped, events]);

  if (isLoading) return <CardsSkeleton count={6} />;

  return (
    <div className="settle min-h-0 flex-1 overflow-y-auto">
      <div className="hairline-b flex items-center gap-2 px-6 py-2.5">
        <span className="text-caption tracking-[0.07em] text-grey-500 uppercase">
          Project
        </span>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="h-7 w-56 border-grey-200 text-small">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <span className="flex items-center gap-2">
                  <ProjectIcon project={project} size="xs" />
                  {project.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section className="grid grid-cols-2 gap-3 px-6 py-5 lg:grid-cols-4">
        <Metric
          label="Cycle time"
          value={metrics.cycleTime !== null ? metrics.cycleTime.toFixed(1) : "—"}
          unit="days"
          hint={`Median, created to verified, across ${metrics.sampleSize} tickets`}
        />
        <Metric
          label="Throughput"
          value={String(metrics.throughput)}
          hint="Verified in the last 14 days"
        />
        <Metric
          label="Open"
          value={String(scoped.length - counts.done)}
          hint={`of ${scoped.length} total`}
        />
        <Metric
          label="Needs attention"
          value={String(oldest.length)}
          hint="Past the limit for the column it is in"
        />
      </section>

      <section className="px-6 pb-5">
        <h2 className="mb-3 text-heading font-semibold text-grey-900">
          Opened against verified
        </h2>
        <div className="glass-soft shadow-card rounded-xl border border-grey-200 p-4">
          <ChartContainer
            config={flowChartConfig}
            className="aspect-auto h-56 w-full"
          >
            <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                {(["opened", "verified"] as const).map((key) => (
                  <linearGradient
                    key={key}
                    id={`fill-${key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={`var(--color-${key})`}
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="100%"
                      stopColor={`var(--color-${key})`}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} stroke="var(--grey-200)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                stroke="var(--grey-500)"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                allowDecimals={false}
                stroke="var(--grey-500)"
              />
              <ChartTooltip
                cursor={{ stroke: "var(--grey-300)" }}
                content={<ChartTooltipContent labelKey="label" indicator="dot" />}
              />
              <Area
                dataKey="opened"
                type="monotone"
                stroke="var(--color-opened)"
                fill="url(#fill-opened)"
                strokeWidth={1.5}
                dot={false}
              />
              <Area
                dataKey="verified"
                type="monotone"
                stroke="var(--color-verified)"
                fill="url(#fill-verified)"
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
          <p className="mt-2 text-small text-grey-500">
            Weekly, over the last twelve. The right-hand bucket is the week in
            progress, so it always reads low.
          </p>
        </div>
      </section>

      <section className="px-6 pb-5">
        <h2 className="mb-3 text-heading font-semibold text-grey-900">
          Where work sits
        </h2>
        <div className="glass-soft shadow-card flex flex-col gap-2 rounded-xl border border-grey-200 p-4">
          {TICKET_STATUSES.map((status) => {
            const median = metrics.medianInStatus[status];
            const limit = STALE_AFTER_DAYS[status];
            const slow = median !== undefined && limit !== null && median >= limit;

            return (
              <div key={status} className="flex items-center gap-3">
                <span className="w-28 shrink-0">
                  <StatusBadge status={status} />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-md bg-grey-100">
                  <div
                    className="h-full rounded-md bg-grey-700 transition-[width] duration-300"
                    style={{ width: `${(counts[status] / busiest) * 100}%` }}
                  />
                </div>
                <span className="tnum w-10 shrink-0 text-right text-small text-grey-700">
                  {counts[status]}
                </span>
                <span
                  className={cn(
                    "tnum w-32 shrink-0 text-right text-small",
                    slow ? "font-medium" : "text-grey-500",
                  )}
                  style={slow ? { color: "var(--priority-urgent-fg)" } : undefined}
                >
                  {median !== undefined
                    ? `${median.toFixed(0)}d median`
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-3 px-6 pb-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-heading font-semibold text-grey-900">
            Sitting too long
          </h2>
          <div className="glass-soft shadow-card flex flex-col gap-1 rounded-xl border border-grey-200 p-3">
            {oldest.length === 0 ? (
              <p className="py-4 text-center text-small text-grey-500">
                🌤️ Nothing is stuck.
              </p>
            ) : (
              oldest.map((ticket) => (
                <TicketLine
                  key={ticket.id}
                  ticket={ticket}
                  trailing={`${daysInColumn(ticket, now)}d in ${STATUS_LABEL[
                    ticket.status as TicketStatus
                  ].toLowerCase()}`}
                />
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-heading font-semibold text-grey-900">
            Took the longest
          </h2>
          <div className="glass-soft shadow-card flex flex-col gap-1 rounded-xl border border-grey-200 p-3">
            {slowest.length === 0 ? (
              <p className="py-4 text-center text-small text-grey-500">
                Nothing verified yet.
              </p>
            ) : (
              slowest.map(({ ticket, days }) => (
                <TicketLine
                  key={ticket.id}
                  ticket={ticket}
                  trailing={`${days.toFixed(0)}d to verify`}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function TicketLine({
  ticket,
  trailing,
}: {
  ticket: Ticket;
  trailing: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-grey-50">
      <span className="tnum shrink-0 text-caption font-medium text-grey-500">
        {ticket.key}
      </span>
      <span className="min-w-0 flex-1 truncate text-small text-grey-900">
        {ticket.title}
      </span>
      <AvatarStack userIds={ticket.assigneeIds} />
      <span className="tnum shrink-0 text-caption text-grey-500">
        {trailing}
      </span>
    </div>
  );
}
