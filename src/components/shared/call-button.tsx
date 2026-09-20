"use client";

import * as React from "react";
import { Phone, Video } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { getUser } from "@/lib/mock";
import { cn } from "@/lib/utils";

/**
 * Start a call about this project or ticket, Slack-style.
 *
 * In a real unified workspace the call itself belongs to the platform and this
 * button would deep-link into it with the ticket as context — which is why the
 * dialog names the room after the ticket rather than pretending to dial. There
 * is no backend here to place a call with, so what it demonstrates is the
 * handoff: who gets pulled in, and what the call is about.
 */
export function CallButton({
  subject,
  participantIds,
  className,
}: {
  subject: string;
  participantIds: string[];
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const room = subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Start a call about ${subject}`}
        title={`Start a call about ${subject}`}
        className={cn(
          "flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900",
          className,
        )}
      >
        <Phone className="size-4" strokeWidth={1.75} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="size-4 text-grey-500" strokeWidth={1.75} />
              Start a call
            </DialogTitle>
            <DialogDescription className="text-small text-grey-500">
              About <span className="text-grey-900">{subject}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <p className="text-caption font-medium tracking-wide text-grey-500 uppercase">
                Room
              </p>
              <p className="mt-1 font-mono text-small text-grey-700">
                uni.call/{room}
              </p>
            </div>

            <div>
              <p className="text-caption font-medium tracking-wide text-grey-500 uppercase">
                Invites {participantIds.length}
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {participantIds.map((id) => (
                  <li
                    key={id}
                    className="flex h-7 items-center gap-1.5 rounded-md border border-grey-200 px-1.5 text-small text-grey-700"
                  >
                    <UserAvatar userId={id} />
                    {getUser(id)?.name.split(" ")[0]}
                  </li>
                ))}
              </ul>
            </div>

            <p className="rounded-md bg-grey-50 px-2.5 py-2 text-caption text-grey-500">
              Calling belongs to the workspace, not to Tickets. This is the
              handoff: the room and the context travel, the call happens there.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
