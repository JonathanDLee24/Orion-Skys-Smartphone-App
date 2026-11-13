import React from 'react';
import { act, create } from 'react-test-renderer';
import AdminDashboardScreen from '../src/screens/AdminDashboardScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), popToTop: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

global.IS_REACT_ACT_ENVIRONMENT = true;

test('admin dashboard links to Orion Skys operational screens', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<AdminDashboardScreen navigation={navigation} />);
  });

  const expectedRoutes = [
    ['Show operations', 'EmployeeEvents'],
    ['Drone fleet', 'DroneManifest'],
    ['QR check-in', 'QRCodeScanner'],
    ['Show documents', 'DossierShowSelect'],
  ];

  for (const [label, route] of expectedRoutes) {
    const link = tree.root.find((node) => node.props.accessibilityLabel === label);
    await act(async () => link.props.onPress());
    expect(navigation.navigate).toHaveBeenLastCalledWith(route);
  }

  await act(async () => tree.unmount());
});
