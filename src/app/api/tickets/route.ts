import { apiError } from "@/lib/server/api-error";
import { createTicket, listTickets } from "@/lib/server/ticket-service";

export const dynamic = "force-static";

export async function GET(request: Request) {
  try {
    return Response.json(await listTickets(new URL(request.url).searchParams));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ticket = await createTicket(await request.json());
    if (!ticket) return Response.json({ error: "Project not found" }, { status: 404 });
    return Response.json(ticket, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}