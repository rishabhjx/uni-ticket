import { AppShell } from "@/components/shell/app-shell";
import { TicketStoreProvider } from "@/lib/store/ticket-store";

/**
 * Mock dates are relative to "today", so these routes render per request
 * rather than being frozen into the build output.
 */
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TicketStoreProvider>
      <AppShell>{children}</AppShell>
    </TicketStoreProvider>
  );
}
