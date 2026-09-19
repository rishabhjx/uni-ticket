import { notFound } from "next/navigation";

import { ListView } from "@/components/list/list-view";
import { PageHeader } from "@/components/shell/page-header";
import { ViewSwitcher } from "@/components/shell/view-switcher";
import { getProjectBySlug, projects } from "@/lib/mock";

/** Every project route is known up front, so the export covers all of them. */
export function generateStaticParams() {
  return projects.map((project) => ({ key: project.slug }));
}

export default async function ProjectListPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const project = getProjectBySlug(key);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title={project.name}
        actions={<ViewSwitcher projectSlug={project.slug} />}
      />
      <ListView project={project} />
    </>
  );
}
