import { Suspense } from "react";

import { RowsSkeleton } from "@/components/shared/skeletons";
import { ResolvedRoute } from "@/components/shell/not-found-router";

/**
 * Inside the app layout the shell and the store already exist, so this renders
 * the resolved view on its own — mounting a second shell would nest the whole
 * chrome inside itself.
 */
export default function AppNotFound() {
  return (
    <Suspense fallback={<RowsSkeleton rows={10} />}>
      <ResolvedRoute />
    </Suspense>
  );
}
