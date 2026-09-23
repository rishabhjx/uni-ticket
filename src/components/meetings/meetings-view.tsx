"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, CalendarPlus } from "lucide-react";

import { MeetingCard } from "@/components/meetings/meeting-card";
import { MeetingDetailDialog } from "@/components/meetings/meeting-detail-dialog";
import { ScheduleDialog } from "@/components/meetings/schedule-dialog";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/reui/empty";
import { PageHeader } from "@/components/shell/page-header";
import { formatDueDate } from "@/lib/format";
import { isMeetingRecentOrUpcoming } from "@/lib/mock";
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

  const upcoming = React.useMemo(
    () =>
      meetings
        .filter((meeting) => isMeetingRecentOrUpcoming(meeting))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [meetings],
  );

  const groups = React.useMemo(() => {
    const map = new Map<string, typeof upcoming>();
    for (const meeting of upcoming) {
      const label = formatDueDate(meeting.startsAt);
      const bucket = map.get(label);
      if (bucket) bucket.push(meeting);
      else map.set(label, [meeting]);
    }
    return [...map.entries()];
  }, [upcoming]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Meetings"
        actions={
          <button
            type="button"
            onClick={() => setScheduleOpen(true)}
            className="flex h-7 items-center gap-1.5 rounded-md bg-accent-600 px-2.5 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700"
          >
            <CalendarPlus className="size-3.5" strokeWidth={1.75} />
            Schedule
          </button>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <Empty className="h-full">
            <EmptyMedia variant="icon">
              <CalendarDays className="size-5 text-grey-400" strokeWidth={1.5} />
            </EmptyMedia>
            <EmptyTitle>Nothing scheduled</EmptyTitle>
            <EmptyDescription>Schedule a meeting to get started.</EmptyDescription>
          </Empty>
        ) : (
          groups.map(([label, dayMeetings]) => (
            <div key={label}>
              <h2 className="hairline-b bg-grey-50 px-4 py-1.5 text-caption font-medium tracking-[0.07em] text-grey-500 uppercase">
                {label}
              </h2>
              {dayMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} onOpenDetail={openDetail} />
              ))}
            </div>
          ))
        )}
      </div>

      <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
      <MeetingDetailDialog meetingId={detailId} onClose={closeDetail} />
    </div>
  );
}
