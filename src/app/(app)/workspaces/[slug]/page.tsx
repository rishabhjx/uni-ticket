import { notFound } from "next/navigation";

import { WorkspaceView } from "@/components/workspaces/workspace-view";
import { getWorkspaceBySlug, workspaces } from "@/lib/mock";

/** Seeded workspaces are known up front; created ones fall to not-found. */
export function generateStaticParams() {
  return workspaces.map((workspace) => ({ slug: workspace.slug }));
}

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workspace = getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  return <WorkspaceView workspaceId={workspace.id} />;
}
