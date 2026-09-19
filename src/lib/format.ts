import { TODAY } from "@/lib/mock";

const dayMs = 86_400_000;

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

/** Whole days from today — negative is in the past. */
export function daysFrom(iso: string) {
  return Math.round((startOfDay(new Date(iso)).getTime() - TODAY.getTime()) / dayMs);
}

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "Today", "Tomorrow", "3 Oct" — the form a person would actually say. */
export function formatDueDate(iso: string) {
  const offset = daysFrom(iso);
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  if (offset === -1) return "Yesterday";
  const date = new Date(iso);
  return date.getFullYear() === TODAY.getFullYear()
    ? shortDate.format(date)
    : longDate.format(date);
}

/** "2h ago", "3d ago", "12 Aug" — for activity timestamps. */
export function formatRelative(iso: string) {
  const then = new Date(iso);
  const minutes = Math.round((Date.now() - then.getTime()) / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return then.getFullYear() === TODAY.getFullYear()
    ? shortDate.format(then)
    : longDate.format(then);
}

export function formatDate(iso: string) {
  return longDate.format(new Date(iso));
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
