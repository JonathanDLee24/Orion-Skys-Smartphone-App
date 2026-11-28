// Session-only downtime and maintenance ledger for the fleet manifest.
// Grounded or in-maintenance drones stay out of the launch-ready count until
// their follow-up record is closed.

export const AVAILABILITY_STATES = ['Available', 'Maintenance', 'Grounded/Downtime'];

const initialFleet = [
  { id: 'SF-Q-001', rfid: 'RFID: 900-11A0', battery: '98%', availability: 'Available' },
  { id: 'SF-Q-002', rfid: 'RFID: 900-11A1', battery: '92%', availability: 'Available' },
  { id: 'SF-Q-003', rfid: 'RFID: 900-11A2', battery: '45%', availability: 'Available' },
  { id: 'SF-Q-004', rfid: 'RFID: 900-11A3', battery: '12%', availability: 'Maintenance' },
  { id: 'SF-Q-005', rfid: 'RFID: 900-11A4', battery: '88%', availability: 'Available' },
  { id: 'SF-Q-006', rfid: 'RFID: 900-11A5', battery: '76%', availability: 'Available' },
];
let fleet = initialFleet.map(item => ({ ...item }));
let records = [];
let nextId = 1;

function copyRecord(record) {
  return { ...record, history: record.history.map(event => ({ ...event })) };
}

function hasOpenRecord(droneId) {
  return records.some(record => record.droneId === droneId && record.status === 'Open');
}

export function getFleet() { return fleet.map(item => ({ ...item })); }
export function getDowntimeRecords(droneId) {
  return records.filter(item => !droneId || item.droneId === droneId).map(copyRecord);
}
export function getOpenDowntimeRecord(droneId) {
  const record = records.find(item => item.droneId === droneId && item.status === 'Open');
  return record ? copyRecord(record) : null;
}
export function getLaunchReadyFleet() {
  return getFleet().filter(item => item.availability === 'Available' && !hasOpenRecord(item.id));
}

// Counts for the operational views, e.g. the manifest header and the admin
// dashboard readiness strip.
export function getFleetStatusSummary() {
  const summary = { total: fleet.length, available: 0, maintenance: 0, grounded: 0, launchReady: getLaunchReadyFleet().length };
  fleet.forEach(item => {
    if (item.availability === 'Available') summary.available += 1;
    else if (item.availability === 'Maintenance') summary.maintenance += 1;
    else summary.grounded += 1;
  });
  return summary;
}

export function isLaunchReady(droneId) {
  return getLaunchReadyFleet().some(item => item.id === droneId);
}

export function createDowntimeRecord({ droneId, issue, workPerformed, staff, availability, scheduledFor = '' }) {
  const drone = fleet.find(item => item.id === droneId);
  if (!drone) throw new Error('Select a valid drone.');
  if (!issue?.trim() || !workPerformed?.trim() || !staff?.trim()) throw new Error('Issue, work performed and responsible staff are required.');
  if (!AVAILABILITY_STATES.includes(availability)) throw new Error('Select available, maintenance or grounded downtime.');
  if (availability === 'Available' && scheduledFor) throw new Error('A drone returned to available cannot have a scheduled service time.');
  let scheduledAt = null;
  if (scheduledFor) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(scheduledFor)) throw new Error('Enter the service time as YYYY-MM-DDTHH:mm.');
    const date = new Date(scheduledFor);
    const localValue = Number.isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    if (localValue !== scheduledFor || date.getTime() <= Date.now()) throw new Error('Enter a valid future local service time.');
    scheduledAt = date.toISOString();
  }
  if (hasOpenRecord(droneId)) throw new Error('Close the existing follow-up before creating another record.');
  const timestamp = new Date().toISOString();
  // "Available" means the work was finished on the spot, so the record is
  // logged as closed and the drone stays launch-ready.
  const finishedOnTheSpot = availability === 'Available';
  const event = { timestamp, staff: staff.trim(), workPerformed: workPerformed.trim(), availability, scheduledAt, action: 'Created' };
  const record = {
    id: String(nextId++),
    droneId,
    issue: issue.trim(),
    status: finishedOnTheSpot ? 'Closed' : 'Open',
    scheduledAt,
    createdAt: timestamp,
    updatedAt: timestamp,
    closedAt: finishedOnTheSpot ? timestamp : null,
    history: [event],
  };
  records.push(record);
  drone.availability = availability;
  return copyRecord(record);
}

// Log more maintenance work. Passing close moves the drone to the selected
// state and ends the follow-up; Available is the only closed state that brings
// the drone back into the launch-ready inventory.
export function updateDowntimeRecord({ id, staff, workPerformed, availability, close = false }) {
  const record = records.find(item => item.id === id);
  if (!record || record.status !== 'Open') throw new Error('Open follow-up not found.');
  if (!staff?.trim() || !workPerformed?.trim()) throw new Error('Work performed and responsible staff are required.');
  if (!AVAILABILITY_STATES.includes(availability)) throw new Error('Select a valid availability.');
  if (!close && availability === 'Available') throw new Error('Close follow-up before returning the drone to available.');
  const timestamp = new Date().toISOString();
  record.history.push({ timestamp, staff: staff.trim(), workPerformed: workPerformed.trim(), availability, action: close ? 'Closed' : 'Updated' });
  record.updatedAt = timestamp;
  if (close) { record.status = 'Closed'; record.closedAt = timestamp; }
  fleet.find(item => item.id === record.droneId).availability = availability;
  return copyRecord(record);
}

export function resetFleetForTests() { fleet = initialFleet.map(item => ({ ...item })); records = []; nextId = 1; }
