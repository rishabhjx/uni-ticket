import { BoardsView } from "@/components/boards/boards-view";
import { PageHeader } from "@/components/shell/page-header";

export default function BoardsPage() {
  return (
    <>
      <PageHeader title="Boards" />
      <BoardsView />
    </>
  );
}
