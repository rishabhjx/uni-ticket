import { AppShell } from "@/components/shell/app-shell";
import { TicketStoreProvider } from "@/lib/store/ticket-store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TicketStoreProvider>
      <AppShell>{children}</AppShell>
    </TicketStoreProvider>
  );
}
