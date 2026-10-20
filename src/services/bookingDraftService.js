export const DEFAULT_BOOKING_DRAFT = {
  date: '2026-11-21',
  timeSlot: '8:00 PM',
  venueName: 'Marina Bay Event Deck',
  streetAddress: '10 Bayfront Avenue',
  city: 'Singapore',
  postalCode: '018956',
  timeZone: 'America/Los_Angeles',
};

// Session-only cache. Replace with POST /api/bookings when the backend exists.
export const bookingSession = {
  bookings: [],
};

export const REQUIRED_VENUE_FIELDS = ['venueName', 'streetAddress', 'city', 'postalCode'];

export function validateVenueDetails(details = {}) {
  return REQUIRED_VENUE_FIELDS.reduce((errors, field) => {
    if (!String(details[field] ?? '').trim()) errors[field] = 'Required';
    return errors;
  }, {});
}

export function isVenueDetailsComplete(details) {
  return Object.keys(validateVenueDetails(details)).length === 0;
}

export function saveBookingDraft(draft) {
  const record = {
    id: `booking-${Date.now()}-${bookingSession.bookings.length + 1}`,
    ...draft,
    venueName: String(draft.venueName).trim(),
    streetAddress: String(draft.streetAddress).trim(),
    city: String(draft.city).trim(),
    postalCode: String(draft.postalCode).trim(),
    status: 'review',
    savedAt: new Date().toISOString(),
  };
  bookingSession.bookings.push(record);
  return record;
}

export function getLatestBookingDraft() {
  return bookingSession.bookings[bookingSession.bookings.length - 1] || null;
}

export function clearBookingSession() {
  bookingSession.bookings.length = 0;
}
