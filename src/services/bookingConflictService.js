import { MONTH_SHORT, WEEKDAY_NAMES, formatTimeSlot, parseDateKey, toDateKey } from '../utils/bookingCalendar';

export const DATE_CONFLICT = 'DATE_CONFLICT';
export const CANCELLED_STATUS = 'cancelled';

const ISO_START = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{1,2}):(\d{2}))?/;

// Temporary local ledger of submitted requests. It stands in for
// POST /api/bookings: the server will own date locking once the backend exists.
export const bookingSubmissions = [];

// Shows run once per day, so the request reference stays date + time to keep
// every queued request distinct even though the date itself is exclusive.
function submissionReference(date, timeSlot) {
  const datePart = String(date).replace(/-/g, '');
  const match = String(timeSlot).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return `REQ-${datePart}`;
  const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return `REQ-${datePart}-${String(hour).padStart(2, '0')}${match[2]}`;
}

// Minutes after midnight, so a same-date list sorts 12:00 AM before 1:00 AM.
function slotMinutes(timeSlot) {
  const match = String(timeSlot).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return hour * 60 + Number(match[2]);
}

function compareSubmissions(first, second) {
  if (first.date !== second.date) return first.date < second.date ? -1 : 1;
  return slotMinutes(first.timeSlot) - slotMinutes(second.timeSlot);
}

function isActive(submission) {
  return submission.status !== CANCELLED_STATUS;
}

// A date can only be claimed once. Re-sending the same booking is idempotent so
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

  const existing = getSubmissionForDate(date);
  if (existing) {
    if (booking.id != null && existing.bookingId === booking.id) {
      return { ok: true, submission: existing, repeated: true };
    }
    return {
      ok: false,
      error: {
        code: DATE_CONFLICT,
        message: 'DATE NO LONGER AVAILABLE',
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
    streetAddress: booking.streetAddress ?? null,
    city: booking.city ?? null,
    postalCode: booking.postalCode ?? null,
    date,
    timeSlot,
    timeZone: booking.timeZone ?? null,
    timeZoneLabel: booking.timeZoneLabel ?? null,
    droneCount: booking.droneCount ?? null,
    durationMinutes: booking.durationMinutes ?? null,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
  bookingSubmissions.push(submission);
  return { ok: true, submission };
}

// Active bookings only; cancelled records stay in the session ledger but no
// longer hold their date or appear on the dashboard.
export function getBookingSubmissions() {
  return bookingSubmissions.filter(isActive);
}

// Chronological list for the employee dashboard and other read-only views.
export function getScheduledSubmissions() {
  return getBookingSubmissions().sort(compareSubmissions);
}

export function getNextScheduledSubmission(today = new Date()) {
  const todayKey = toDateKey(today);
  return getScheduledSubmissions().find((submission) => submission.date >= todayKey) || null;
}

// Calendar keys for dates that already have a show, so the picker can block them.
export function getBookedDateKeys() {
  return [...new Set(getBookingSubmissions().map((submission) => submission.date))];
}

export function getSubmissionForDate(date) {
  if (!date) return null;
  return getBookingSubmissions().find((submission) => submission.date === date) || null;
}

export function getSubmissionById(id) {
  if (!id) return null;
  return bookingSubmissions.find((submission) => submission.id === id) || null;
}

export function isBookingDateTaken(date) {
  return Boolean(getSubmissionForDate(date));
}

// Cancelling releases the date for a new request while keeping the record for
// the rest of the session so the UI can show what was cancelled.
export function cancelBookingSubmission(id) {
  const submission = getSubmissionById(id);
  if (!submission || !isActive(submission)) return null;
  submission.status = CANCELLED_STATUS;
  submission.cancelledAt = new Date().toISOString();
  return submission;
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
