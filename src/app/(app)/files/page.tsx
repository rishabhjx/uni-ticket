import { Suspense } from "react";

import { FilesView } from "@/components/files/files-view";

export default function FilesPage() {
  return (
    <Suspense fallback={null}>
      <FilesView />
    </Suspense>
  );
}
