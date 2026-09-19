import { ProjectsView } from "@/components/projects/projects-view";
import { PageHeader } from "@/components/shell/page-header";

export default function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projects" />
      <ProjectsView />
    </>
  );
}
