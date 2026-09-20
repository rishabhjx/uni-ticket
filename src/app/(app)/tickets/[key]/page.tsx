import { TicketPage } from "@/components/tickets/ticket-page";
import { tickets } from "@/lib/mock";

/**
 * Every seeded ticket gets a route. Tickets created at runtime have none, so
 * they fall to not-found, which resolves the path against the store.
 */
export function generateStaticParams() {
  return tickets.map((ticket) => ({ key: ticket.key.toLowerCase() }));
}

export default async function TicketRoute({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  return <TicketPage ticketKey={key.toUpperCase()} />;
}
