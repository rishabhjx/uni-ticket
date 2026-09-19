import { OverviewView } from "@/components/overview/overview-view";
import { PageHeader } from "@/components/shell/page-header";

export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Overview" />
      <OverviewView />
    </>
  );
}
