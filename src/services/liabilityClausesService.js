import { useSyncExternalStore } from 'react';

// Mock content for now; clauses will load per show once the compliance
// service exists. Every clause listed here must be accepted before the pilot
// can proceed.
export const LIABILITY_CLAUSES = [
  {
    id: 'L-01',
    title: 'Operational Risk Assumption',
    description: 'PIC assumes ultimate structural risk over Class B airspace transitions.',
  },
  {
    id: 'L-02',
    title: 'Part 107 visual line-of-sight',
    description: 'Crew must maintain uninterrupted visual contact with all active nodes.',
  },
  {
    id: 'L-03',
    title: 'Battery Thermal Protocol',
    description: 'Unconditional immediate landing of cells exceeding 65°C core temp.',
  },
  {
    id: 'L-04',
    title: 'Geomagnetic Interference SLA',
    description: 'Acknowledgment of auto-return thresholds under solar storm indexes.',
  },
  {
    id: 'L-05',
    title: 'FAA Emergency Coordination',
    description: 'Waiver of manual override delays during priority commercial air traffic.',
  },
];

export function getLiabilityClauses() {
  return LIABILITY_CLAUSES;
}

// Per-show compliance records for this session, keyed by the show's id. Each
// record keeps which clauses are checked and when Proceed accepted them.
// Replace with the compliance API once the backend exists.
const records = new Map();
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

function allClauseIds() {
  return getLiabilityClauses().map((clause) => clause.id);
}

function coversEveryClause(checkedIds) {
  return allClauseIds().every((id) => checkedIds.includes(id));
}

export function getShowKey(submission) {
  return submission?.id || submission?.reference || null;
}

export function getCheckedClauseIds(showKey) {
  return showKey ? [...(records.get(showKey)?.checkedIds || [])] : [];
}

// Saves the boxes exactly as the pilot left them. Unchecking any clause
// withdraws an earlier acceptance; only Proceed can grant it again.
export function saveCheckedClauses(showKey, checkedIds) {
  if (!showKey) return null;
  const known = new Set(allClauseIds());
  const ids = [...new Set(checkedIds)].filter((id) => known.has(id));
  const previous = records.get(showKey);
  const record = {
    showKey,
    checkedIds: ids,
    acceptedAt: previous?.acceptedAt && coversEveryClause(ids) ? previous.acceptedAt : null,
  };
  records.set(showKey, record);
  notify();
  return record;
}

// Accepted only after Proceed and only while every current clause is still
// checked, so adding a clause later also asks the pilot to accept again.
export function getLiabilityAcceptance(showKey) {
  const record = showKey ? records.get(showKey) : null;
  if (!record?.acceptedAt || !coversEveryClause(record.checkedIds)) return null;
  return record;
}

export function isLiabilityAccepted(showKey) {
  return Boolean(getLiabilityAcceptance(showKey));
}

export function acceptLiabilityClauses(showKey, acceptedAt = new Date()) {
  if (!showKey) return null;
  const record = { showKey, checkedIds: allClauseIds(), acceptedAt: acceptedAt.toISOString() };
  records.set(showKey, record);
  notify();
  return record;
}

export function clearLiabilityAcceptances() {
  records.clear();
  notify();
}

export function subscribeLiabilityAcceptances(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Re-renders the caller whenever any show's acceptance changes.
export function useLiabilityAccepted(showKey) {
  return useSyncExternalStore(
    subscribeLiabilityAcceptances,
    () => isLiabilityAccepted(showKey),
    () => isLiabilityAccepted(showKey)
  );
}
