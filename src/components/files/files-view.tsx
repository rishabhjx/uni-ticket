"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, FolderPlus, HardDrive, Star, Upload } from "lucide-react";

import { FileRow } from "@/components/files/file-row";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/reui/empty";
import { ProjectIcon } from "@/components/shared/entity-icon";
import { PageHeader } from "@/components/shell/page-header";
import { projects } from "@/lib/mock";
import { useFilesStore } from "@/lib/store/files-store";
import { cn } from "@/lib/utils";

type DriveId = "mine" | "starred" | string;

export function FilesView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { files, createFolder, uploadFiles } = useFilesStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const drive: DriveId = params.get("drive") ?? "mine";
  const folderId = params.get("folder");

  const navigate = (next: { drive?: DriveId; folder?: string | null }) => {
    const query = new URLSearchParams();
    query.set("drive", next.drive ?? drive);
    if (next.folder) query.set("folder", next.folder);
    router.push(`${pathname}?${query.toString()}`, { scroll: false });
  };

  const projectId = drive === "mine" || drive === "starred" ? null : drive;

  const breadcrumb = React.useMemo(() => {
    if (!folderId) return [];
    const byId = new Map(files.map((file) => [file.id, file]));
    const trail: { id: string; name: string }[] = [];
    let current = byId.get(folderId);
    while (current) {
      trail.unshift({ id: current.id, name: current.name });
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return trail;
  }, [folderId, files]);

  const visible = React.useMemo(() => {
    if (drive === "starred") {
      return files.filter((file) => file.starred && file.kind !== "folder");
    }
    return files
      .filter((file) => file.projectId === projectId && file.parentId === (folderId ?? null))
      .sort((a, b) => {
        if (a.kind === "folder" && b.kind !== "folder") return -1;
        if (a.kind !== "folder" && b.kind === "folder") return 1;
        return a.name.localeCompare(b.name);
      });
  }, [files, drive, projectId, folderId]);

  const driveName = drive === "mine" ? "My files" : drive === "starred" ? "Starred" : projects.find((p) => p.id === drive)?.name;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Files"
        actions={
          drive === "starred" ? null : (
            <>
              <button
                type="button"
                onClick={() => createFolder("Untitled folder", folderId, projectId)}
                className="flex h-7 items-center gap-1.5 rounded-md border border-grey-200 px-2.5 text-small text-grey-700 transition-colors hover:border-grey-300"
              >
                <FolderPlus className="size-3.5" strokeWidth={1.75} />
                New folder
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-7 items-center gap-1.5 rounded-md bg-accent-600 px-2.5 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700"
              >
                <Upload className="size-3.5" strokeWidth={1.75} />
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                onChange={(event) => {
                  if (event.target.files) uploadFiles(event.target.files, { parentId: folderId, projectId });
                  event.target.value = "";
                }}
              />
            </>
          )
        }
      />

      <div className="flex min-h-0 flex-1">
        <div className="hairline-r flex w-[220px] shrink-0 flex-col gap-0.5 bg-grey-50 px-2 py-3">
          <button
            type="button"
            onClick={() => navigate({ drive: "mine", folder: null })}
            className={cn(
              "flex h-8 items-center gap-2 rounded-md px-2 text-small transition-colors",
              drive === "mine" ? "bg-grey-150 font-medium text-grey-900" : "text-grey-600 hover:bg-grey-100 hover:text-grey-900",
            )}
          >
            <HardDrive className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
            My files
          </button>
          <button
            type="button"
            onClick={() => navigate({ drive: "starred", folder: null })}
            className={cn(
              "flex h-8 items-center gap-2 rounded-md px-2 text-small transition-colors",
              drive === "starred" ? "bg-grey-150 font-medium text-grey-900" : "text-grey-600 hover:bg-grey-100 hover:text-grey-900",
            )}
          >
            <Star className="size-3.5 shrink-0 text-grey-400" strokeWidth={1.75} />
            Starred
          </button>

          <h3 className="mt-3 px-2 py-1 text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
            Shared drives
          </h3>
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => navigate({ drive: project.id, folder: null })}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2 text-small transition-colors",
                drive === project.id ? "bg-grey-150 font-medium text-grey-900" : "text-grey-600 hover:bg-grey-100 hover:text-grey-900",
              )}
            >
              <ProjectIcon project={project} size="xs" />
              <span className="min-w-0 flex-1 truncate text-left">{project.name}</span>
            </button>
          ))}
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {drive !== "starred" ? (
            <div className="hairline-b flex h-9 shrink-0 items-center gap-1 px-4 text-small text-grey-600">
              <button
                type="button"
                onClick={() => navigate({ folder: null })}
                className="rounded-md px-1 py-0.5 hover:bg-grey-100 hover:text-grey-900"
              >
                {driveName}
              </button>
              {breadcrumb.map((crumb) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight className="size-3 shrink-0 text-grey-400" strokeWidth={2} />
                  <button
                    type="button"
                    onClick={() => navigate({ folder: crumb.id })}
                    className="rounded-md px-1 py-0.5 hover:bg-grey-100 hover:text-grey-900"
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {visible.length === 0 ? (
              <Empty className="h-full">
                <EmptyMedia variant="icon">
                  <HardDrive className="size-5 text-grey-400" strokeWidth={1.5} />
                </EmptyMedia>
                <EmptyTitle>Nothing here</EmptyTitle>
                <EmptyDescription>
                  {drive === "starred" ? "Star a file to find it here." : "Upload a file or create a folder."}
                </EmptyDescription>
              </Empty>
            ) : (
              visible.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  onOpenFolder={(id) => navigate({ folder: id })}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
