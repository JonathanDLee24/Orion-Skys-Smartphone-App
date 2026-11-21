import { getDroneMissions, getDroneUsage } from '../src/services/droneUsageService';

test('lists and joins mission records for a drone', () => {
  const missions = getDroneMissions('D1');

  expect(missions).toHaveLength(3);
  expect(missions.map((mission) => mission.missionID)).toEqual(['M2', 'M1', 'M3']);
});

test('derives mission flight time and flight count from drone missions', () => {
  const usage = getDroneUsage('D1');

  expect(usage.numFlights).toBe(18);
  expect(usage.missionFlightMinutes).toBeCloseTo(36.7);
  expect(usage.hours).toBe(42.5);
  expect(usage.missions).toHaveLength(3);
});

test('returns no missions for an unknown drone', () => {
  expect(getDroneMissions('unknown')).toEqual([]);
  expect(getDroneUsage('unknown').missionFlightMinutes).toBe(0);
});
