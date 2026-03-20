/**
 * Get the Monday of the week containing the given date.
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns an array of 7 date strings (YYYY-MM-DD) starting from the given Monday.
 */
export function getWeekDates(startDate: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(formatISO(d));
  }
  return dates;
}

/**
 * Formats a date as a human-readable header, e.g. "Mon 3/19".
 */
export function formatDateHeader(date: string): string {
  const d = new Date(date + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * Returns true if the given date string is today.
 */
export function isToday(date: string): boolean {
  return date === formatISO(new Date());
}

/**
 * Add (or subtract) weeks from a date.
 */
export function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

/**
 * Format a Date as YYYY-MM-DD.
 */
function formatISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
