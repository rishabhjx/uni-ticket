"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { EmojiPicker } from "@/components/shared/emoji-picker";
import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CURRENT_USER_ID, getUser, users } from "@/lib/mock";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-8 w-full rounded-md border border-grey-200 px-2.5 text-small text-grey-900 transition-colors placeholder:text-grey-500 hover:border-grey-300 focus:border-accent-600 focus:outline-none";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[92px_1fr] items-start gap-3">
      <span className="pt-1.5 text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </label>
  );
}

/** "Product Engineering" -> "product-engineering". */
function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { workspaces, createWorkspace } = useTicketStore();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [emoji, setEmoji] = React.useState("🏗️");
  const [memberIds, setMemberIds] = React.useState<string[]>([CURRENT_USER_ID]);

  const slug = slugify(name);
  const taken = workspaces.some((workspace) => workspace.slug === slug);
  const canSubmit = name.trim().length > 0 && slug.length > 1 && !taken;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const workspace = createWorkspace({
      name,
      slug,
      description,
      emoji,
      memberIds,
    });

    setName("");
    setDescription("");
    setMemberIds([CURRENT_USER_ID]);
    onOpenChange(false);
    // Creating something should land you in it.
    router.push(`/workspaces/${workspace.slug}`);
  };

  const toggleMember = (id: string) =>
    setMemberIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="hairline-b px-5 py-4">
          <DialogTitle className="text-heading font-semibold">
            New workspace
          </DialogTitle>
          <DialogDescription className="text-small text-grey-500">
            A workspace holds projects. Everything under it shares its people.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <div className="flex flex-col gap-3 px-5 py-4">
            <div className="flex items-center gap-2">
              <EmojiPicker value={emoji} onChange={setEmoji} className="size-9" />
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Workspace name"
                aria-label="Workspace name"
                className={cn(fieldClass, "h-9 text-heading font-medium")}
              />
            </div>

            <Row label="URL">
              <span className="flex h-8 items-center rounded-md bg-grey-50 px-2.5 text-small text-grey-500">
                /workspaces/
                <span className="text-grey-900">{slug || "…"}</span>
              </span>
            </Row>
            {taken ? (
              <p className="pl-[104px] text-caption text-[color:var(--danger)]">
                A workspace already uses that name.
              </p>
            ) : null}

            <Row label="About">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                placeholder="What belongs in here?"
                aria-label="Workspace description"
                className={cn(fieldClass, "h-auto resize-y py-1.5")}
              />
            </Row>

            <Row label="People">
              <div className="flex flex-wrap gap-1">
                {users.map((user) => {
                  const on = memberIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleMember(user.id)}
                      aria-pressed={on}
                      className={cn(
                        "flex h-7 items-center gap-1.5 rounded-md border px-1.5 text-small transition-colors",
                        on
                          ? "border-accent-600 bg-accent-50 text-accent-700"
                          : "border-grey-200 text-grey-600 hover:border-grey-300",
                      )}
                    >
                      <UserAvatar userId={user.id} />
                      {getUser(user.id)?.name.split(" ")[0]}
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
              Create workspace
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
