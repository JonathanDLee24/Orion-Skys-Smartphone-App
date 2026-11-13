import React from 'react';
import { act, create } from 'react-test-renderer';
import { Pressable, Text, TextInput } from 'react-native';
import { DroneLaunchProvider, useDroneLaunch } from '../src/components/DroneLaunchTransition';
import DroneGlyph from '../src/components/DroneGlyph';
import EmployeeLoginScreen from '../src/screens/EmployeeLoginScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

global.IS_REACT_ACT_ENVIRONMENT = true;

function Launcher() {
  const { launch } = useDroneLaunch();
  return (
    <Pressable accessibilityLabel="Launch" onPress={launch}>
      <Text>Launch</Text>
    </Pressable>
  );
}

const overlays = (tree) => tree.root.findAllByProps({ testID: 'drone-launch-overlay' });

test('launching the transition covers the screen with the drone and its fleet', async () => {
  let tree;
  await act(async () => {
    tree = create(
      <DroneLaunchProvider>
        <Launcher />
      </DroneLaunchProvider>,
    );
  });
  expect(overlays(tree)).toHaveLength(0);

  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Launch' }).props.onPress());

  const overlay = overlays(tree)[0];
  expect(overlay.props.pointerEvents).toBe('none');
  expect(overlay.findAllByType(DroneGlyph).length).toBeGreaterThan(1);
  await act(async () => tree.unmount());
});

test('a successful employee sign in launches the transition and still navigates', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(
      <DroneLaunchProvider>
        <EmployeeLoginScreen navigation={navigation} />
      </DroneLaunchProvider>,
    );
  });

  const inputs = tree.root.findAllByType(TextInput);
  await act(async () => inputs[0].props.onChangeText('test'));
  await act(async () => inputs[1].props.onChangeText('password1234'));
  const submit = tree.root.find((node) => node.props.accessibilityLabel === 'Sign in');
  await act(async () => submit.props.onPress());

  expect(navigation.navigate).toHaveBeenCalledWith('EmployeeDashboard');
  expect(overlays(tree).length).toBeGreaterThan(0);
  await act(async () => tree.unmount());
});

test('the launch overlay clears away once the drones have flown off', async () => {
  jest.useFakeTimers();
  let tree;
  await act(async () => {
    tree = create(
      <DroneLaunchProvider>
        <Launcher />
      </DroneLaunchProvider>,
    );
  });
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Launch' }).props.onPress());
  expect(overlays(tree).length).toBeGreaterThan(0);

  act(() => {
    jest.advanceTimersByTime(2500);
  });

  expect(overlays(tree)).toHaveLength(0);
  await act(async () => tree.unmount());
  jest.useRealTimers();
});

test('login screens outside a provider sign in without the transition', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<EmployeeLoginScreen navigation={navigation} />);
  });

  const inputs = tree.root.findAllByType(TextInput);
  await act(async () => inputs[0].props.onChangeText('test'));
  await act(async () => inputs[1].props.onChangeText('password1234'));
  const submit = tree.root.find((node) => node.props.accessibilityLabel === 'Sign in');
  await act(async () => submit.props.onPress());

  expect(navigation.navigate).toHaveBeenCalledWith('EmployeeDashboard');
  expect(overlays(tree)).toHaveLength(0);
  await act(async () => tree.unmount());
});
