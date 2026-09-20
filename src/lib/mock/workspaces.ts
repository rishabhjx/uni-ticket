import type { Workspace } from "./types";

/**
 * A workspace groups projects the way a company groups teams: everything
 * under "Platform" shares members, and a project belongs to exactly one.
 *
 * This is the level the brief was missing — the sidebar listed six projects
 * flat, which is fine at six and unusable at sixty.
 */
export const workspaces: Workspace[] = [
  {
    id: "w-product",
    slug: "product",
    name: "Product Engineering",
    description: "The platform, billing and mobile teams.",
    emoji: "🏗️",
    memberIds: ["u-1", "u-2", "u-3", "u-4", "u-5", "u-6", "u-8"],
  },
  {
    id: "w-data",
    slug: "data",
    name: "Data & Design",
    description: "Analytics, the data platform and the design system.",
    emoji: "🎛️",
    memberIds: ["u-1", "u-3", "u-4", "u-7"],
  },
  {
    id: "w-ops",
    slug: "ops",
    name: "Internal Operations",
    description: "IT support and everything that keeps the office running.",
    emoji: "🛠️",
    memberIds: ["u-1", "u-6", "u-7", "u-8"],
  },
];

export const workspacesById = new Map(
  workspaces.map((workspace) => [workspace.id, workspace]),
);

export function getWorkspace(id: string | null | undefined) {
  return id ? workspacesById.get(id) : undefined;
}

export function getWorkspaceBySlug(slug: string) {
  return workspaces.find((workspace) => workspace.slug === slug);
}
