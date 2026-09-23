"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Which ticket the panel is showing lives in the URL, so a ticket is a link
 * you can send someone and the browser's back button closes the panel. The
 * key is used rather than the internal id because ?ticket=APO-142 is what a
 * person would expect to see.
 */
type TicketPanelValue = {
  openTicketKey: string | null;
  openTicket: (ticketKey: string) => void;
  closeTicket: () => void;
};

const TicketPanelContext = React.createContext<TicketPanelValue | null>(null);

export function TicketPanelProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const openTicketKey = params.get("ticket");

  const openTicket = React.useCallback(
    (ticketKey: string) => {
      const next = new URLSearchParams(params.toString());
      next.set("ticket", ticketKey);
      // push, so back closes the panel rather than leaving the page.
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, params],
  );

  const closeTicket = React.useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("ticket");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [router, pathname, params]);

  const value = React.useMemo(
    () => ({ openTicketKey, openTicket, closeTicket }),
    [openTicketKey, openTicket, closeTicket],
  );

  return <TicketPanelContext value={value}>{children}</TicketPanelContext>;
}

export function useTicketPanel() {
  const context = React.use(TicketPanelContext);
  if (!context) {
    throw new Error("useTicketPanel must be used inside <TicketPanelProvider>");
  }
  return context;
}
