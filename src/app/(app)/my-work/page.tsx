import { PageHeader } from "@/components/shell/page-header";
import { MyWorkView } from "@/components/work/my-work-view";

export default function MyWorkPage() {
  return (
    <>
      <PageHeader title="My work" />
      <MyWorkView />
    </>
  );
}
