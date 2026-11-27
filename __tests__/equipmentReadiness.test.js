import {
  EQUIPMENT_STATUS,
  compareManifest,
  getAuditTrail,
  getExpectedManifest,
  getFlaggedAssets,
  getMissingEquipmentAlert,
  getOpenFollowUps,
  getReadinessStatus,
  logAlertAction,
  openSafetyFollowUp,
  resetEquipmentReadiness,
  resolveAsset,
} from '../src/services/equipmentReadinessService';

beforeEach(() => {
  resetEquipmentReadiness();
});

test('OSPSA-254 AC-1 detects missing equipment against the expected manifest', () => {
  const expected = getExpectedManifest().map((asset) => asset.assetId);
  const comparison = compareManifest();
  expect(comparison.map((asset) => asset.assetId)).toEqual(expected);

  const flagged = getFlaggedAssets();
  expect(flagged.map((asset) => asset.assetId)).toEqual(['SF-Q-004', 'SF-Q-005', 'SF-Q-006']);

  const missing = flagged.find((asset) => asset.assetId === 'SF-Q-005');
  expect(missing.status).toBe(EQUIPMENT_STATUS.MISSING);
  expect(missing.issue).toMatch(/RFID handshake/);
});

test('OSPSA-254 AC-2 alert names every affected asset', () => {
  const alert = getMissingEquipmentAlert();
  expect(alert.blocked).toBe(true);
  expect(alert.level).toBe('CRITICAL');
  expect(alert.headline).toBe('3 HARDWARE SEGMENTS UNACCOUNTED FOR');
  expect(alert.assets.map((asset) => asset.assetId)).toEqual([
    'SF-Q-004',
    'SF-Q-005',
    'SF-Q-006',
  ]);
  expect(alert.nextAction).toMatch(/safety follow-up/i);
  expect(alert.rules).toHaveLength(3);
});

test('OSPSA-254 AC-3 readiness stays blocked until flagged assets are verified', () => {
  let readiness = getReadinessStatus();
  expect(readiness.blocked).toBe(true);
  expect(readiness.blockers).toEqual([
    'SF-Q-004 · FAILED',
    'SF-Q-005 · MISSING',
    'SF-Q-006 · UNVERIFIED',
  ]);
  expect(readiness.verifiedCount).toBe(3);
  expect(readiness.requiredCount).toBe(6);

  resolveAsset('SF-Q-005', { resolution: 'Recovered from the NE sector.' });
  readiness = getReadinessStatus();
  expect(readiness.blocked).toBe(true);
  expect(readiness.missingCount).toBe(0);
  expect(readiness.verifiedCount).toBe(4);
});

test('OSPSA-254 AC-4 follow-ups and resolutions are auditable', () => {
  expect(() => openSafetyFollowUp('SF-Q-005', { note: '   ' })).toThrow(
    'A follow-up note is required.',
  );

  const followUp = openSafetyFollowUp('SF-Q-005', {
    note: 'Search the NE sector with the recovery crew.',
    actor: 'Safety lead',
  });
  expect(followUp.assetId).toBe('SF-Q-005');
  expect(followUp.actor).toBe('Safety lead');
  expect(getOpenFollowUps()).toHaveLength(1);

  resolveAsset('SF-Q-004', { resolution: 'Battery pack replaced and load-tested.' });
  resolveAsset('SF-Q-005', { resolution: 'Airframe recovered and scanned.' });
  resolveAsset('SF-Q-006', { resolution: 'Safety sign-off recorded.' });

  expect(getReadinessStatus().blocked).toBe(false);
  expect(getReadinessStatus().level).toBe('CLEAR');
  expect(getOpenFollowUps()).toHaveLength(0);

  const trail = getAuditTrail();
  expect(trail.some((entry) => entry.action === 'FOLLOW_UP' && entry.assetId === 'SF-Q-005')).toBe(true);
  expect(trail.filter((entry) => entry.action === 'RESOLVED')).toHaveLength(3);
  expect(trail[0].action).toBe('RESOLVED');
});

test('OSPSA-254 alert actions are written to the audit trail', () => {
  logAlertAction('PING');
  expect(getAuditTrail()[0].action).toBe('PING');
  logAlertAction('BEACON');
  expect(getAuditTrail()[0].action).toBe('BEACON');
  expect(() => logAlertAction('UNKNOWN')).toThrow('Unknown alert action: UNKNOWN');
});
