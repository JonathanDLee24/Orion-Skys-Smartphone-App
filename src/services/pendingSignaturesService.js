// Placeholder sign-off data for now; signers and their statuses will load per
// show once the compliance service exists.
export const SIGNATURE_STATUS = {
  SIGNED: 'signed',
  PENDING: 'pending',
  OVERDUE: 'overdue',
};

export const REQUIRED_SIGNERS = [
  {
    id: 'signer-sarah-chen',
    name: 'Sarah Chen',
    role: 'VP of Operations',
    organization: 'Client',
    email: 'sarah.chen@client.example.com',
    status: SIGNATURE_STATUS.SIGNED,
  },
  {
    id: 'signer-marcus-vance',
    name: 'Capt. Marcus Vance',
    role: 'Pilot-in-Command',
    organization: 'Orion Skys',
    email: 'marcus.vance@orionskys.example.com',
    status: SIGNATURE_STATUS.PENDING,
  },
  {
    id: 'signer-evelyn-ross',
    name: 'Evelyn Ross',
    role: 'FAA Flight Liaison',
    organization: 'FAA',
    email: 'evelyn.ross@faa.example.com',
    status: SIGNATURE_STATUS.OVERDUE,
  },
];

// Placeholder time left before the flight window locks.
export const FLIGHT_WINDOW_LOCK = { days: 2, hours: 14, minutes: 32 };

export function getRequiredSigners() {
  return REQUIRED_SIGNERS;
}

export function getFlightWindowLock() {
  return FLIGHT_WINDOW_LOCK;
}

export function formatTimeline({ days, hours, minutes }) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m`;
}

export function needsReminder(signer) {
  return signer.status === SIGNATURE_STATUS.PENDING || signer.status === SIGNATURE_STATUS.OVERDUE;
}

// The most serious status in the list: overdue, then pending, then signed.
export function getOverallSignatureStatus(signers) {
  if (signers.some((signer) => signer.status === SIGNATURE_STATUS.OVERDUE)) return SIGNATURE_STATUS.OVERDUE;
  if (signers.some((signer) => signer.status === SIGNATURE_STATUS.PENDING)) return SIGNATURE_STATUS.PENDING;
  return SIGNATURE_STATUS.SIGNED;
}

// Placeholder for re-sending the signature request; returns where and when it
// was sent.
export function resendSignatureRequest(signer, sentAt = new Date()) {
  return { signerId: signer.id, email: signer.email, sentAt: sentAt.toISOString() };
}
