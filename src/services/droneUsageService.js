import { droneMissionData, mockDroneUsage } from '../mockData';

export function getDroneMissions(droneID) {
  if (!droneID) return [];
  return droneMissionData
    .filter((mission) => mission.droneID === droneID)
    .sort((first, second) => second.date.localeCompare(first.date));
}

export function getDroneUsage(droneID) {
  const missions = getDroneMissions(droneID);
  const missionFlightMinutes = missions.reduce(
    (total, mission) => total + (Number(mission.totalFlightTimeMins) || 0),
    0,
  );

  const storedUsage = mockDroneUsage.droneID === droneID ? mockDroneUsage : null;

  return {
    droneID,
    hours: storedUsage?.hours ?? missionFlightMinutes / 60,
    numFlights: storedUsage?.numFlights ?? missions.length,
    missionFlightMinutes,
    nextMaintenanceInHours: storedUsage?.nextMaintenanceInHours ?? null,
    missions,
  };
}
