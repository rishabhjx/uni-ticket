"use client";

import * as React from "react";

import { ChatStoreProvider } from "@/lib/store/chat-store";
import { FilesStoreProvider } from "@/lib/store/files-store";
import { MailStoreProvider } from "@/lib/store/mail-store";
import { MeetingsStoreProvider } from "@/lib/store/meetings-store";
import { useTicketStore } from "@/lib/store/ticket-store";

/**
 * The workspace's other apps, all in one wrapper so the layout does not grow
 * a new provider every time one is added. Chat needs the live set of ticket
 * keys to decide whether "APO-142" typed into a message is a real cross-link
 * or just three letters and a number, which is why this sits inside
 * <TicketStoreProvider> rather than beside it.
 */
export function WorkspaceProviders({ children }: { children: React.ReactNode }) {
  const { tickets } = useTicketStore();
  const knownTicketKeys = React.useMemo(
    () => new Set(tickets.map((ticket) => ticket.key)),
    [tickets],
  );

  return (
    <ChatStoreProvider knownTicketKeys={knownTicketKeys}>
      <MailStoreProvider>
        <MeetingsStoreProvider>
          <FilesStoreProvider>{children}</FilesStoreProvider>
        </MeetingsStoreProvider>
      </MailStoreProvider>
    </ChatStoreProvider>
  );
}
