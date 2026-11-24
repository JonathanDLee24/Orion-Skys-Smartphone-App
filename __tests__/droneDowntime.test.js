import {
  AVAILABILITY_STATES,
  createDowntimeRecord,
  getDowntimeRecords,
  getFleet,
  getFleetStatusSummary,
  getLaunchReadyFleet,
  getOpenDowntimeRecord,
  resetFleetForTests,
  updateDowntimeRecord,
} from '../src/services/droneDowntimeService';

beforeEach(() => resetFleetForTests());
test('grounded aircraft stays excluded until follow-up is closed and audit records every change', () => {
  const record = createDowntimeRecord({ droneId: 'SF-Q-001', issue: 'Damaged arm', workPerformed: 'Inspected', staff: 'Alex', availability: 'Grounded/Downtime' });
  expect(getLaunchReadyFleet().some(d => d.id === record.droneId)).toBe(false);
  expect(() => updateDowntimeRecord({ id: record.id, staff: 'Alex', workPerformed: 'Repaired', availability: 'Available' })).toThrow('Close follow-up');
  updateDowntimeRecord({ id: record.id, staff: 'Alex', workPerformed: 'Repaired', availability: 'Maintenance' });
  expect(getLaunchReadyFleet().some(d => d.id === record.droneId)).toBe(false);
  updateDowntimeRecord({ id: record.id, staff: 'Sam', workPerformed: 'Verified', availability: 'Available', close: true });
  expect(getLaunchReadyFleet().some(d => d.id === record.droneId)).toBe(true);
  const saved = getDowntimeRecords(record.droneId)[0];
  expect(saved.status).toBe('Closed');
  expect(saved.closedAt).toBeTruthy();
  expect(saved.history.map(e => e.action)).toEqual(['Created', 'Updated', 'Closed']);
  expect(saved.history[2].staff).toBe('Sam');
});
test('validation prevents duplicate open records and invalid changes', () => {
  const input = { droneId: 'SF-Q-002', issue: 'Fault', workPerformed: 'Inspected', staff: 'Alex', availability: 'Maintenance' };
  expect(() => createDowntimeRecord({ ...input, staff: ' ' })).toThrow();
  const record = createDowntimeRecord(input);
  expect(() => createDowntimeRecord(input)).toThrow();
  updateDowntimeRecord({ id: record.id, staff: 'Alex', workPerformed: 'Needs parts', availability: 'Maintenance', close: true });
  expect(getFleet().find(d => d.id === input.droneId).availability).toBe('Maintenance');
  expect(getLaunchReadyFleet().some(d => d.id === input.droneId)).toBe(false);
});

test('schedules future service while immediately removing the drone from launch-ready inventory', () => {
  const input = { droneId: 'SF-Q-001', issue: 'Inspection', workPerformed: 'None yet', staff: 'Alex', availability: 'Maintenance' };
  expect(() => createDowntimeRecord({ ...input, scheduledFor: '2027-02-30T10:00' })).toThrow();
  expect(() => createDowntimeRecord({ ...input, scheduledFor: '2020-01-01T10:00' })).toThrow();
  const record = createDowntimeRecord({ ...input, scheduledFor: '2099-04-12T10:30' });
  expect(new Date(record.scheduledAt).getHours()).toBe(10);
  expect(record.history[0].scheduledAt).toBe(record.scheduledAt);
  expect(getLaunchReadyFleet().some(d => d.id === input.droneId)).toBe(false);
});

test('every availability state is accepted and invalid states are rejected', () => {
  expect(AVAILABILITY_STATES).toEqual(['Available', 'Maintenance', 'Grounded/Downtime']);
  expect(() => createDowntimeRecord({ droneId: 'SF-Q-003', issue: 'Fault', workPerformed: 'Inspected', staff: 'Alex', availability: 'Retired' })).toThrow('Select available, maintenance or grounded downtime.');
  ['Maintenance', 'Grounded/Downtime'].forEach((availability) => {
    const record = createDowntimeRecord({ droneId: 'SF-Q-003', issue: 'Fault', workPerformed: 'Inspected', staff: 'Alex', availability });
    expect(record.status).toBe('Open');
    updateDowntimeRecord({ id: record.id, staff: 'Alex', workPerformed: 'Done', availability: 'Available', close: true });
  });
  const onTheSpot = createDowntimeRecord({ droneId: 'SF-Q-003', issue: 'Prop chip', workPerformed: 'Replaced prop', staff: 'Alex', availability: 'Available' });
  expect(onTheSpot.status).toBe('Closed');
});

test('on-the-spot maintenance is logged closed and keeps the drone launch-ready', () => {
  const record = createDowntimeRecord({ droneId: 'SF-Q-005', issue: 'Chipped propeller', workPerformed: 'Replaced propeller', staff: 'Riley', availability: 'Available' });
  expect(record.status).toBe('Closed');
  expect(record.closedAt).toBeTruthy();
  expect(record.history).toHaveLength(1);
  expect(record.history[0]).toMatchObject({ staff: 'Riley', availability: 'Available', action: 'Created', workPerformed: 'Replaced propeller' });
  expect(getFleet().find(d => d.id === 'SF-Q-005').availability).toBe('Available');
  expect(getLaunchReadyFleet().some(d => d.id === 'SF-Q-005')).toBe(true);
  expect(getOpenDowntimeRecord('SF-Q-005')).toBeNull();
  // A closed on-the-spot log does not block the next record for that drone.
  expect(() => createDowntimeRecord({ droneId: 'SF-Q-005', issue: 'Routine check', workPerformed: 'Checked', staff: 'Riley', availability: 'Maintenance' })).not.toThrow();
  // A finished job cannot also be scheduled for later.
  expect(() => createDowntimeRecord({ droneId: 'SF-Q-006', issue: 'Check', workPerformed: 'Checked', staff: 'Riley', availability: 'Available', scheduledFor: '2099-04-12T10:30' })).toThrow('scheduled service time');
});

test('fleet status summary reflects availability and open follow-ups', () => {
  expect(getFleetStatusSummary()).toEqual({ total: 6, available: 5, maintenance: 1, grounded: 0, launchReady: 5 });
  createDowntimeRecord({ droneId: 'SF-Q-002', issue: 'Motor swap', workPerformed: 'Swapping', staff: 'Alex', availability: 'Grounded/Downtime' });
  expect(getFleetStatusSummary()).toEqual({ total: 6, available: 4, maintenance: 1, grounded: 1, launchReady: 4 });
  expect(getOpenDowntimeRecord('SF-Q-002')).toMatchObject({ droneId: 'SF-Q-002', status: 'Open', issue: 'Motor swap' });
});
