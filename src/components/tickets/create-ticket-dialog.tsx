"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { PriorityBadge, SeverityBadge, TypeIcon } from "@/components/tickets/badges";
import { AssigneePicker } from "@/components/tickets/assignee-picker";
import { kindOf } from "@/components/tickets/comment-composer";
import { CustomFieldControl } from "@/components/tickets/custom-fields";
import { StageAssigneesEditor } from "@/components/tickets/stage-assignees";
import { Checkbox } from "@/components/ui/checkbox";
import { useProjectFields } from "@/lib/store/added-fields";
import { UserAvatar } from "@/components/tickets/user-avatar";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CURRENT_USER_ID,
  DISCIPLINE_LABEL,
  DISCIPLINES,
  ENVIRONMENT_LABEL,
  ENVIRONMENTS,
  canEdit as canEditProject,
  getProject,
  getProjectBySlug,
  getUser,
  isDefect,
  labels,
  sprintsForProject,
  SEVERITY_LABEL,
  STATUS_DISCIPLINE,
  STATUS_LABEL,
  statusesForDiscipline,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  TICKET_TYPES,
  TYPE_LABEL,
  users,
  type Attachment,
  type Discipline,
  type Environment,
  type TicketPriority,
  type TicketSeverity,
  type TicketStatus,
  type TicketType,
} from "@/lib/mock";
import { TEMPLATES } from "@/lib/mock/templates";
import { useTicketPanel } from "@/lib/store/ticket-panel";
import {
  useTicketStore,
  type NewTicketInput,
} from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

const LAST_TYPE_KEY = "uni.lastTicketType";

const fieldClass =
  "h-8 w-full rounded-md border border-grey-200 px-2.5 text-small text-grey-900 transition-colors placeholder:text-grey-500 hover:border-grey-300 focus:border-accent-600 focus:outline-none";

function Section({ title }: { title: string }) {
  return (
    <div className="mt-2 flex shrink-0 items-center gap-2 first:mt-0">
      <span className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
        {title}
      </span>
      <span aria-hidden className="h-px flex-1 bg-grey-150" />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid shrink-0 grid-cols-[100px_1fr] items-center gap-3">
      <span className="text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
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
  const [assigneeIds, setAssigneeIds] = React.useState<string[]>([]);
  // Off by default: a ticket follows whatever the project already routes to
  // per stage, and only needs its own roster when this one has to differ.
  const [inheritStages, setInheritStages] = React.useState(true);
  const [stageAssignees, setStageAssignees] = React.useState<
    Partial<Record<Discipline, string>>
  >({});
  const [labelIds, setLabelIds] = React.useState<string[]>([]);
  // Filing straight into a stage: a bug found in QA does not start in Backlog.
  const [status, setStatus] = React.useState<TicketStatus>("backlog");
  const [dueAt, setDueAt] = React.useState("");
  const [sprintId, setSprintId] = React.useState("none");
  const [parentId, setParentId] = React.useState("none");
  const [requesterId, setRequesterId] = React.useState("none");
  const [custom, setCustom] = React.useState<Record<string, unknown>>({});
  const [files, setFiles] = React.useState<Omit<Attachment, "id">[]>([]);
  /*
   * Until someone picks a person themselves, the assignee follows the status:
   * a ticket created straight into Ready for QA belongs to whoever owns QA on
   * this project, which is the same rule routing applies once it exists. The
   * flag is what stops that default overwriting a deliberate choice.
   */
  const [assigneeTouched, setAssigneeTouched] = React.useState(false);
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
  const projectFields = useProjectFields(projectId);
  const defect = isDefect(type);
  const service = project?.kind === "service";

  const stageOwner = project?.team?.[STATUS_DISCIPLINE[status]] ?? null;
  const [lastDefault, setLastDefault] = React.useState<string | null>(null);
  if (!assigneeTouched && stageOwner !== lastDefault) {
    setLastDefault(stageOwner);
    setAssigneeIds(stageOwner ? [stageOwner] : []);
  }
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
    setRequesterId("none");
    setCustom({});
    setFiles([]);
    setAssigneeTouched(false);
    setInheritStages(true);
    setStageAssignees({});
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
      status,
      assigneeIds,
      labelIds,
      estimate: null,
      dueAt: dueAt ? new Date(`${dueAt}T17:00:00`).toISOString() : null,
      environment: defect ? environment : null,
      buildVersion: null,
      sprintId: sprintId === "none" ? null : sprintId,
      parentId: parentId === "none" ? null : parentId,
      requesterId: service && requesterId !== "none" ? requesterId : null,
      stageAssignees: inheritStages ? undefined : stageAssignees,
      custom: custom as NewTicketInput["custom"],
      attachments: files,
    });

    reset();
    onOpenChange(false);
    // By KEY, not id: the panel resolves ?ticket= against ticket.key, so
    // passing the id opened nothing at all.
    openTicket(ticket.key);
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
          <div className="flex max-h-[64vh] flex-col gap-3 overflow-y-auto px-5 py-4">
            <input
              autoFocus
              data-form-title
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short, specific summary"
              aria-label="Title"
              className={cn(fieldClass, "h-9 shrink-0 text-heading font-medium")}
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
              className="w-full shrink-0 resize-none rounded-md border border-grey-200 px-2.5 py-2 text-small text-grey-900 transition-colors placeholder:text-grey-500 hover:border-grey-300 focus:border-accent-600 focus:outline-none"
            />

            <Section title="Where it goes" />

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

            {project && !canEditProject(project, CURRENT_USER_ID) ? (
              /*
               * You can raise a request in a project you only have viewer
               * access to -- that is what a service desk is for -- but the
               * ticket arrives read-only, and finding that out AFTER filing
               * it is the kind of surprise that makes people distrust a tool.
               */
              <p className="-mt-1 pl-[112px] text-caption text-grey-500">
                You are a viewer in {project.name}: you can raise this, and the{" "}
                {project.name} team will own it from there.
              </p>
            ) : null}

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

            <Section title="Triage" />

            <Row label="Status">
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TicketStatus)}
              >
                <SelectTrigger className="h-8 text-small">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCIPLINES.map((discipline) => (
                    <SelectGroup key={discipline}>
                      <SelectLabel>{DISCIPLINE_LABEL[discipline]}</SelectLabel>
                      {statusesForDiscipline(discipline).map((option) => (
                        <SelectItem key={option} value={option}>
                          {STATUS_LABEL[option]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
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
              </>
            ) : null}

            <Section title="Who has it" />

            <Row label="Assignees">
              <div className="flex flex-col gap-1">
                <AssigneePicker
                  value={assigneeIds}
                  memberIds={project?.memberIds ?? []}
                  team={project?.team}
                  onChange={(next) => {
                    setAssigneeTouched(true);
                    setAssigneeIds(next);
                  }}
                  className="h-8 rounded-md border border-grey-200"
                />
                {!assigneeTouched && stageOwner ? (
                  <span className="px-1 text-caption text-grey-500">
                    Following {DISCIPLINE_LABEL[STATUS_DISCIPLINE[status]]} —
                    change the status and this follows it.
                  </span>
                ) : null}
              </div>
            </Row>

            <Row label="Per stage">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-small text-grey-700">
                  <Checkbox
                    checked={inheritStages}
                    onCheckedChange={(next) => setInheritStages(next === true)}
                  />
                  Inherit assignees from project
                </label>
                {!inheritStages ? (
                  <StageAssigneesEditor
                    value={stageAssignees}
                    onChange={setStageAssignees}
                    memberIds={project?.memberIds ?? []}
                    projectTeam={project?.team}
                  />
                ) : (
                  <p className="text-caption text-grey-500">
                    Each stage goes to whoever {project?.name ?? "the project"}{" "}
                    already has assigned to it.
                  </p>
                )}
              </div>
            </Row>

            {service ? (
              <Row label="Requester">
                <Select value={requesterId} onValueChange={setRequesterId}>
                  <SelectTrigger className="h-8 text-small">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nobody outside the team</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} · {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
            ) : null}

            <Row label="Reporter">
              {/* Not editable: you are the reporter of what you file, and a
                  field that only ever holds one value should say so rather
                  than pretend to be a choice. */}
              <span className="flex h-8 items-center gap-2 px-1 text-small text-grey-700">
                <UserAvatar userId={CURRENT_USER_ID} />
                {getUser(CURRENT_USER_ID)?.name} · you
              </span>
            </Row>

            <Section title="Planning" />

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

            <Section title="Everything else" />

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

            {projectFields.length > 0 ? (
              <>
                <p className="mt-1 text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
                  {project?.name} fields
                </p>
                {/* A project's own fields were only settable AFTER the ticket
                    existed, which is the one moment you know least about it.
                    Same control as the panel, so the field behaves the same
                    in both places. */}
                {projectFields.map((field) => (
                  <Row key={field.id} label={field.name}>
                    <CustomFieldControl
                      field={field}
                      value={custom[field.id] ?? null}
                      onChange={(next) =>
                        setCustom((current) => ({ ...current, [field.id]: next }))
                      }
                      className="h-8 border border-grey-200 px-2.5 hover:bg-transparent"
                    />
                  </Row>
                ))}
              </>
            ) : null}

            <Row label="Attachments">
              <div className="flex flex-col gap-1.5">
                <input
                  type="file"
                  multiple
                  aria-label="Attach files"
                  onChange={(event) => {
                    const picked = Array.from(event.target.files ?? []).map(
                      (file) => ({
                        name: file.name,
                        size: file.size,
                        kind: kindOf(file),
                        url: file.type.startsWith("image/")
                          ? URL.createObjectURL(file)
                          : undefined,
                      }),
                    );
                    setFiles((current) => [...current, ...picked]);
                    event.target.value = "";
                  }}
                  className="text-caption text-grey-600 file:mr-2 file:h-7 file:rounded-md file:border file:border-grey-200 file:bg-transparent file:px-2 file:text-caption file:text-grey-700 hover:file:border-grey-300"
                />
                {files.length > 0 ? (
                  <ul className="flex flex-wrap gap-1">
                    {files.map((file, index) => (
                      <li key={`${file.name}-${index}`}>
                        <button
                          type="button"
                          onClick={() =>
                            setFiles((current) =>
                              current.filter((_, i) => i !== index),
                            )
                          }
                          title={`Remove ${file.name}`}
                          className="tap flex items-center gap-1 rounded-md bg-grey-100 px-1.5 py-0.5 text-caption text-grey-700 transition-colors hover:bg-grey-200"
                        >
                          <span className="max-w-[160px] truncate">
                            {file.name}
                          </span>
                          <span aria-hidden className="text-grey-500">
                            ×
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
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
              className="h-8 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-100 disabled:text-grey-600"
            >
              Create ticket
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
