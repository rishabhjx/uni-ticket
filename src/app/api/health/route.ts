import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-static";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, service: "uni-ticket", timestamp: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false, service: "uni-ticket" }, { status: 503 });
  }
}