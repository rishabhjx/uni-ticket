"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

import { EmojiPicker } from "@/components/shared/emoji-picker";
import { Checkbox } from "@/components/ui/checkbox";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CUSTOM_FIELD_TYPES,
  CURRENT_USER_ID,
  DISCIPLINE_LABEL,
  DISCIPLINES,
  getUser,
  users,
  type CustomField,
  type CustomFieldType,
  type Discipline,
  type Project,
} from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-8 w-full rounded-md border border-grey-200 px-2.5 text-small text-grey-900 transition-colors placeholder:text-grey-400 hover:border-grey-300 focus:border-accent-600 focus:outline-none";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[92px_1fr] items-start gap-3">
      <span className="pt-1.5 text-caption font-medium tracking-wide text-grey-500 uppercase">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </label>
  );
}

/** Derives a ticket prefix from the name, e.g. "Orbit Data" -> "ORB". */
function suggestKey(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { projects, workspaces, createProject } = useTicketStore();

  const [name, setName] = React.useState("");
  const [key, setKey] = React.useState("");
  const [keyTouched, setKeyTouched] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [emoji, setEmoji] = React.useState("🚀");
  const [kind, setKind] = React.useState<Project["kind"]>("software");
  const [memberIds, setMemberIds] = React.useState<string[]>([CURRENT_USER_ID]);
  const [workspaceId, setWorkspaceId] = React.useState(workspaces[0]?.id ?? "");
  const [customFields, setCustomFields] = React.useState<CustomField[]>([]);
  const [team, setTeam] = React.useState<Partial<Record<Discipline, string>>>({
    // Whoever is creating it owns everything until they say otherwise, which
    // beats a project where routing silently does nothing.
    intake: CURRENT_USER_ID,
    design: CURRENT_USER_ID,
    development: CURRENT_USER_ID,
    qa: CURRENT_USER_ID,
    product: CURRENT_USER_ID,
  });

  const effectiveKey = keyTouched ? key : suggestKey(name);
  const taken = projects.some(
    (project) => project.key.toUpperCase() === effectiveKey.toUpperCase(),
  );
  const canSubmit =
    name.trim().length > 0 &&
    effectiveKey.trim().length >= 2 &&
    !taken &&
    workspaceId.length > 0;

  const reset = () => {
    setName("");
    setKey("");
    setKeyTouched(false);
    setDescription("");
    setMemberIds([CURRENT_USER_ID]);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const project = createProject({
      name,
      key: effectiveKey,
      description,
      emoji,
      kind,
      memberIds,
      workspaceId,
      team,
      customFields,
    });

    reset();
    onOpenChange(false);
    router.push(`/projects/${project.slug}/board`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="hairline-b px-5 py-4">
          <DialogTitle className="text-heading font-semibold">
            New project
          </DialogTitle>
          <DialogDescription className="text-small text-grey-500">
            It appears in the sidebar with an empty board ready for tickets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto px-5 py-4">
            <div className="flex gap-2">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-grey-200 text-lg"
              >
                {emoji}
              </span>
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Project name"
                aria-label="Project name"
                className={cn(fieldClass, "h-9 text-heading font-medium")}
              />
            </div>

            <Row label="Icon">
              <EmojiPicker value={emoji} onChange={setEmoji} />
            </Row>

            <Row label="Fields">
              <div className="flex flex-col gap-1.5">
                <p className="text-caption text-grey-500">
                  Anything this project tracks that a ticket does not already
                  carry. They show on the ticket, and the ones you tick appear
                  on cards and as a list column.
                </p>

                {customFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-1.5">
                    <input
                      value={field.name}
                      onChange={(event) =>
                        setCustomFields((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, name: event.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="Field name"
                      aria-label="Field name"
                      className={cn(fieldClass, "h-7 flex-1")}
                    />
                    <Select
                      value={field.type}
                      onValueChange={(value) =>
                        setCustomFields((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, type: value as CustomFieldType }
                              : item,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="h-7 w-28 text-small">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOM_FIELD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label
                      title="Show on cards and as a list column"
                      className="flex h-7 items-center gap-1 rounded-md border border-grey-200 px-1.5 text-caption text-grey-600"
                    >
                      <Checkbox
                        checked={field.showOnCard ?? false}
                        onCheckedChange={(next) =>
                          setCustomFields((current) =>
                            current.map((item, i) =>
                              i === index
                                ? { ...item, showOnCard: next === true }
                                : item,
                            ),
                          )
                        }
                        aria-label={`Show ${field.name || "this field"} on cards`}
                      />
                      Card
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomFields((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      aria-label={`Remove ${field.name || "field"}`}
                      className="flex size-7 items-center justify-center rounded-md text-grey-400 transition-colors hover:text-[color:var(--danger)]"
                    >
                      <X className="size-3.5" strokeWidth={2} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCustomFields((current) => [
                      ...current,
                      {
                        id: `cf-${Date.now()}-${current.length}`,
                        name: "",
                        type: "text",
                      },
                    ])
                  }
                  className="flex h-7 items-center gap-1.5 self-start rounded-md border border-dashed border-grey-200 px-2 text-small text-grey-500 transition-colors hover:border-grey-300 hover:text-grey-900"
                >
                  <Plus className="size-3.5" strokeWidth={2} />
                  Add a field
                </button>
              </div>
            </Row>

            <Row label="Routing">
              <div className="flex flex-col gap-1.5">
                <p className="text-caption text-grey-500">
                  Who picks a ticket up when it reaches each stage. Moving a
                  ticket into a stage assigns it to them.
                </p>
                {DISCIPLINES.filter((d) => d !== "closed").map((discipline) => (
                  <div
                    key={discipline}
                    className="grid grid-cols-[96px_1fr] items-center gap-2"
                  >
                    <span className="text-small text-grey-600">
                      {DISCIPLINE_LABEL[discipline]}
                    </span>
                    <Select
                      value={team[discipline] ?? "none"}
                      onValueChange={(value) =>
                        setTeam((current) => ({
                          ...current,
                          [discipline]: value === "none" ? undefined : value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-7 text-small">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-grey-500">Nobody</span>
                        </SelectItem>
                        {memberIds.map((id) => (
                          <SelectItem key={id} value={id}>
                            {getUser(id)?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </Row>

            <Row label="Workspace">
              <Select value={workspaceId} onValueChange={setWorkspaceId}>
                <SelectTrigger className="h-8 text-small">
                  <SelectValue placeholder="Pick a workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.emoji} {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>

            <Row label="Key">
              <input
                value={effectiveKey}
                onChange={(event) => {
                  setKeyTouched(true);
                  setKey(event.target.value.toUpperCase().replace(/[^A-Z]/g, ""));
                }}
                maxLength={4}
                placeholder="ORB"
                aria-label="Ticket key prefix"
                className={cn(fieldClass, "w-24 font-mono tracking-wide")}
              />
              <p className="mt-1 text-caption text-grey-500">
                {taken ? (
                  <span style={{ color: "var(--priority-urgent-fg)" }}>
                    {effectiveKey} is already used by another project.
                  </span>
                ) : (
                  `Tickets will be numbered ${effectiveKey || "KEY"}-101 onwards.`
                )}
              </p>
            </Row>

            <Row label="About">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                placeholder="What this project covers."
                aria-label="Description"
                className="w-full resize-none rounded-md border border-grey-200 px-2.5 py-2 text-small text-grey-900 transition-colors placeholder:text-grey-400 hover:border-grey-300 focus:border-accent-600 focus:outline-none"
              />
            </Row>

            <Row label="Type">
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as Project["kind"])}
              >
                <SelectTrigger className="h-8 text-small">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="software">
                    Software — sprints, reviews and QA
                  </SelectItem>
                  <SelectItem value="service">
                    Service desk — requesters and SLAs
                  </SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Row label="Members">
              <div className="flex flex-wrap gap-1">
                {users.map((user) => {
                  const active = memberIds.includes(user.id);
                  const isMe = user.id === CURRENT_USER_ID;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      disabled={isMe}
                      onClick={() =>
                        setMemberIds((current) =>
                          active
                            ? current.filter((id) => id !== user.id)
                            : [...current, user.id],
                        )
                      }
                      className={cn(
                        "flex h-7 items-center gap-1.5 rounded-md border px-1.5 text-caption transition-colors",
                        active
                          ? "border-accent-200 bg-accent-50 text-accent-700"
                          : "border-grey-200 text-grey-600 hover:border-grey-300",
                        isMe && "cursor-default",
                      )}
                    >
                      <UserAvatar userId={user.id} />
                      {getUser(user.id)?.name.split(" ")[0]}
                      {isMe ? " (you)" : ""}
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
              className="h-8 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-100 disabled:text-grey-500"
            >
              Create project
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
