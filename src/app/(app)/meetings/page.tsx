import { Suspense } from "react";

import { MeetingsView } from "@/components/meetings/meetings-view";

export default function MeetingsPage() {
  return (
    <Suspense fallback={null}>
      <MeetingsView />
    </Suspense>
  );
}
