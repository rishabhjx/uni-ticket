import {
  Briefcase,
  ClipboardList,
  Presentation,
  RefreshCw,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { MeetingKind } from "@/lib/mock";

export const MEETING_KIND_ICON: Record<MeetingKind, LucideIcon> = {
  standup: Users,
  review: Presentation,
  planning: ClipboardList,
  one_on_one: UserRound,
  sync: RefreshCw,
  interview: Briefcase,
};

export const MEETING_KIND_LABEL: Record<MeetingKind, string> = {
  standup: "Standup",
  review: "Review",
  planning: "Planning",
  one_on_one: "1:1",
  sync: "Sync",
  interview: "Interview",
};
