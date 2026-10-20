import { DEFAULT_TIME_ZONE, formatTimeZoneName } from './timeZones';

export const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTH_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const WEEKS_PER_GRID = 6;
const DAYS_PER_WEEK = 7;
const HOURS_PER_DAY = 24;


export function startOfDay(value = new Date()) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(first, second) {
  return !!first && !!second
    && first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

// Operations do not schedule shows on Sundays, and past dates cannot be booked.
export function isDateBookable(date, today = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  if (startOfDay(date).getTime() < startOfDay(today).getTime()) return false;
  return date.getDay() !== 0;
}

export function buildMonthGrid(year, month, today = new Date()) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < WEEKS_PER_GRID * DAYS_PER_WEEK; index += 1) {
    const date = new Date(year, month, index - startOffset + 1);
    const inMonth = date.getMonth() === month && date.getFullYear() === year;
    cells.push({
      date,
      day: date.getDate(),
      inMonth,
      available: inMonth && isDateBookable(date, today),
    });
  }

  return cells;
}

export function chunkIntoWeeks(cells) {
  const weeks = [];
  for (let index = 0; index < cells.length; index += DAYS_PER_WEEK) {
    weeks.push(cells.slice(index, index + DAYS_PER_WEEK));
  }
  return weeks;
}

export function formatMonthYear(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatSelectedDate(date, timeZone = DEFAULT_TIME_ZONE) {
  return `${WEEKDAY_SHORT[date.getDay()]}, ${date.getDate()} ${MONTH_SHORT[date.getMonth()]} // ${formatTimeZoneName(date, timeZone)}`;
}

export function formatTimeSlot(hour) {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${suffix}`;
}

// Twenty-four hourly requests so shows can be scheduled around the clock.
export function buildTimeSlots() {
  return Array.from({ length: HOURS_PER_DAY }, (_, hour) => ({
    value: formatTimeSlot(hour),
    hour,
    testID: `time-slot-${String(hour).padStart(2, '0')}00`,
  }));
}

export function formatAccessibleDate(date) {
  return `${WEEKDAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function toDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseDateKey(key) {
  const [year, month, day] = String(key).split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}
