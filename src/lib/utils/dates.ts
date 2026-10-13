import { BUSINESS_TIMEZONE } from '@/lib/constants/schedule';

/**
 * Format a UTC timestamptz for display in Melbourne local time.
 */
export function formatInMelbourne(
  utcDate: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: BUSINESS_TIMEZONE,
    ...options,
  }).format(date);
}

export function formatBookingDate(utcDate: string): string {
  return formatInMelbourne(utcDate, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatBookingTime(utcDate: string): string {
  return formatInMelbourne(utcDate, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Generate Melbourne-local date strings for the next N days.
 * Returns YYYY-MM-DD strings.
 */
export function getNextDates(count: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  const melbToday = new Date(
    now.toLocaleDateString('en-CA', { timeZone: BUSINESS_TIMEZONE })
  );

  for (let i = 0; i < count; i++) {
    const d = new Date(melbToday);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  return dates;
}

/**
 * Format a date string (YYYY-MM-DD) for display in Melbourne locale.
 */
export function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}