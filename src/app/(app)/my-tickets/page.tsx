import { Suspense } from "react";

import { MyTicketsView } from "@/components/list/my-tickets-view";
import { PageHeader } from "@/components/shell/page-header";
import { RowsSkeleton } from "@/components/shared/skeletons";

export default function MyTicketsPage() {
  return (
    <>
      <PageHeader title="My tickets" />
      {/* useSearchParams needs a boundary, and this doubles as the fallback. */}
      <Suspense fallback={<RowsSkeleton rows={12} />}>
        <MyTicketsView />
      </Suspense>
    </>
  );
}
