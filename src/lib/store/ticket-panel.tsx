"use client";

import * as React from "react";

/**
 * Which ticket the detail panel is showing. It lives above the screens so a
 * board card, a table row or a KPI list can all open the same panel over
 * whatever view the person is already on.
 */
type TicketPanelValue = {
  openTicketId: string | null;
  openTicket: (ticketId: string) => void;
  closeTicket: () => void;
};

const TicketPanelContext = React.createContext<TicketPanelValue | null>(null);

export function TicketPanelProvider({ children }: { children: React.ReactNode }) {
  const [openTicketId, setOpenTicketId] = React.useState<string | null>(null);

  const openTicket = React.useCallback((ticketId: string) => {
    setOpenTicketId(ticketId);
  }, []);

  const closeTicket = React.useCallback(() => {
    setOpenTicketId(null);
  }, []);

  const value = React.useMemo(
    () => ({ openTicketId, openTicket, closeTicket }),
    [openTicketId, openTicket, closeTicket],
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
