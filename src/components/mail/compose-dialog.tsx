"use client";

import * as React from "react";
import { PenLine, X } from "lucide-react";

import {
  Attachment as AttachmentCard,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/reui/attachment";
import { MemberPicker } from "@/components/shared/member-picker";
import { attachmentIcon, kindOf } from "@/components/tickets/comment-composer";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatBytes } from "@/lib/format";
import { type Attachment } from "@/lib/mock";
import { useMailStore } from "@/lib/store/mail-store";
import { cn } from "@/lib/utils";

type Draft = Omit<Attachment, "id"> & { url?: string };

const fieldClass =
  "border-grey-200 shadow-none transition-colors placeholder:text-grey-500 hover:border-grey-300 focus-visible:border-accent-600 focus-visible:ring-0";
const labelClass =
  "mb-1 text-caption font-medium tracking-[0.07em] text-grey-500 uppercase";

const SIGNATURE_KEY = "uni.mailSignature";

function loadSignature() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(SIGNATURE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveSignature(value: string) {
  try {
    window.localStorage.setItem(SIGNATURE_KEY, value);
  } catch {
    // Private-browsing/storage-denied: the signature just doesn't persist.
  }
}

export type ComposeInitial = {
  subject?: string;
  body?: string;
  attachments?: Draft[];
};

export function ComposeDialog({
  open,
  onOpenChange,
  onSent,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: (threadId: string, folder: "sent" | "drafts") => void;
  /** Seeds the dialog for Forward — a fresh subject/body/attachments rather
   *  than a blank compose. */
  initial?: ComposeInitial;
}) {
  const { compose } = useMailStore();
  const [toIds, setToIds] = React.useState<string[]>([]);
  const [ccIds, setCcIds] = React.useState<string[]>([]);
  const [bccIds, setBccIds] = React.useState<string[]>([]);
  const [showCcBcc, setShowCcBcc] = React.useState(false);
  const [externalEmail, setExternalEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [signature, setSignature] = React.useState(loadSignature);
  const [editingSignature, setEditingSignature] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const pending = React.useRef<string[]>([]);

  const reset = () => {
    setToIds([]);
    setCcIds([]);
    setBccIds([]);
    setShowCcBcc(false);
    setExternalEmail("");
    setSubject("");
    setBody("");
    setDrafts([]);
  };

  // Loads a fresh draft (blank, or Forward's seed + the signature) every
  // time the dialog opens — not on every render, so typing isn't clobbered.
  const [lastOpen, setLastOpen] = React.useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setToIds([]);
      setCcIds([]);
      setBccIds([]);
      setShowCcBcc(false);
      setExternalEmail("");
      setSubject(initial?.subject ?? "");
      const quoted = initial?.body ?? "";
      setBody(signature ? `\n\n${signature}\n\n${quoted}` : quoted);
      setDrafts(initial?.attachments ?? []);
    }
  }

  React.useEffect(() => {
    const urls = pending.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const accept = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next = Array.from(files).map((file) => {
      const kind = kindOf(file);
      return {
        name: file.name,
        size: file.size,
        kind,
        url: kind === "image" ? URL.createObjectURL(file) : undefined,
      };
    });
    for (const draft of next) {
      if (draft.url) pending.current.push(draft.url);
    }
    setDrafts((current) => [...current, ...next]);
  };

  const hasRecipient = toIds.length > 0 || externalEmail.trim().length > 0;
  const hasContent = subject.trim().length > 0 || body.trim().length > 0 || drafts.length > 0;
  const canSend = hasRecipient && hasContent;

  const attachmentsPayload = () =>
    drafts.map(({ name, size, kind, url }) => ({ name, size, kind, url }));

  const send = () => {
    if (!canSend) return;
    const thread = compose({
      subject,
      body,
      toIds,
      ccIds,
      bccIds,
      externalEmail: externalEmail.trim() || undefined,
      attachments: attachmentsPayload(),
    });
    reset();
    onOpenChange(false);
    onSent?.(thread.id, "sent");
  };

  const saveDraft = () => {
    if (!subject.trim() && !body.trim()) return;
    const thread = compose({
      subject,
      body,
      toIds,
      ccIds,
      bccIds,
      externalEmail: externalEmail.trim() || undefined,
      attachments: attachmentsPayload(),
      asDraft: true,
    });
    reset();
    onOpenChange(false);
    onSent?.(thread.id, "drafts");
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
          <DialogTitle>{initial ? "Forward" : "New email"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2.5">
          <div>
            <div className="flex items-center justify-between">
              <Label className={labelClass}>To</Label>
              {!showCcBcc ? (
                <button
                  type="button"
                  onClick={() => setShowCcBcc(true)}
                  className="text-caption text-grey-500 hover:text-grey-900 hover:underline"
                >
                  Cc/Bcc
                </button>
              ) : null}
            </div>
            <MemberPicker value={toIds} onChange={setToIds} placeholder="Add recipients" />
          </div>

          {showCcBcc ? (
            <>
              <div>
                <Label className={labelClass}>Cc</Label>
                <MemberPicker value={ccIds} onChange={setCcIds} placeholder="Add cc" />
              </div>
              <div>
                <Label className={labelClass}>Bcc</Label>
                <MemberPicker value={bccIds} onChange={setBccIds} placeholder="Add bcc" />
              </div>
            </>
          ) : null}

          <div>
            <Label className={labelClass}>External (optional)</Label>
            <Input
              type="email"
              value={externalEmail}
              onChange={(event) => setExternalEmail(event.target.value)}
              placeholder="someone@outside.example"
              className={cn(fieldClass, "h-8 text-small")}
            />
          </div>

          <Input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            className={cn(fieldClass, "h-8 text-small")}
          />

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={7}
            placeholder="Write your message"
            className="w-full resize-none rounded-md border border-grey-200 px-2.5 py-2 text-small text-grey-900 placeholder:text-grey-500 focus:border-accent-600 focus:outline-none"
          />

          {drafts.length > 0 ? (
            <AttachmentGroup className="flex flex-wrap">
              {drafts.map((draft, index) => {
                const Icon = attachmentIcon[draft.kind];
                return (
                  <AttachmentCard key={`${draft.name}-${index}`} size="sm" className="w-[200px]">
                    <AttachmentMedia variant={draft.url ? "image" : "icon"} className="rounded-md">
                      {draft.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={draft.url} alt={draft.name} />
                      ) : (
                        <Icon className="size-4 text-grey-400" strokeWidth={1.75} />
                      )}
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{draft.name}</AttachmentTitle>
                      <AttachmentDescription>{formatBytes(draft.size)}</AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction
                        onClick={() => {
                          const gone = drafts[index];
                          // Only revoke a URL this dialog created itself —
                          // a Forward carries over the original message's
                          // own attachment URL, which is still in use there.
                          if (gone.url && pending.current.includes(gone.url)) {
                            URL.revokeObjectURL(gone.url);
                            pending.current = pending.current.filter((url) => url !== gone.url);
                          }
                          setDrafts((current) => current.filter((_, i) => i !== index));
                        }}
                        aria-label={`Remove ${draft.name}`}
                      >
                        <X className="size-3" strokeWidth={2.25} />
                      </AttachmentAction>
                    </AttachmentActions>
                  </AttachmentCard>
                );
              })}
            </AttachmentGroup>
          ) : null}

          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              className="sr-only"
              onChange={(event) => {
                accept(event.target.files);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-7 w-fit items-center gap-1.5 rounded-md border border-grey-200 px-2.5 text-caption text-grey-700 transition-colors hover:border-grey-300"
            >
              Attach files
            </button>

            <Popover open={editingSignature} onOpenChange={setEditingSignature}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Edit signature"
                  className="flex h-7 w-fit items-center gap-1.5 rounded-md border border-grey-200 px-2.5 text-caption text-grey-700 transition-colors hover:border-grey-300"
                >
                  <PenLine className="size-3" strokeWidth={1.75} />
                  Signature
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-2.5">
                <p className={labelClass}>Signature</p>
                <textarea
                  value={signature}
                  onChange={(event) => setSignature(event.target.value)}
                  onBlur={() => saveSignature(signature)}
                  rows={3}
                  placeholder="Appended to new messages and forwards"
                  className="w-full resize-none rounded-md border border-grey-200 px-2 py-1.5 text-small text-grey-900 placeholder:text-grey-500 focus:border-accent-600 focus:outline-none"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <button
            type="button"
            onClick={saveDraft}
            disabled={!subject.trim() && !body.trim()}
            className="h-8 rounded-md px-3 text-small text-grey-600 transition-colors hover:bg-grey-100 hover:text-grey-900 disabled:text-grey-400"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="h-8 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-100 disabled:text-grey-400"
          >
            Send
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
