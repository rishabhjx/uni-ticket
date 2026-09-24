"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, FolderPlus, HardDrive, Search, Star, Upload } from "lucide-react";

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
  const [query, setQuery] = React.useState("");
  const [dragging, setDragging] = React.useState(false);

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
    const term = query.trim().toLowerCase();
    const scoped =
      drive === "starred"
        ? files.filter((file) => file.starred && file.kind !== "folder")
        : files.filter(
            (file) => file.projectId === projectId && file.parentId === (folderId ?? null),
          );
    return scoped
      .filter((file) => !term || file.name.toLowerCase().includes(term))
      .sort((a, b) => {
        if (a.kind === "folder" && b.kind !== "folder") return -1;
        if (a.kind !== "folder" && b.kind === "folder") return 1;
        return a.name.localeCompare(b.name);
      });
  }, [files, drive, projectId, folderId, query]);

  // A search that stayed put across folders would keep hiding everything the
  // moment you navigated somewhere the term doesn't match.
  const [lastScope, setLastScope] = React.useState(`${drive}:${folderId}`);
  if (`${drive}:${folderId}` !== lastScope) {
    setLastScope(`${drive}:${folderId}`);
    if (query) setQuery("");
  }

  // Every folder in this drive, so a row's "Move to" submenu can offer
  // somewhere to go regardless of which folder it's currently sitting in.
  const driveFolders = React.useMemo(
    () => files.filter((file) => file.projectId === projectId && file.kind === "folder"),
    [files, projectId],
  );

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
        <div className="glass-soft hairline-r flex w-[220px] shrink-0 flex-col gap-0.5 px-2 py-3">
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
          <div className="hairline-b flex h-9 shrink-0 items-center gap-2 px-4">
            {drive !== "starred" ? (
              <div className="flex min-w-0 flex-1 items-center gap-1 text-small text-grey-600">
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
            ) : (
              <span className="min-w-0 flex-1" />
            )}
            <div className="flex w-44 shrink-0 items-center gap-1.5 rounded-md border border-grey-200 px-2 py-1 focus-within:border-accent-600">
              <Search className="size-3 shrink-0 text-grey-400" strokeWidth={1.75} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search this folder"
                aria-label="Search files"
                className="min-w-0 flex-1 bg-transparent text-caption text-grey-900 placeholder:text-grey-500 focus:outline-none"
              />
            </div>
          </div>

          <div
            className={cn(
              "relative min-h-0 flex-1 overflow-y-auto",
              dragging && "bg-accent-50 outline-2 -outline-offset-2 outline-dashed outline-accent-500",
            )}
            onDragOver={(event) => {
              if (drive === "starred") return;
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              if (drive === "starred") return;
              if (event.dataTransfer.files.length > 0) {
                uploadFiles(event.dataTransfer.files, { parentId: folderId, projectId });
              }
            }}
          >
            {visible.length === 0 ? (
              <Empty className="h-full">
                <EmptyMedia variant="icon">
                  <HardDrive className="size-5 text-grey-400" strokeWidth={1.5} />
                </EmptyMedia>
                <EmptyTitle>{query ? "No matches" : "Nothing here"}</EmptyTitle>
                <EmptyDescription>
                  {query
                    ? "Try a different name."
                    : drive === "starred"
                      ? "Star a file to find it here."
                      : "Upload a file, or drop one anywhere in this list."}
                </EmptyDescription>
              </Empty>
            ) : (
              visible.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  siblingFolders={driveFolders}
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
