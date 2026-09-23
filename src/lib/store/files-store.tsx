"use client";

import * as React from "react";

import {
  driveFiles as seedFiles,
  CURRENT_USER_ID,
  type DriveFile,
  type DriveFileKind,
} from "@/lib/mock";

type FilesStoreValue = {
  files: DriveFile[];
  createFolder: (name: string, parentId: string | null, projectId: string | null) => DriveFile;
  uploadFiles: (
    fileList: FileList,
    dest: { parentId: string | null; projectId: string | null },
  ) => void;
  toggleStar: (fileId: string) => void;
  linkToTicket: (fileId: string, ticketKey: string) => void;
  unlinkFromTicket: (fileId: string, ticketKey: string) => void;
  deleteFile: (fileId: string) => void;
};

const FilesStoreContext = React.createContext<FilesStoreValue | null>(null);

function kindFromMime(file: File): Exclude<DriveFileKind, "folder"> {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "other";
}

export function FilesStoreProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = React.useState<DriveFile[]>(seedFiles);
  const seq = React.useRef(0);

  const createFolder = React.useCallback(
    (name: string, parentId: string | null, projectId: string | null) => {
      seq.current += 1;
      const folder: DriveFile = {
        id: `folder-new-${seq.current}`,
        name: name.trim() || "Untitled folder",
        kind: "folder",
        parentId,
        projectId,
        ownerId: CURRENT_USER_ID,
        sizeBytes: null,
        updatedAt: new Date().toISOString(),
        starred: false,
        ticketRefs: [],
        sharedWithIds: [],
      };
      setFiles((current) => [folder, ...current]);
      return folder;
    },
    [],
  );

  const uploadFiles = React.useCallback(
    (fileList: FileList, dest: { parentId: string | null; projectId: string | null }) => {
      const at = new Date().toISOString();
      const next = Array.from(fileList).map((file, index) => {
        seq.current += 1;
        const kind = kindFromMime(file);
        return {
          id: `file-new-${seq.current}-${index}`,
          name: file.name,
          kind,
          parentId: dest.parentId,
          projectId: dest.projectId,
          ownerId: CURRENT_USER_ID,
          sizeBytes: file.size,
          updatedAt: at,
          starred: false,
          ticketRefs: [],
          sharedWithIds: [],
        } satisfies DriveFile;
      });
      setFiles((current) => [...next, ...current]);
    },
    [],
  );

  const toggleStar = React.useCallback((fileId: string) => {
    setFiles((current) =>
      current.map((file) =>
        file.id === fileId ? { ...file, starred: !file.starred } : file,
      ),
    );
  }, []);

  const linkToTicket = React.useCallback((fileId: string, ticketKey: string) => {
    setFiles((current) =>
      current.map((file) =>
        file.id === fileId && !file.ticketRefs.includes(ticketKey)
          ? { ...file, ticketRefs: [...file.ticketRefs, ticketKey] }
          : file,
      ),
    );
  }, []);

  const unlinkFromTicket = React.useCallback((fileId: string, ticketKey: string) => {
    setFiles((current) =>
      current.map((file) =>
        file.id === fileId
          ? { ...file, ticketRefs: file.ticketRefs.filter((key) => key !== ticketKey) }
          : file,
      ),
    );
  }, []);

  const deleteFile = React.useCallback((fileId: string) => {
    setFiles((current) => current.filter((file) => file.id !== fileId));
  }, []);

  const value = React.useMemo(
    () => ({
      files,
      createFolder,
      uploadFiles,
      toggleStar,
      linkToTicket,
      unlinkFromTicket,
      deleteFile,
    }),
    [files, createFolder, uploadFiles, toggleStar, linkToTicket, unlinkFromTicket, deleteFile],
  );

  return <FilesStoreContext value={value}>{children}</FilesStoreContext>;
}

export function useFilesStore() {
  const context = React.use(FilesStoreContext);
  if (!context) throw new Error("useFilesStore must be used inside <FilesStoreProvider>");
  return context;
}
