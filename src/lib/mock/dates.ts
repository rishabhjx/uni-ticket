/**
 * Every date in the dataset is expressed as a day offset from today, so the
 * prototype stays fresh whenever it runs: things are overdue, due this week,
 * and updated recently regardless of the date.
 *
 * The anchor is midnight on the build date, which next.config.ts resolves once
 * and inlines into both bundles, so prerendered HTML and hydration agree.
 */
function startOfToday() {
  const stamped = process.env.NEXT_PUBLIC_BUILD_DATE;
  if (stamped) {
    const [year, month, day] = stamped.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export const TODAY = startOfToday();

export function daysFromToday(days: number, minutesIntoDay = 0) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() + days);
  date.setMinutes(date.getMinutes() + minutesIntoDay);
  return date;
}

export function isoDaysAgo(days: number, minutesIntoDay = 0) {
  return daysFromToday(-days, minutesIntoDay).toISOString();
}

export function startOfWeek(reference: Date = TODAY) {
  const date = new Date(reference);
  // Monday-first.
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return date;
}

export function addDays(reference: Date, delta: number) {
  const date = new Date(reference);
  date.setDate(date.getDate() + delta);
  return date;
}

export function startOfDay(reference: Date) {
  return new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  );
}

/** The Monday-first week `anchor` falls in, as seven dates. */
export function weekDays(anchor: Date) {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function startOfMonth(reference: Date) {
  return new Date(reference.getFullYear(), reference.getMonth(), 1);
}

export function addMonths(reference: Date, delta: number) {
  return new Date(reference.getFullYear(), reference.getMonth() + delta, 1);
}

/**
 * Six Monday-first weeks, the way every month-grid calendar draws itself:
 * a fixed 42 cells so switching months never changes the grid's height.
 */
export function monthGridDays(monthAnchor: Date) {
  const gridStart = startOfWeek(startOfMonth(monthAnchor));
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(date.getDate() + index);
    return date;
  });
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
