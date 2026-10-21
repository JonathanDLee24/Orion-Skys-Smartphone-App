import { MONTH_SHORT, WEEKDAY_NAMES, formatTimeSlot, parseDateKey } from '../utils/bookingCalendar';

export const TIME_SLOT_CONFLICT = 'TIME_SLOT_CONFLICT';

const ISO_START = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{1,2}):(\d{2}))?/;

// Temporary local ledger of submitted requests. It stands in for
// POST /api/bookings: the server will own slot locking once the backend exists.
export const bookingSubmissions = [];

function slotKey(date, timeSlot) {
  return `${date} ${timeSlot}`;
}

// 24-hour reference suffix so 8:00 AM and 8:00 PM never share a reference.
function submissionReference(date, timeSlot) {
  const datePart = String(date).replace(/-/g, '');
  const match = String(timeSlot).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return `REQ-${datePart}`;
  const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return `REQ-${datePart}-${String(hour).padStart(2, '0')}${match[2]}`;
}

// A slot can only be claimed once. Re-sending the same booking is idempotent so
// a double tap cannot lock the client out of their own request.
export function requestBookingSlot(booking = {}) {
  const date = booking.date;
  const timeSlot = booking.timeSlot;

  if (!date || !timeSlot) {
    return {
      ok: false,
      error: { code: 'INVALID_SLOT', message: 'MISSING DATE OR TIME', unavailableSlot: { date, timeSlot } },
    };
  }

  const existing = getSubmissionForSlot(date, timeSlot);
  if (existing) {
    if (booking.id != null && existing.bookingId === booking.id) {
      return { ok: true, submission: existing, repeated: true };
    }
    return {
      ok: false,
      error: {
        code: TIME_SLOT_CONFLICT,
        message: 'TIME NO LONGER AVAILABLE',
        unavailableSlot: { date, timeSlot },
      },
    };
  }

  const submission = {
    id: `submission-${Date.now()}-${bookingSubmissions.length + 1}`,
    reference: submissionReference(date, timeSlot),
    bookingId: booking.id ?? null,
    eventName: booking.eventName ?? null,
    venueName: booking.venueName ?? null,
    date,
    timeSlot,
    timeZone: booking.timeZone ?? null,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
  bookingSubmissions.push(submission);
  return { ok: true, submission };
}

export function getBookingSubmissions() {
  return bookingSubmissions.slice();
}

export function getSubmissionForSlot(date, timeSlot) {
  if (!date || !timeSlot) return null;
  const key = slotKey(date, timeSlot);
  return bookingSubmissions.find((submission) => slotKey(submission.date, submission.timeSlot) === key) || null;
}

export function isBookingSlotTaken(date, timeSlot) {
  return Boolean(getSubmissionForSlot(date, timeSlot));
}

export function clearBookingSubmissions() {
  bookingSubmissions.length = 0;
}

function normalizeSlot(value, fallback) {
  if (value == null) return { date: fallback.date, timeSlot: fallback.timeSlot };

  if (typeof value === 'string') {
    const match = value.match(ISO_START);
    if (!match) return { date: fallback.date, timeSlot: value };
    return {
      date: match[1],
      timeSlot: match[2] != null ? formatTimeSlot(Number(match[2])) : fallback.timeSlot,
    };
  }

  const startsAt = value.startsAt || value.datetime || value.start;
  if (startsAt) {
    const fromStart = normalizeSlot(startsAt, fallback);
    return {
      date: value.date || fromStart.date,
      timeSlot: value.timeSlot || fromStart.timeSlot,
    };
  }

  return {
    date: value.date || value.dateKey || fallback.date,
    timeSlot: value.timeSlot || value.time || fallback.timeSlot,
  };
}


// Reads the exact signature returned by the backend, whether it arrives as an
// ISO timestamp, a string, or separate date/time fields.
export function getUnavailableSlot(conflict, fallback = {}) {
  const source = conflict?.unavailableSlot || conflict?.error?.unavailableSlot || conflict?.error || conflict;
  return normalizeSlot(source, fallback);
}

export function formatUnavailableSlot(slot = {}) {
  if (!slot.date) return slot.timeSlot || '';
  const date = parseDateKey(slot.date);
  const weekday = WEEKDAY_NAMES[date.getDay()].slice(0, 3);
  const month = MONTH_SHORT[date.getMonth()];
  const monthName = month ? month.charAt(0) + month.slice(1).toLowerCase() : '';
  const time = slot.timeSlot ? ` · ${slot.timeSlot}` : '';
  return `${weekday}, ${date.getDate()} ${monthName} ${date.getFullYear()}${time}`;
}

export function formatConflictDate(slot = {}) {
  return formatUnavailableSlot({ ...slot, timeSlot: '' });
}
