import { tickets } from "@/lib/mock";

/**
 * Swapped in for `route.ts` only when building the GitHub Pages static
 * export (see scripts/prepare-pages-build.mjs). There is no Postgres to
 * page through, so this serves the whole seeded dataset as a single
 * unpaginated response — the client's cursor loop stops the moment
 * `nextCursor` comes back null. POST is dropped entirely: there is no
 * server to accept a write, and `output: "export"` only supports GET.
 */
export const dynamic = "force-static";

export async function GET() {
  return Response.json({ data: tickets, nextCursor: null });
}
