/**
 * Swapped in for `route.ts` only when building the GitHub Pages static
 * export (see scripts/prepare-pages-build.mjs) — there is no server there to
 * run a live database check against, so this pre-renders a fixed response
 * instead. `dynamic` has to be a literal for `output: "export"` to accept
 * it, which is why this is a separate file rather than an env branch inside
 * the real one.
 */
export const dynamic = "force-static";

export async function GET() {
  return Response.json({ ok: true, service: "uni-ticket", note: "static export — no backend" });
}
