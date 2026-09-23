import { Suspense } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { AppShellSkeleton } from "@/components/shared/skeletons";
import { TicketStoreProvider } from "@/lib/store/ticket-store";
import { WorkspaceProviders } from "@/lib/store/workspace-providers";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TicketStoreProvider>
      <WorkspaceProviders>
        {/*
          Filters live in the URL, so the shell reads search params and has to
          sit behind a boundary. The fallback is the same skeleton the store
          shows while it loads, so the two are indistinguishable.
        */}
        <Suspense fallback={<AppShellSkeleton />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </WorkspaceProviders>
    </TicketStoreProvider>
  );
}
