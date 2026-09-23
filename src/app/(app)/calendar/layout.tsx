import { CalendarStoreProvider } from "@/lib/store/calendar-store";

export default function CalendarSectionLayout({ children }: { children: React.ReactNode }) {
  return <CalendarStoreProvider>{children}</CalendarStoreProvider>;
}
