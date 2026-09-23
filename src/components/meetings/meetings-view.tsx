"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { CalendarView } from "@/components/meetings/calendar-view";
import { MeetingDetailDialog } from "@/components/meetings/meeting-detail-dialog";
import { ScheduleDialog } from "@/components/meetings/schedule-dialog";
import { PageHeader } from "@/components/shell/page-header";
import { useMeetingsStore } from "@/lib/store/meetings-store";

export function MeetingsView() {
  const { meetings } = useMeetingsStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [scheduleOpen, setScheduleOpen] = React.useState(false);

  // The open meeting lives in the URL, the same way the ticket panel does —
  // so a Connections row elsewhere in the workspace can deep-link straight
  // to it, and this component never needs to keep its own copy in sync.
  const detailId = params.get("open");
  const openDetail = (id: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("open", id);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const closeDetail = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("open");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Calendar"
        actions={
          <button
            type="button"
            onClick={() => setScheduleOpen(true)}
            className="flex h-7 items-center gap-1.5 rounded-md bg-accent-600 px-2.5 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            New meeting
          </button>
        }
      />

      <CalendarView meetings={meetings} onOpenDetail={openDetail} />

      <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
      <MeetingDetailDialog meetingId={detailId} onClose={closeDetail} />
    </div>
  );
}
