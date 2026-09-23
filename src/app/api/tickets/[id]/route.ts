import { apiError } from "@/lib/server/api-error";
import { getTicket, updateTicket } from "@/lib/server/ticket-service";

export const dynamic = "force-static";

type RouteContext = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return [{ id: "_" }];
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const ticket = await getTicket(id);
    if (!ticket) return Response.json({ error: "Ticket not found" }, { status: 404 });
    return Response.json(ticket);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const ticket = await updateTicket(id, await request.json());
    if (!ticket) return Response.json({ error: "Ticket not found" }, { status: 404 });
    return Response.json(ticket);
  } catch (error) {
    return apiError(error);
  }
}