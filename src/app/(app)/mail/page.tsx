import { Suspense } from "react";

import { MailView } from "@/components/mail/mail-view";

export default function MailPage() {
  return (
    <Suspense fallback={null}>
      <MailView />
    </Suspense>
  );
}
