import { Suspense } from "react";

import { AppShellSkeleton } from "@/components/shared/skeletons";
import { NotFoundRouter } from "@/components/shell/not-found-router";

/**
 * A project created at runtime has no prerendered route, and a static host
 * cannot generate one — so it serves this page instead. Rather than a dead
 * end, it resolves the path against the store and renders the right view.
 */
export default function NotFound() {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <NotFoundRouter />
    </Suspense>
  );
}
