import { notFound } from "next/navigation";

import { CalendarView } from "@/components/calendar/calendar-view";
import { getProjectBySlug, projects } from "@/lib/mock";

/** Every project route is known up front, so the export covers all of them. */
export function generateStaticParams() {
  return projects.map((project) => ({ key: project.slug }));
}

export default async function ProjectCalendarPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const project = getProjectBySlug(key);
  if (!project) notFound();

  return <CalendarView project={project} />;
}
