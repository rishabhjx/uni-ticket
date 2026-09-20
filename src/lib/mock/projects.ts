import type { Project, ProjectRole } from "./types";
import { isoDaysAgo } from "./dates";

/** The current user is a member of every project in this prototype. */
export const projects: Project[] = [
  {
    id: "p-apo",
    key: "APO",
    slug: "apo",
    workspaceId: "w-product",
    name: "Apollo Platform",
    description: "Core services, the public API gateway and platform reliability.",
    leadId: "u-2",
    memberIds: ["u-1", "u-2", "u-3", "u-5", "u-8"],
    roles: { "u-1": "admin", "u-2": "admin", "u-3": "member", "u-5": "member", "u-8": "member" } as const,
    emoji: "🛰️",
    kind: "software" as const,
    wipLimits: { in_progress: 8, in_review: 5 },
    startedOn: isoDaysAgo(420),
  },
  {
    id: "p-atl",
    key: "ATL",
    slug: "atl",
    workspaceId: "w-product",
    name: "Atlas Billing",
    description: "Subscriptions, invoicing, tax and revenue reporting.",
    leadId: "u-5",
    memberIds: ["u-1", "u-3", "u-5", "u-7", "u-8"],
    roles: { "u-1": "member", "u-3": "admin", "u-5": "admin", "u-7": "member", "u-8": "member" } as const,
    emoji: "🧾",
    kind: "software" as const,
    startedOn: isoDaysAgo(300),
  },
  {
    id: "p-hel",
    key: "HEL",
    slug: "hel",
    workspaceId: "w-product",
    name: "Helios Mobile",
    description: "The iOS and Android clients, plus the shared mobile core.",
    leadId: "u-6",
    memberIds: ["u-1", "u-3", "u-4", "u-6", "u-8"],
    roles: { "u-1": "member", "u-3": "member", "u-4": "member", "u-6": "admin", "u-8": "member" } as const,
    emoji: "📱",
    kind: "software" as const,
    startedOn: isoDaysAgo(260),
  },
  {
    id: "p-orb",
    key: "ORB",
    slug: "orb",
    workspaceId: "w-data",
    name: "Orbit Data",
    description: "Ingest pipelines, the warehouse and internal analytics.",
    leadId: "u-7",
    memberIds: ["u-1", "u-2", "u-5", "u-7"],
    roles: { "u-1": "member", "u-2": "member", "u-5": "member", "u-7": "admin" } as const,
    emoji: "📊",
    kind: "software" as const,
    startedOn: isoDaysAgo(190),
  },
  {
    id: "p-ver",
    key: "VER",
    slug: "ver",
    workspaceId: "w-data",
    name: "Vertex Design",
    description: "The design system, brand and the marketing site.",
    leadId: "u-4",
    memberIds: ["u-1", "u-4", "u-6", "u-8"],
    roles: { "u-1": "member", "u-4": "admin", "u-6": "member", "u-8": "member" } as const,
    emoji: "🎨",
    kind: "software" as const,
    startedOn: isoDaysAgo(150),
  },
  {
    id: "p-hlp",
    key: "HLP",
    slug: "hlp",
    workspaceId: "w-ops",
    name: "Helpdesk",
    description: "Internal IT service desk: access, hardware and incidents.",
    leadId: "u-3",
    memberIds: ["u-1", "u-3", "u-8"],
    roles: { "u-1": "viewer", "u-3": "admin", "u-8": "member" } as const,
    emoji: "🛟",
    kind: "service" as const,
    startedOn: isoDaysAgo(240),
  },
];

/** Service desks behave differently enough to be worth asking about. */
export function isServiceDesk(project: Project) {
  return project.kind === "service";
}

/** Anyone not named in a project's roles is a viewer. */
export function roleIn(project: Project, userId: string): ProjectRole {
  return project.roles[userId] ?? "viewer";
}

export function canEdit(project: Project | undefined, userId: string) {
  if (!project) return false;
  return roleIn(project, userId) !== "viewer";
}

export function canAdminister(project: Project | undefined, userId: string) {
  if (!project) return false;
  return roleIn(project, userId) === "admin";
}

export const projectsById = new Map(projects.map((project) => [project.id, project]));
export const projectsBySlug = new Map(projects.map((project) => [project.slug, project]));

export function getProject(id: string) {
  return projectsById.get(id);
}

export function getProjectBySlug(slug: string) {
  return projectsBySlug.get(slug.toLowerCase());
}

/** Two-letter monogram used in the sidebar and project lists. */
export function projectMonogram(project: Project) {
  return project.key.slice(0, 2);
}
