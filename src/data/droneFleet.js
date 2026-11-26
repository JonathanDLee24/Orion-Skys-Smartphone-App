export const droneFleet = [
  { id: 'SF-Q-001', rfid: 'RFID: 900-11A0', state: 'ACTIVE', battery: '98%' },
  { id: 'SF-Q-002', rfid: 'RFID: 900-11A1', state: 'ACTIVE', battery: '92%' },
  { id: 'SF-Q-003', rfid: 'RFID: 900-11A2', state: 'STANDBY', battery: '45%' },
  { id: 'SF-Q-004', rfid: 'RFID: 900-11A3', state: 'SERVICE', battery: '12%' },
  { id: 'SF-Q-005', rfid: 'RFID: 900-11A4', state: 'ACTIVE', battery: '88%' },
  { id: 'SF-Q-006', rfid: 'RFID: 900-11A5', state: 'ACTIVE', battery: '76%' },
];

export function isDroneReadyToFly(drone) {
  return drone.state === 'ACTIVE' && Number.parseInt(drone.battery, 10) >= 50;
}

export function findDroneByQrData(data) {
  const value = String(data).toUpperCase();
  return droneFleet.find((drone) => value.includes(drone.id) || value.includes(drone.rfid));
}
