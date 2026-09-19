import { HomeView } from "@/components/home/home-view";
import { PageHeader } from "@/components/shell/page-header";

export default function HomePage() {
  return (
    <>
      <PageHeader title="Home" />
      <HomeView />
    </>
  );
}
