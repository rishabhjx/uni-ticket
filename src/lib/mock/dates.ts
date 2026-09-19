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
