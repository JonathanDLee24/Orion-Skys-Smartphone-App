// OSPSA-254 — Missing equipment alert.
// The expected show manifest is compared with the serialized fleet manifest so
// missing, failed, and unverified assets can be isolated before launch. Any
// flagged asset locks show readiness until safety staff close a follow-up, and
// every alert action is written to an append-only audit trail.

export const EQUIPMENT_STATUS = {
  VERIFIED: 'VERIFIED',
  MISSING: 'MISSING',
  FAILED: 'FAILED',
  UNVERIFIED: 'UNVERIFIED',
};

export const READINESS_RULES = [
  'Every required airframe needs a serialized scan before launch.',
  'A failed airframe stays out of the launch manifest until maintenance signs off.',
  'An unverified serial number blocks launch until safety staff confirm it.',
];

const EXPECTED_EQUIPMENT = [
  { assetId: 'SF-Q-001', rfid: 'RFID: 900-11A0', label: 'Primary airframe 01', role: 'SHOW AIRFRAME', required: true, stagingArea: 'Launch pad A' },
  { assetId: 'SF-Q-002', rfid: 'RFID: 900-11A1', label: 'Primary airframe 02', role: 'SHOW AIRFRAME', required: true, stagingArea: 'Launch pad A' },
  { assetId: 'SF-Q-003', rfid: 'RFID: 900-11A2', label: 'Primary airframe 03', role: 'SHOW AIRFRAME', required: true, stagingArea: 'Launch pad B' },
  { assetId: 'SF-Q-004', rfid: 'RFID: 900-11A3', label: 'Primary airframe 04', role: 'SHOW AIRFRAME', required: true, stagingArea: 'Maintenance bay' },
  { assetId: 'SF-Q-005', rfid: 'RFID: 900-11A4', label: 'Primary airframe 05', role: 'SHOW AIRFRAME', required: true, stagingArea: 'NE sector', lastKnown: 'NE sector / Alt: 24 ft' },
  { assetId: 'SF-Q-006', rfid: 'RFID: 900-11A5', label: 'Primary airframe 06', role: 'SHOW AIRFRAME', required: true, stagingArea: 'Staging perimeter' },
];

// Snapshot of the last serialized scan for the show. SF-Q-005 is deliberately
// absent: the comparison below must catch it from the expected manifest.
const INITIAL_SERIALIZED_MANIFEST = {
  'SF-Q-001': { status: 'VERIFIED', state: 'ACTIVE', battery: '98%', lastSeen: 'Launch pad A / Pre-flight bay' },
  'SF-Q-002': { status: 'VERIFIED', state: 'ACTIVE', battery: '92%', lastSeen: 'Launch pad A / Pre-flight bay' },
  'SF-Q-003': { status: 'VERIFIED', state: 'STANDBY', battery: '45%', lastSeen: 'Launch pad B / Charging rack' },
  'SF-Q-004': {
    status: 'FAILED',
    state: 'SERVICE',
    battery: '12%',
    lastSeen: 'Maintenance bay / Cell 3',
    issue: 'Battery pack failed the pre-flight load test.',
  },
  'SF-Q-006': {
    status: 'UNVERIFIED',
    state: 'STANDBY',
    battery: '76%',
    lastSeen: 'Staging perimeter',
    issue: 'Serialized scan is waiting for safety sign-off.',
  },
};

const INITIAL_AUDIT = [
  {
    id: 'AUD-0003',
    at: '2026-11-26T22:14:00.000Z',
    assetId: 'SF-Q-005',
    action: 'FLAGGED',
    actor: 'Manifest monitor',
    note: 'Missing from the serialized scan; last telemetry NE sector at 24 ft.',
  },
  {
    id: 'AUD-0002',
    at: '2026-11-26T22:12:00.000Z',
    assetId: 'SF-Q-004',
    action: 'FLAGGED',
    actor: 'Maintenance',
    note: 'Battery pack failed the pre-flight load test.',
  },
  {
    id: 'AUD-0001',
    at: '2026-11-26T22:10:00.000Z',
    assetId: 'SF-Q-006',
    action: 'FLAGGED',
    actor: 'Manifest monitor',
    note: 'Serialized scan is waiting for safety sign-off.',
  },
];

function cloneManifest(source) {
  return Object.entries(source).reduce((next, [assetId, record]) => {
    next[assetId] = { ...record };
    return next;
  }, {});
}

let serializedManifest = cloneManifest(INITIAL_SERIALIZED_MANIFEST);
let followUps = [];
let auditTrail = INITIAL_AUDIT.map((entry) => ({ ...entry }));
let auditSequence = INITIAL_AUDIT.length;

function nextAuditId() {
  auditSequence += 1;
  return `AUD-${String(auditSequence).padStart(4, '0')}`;
}

function recordAudit(action, assetId, note, actor) {
  const entry = {
    id: nextAuditId(),
    at: new Date().toISOString(),
    assetId: assetId || null,
    action,
    actor: actor || 'Safety staff',
    note,
  };
  auditTrail = [entry, ...auditTrail];
  return entry;
}

export function resetEquipmentReadiness() {
  serializedManifest = cloneManifest(INITIAL_SERIALIZED_MANIFEST);
  followUps = [];
  auditTrail = INITIAL_AUDIT.map((entry) => ({ ...entry }));
  auditSequence = INITIAL_AUDIT.length;
}

export function getExpectedManifest() {
  return EXPECTED_EQUIPMENT.map((asset) => ({ ...asset }));
}

export function getSerializedManifest() {
  return Object.entries(serializedManifest).map(([assetId, record]) => ({ assetId, ...record }));
}

// AC-1: compare every expected asset against the serialized manifest. A serial
// number with no scan is reported as MISSING instead of simply disappearing.
export function compareManifest() {
  return EXPECTED_EQUIPMENT.map((expected) => {
    const record = serializedManifest[expected.assetId];
    if (!record) {
      return {
        ...expected,
        status: EQUIPMENT_STATUS.MISSING,
        state: 'UNACCOUNTED',
        battery: '—',
        lastSeen: expected.lastKnown || 'No serialized scan',
        issue: 'Expected asset was not found in the serialized manifest; no RFID handshake.',
      };
    }
    return { ...expected, ...record };
  });
}

export function getFlaggedAssets() {
  return compareManifest().filter(
    (asset) => asset.required && asset.status !== EQUIPMENT_STATUS.VERIFIED,
  );
}

export function getOpenFollowUps() {
  return followUps
    .filter((followUp) => !followUp.resolvedAt)
    .map((followUp) => ({ ...followUp }));
}

export function getAuditTrail() {
  return auditTrail.map((entry) => ({ ...entry }));
}

// AC-2 and AC-3: one alert payload carries the affected assets and the locked
// readiness state so the UI never has to re-derive either.
export function getReadinessStatus() {
  const comparison = compareManifest();
  const flagged = comparison.filter(
    (asset) => asset.required && asset.status !== EQUIPMENT_STATUS.VERIFIED,
  );
  const countBy = (status) => flagged.filter((asset) => asset.status === status).length;
  const missingCount = countBy(EQUIPMENT_STATUS.MISSING);
  const failedCount = countBy(EQUIPMENT_STATUS.FAILED);
  const unverifiedCount = countBy(EQUIPMENT_STATUS.UNVERIFIED);
  const blocked = flagged.length > 0;
  const severe = missingCount + failedCount > 0;
  const verifiedCount = comparison.filter(
    (asset) => asset.required && asset.status === EQUIPMENT_STATUS.VERIFIED,
  ).length;
  const requiredCount = EXPECTED_EQUIPMENT.filter((asset) => asset.required).length;

  return {
    blocked,
    level: blocked ? (severe ? 'CRITICAL' : 'ATTENTION') : 'CLEAR',
    headline: blocked
      ? `${flagged.length} HARDWARE SEGMENT${flagged.length === 1 ? '' : 'S'} UNACCOUNTED FOR`
      : 'ALL REQUIRED EQUIPMENT VERIFIED',
    detail: blocked
      ? 'Show telemetry indicates equipment did not complete the serialized manifest check. Show readiness is locked until safety staff close every follow-up.'
      : 'The serialized manifest matches the expected show manifest. Launch checks can continue.',
    verifiedCount,
    requiredCount,
    flaggedCount: flagged.length,
    missingCount,
    failedCount,
    unverifiedCount,
    blockers: flagged.map((asset) => `${asset.assetId} · ${asset.status}`),
    rules: [...READINESS_RULES],
    assets: flagged,
  };
}

export function getMissingEquipmentAlert() {
  const readiness = getReadinessStatus();
  return {
    ...readiness,
    assets: getFlaggedAssets(),
    followUps: getOpenFollowUps(),
    nextAction: readiness.blocked
      ? 'Ping the active transceivers, then open a safety follow-up for every flagged asset.'
      : 'No safety follow-up is required.',
  };
}

// AC-4: follow-ups are append-only from the operator's point of view. Opening
// an existing follow-up again returns the open record instead of duplicating it.
export function openSafetyFollowUp(assetId, { note, actor = 'Safety staff' } = {}) {
  const asset = compareManifest().find((entry) => entry.assetId === assetId);
  if (!asset) throw new Error(`Unknown asset: ${assetId}`);
  if (asset.status === EQUIPMENT_STATUS.VERIFIED) {
    throw new Error(`${assetId} is already verified.`);
  }

  const trimmed = typeof note === 'string' ? note.trim() : '';
  if (!trimmed) throw new Error('A follow-up note is required.');

  const existing = followUps.find(
    (followUp) => followUp.assetId === assetId && !followUp.resolvedAt,
  );
  if (existing) return { ...existing };

  const record = {
    id: `FU-${String(followUps.length + 1).padStart(3, '0')}`,
    assetId,
    note: trimmed,
    actor,
    openedAt: new Date().toISOString(),
    resolvedAt: null,
    resolution: null,
  };
  followUps = [record, ...followUps];
  recordAudit('FOLLOW_UP', assetId, trimmed, actor);
  return { ...record };
}

export function resolveAsset(assetId, { resolution, actor = 'Safety staff' } = {}) {
  const asset = compareManifest().find((entry) => entry.assetId === assetId);
  if (!asset) throw new Error(`Unknown asset: ${assetId}`);
  if (asset.status === EQUIPMENT_STATUS.VERIFIED) {
    throw new Error(`${assetId} is already verified.`);
  }

  const trimmed = typeof resolution === 'string' ? resolution.trim() : '';
  if (!trimmed) throw new Error('A resolution note is required.');

  const at = new Date().toISOString();
  serializedManifest = {
    ...serializedManifest,
    [assetId]: {
      ...serializedManifest[assetId],
      status: EQUIPMENT_STATUS.VERIFIED,
      state: 'ACTIVE',
      issue: null,
      verifiedAt: at,
      verifiedBy: actor,
    },
  };
  followUps = followUps.map((followUp) => (
    followUp.assetId === assetId && !followUp.resolvedAt
      ? { ...followUp, resolvedAt: at, resolution: trimmed }
      : followUp
  ));
  recordAudit('RESOLVED', assetId, trimmed, actor);

  return { assetId, ...serializedManifest[assetId] };
}

export function logAlertAction(action, { actor = 'Safety staff' } = {}) {
  const notes = {
    PING: 'Pinged the active transceivers for every flagged asset.',
    BEACON: 'Triggered the local audio beacon for recovery crews.',
  };
  if (!notes[action]) throw new Error(`Unknown alert action: ${action}`);
  return recordAudit(action, null, notes[action], actor);
}
