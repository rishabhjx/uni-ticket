import { apiError } from "@/lib/server/api-error";
import { listWorkspaces } from "@/lib/server/ticket-service";

export async function GET() {
  try {
    return Response.json(await listWorkspaces());
  } catch (error) {
    return apiError(error);
  }
}