import {
  bookingSubmissions,
  CANCELLED_STATUS,
  getSubmissionById,
  getSubmissionForDate,
} from './bookingConflictService';
import { getTimeZoneLabel } from '../utils/timeZones';

// Demo shows stand in for the account schedule API until the backend exists.
// They are seeded into the same session ledger as submitted bookings so the
// dashboard, events feed and manage screen all read one source of truth.
const SINGAPORE_TIME_ZONE = {
  timeZone: 'Asia/Singapore',
  timeZoneLabel: getTimeZoneLabel('Asia/Singapore'),
};

export const DEMO_EVENTS = [
  {
    id: 'demo-apex-summit',
    reference: 'REQ-20261114-2000',
    bookingId: 'demo-apex-summit',
    eventName: 'Apex Global Summit',
    date: '2026-11-14',
    timeSlot: '8:00 PM',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
    droneCount: 200,
    durationMinutes: 10,
    status: 'confirmed',
    submittedAt: '2026-10-20T09:00:00.000Z',
    ...SINGAPORE_TIME_ZONE,
  },
  {
    id: 'demo-apex-partner-night',
    reference: 'REQ-20261212-2030',
    bookingId: 'demo-apex-partner-night',
    eventName: 'Apex Partner Night',
    date: '2026-12-12',
    timeSlot: '8:30 PM',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
    droneCount: 180,
    durationMinutes: 12,
    status: 'confirmed',
    submittedAt: '2026-10-22T09:00:00.000Z',
    ...SINGAPORE_TIME_ZONE,
  },
  {
    id: 'demo-apex-product-launch',
    reference: 'REQ-20261205-2000',
    bookingId: 'demo-apex-product-launch',
    eventName: 'Apex Product Launch',
    date: '2026-12-05',
    timeSlot: '8:00 PM',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
    droneCount: 150,
    durationMinutes: 8,
    status: 'pending',
    submittedAt: '2026-10-24T09:00:00.000Z',
    ...SINGAPORE_TIME_ZONE,
  },
  {
    id: 'demo-apex-summer-showcase',
    reference: 'REQ-20260822-2100',
    bookingId: 'demo-apex-summer-showcase',
    eventName: 'Apex Summer Showcase',
    date: '2026-08-22',
    timeSlot: '9:00 PM',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
    droneCount: 120,
    durationMinutes: 10,
    status: 'completed',
    submittedAt: '2026-07-01T09:00:00.000Z',
    ...SINGAPORE_TIME_ZONE,
  },
];

// The employee portal features this show as the next scheduled show.
export const FEATURED_DEMO_EVENT_ID = 'demo-apex-summit';

// The featured show from the session ledger, unless it was never seeded or has
// since been cancelled.
export function getFeaturedDemoEvent() {
  const event = getSubmissionById(FEATURED_DEMO_EVENT_ID);
  return event && event.status !== CANCELLED_STATUS ? event : null;
}

// One show per day: a demo record never replaces a real booking that already
// claimed its date, and re-mounting the feed cannot add duplicates.
export function seedDemoEvents() {
  let seeded = 0;
  DEMO_EVENTS.forEach((event) => {
    if (getSubmissionById(event.id) || getSubmissionForDate(event.date)) return;
    bookingSubmissions.push({ ...event });
    seeded += 1;
  });
  return seeded;
}
