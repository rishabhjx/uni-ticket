"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
import { CURRENT_USER_ID, getUser, users, type Project } from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-8 w-full rounded-md border border-grey-200 px-2.5 text-small text-grey-900 transition-colors placeholder:text-grey-400 hover:border-grey-300 focus:border-accent-600 focus:outline-none";

const EMOJI = ["🚀", "🛰️", "🧩", "📦", "🔭", "⚙️", "🎯", "🌱", "🛟", "📊", "🎨", "🔐"];

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
  const { projects, createProject } = useTicketStore();

  const [name, setName] = React.useState("");
  const [key, setKey] = React.useState("");
  const [keyTouched, setKeyTouched] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [emoji, setEmoji] = React.useState(EMOJI[0]);
  const [kind, setKind] = React.useState<Project["kind"]>("software");
  const [memberIds, setMemberIds] = React.useState<string[]>([CURRENT_USER_ID]);

  const effectiveKey = keyTouched ? key : suggestKey(name);
  const taken = projects.some(
    (project) => project.key.toUpperCase() === effectiveKey.toUpperCase(),
  );
  const canSubmit =
    name.trim().length > 0 && effectiveKey.trim().length >= 2 && !taken;

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
              <div className="flex flex-wrap gap-1">
                {EMOJI.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setEmoji(option)}
                    aria-pressed={emoji === option}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md border text-base transition-colors",
                      emoji === option
                        ? "border-accent-600 bg-accent-50"
                        : "border-grey-200 hover:border-grey-300",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
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
              className="h-8 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-200 disabled:text-grey-400"
            >
              Create project
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
