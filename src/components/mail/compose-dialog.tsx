"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENT_USER_ID, users } from "@/lib/mock";
import { useMailStore } from "@/lib/store/mail-store";

export function ComposeDialog({
  open,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: (threadId: string) => void;
}) {
  const { compose } = useMailStore();
  const [toId, setToId] = React.useState<string>(
    users.find((u) => u.id !== CURRENT_USER_ID)?.id ?? "",
  );
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");

  const reset = () => {
    setSubject("");
    setBody("");
  };

  const send = () => {
    if (!subject.trim() && !body.trim()) return;
    const thread = compose({ subject, body, toIds: toId ? [toId] : [] });
    reset();
    onOpenChange(false);
    onSent?.(thread.id);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New email</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2.5">
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger className="h-8 text-small">
              <SelectValue placeholder="To" />
            </SelectTrigger>
            <SelectContent>
              {users
                .filter((user) => user.id !== CURRENT_USER_ID)
                .map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} · {user.email}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            className="h-8 text-small"
          />

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={8}
            placeholder="Write your message"
            className="w-full resize-none rounded-md border border-grey-200 px-2.5 py-2 text-small text-grey-900 placeholder:text-grey-500 focus:border-accent-600 focus:outline-none"
          />
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={send}
            disabled={!subject.trim() && !body.trim()}
            className="h-8 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-100 disabled:text-grey-400"
          >
            Send
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
