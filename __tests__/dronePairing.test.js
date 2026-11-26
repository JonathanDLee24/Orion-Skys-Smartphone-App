import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import DronePairingScreen from '../src/screens/DronePairingScreen';
import DroneDetailsScreen from '../src/screens/DroneDetailsScreen';

jest.mock('expo-camera', () => ({
  CameraView: (props) => jest.requireActual('react').createElement('CameraView', props),
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

test('pairing scanner routes known drones and the bypass to drone details', async () => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<DronePairingScreen navigation={navigation} />);
  });

  const labels = tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
  expect(labels).toContain('FLEET FLIGHT READINESS');
  expect(labels).toContain('READY TO FLY');
  expect(labels).toContain('NOT READY');

  await act(async () => {
    tree.root.findByProps({ testID: 'drone-camera-preview' }).props.onBarcodeScanned({ data: 'https://fleet.local/SF-Q-002' });
  });
  expect(navigation.navigate).toHaveBeenCalledWith('DroneDetails', {
    droneId: 'SF-Q-002',
    qrData: 'https://fleet.local/SF-Q-002',
  });

  navigation.navigate.mockClear();
  await act(async () => {
    tree.root.findByProps({ accessibilityLabel: 'Bypass scanner and view test drone' }).props.onPress();
  });
  expect(navigation.navigate).toHaveBeenCalledWith('DroneDetails', { droneId: 'SF-Q-001', qrData: undefined });
  await act(async () => tree.unmount());
});

test('drone details distinguish ready fleet records from unknown QR codes', async () => {
  let readyTree;
  await act(async () => {
    readyTree = create(<DroneDetailsScreen navigation={{ goBack: jest.fn() }} route={{ params: { droneId: 'SF-Q-001' } }} />);
  });
  const readyText = readyTree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
  expect(readyText).toContain('READY TO FLY');
  expect(readyText).toContain('RFID: 900-11A0');
  await act(async () => readyTree.unmount());

  let unknownTree;
  await act(async () => {
    unknownTree = create(<DroneDetailsScreen navigation={{ goBack: jest.fn() }} route={{ params: { qrData: 'UNKNOWN-QR' } }} />);
  });
  const unknownText = unknownTree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
  expect(unknownText).toContain('UNREGISTERED DRONE');
  expect(unknownText).toContain('NOT READY TO FLY');
  await act(async () => unknownTree.unmount());
});
