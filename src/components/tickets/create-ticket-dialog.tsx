"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { PriorityBadge, SeverityBadge, TypeIcon } from "@/components/tickets/badges";
import { AssigneePicker } from "@/components/tickets/assignee-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ENVIRONMENT_LABEL,
  ENVIRONMENTS,
  getProject,
  getProjectBySlug,
  isDefect,
  labels,
  sprintsForProject,
  SEVERITY_LABEL,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  TICKET_TYPES,
  TYPE_LABEL,
  type Environment,
  type TicketPriority,
  type TicketSeverity,
  type TicketType,
} from "@/lib/mock";
import { TEMPLATES } from "@/lib/mock/templates";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

const LAST_TYPE_KEY = "uni.lastTicketType";

const fieldClass =
  "h-8 w-full rounded-md border border-grey-200 px-2.5 text-small text-grey-900 transition-colors placeholder:text-grey-400 hover:border-grey-300 focus:border-accent-600 focus:outline-none";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[92px_1fr] items-center gap-3">
      <span className="text-caption font-medium tracking-wide text-grey-500 uppercase">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </label>
  );
}

export function CreateTicketDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { createTicket, tickets, projects } = useTicketStore();
  const { openTicket } = useTicketPanel();

  // Default to whichever project you are looking at.
  const routeProject = React.useMemo(() => {
    const match = pathname.match(/^\/projects\/([^/]+)/);
    return match ? getProjectBySlug(match[1]) : undefined;
  }, [pathname]);

  const [projectId, setProjectId] = React.useState(
    routeProject?.id ?? projects[0].id,
  );
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  // QA files bugs all day and should not re-pick "Bug" every time.
  const [type, setType] = React.useState<TicketType>(() => {
    if (typeof window === "undefined") return "task";
    try {
      const stored = window.localStorage.getItem(LAST_TYPE_KEY);
      return (stored as TicketType) ?? "task";
    } catch {
      return "task";
    }
  });
  const [priority, setPriority] = React.useState<TicketPriority>("medium");
  const [severity, setSeverity] = React.useState<TicketSeverity>("s3");
  const [environment, setEnvironment] = React.useState<Environment>("production");
  const [buildVersion, setBuildVersion] = React.useState("");
  const [assigneeIds, setAssigneeIds] = React.useState<string[]>([]);
  const [labelIds, setLabelIds] = React.useState<string[]>([]);
  const [dueAt, setDueAt] = React.useState("");
  const [sprintId, setSprintId] = React.useState("none");
  const [parentId, setParentId] = React.useState("none");
  // Tracks whether the body is still an untouched template, so switching type
  // can swap it without destroying anything typed.
  const [templateType, setTemplateType] = React.useState<TicketType | null>(null);

  // Opening the dialog on a different project should follow that project.
  const [lastRouteProject, setLastRouteProject] = React.useState(routeProject?.id);
  if (routeProject?.id !== lastRouteProject) {
    setLastRouteProject(routeProject?.id);
    if (routeProject) setProjectId(routeProject.id);
  }

  const project = getProject(projectId);
  const defect = isDefect(type);
  const cycles = sprintsForProject(projectId);
  const epics = React.useMemo(
    () =>
      tickets.filter(
        (ticket) => ticket.projectId === projectId && ticket.type === "epic",
      ),
    [tickets, projectId],
  );

  const chooseType = (next: TicketType) => {
    setType(next);
    try {
      window.localStorage.setItem(LAST_TYPE_KEY, next);
    } catch {
      // Remembering the type is a convenience, not state worth failing over.
    }
    const template = TEMPLATES[next];
    if (template && (description.trim() === "" || templateType === type)) {
      setDescription(template);
      setTemplateType(next);
    }
  };
  const canSubmit = title.trim().length > 0;

  const reset = () => {
    setTitle("");
    setDescription("");
    setLabelIds([]);
    setDueAt("");
    setBuildVersion("");
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const ticket = createTicket({
      projectId,
      title,
      description,
      type,
      priority,
      severity: defect ? severity : null,
      status: "backlog",
      assigneeIds,
      labelIds,
      estimate: null,
      dueAt: dueAt ? new Date(`${dueAt}T17:00:00`).toISOString() : null,
      environment: defect ? environment : null,
      buildVersion: defect && buildVersion.trim() ? buildVersion.trim() : null,
      sprintId: sprintId === "none" ? null : sprintId,
      parentId: parentId === "none" ? null : parentId,
    });

    reset();
    onOpenChange(false);
    openTicket(ticket.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 p-0">
        <DialogHeader className="hairline-b px-5 py-4">
          <DialogTitle className="text-heading font-semibold">
            New ticket
          </DialogTitle>
          <DialogDescription className="text-small text-grey-500">
            It lands at the top of {project?.name ?? "the project"} backlog.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto px-5 py-4">
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short, specific summary"
              aria-label="Title"
              className={cn(fieldClass, "h-9 text-heading font-medium")}
            />

            <textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setTemplateType(null);
              }}
              rows={10}
              placeholder={
                defect
                  ? "What happened, what you expected, and the steps to reproduce. Paste logs in ```code fences```."
                  : "Context, scope and anything the next person needs."
              }
              aria-label="Description"
              className="w-full resize-none rounded-md border border-grey-200 px-2.5 py-2 text-small text-grey-900 transition-colors placeholder:text-grey-400 hover:border-grey-300 focus:border-accent-600 focus:outline-none"
            />

            <Row label="Project">
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-8 text-small">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>

            <Row label="Type">
              <Select value={type} onValueChange={(value) => chooseType(value as TicketType)}>
                <SelectTrigger className="h-8 text-small">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>
                      <span className="flex items-center gap-2">
                        <TypeIcon type={item} />
                        {TYPE_LABEL[item]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>

            <Row label="Priority">
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TicketPriority)}
              >
                <SelectTrigger className="h-8 text-small">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      <PriorityBadge priority={item} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>

            {/* Severity, environment and build only make sense on a defect. */}
            {defect ? (
              <>
                <Row label="Severity">
                  <Select
                    value={severity}
                    onValueChange={(value) => setSeverity(value as TicketSeverity)}
                  >
                    <SelectTrigger className="h-8 text-small">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_SEVERITIES.map((item) => (
                        <SelectItem key={item} value={item}>
                          <SeverityBadge severity={item} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>

                <Row label="Environment">
                  <Select
                    value={environment}
                    onValueChange={(value) => setEnvironment(value as Environment)}
                  >
                    <SelectTrigger className="h-8 text-small">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENVIRONMENTS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {ENVIRONMENT_LABEL[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>

                <Row label="Build">
                  <input
                    value={buildVersion}
                    onChange={(event) => setBuildVersion(event.target.value)}
                    placeholder="4.2.1"
                    className={fieldClass}
                  />
                </Row>
              </>
            ) : null}

            <Row label="Assignees">
              <AssigneePicker
                value={assigneeIds}
                memberIds={project?.memberIds ?? []}
                onChange={setAssigneeIds}
                className="h-8 rounded-md border border-grey-200"
              />
            </Row>

            {cycles.length > 0 ? (
              <Row label="Sprint">
                <Select value={sprintId} onValueChange={setSprintId}>
                  <SelectTrigger className="h-8 text-small">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Backlog — no sprint</SelectItem>
                    {cycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.name}
                        {cycle.state === "active" ? " · active" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
            ) : null}

            {epics.length > 0 && type !== "epic" ? (
              <Row label="Epic">
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger className="h-8 text-small">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No epic</SelectItem>
                    {epics.map((epic) => (
                      <SelectItem key={epic.id} value={epic.id}>
                        {epic.key} · {epic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
            ) : null}

            <Row label="Due">
              <input
                type="date"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                className={fieldClass}
              />
            </Row>

            <Row label="Labels">
              <div className="flex flex-wrap gap-1">
                {labels.map((label) => {
                  const active = labelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() =>
                        setLabelIds((current) =>
                          active
                            ? current.filter((id) => id !== label.id)
                            : [...current, label.id],
                        )
                      }
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-caption transition-colors",
                        active
                          ? "bg-accent-100 text-accent-700"
                          : "bg-grey-100 text-grey-600 hover:bg-grey-150",
                      )}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </Row>
          </div>

          <DialogFooter className="hairline-t px-5 py-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 rounded-md px-3 text-small text-grey-600 transition-colors hover:bg-grey-100 hover:text-grey-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-8 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-200 disabled:text-grey-400"
            >
              Create ticket
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
