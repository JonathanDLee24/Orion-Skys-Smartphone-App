export const DEFAULT_EVENT_DETAILS = {
  id: 'DSO-EVT-261114',
  title: 'Apex Global Summit',
  status: 'CONFIRMED',
  date: 'Sat, 14 Nov 2026',
  time: '8:00 PM',
  timeZone: 'SGT (UTC+8)',
  duration: '10-minute show',
  venue: 'Marina Bay Event Deck',
  address: '10 Bayfront Avenue, Singapore 018956',
  droneCount: 200,
  choreography: 'custom choreography',
  client: 'Apex Global Corp.',
  briefDue: '24 Oct 2026',
};

function formatDroneCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : DEFAULT_EVENT_DETAILS.droneCount;
}

export function getEventDetails(submission = {}) {
  return {
    ...DEFAULT_EVENT_DETAILS,
    id: submission.reference || submission.id || DEFAULT_EVENT_DETAILS.id,
    title: submission.eventName || DEFAULT_EVENT_DETAILS.title,
    date: submission.displayDate || DEFAULT_EVENT_DETAILS.date,
    time: submission.timeSlot || DEFAULT_EVENT_DETAILS.time,
    timeZone: submission.timeZoneLabel || submission.timeZone || DEFAULT_EVENT_DETAILS.timeZone,
    venue: submission.venueName || DEFAULT_EVENT_DETAILS.venue,
    address: [submission.streetAddress, submission.city, submission.postalCode]
      .filter(Boolean)
      .join(', ') || DEFAULT_EVENT_DETAILS.address,
    droneCount: formatDroneCount(submission.droneCount),
    duration: submission.durationMinutes ? `${submission.durationMinutes}-minute show` : DEFAULT_EVENT_DETAILS.duration,
    status: submission.status === 'cancelled' ? 'CANCELLED' : DEFAULT_EVENT_DETAILS.status,
  };
}
