import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shell/page-header";
import { Placeholder } from "@/components/shell/placeholder";
import { navProjects } from "@/components/shell/nav-data";

export default async function ProjectListPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const project = navProjects.find((item) => item.key === key);
  if (!project) notFound();

  return (
    <>
      <PageHeader title={project.name} />
      <Placeholder step="step 5">Sortable, filterable, virtualized ticket list</Placeholder>
    </>
  );
}
