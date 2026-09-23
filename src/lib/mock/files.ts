import { dataset } from "./dataset";
import { isoDaysAgo } from "./dates";
import { projects } from "./projects";
import { createRandom } from "./random";
import type { DriveFile, DriveFileKind } from "./types";
import { CURRENT_USER_ID, users } from "./users";

const SEED = 20260919 + 53;
const random = createRandom(SEED);

const FOLDER_NAMES = ["Specs", "Design files", "Meeting notes", "Vendor docs"];

const NAMES_BY_KIND: Record<Exclude<DriveFileKind, "folder">, string[]> = {
  doc: ["RFC", "Onboarding guide", "Postmortem", "Runbook", "Meeting notes"],
  sheet: ["Sprint capacity", "Metrics tracker", "Budget", "Roadmap"],
  slide: ["Sprint review deck", "Quarterly update", "Customer demo"],
  pdf: ["Vendor contract", "Signed NDA", "Architecture diagram export"],
  image: ["Wireframe export", "Whiteboard photo", "Before-after screenshot"],
  video: ["Screen recording", "Demo recording"],
  other: ["Export"],
};

const EXT: Record<Exclude<DriveFileKind, "folder">, string> = {
  doc: ".doc",
  sheet: ".sheet",
  slide: ".slides",
  pdf: ".pdf",
  image: ".png",
  video: ".mp4",
  other: "",
};

const SIZE_RANGE: Record<Exclude<DriveFileKind, "folder">, [number, number]> = {
  doc: [8_000, 120_000],
  sheet: [15_000, 400_000],
  slide: [500_000, 9_000_000],
  pdf: [80_000, 3_000_000],
  image: [200_000, 6_000_000],
  video: [8_000_000, 220_000_000],
  other: [1_000, 50_000],
};

let seq = 0;
function nextId(prefix: string) {
  seq += 1;
  return `${prefix}-${seq}`;
}

const files: DriveFile[] = [];

function addFile(
  kind: Exclude<DriveFileKind, "folder">,
  parentId: string | null,
  projectId: string | null,
  ownerId: string,
  opts: { ticketRefs?: string[]; sharedWithIds?: string[] } = {},
) {
  const name = `${random.pick(NAMES_BY_KIND[kind])}${EXT[kind]}`;
  const [min, max] = SIZE_RANGE[kind];
  files.push({
    id: nextId("file"),
    name,
    kind,
    parentId,
    projectId,
    ownerId,
    sizeBytes: random.int(min, max),
    updatedAt: isoDaysAgo(random.int(0, 45), random.int(0, 23 * 60)),
    starred: random.chance(0.12),
    ticketRefs: opts.ticketRefs ?? [],
    sharedWithIds: opts.sharedWithIds ?? [],
  });
}

// One shared drive per project: a handful of folders, each with a few files.
// A subset of files reference a real ticket, which is what lets the ticket
// panel show "attached in Files" the same way it shows a linked chat thread.
for (const project of projects) {
  const folderCount = random.int(2, FOLDER_NAMES.length);
  const folderNames = random.sample(FOLDER_NAMES, folderCount);
  const projectTickets = dataset.tickets.filter((t) => t.projectId === project.id);

  for (const folderName of folderNames) {
    const folderId = nextId("folder");
    files.push({
      id: folderId,
      name: folderName,
      kind: "folder",
      parentId: null,
      projectId: project.id,
      ownerId: project.leadId,
      sizeBytes: null,
      updatedAt: isoDaysAgo(random.int(0, 60)),
      starred: false,
      ticketRefs: [],
      sharedWithIds: project.memberIds,
    });

    const fileCount = random.int(2, 6);
    for (let i = 0; i < fileCount; i += 1) {
      const kinds: Exclude<DriveFileKind, "folder">[] =
        folderName === "Design files"
          ? ["image", "slide", "doc"]
          : folderName === "Vendor docs"
            ? ["pdf", "doc"]
            : folderName === "Meeting notes"
              ? ["doc", "slide"]
              : ["doc", "sheet", "pdf"];
      const kind = random.pick(kinds);
      const withTicket = projectTickets.length > 0 && random.chance(0.22);
      addFile(kind, folderId, project.id, random.pick(project.memberIds), {
        ticketRefs: withTicket ? [random.pick(projectTickets).key] : [],
        sharedWithIds: project.memberIds,
      });
    }
  }

  // A couple of files sitting at the drive's root, not in any folder.
  addFile(random.pick(["sheet", "slide", "doc"]), null, project.id, project.leadId, {
    sharedWithIds: project.memberIds,
  });
}

// The current user's own files, outside any shared drive.
for (let i = 0; i < 6; i += 1) {
  addFile(random.pick(["doc", "sheet", "image", "pdf"]), null, null, CURRENT_USER_ID);
}

export const driveFiles: DriveFile[] = files.sort((a, b) =>
  b.updatedAt.localeCompare(a.updatedAt),
);

export const driveFilesById = new Map(driveFiles.map((file) => [file.id, file]));

export function getDriveFile(id: string | null | undefined) {
  return id ? driveFilesById.get(id) : undefined;
}

/** null = the drive's root. null projectId + null parent = "My files" root. */
export function filesIn(projectId: string | null, parentId: string | null) {
  return driveFiles.filter(
    (file) => file.projectId === projectId && file.parentId === parentId,
  );
}

export function foldersFor(projectId: string | null) {
  return driveFiles.filter(
    (file) => file.projectId === projectId && file.kind === "folder",
  );
}

export function breadcrumbOf(fileId: string): DriveFile[] {
  const trail: DriveFile[] = [];
  let current = getDriveFile(fileId);
  while (current?.parentId) {
    const parent = getDriveFile(current.parentId);
    if (!parent) break;
    trail.unshift(parent);
    current = parent;
  }
  return trail;
}

export function filesForTicket(ticketKey: string) {
  return driveFiles.filter((file) => file.ticketRefs.includes(ticketKey));
}

export function recentFiles(userId: string = CURRENT_USER_ID, count = 12) {
  return driveFiles
    .filter(
      (file) =>
        file.kind !== "folder" &&
        (file.ownerId === userId || file.sharedWithIds.includes(userId)),
    )
    .slice(0, count);
}

export function starredFiles(userId: string = CURRENT_USER_ID) {
  return driveFiles.filter(
    (file) =>
      file.starred &&
      (file.ownerId === userId || file.sharedWithIds.includes(userId)),
  );
}

export function ownerName(file: DriveFile) {
  return users.find((user) => user.id === file.ownerId)?.name ?? "Unknown";
}
