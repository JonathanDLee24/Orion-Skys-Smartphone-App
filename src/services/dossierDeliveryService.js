// Session-only preview data. Replace this service with the event/email API when
// a mail provider and durable event records are available.
const eventRecords = {};

export function recordDossierDelivery(eventId, delivery) {
  if (!eventId || !delivery?.id || !Array.isArray(delivery.recipients)) throw new Error('Invalid delivery record.');
  const record = eventRecords[eventId] || { id: eventId, emailHistory: [] };
  const entry = { ...delivery, recipients: delivery.recipients.map((recipient) => ({ ...recipient })) };
  const index = record.emailHistory.findIndex((item) => item.id === entry.id);
  if (index === -1) record.emailHistory.unshift(entry);
  else record.emailHistory[index] = entry;
  eventRecords[eventId] = record;
  return entry;
}

export async function fetchEventEmailHistory(eventId) {
  return (eventRecords[eventId]?.emailHistory || []).map((entry) => ({
    ...entry, recipients: entry.recipients.map((recipient) => ({ ...recipient })),
  }));
}

export async function fetchDossierDelivery(eventId, deliveryId) {
  const history = await fetchEventEmailHistory(eventId);
  return history.find((entry) => entry.id === deliveryId) || null;
}

export function clearDossierDeliverySession() {
  Object.keys(eventRecords).forEach((key) => delete eventRecords[key]);
}

export function createPreviewDelivery(eventId) {
  const delivery = {
    id: `preview-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sentAt: new Date().toISOString(),
    preview: true,
    recipients: [
      { type: 'To', email: 'client@example.com', status: 'Success' },
      { type: 'CC', email: 'operations@example.com', status: 'Opened' },
      { type: 'BCC', email: 'archive@example.com', status: 'Bounced' },
    ],
  };
  return recordDossierDelivery(eventId, delivery);
}