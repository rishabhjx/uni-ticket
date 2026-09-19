import { PageHeader } from "@/components/shell/page-header";
import { Placeholder } from "@/components/shell/placeholder";

export default function MyTicketsPage() {
  return (
    <>
      <PageHeader title="My tickets" />
      <Placeholder step="step 7">Everything assigned to me, across projects</Placeholder>
    </>
  );
}
