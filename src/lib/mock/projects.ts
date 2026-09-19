import type { Project } from "./types";
import { isoDaysAgo } from "./dates";

/** The current user is a member of every project in this prototype. */
export const projects: Project[] = [
  {
    id: "p-apo",
    key: "APO",
    slug: "apo",
    name: "Apollo Platform",
    description: "Core services, the public API gateway and platform reliability.",
    leadId: "u-2",
    memberIds: ["u-1", "u-2", "u-3", "u-5", "u-8"],
    startedOn: isoDaysAgo(420),
  },
  {
    id: "p-atl",
    key: "ATL",
    slug: "atl",
    name: "Atlas Billing",
    description: "Subscriptions, invoicing, tax and revenue reporting.",
    leadId: "u-5",
    memberIds: ["u-1", "u-3", "u-5", "u-7", "u-8"],
    startedOn: isoDaysAgo(300),
  },
  {
    id: "p-hel",
    key: "HEL",
    slug: "hel",
    name: "Helios Mobile",
    description: "The iOS and Android clients, plus the shared mobile core.",
    leadId: "u-6",
    memberIds: ["u-1", "u-3", "u-4", "u-6", "u-8"],
    startedOn: isoDaysAgo(260),
  },
  {
    id: "p-orb",
    key: "ORB",
    slug: "orb",
    name: "Orbit Data",
    description: "Ingest pipelines, the warehouse and internal analytics.",
    leadId: "u-7",
    memberIds: ["u-1", "u-2", "u-5", "u-7"],
    startedOn: isoDaysAgo(190),
  },
  {
    id: "p-ver",
    key: "VER",
    slug: "ver",
    name: "Vertex Design",
    description: "The design system, brand and the marketing site.",
    leadId: "u-4",
    memberIds: ["u-1", "u-4", "u-6", "u-8"],
    startedOn: isoDaysAgo(150),
  },
];

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
