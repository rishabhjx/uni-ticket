import { projects } from "@/lib/mock";

/**
 * Where an ad-hoc ticket created from Mail, Chat or Files lands when nobody
 * picked a project — the service desk, since "turn this into a ticket" from
 * an email or a message is closest in spirit to a service-desk request.
 */
export function getDefaultProjectId() {
  const helpdesk = projects.find((project) => project.kind === "service");
  return helpdesk?.id ?? projects[0].id;
}
