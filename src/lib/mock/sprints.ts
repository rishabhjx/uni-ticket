import { isoDaysAgo, daysFromToday } from "./dates";
import { projects } from "./projects";
import type { Sprint } from "./types";

/**
 * Two-week cycles per software project: one finished, one running, one ahead.
 * A service desk works a queue rather than a cycle, so it has none.
 */
export const sprints: Sprint[] = projects
  .filter((project) => project.kind === "software")
  .flatMap((project, index) => {
    const number = 30 + index * 3;
    return [
      {
        id: `s-${project.slug}-past`,
        projectId: project.id,
        name: `Sprint ${number}`,
        startsOn: isoDaysAgo(28),
        endsOn: isoDaysAgo(15),
        state: "past" as const,
      },
      {
        id: `s-${project.slug}-active`,
        projectId: project.id,
        name: `Sprint ${number + 1}`,
        startsOn: isoDaysAgo(14),
        endsOn: daysFromToday(0).toISOString(),
        state: "active" as const,
      },
      {
        id: `s-${project.slug}-next`,
        projectId: project.id,
        name: `Sprint ${number + 2}`,
        startsOn: daysFromToday(1).toISOString(),
        endsOn: daysFromToday(14).toISOString(),
        state: "upcoming" as const,
      },
    ];
  });

export const sprintsById = new Map(sprints.map((sprint) => [sprint.id, sprint]));

export function getSprint(id: string | null) {
  return id ? sprintsById.get(id) : undefined;
}

export function sprintsForProject(projectId: string) {
  return sprints.filter((sprint) => sprint.projectId === projectId);
}

export function activeSprint(projectId: string) {
  return sprints.find(
    (sprint) => sprint.projectId === projectId && sprint.state === "active",
  );
}
