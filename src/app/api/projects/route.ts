import { apiError } from "@/lib/server/api-error";
import { listProjects } from "@/lib/server/ticket-service";

export async function GET() {
  try {
    return Response.json(await listProjects());
  } catch (error) {
    return apiError(error);
  }
}