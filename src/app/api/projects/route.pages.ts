import { projects } from "@/lib/mock";

/**
 * Swapped in for `route.ts` only when building the GitHub Pages static
 * export (see scripts/prepare-pages-build.mjs) — there is no Postgres there
 * to query, so this serves the same seeded dataset the rest of the
 * prototype falls back to.
 */
export const dynamic = "force-static";

export async function GET() {
  return Response.json(projects);
}
