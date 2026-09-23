"use client";

import { FolderPlus } from "lucide-react";

import { ProjectsView } from "@/components/projects/projects-view";
import { WorkspaceIcon } from "@/components/shared/entity-icon";
import { PageHeader } from "@/components/shell/page-header";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { useShell } from "@/hooks/use-shell";
import { useTicketStore } from "@/lib/store/ticket-store";

/**
 * A workspace is its projects plus who is in it. The project grid is the same
 * component the all-projects page uses, scoped — two grids that drift apart is
 * the usual way this ends up inconsistent.
 */
export function WorkspaceView({ workspaceId }: { workspaceId: string }) {
  const { workspaces } = useTicketStore();
  const { openCreateProject } = useShell();
  const workspace = workspaces.find((item) => item.id === workspaceId);

  if (!workspace) return null;

  return (
    <>
      <PageHeader
        icon={<WorkspaceIcon workspace={workspace} size="md" />}
        title={workspace.name}
        meta={
          <span className="min-w-0 truncate text-small text-grey-500">
            {workspace.description}
          </span>
        }
        actions={
          <>
            <span className="flex items-center gap-1">
              {workspace.memberIds.slice(0, 5).map((id) => (
                <UserAvatar key={id} userId={id} />
              ))}
              {workspace.memberIds.length > 5 ? (
                <span className="tnum flex size-[18px] items-center justify-center rounded-full bg-grey-100 text-micro font-medium text-grey-600">
                  +{workspace.memberIds.length - 5}
                </span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={openCreateProject}
              className="flex h-7 items-center gap-1.5 rounded-md border border-grey-200 px-2 text-small text-grey-700 transition-colors hover:border-grey-300 hover:text-grey-900"
            >
              <FolderPlus className="size-3.5" strokeWidth={1.75} />
              New project
            </button>
          </>
        }
      />
      <ProjectsView workspaceId={workspace.id} />
    </>
  );
}
