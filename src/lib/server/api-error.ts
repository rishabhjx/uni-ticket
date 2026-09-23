import { Prisma } from "@prisma/client";
import { z } from "zod";

export function apiError(error: unknown) {
  if (error instanceof z.ZodError) {
    return Response.json(
      { error: "Invalid request", details: error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return Response.json({ error: "Database request failed" }, { status: 409 });
  }
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}