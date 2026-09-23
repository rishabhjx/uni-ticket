// GitHub Pages serves a static export with no server and no Postgres behind
// it, so the Postgres-backed API routes can't ship as-is: `output: "export"`
// only supports GET, and every GET has to be statically renderable — a live
// database query never is. This runs before the static build compiles them:
//
// - Routes with a `route.pages.ts` sibling get that swapped over the real
//   `route.ts` — a static, seed-data-only implementation.
// - `tickets/[id]` is dropped entirely: nothing in the client ever calls its
//   GET (a ticket is found in the in-memory store by key, not fetched by
//   id), and a static export can't hold both `/api/tickets` and
//   `/api/tickets/<id>` anyway — a route handler's output is a flat file,
//   not a directory with an index like a page's, so the two collide.
//
// A no-op when GITHUB_PAGES isn't set, so `npm run build` stays the same
// command for local dev, Node production, and CI.
import { copyFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const routeDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "app", "api");

const staticRoutes = ["health", "workspaces", "projects", "tickets"];
const droppedRoutes = ["tickets/[id]"];

if (process.env.GITHUB_PAGES === "true") {
  for (const route of staticRoutes) {
    const staticSource = join(routeDir, route, "route.pages.ts");
    const target = join(routeDir, route, "route.ts");
    if (!existsSync(staticSource)) {
      throw new Error(`Missing static route for GitHub Pages build: ${staticSource}`);
    }
    copyFileSync(staticSource, target);
  }
  for (const route of droppedRoutes) {
    rmSync(join(routeDir, route, "route.ts"));
  }
  console.log(
    `Swapped ${staticRoutes.length} API route(s) and dropped ${droppedRoutes.length} for the static export.`,
  );
}
