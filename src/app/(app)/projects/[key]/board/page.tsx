import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shell/page-header";
import { Placeholder } from "@/components/shell/placeholder";
import { getProjectBySlug, projects } from "@/lib/mock";

/** Every project route is known up front, so the export covers all of them. */
export function generateStaticParams() {
  return projects.map((project) => ({ key: project.slug }));
}

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const project = getProjectBySlug(key);
  if (!project) notFound();

  return (
    <>
      <PageHeader title={project.name} />
      <Placeholder step="step 4">Kanban board with drag and drop</Placeholder>
    </>
  );
}
