import { CalendarView } from "@/components/calendar/calendar-view";
import { PageHeader } from "@/components/shell/page-header";

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendar" />
      <CalendarView />
    </>
  );
}
