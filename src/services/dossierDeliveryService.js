// Session-only preview data. Replace this service with the event/email API when
// a mail provider and durable event records are available.
const eventRecords = {};

function getEventRecord(eventId) {
  if (!eventRecords[eventId]) eventRecords[eventId] = { id: eventId, emailHistory: [], auditLog: [] };
  return eventRecords[eventId];
}

export function recordDossierDelivery(eventId, delivery) {
  if (!eventId || !delivery?.id || !Array.isArray(delivery.recipients)) throw new Error('Invalid delivery record.');
  const record = getEventRecord(eventId);
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

// ---- Dispatch override ---------------------------------------------------

// Any recipient can be re-sent to. Failed ones must get a new address, since
// re-sending to the same one would fail again.
export const FAILED_DELIVERY_STATUSES = ['Bounced', 'Failed'];

export function isFailedRecipient(recipient) {
  return FAILED_DELIVERY_STATUSES.includes(recipient?.status);
}

export const OVERRIDE_REASONS = [
  { value: 'bounced', label: 'Address bounced' },
  { value: 'wrongRecipient', label: 'Wrong recipient on file' },
  { value: 'clientRequest', label: 'Client requested a new address' },
  { value: 'resendRequest', label: 'Recipient asked for another copy' },
  { value: 'other', label: 'Other' },
];

export const MIN_OVERRIDE_NOTES_LENGTH = 10;

// Who is recorded in the audit log until admin sessions carry a real identity.
export const DEFAULT_OVERRIDE_ADMIN = 'Admin';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value || '').trim());
}

// Returns { email?, reason?, notes? } messages; an empty object means valid.
// previousFailed: the recipient's last delivery failed, so the same address is not allowed.
export function validateDispatchOverride({ email, reason, notes, previousEmail, previousFailed = false } = {}) {
  const errors = {};
  const trimmedEmail = String(email || '').trim();
  if (!trimmedEmail) errors.email = 'Enter the destination email.';
  else if (!isValidEmail(trimmedEmail)) errors.email = 'Enter a valid email address, like name@example.com.';
  else if (previousFailed && previousEmail && trimmedEmail.toLowerCase() === previousEmail.toLowerCase()) errors.email = 'Enter a different address from the one that failed.';
  if (!OVERRIDE_REASONS.some((option) => option.value === reason)) errors.reason = 'Choose a reason for the override.';
  const trimmedNotes = String(notes || '').trim();
  if (!trimmedNotes) errors.notes = 'Explain why this override is needed.';
  else if (trimmedNotes.length < MIN_OVERRIDE_NOTES_LENGTH) errors.notes = `Write at least ${MIN_OVERRIDE_NOTES_LENGTH} characters.`;
  return errors;
}

export function getOverrideReasonLabel(reason) {
  return OVERRIDE_REASONS.find((option) => option.value === reason)?.label || reason;
}

// Re-sends the dossier to one recipient on the delivery, optionally replacing
// their address, and records the override in the event's audit log.
// Placeholder: no email is sent; the new recipient's status is simulated.
export async function resendDossierOverride(eventId, deliveryId, {
  recipientIndex, email, reason, notes, admin = DEFAULT_OVERRIDE_ADMIN, at = new Date(),
} = {}) {
  const record = getEventRecord(eventId);
  const delivery = record.emailHistory.find((entry) => entry.id === deliveryId);
  if (!delivery) throw new Error('Delivery record not found.');
  const previous = delivery.recipients[recipientIndex];
  if (!previous) throw new Error('Recipient not found on this delivery.');
  const errors = validateDispatchOverride({ email, reason, notes, previousEmail: previous.email, previousFailed: isFailedRecipient(previous) });
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);

  const timestamp = at.toISOString();
  const newEmail = email.trim();
  const addressChanged = newEmail.toLowerCase() !== previous.email.toLowerCase();
  // Keep the address that was first replaced, so repeated resends still show the original.
  let replacedEmail = addressChanged ? (previous.replacedEmail || previous.email) : previous.replacedEmail;
  if (replacedEmail && replacedEmail.toLowerCase() === newEmail.toLowerCase()) replacedEmail = undefined;
  const recipients = delivery.recipients.map((recipient, index) => (index === recipientIndex
    ? { type: recipient.type, email: newEmail, status: 'Resent', resentAt: timestamp, ...(replacedEmail ? { replacedEmail } : {}) }
    : recipient));
  const updated = recordDossierDelivery(eventId, { ...delivery, recipients });

  const auditEntry = {
    id: `override-${record.auditLog.length + 1}-${at.getTime()}`,
    action: 'DISPATCH_OVERRIDE',
    deliveryId,
    admin,
    reason,
    notes: notes.trim(),
    recipientType: previous.type,
    previousRecipient: previous.email,
    previousStatus: previous.status,
    newRecipient: newEmail,
    at: timestamp,
    preview: Boolean(delivery.preview),
  };
  record.auditLog.unshift(auditEntry);
  return { delivery: updated, auditEntry: { ...auditEntry } };
}

// Newest first. Pass a deliveryId to see only that delivery's entries.
export async function fetchEventAuditLog(eventId, deliveryId) {
  const log = eventRecords[eventId]?.auditLog || [];
  return log.filter((entry) => !deliveryId || entry.deliveryId === deliveryId).map((entry) => ({ ...entry }));
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