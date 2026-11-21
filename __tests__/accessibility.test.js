import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { act, create } from 'react-test-renderer';
import AppText from '../src/components/AppText';
import { AccessibilityProvider, useAccessibility } from '../src/components/AccessibilityProvider';
import PrimaryButton from '../src/components/PrimaryButton';
import { DroneLaunchProvider, useDroneLaunch } from '../src/components/DroneLaunchTransition';
import ToggleSwitch from '../src/components/ToggleSwitch';
import AccessibilitySettingsScreen from '../src/screens/AccessibilitySettingsScreen';
import DashboardScreen from '../src/screens/DashboardScreen';
import {
  defaultAccessibilityPreferences,
  getAccessibilityPreferences,
  resetAccessibilityPreferences,
  resolveAccessibilityPreferences,
  setAccessibilityPreferences,
  textScaleFactor,
} from '../src/services/accessibilityService';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

let tree;

beforeEach(() => {
  resetAccessibilityPreferences();
});

afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  resetAccessibilityPreferences();
});

async function render(element) {
  await act(async () => {
    tree = create(<AccessibilityProvider>{element}</AccessibilityProvider>);
  });
}

const textOf = () => tree.root
  .findAll((node) => node.type === 'Text')
  .map((node) => node.props.children)
  .flat()
  .join(' ');
const byLabel = (label) => tree.root.findAll(
  (node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function',
)[0];
const press = (label) => act(async () => byLabel(label).props.onPress());
const hostStyle = (testID) => StyleSheet.flatten(
  tree.root.find((node) => node.props.testID === testID && node.type === 'Text').props.style,
);

test('the master switch gates every option and starts off', () => {
  expect(getAccessibilityPreferences()).toEqual(defaultAccessibilityPreferences);
  expect(resolveAccessibilityPreferences({ textSize: 'largest', highContrast: true })).toEqual({
    enabled: false,
    textSize: 'largest',
    fontScale: 1,
    highContrast: false,
    largeTargets: false,
    reduceMotion: false,
  });
  expect(textScaleFactor('largest')).toBe(1.5);
  expect(resolveAccessibilityPreferences({
    enabled: true,
    textSize: 'largest',
    highContrast: true,
    largeTargets: true,
    reduceMotion: true,
  })).toEqual({
    enabled: true,
    textSize: 'largest',
    fontScale: 1.5,
    highContrast: true,
    largeTargets: true,
    reduceMotion: true,
  });
});

test('the accessibility screen starts switched off with the sub-options disabled', async () => {
  await render(<AccessibilitySettingsScreen navigation={{ navigate: jest.fn() }} />);

  const master = tree.root.findAll((node) => node.props.accessibilityLabel === 'Accessibility mode' && node.type !== 'Text')[0];
  expect(master.props.accessibilityState.checked).toBe(false);
  expect(textOf()).toContain('○ ACCESSIBILITY MODE OFF');
  expect(textOf()).toContain('Turn on Accessibility mode to change the text size.');

  const contrast = tree.root.findAll(
    (node) => node.props.accessibilityLabel === 'High-contrast colours' && node.type !== 'Text',
  )[0];
  expect(contrast.props.accessibilityState).toEqual({ checked: false, disabled: true });
});

test('turning the master switch on applies text, contrast, targets and motion options', async () => {
  await render(<AccessibilitySettingsScreen navigation={{ navigate: jest.fn() }} />);

  await press('Accessibility mode');
  expect(getAccessibilityPreferences().enabled).toBe(true);
  expect(textOf()).toContain('● ACCESSIBILITY MODE ON');

  await press('Largest text');
  await press('High-contrast colours');
  await press('Large touch targets');
  await press('Reduce motion');

  expect(getAccessibilityPreferences()).toMatchObject({
    enabled: true,
    textSize: 'largest',
    highContrast: true,
    largeTargets: true,
    reduceMotion: true,
  });
  // 13px preview copy scales by the largest factor.
  expect(hostStyle('a11y-text-preview').fontSize).toBe(19.5);
});

test('all app text and muted colours follow the accessibility mode', async () => {
  function Probe() {
    const { fontScale, highContrast, largeTargets, reduceMotion } = useAccessibility();
    return (
      <AppText testID="probe" style={{ color: '#8C8C8C', fontSize: 10, lineHeight: 16 }}>
        {`${fontScale}|${highContrast}|${largeTargets}|${reduceMotion}`}
      </AppText>
    );
  }

  await render(<Probe />);
  expect(hostStyle('probe')).toEqual({ color: '#8C8C8C', fontSize: 10, lineHeight: 16 });

  await act(async () => {
    setAccessibilityPreferences({ enabled: true, textSize: 'large', highContrast: true });
  });
  expect(textOf()).toBe('1.25|true|false|false');
  expect(hostStyle('probe')).toEqual({ color: '#E6E6E6', fontSize: 12.5, lineHeight: 20 });
});

test('high contrast strengthens borders and dividers, not just text', async () => {
  await render(<AccessibilitySettingsScreen navigation={{ navigate: jest.fn() }} />);
  const resetBorder = () => StyleSheet.flatten(
    tree.root.find((node) => node.props.accessibilityLabel === 'Reset accessibility options' && typeof node.props.style === 'function')
      .props.style({ pressed: false }),
  ).borderColor;
  expect(resetBorder()).toBe('#262626');

  await act(async () => {
    setAccessibilityPreferences({ enabled: true, highContrast: true });
  });
  expect(resetBorder()).toBe('#8A8A8A');
});

test('large touch targets grow buttons and switches', async () => {
  await render(<PrimaryButton title="Continue" onPress={() => {}} />);
  const styleOf = () => StyleSheet.flatten(
    tree.root.find((node) => node.props.accessibilityLabel === 'Continue' && typeof node.props.style === 'function')
      .props.style({ pressed: false }),
  );
  expect(styleOf().minHeight).toBe(44);

  await act(async () => {
    setAccessibilityPreferences({ enabled: true, largeTargets: true });
  });
  expect(styleOf().minHeight).toBe(60);

  await act(async () => {
    tree.update(
      <AccessibilityProvider>
        <ToggleSwitch label="Reduced" value={false} onValueChange={() => {}} testID="probe-switch" />
      </AccessibilityProvider>,
    );
  });
  const touch = tree.root.find((node) => node.props.accessibilityRole === 'switch' && node.type !== 'Text');
  expect(StyleSheet.flatten(touch.props.style).minHeight).toBe(56);
});

test('reduce motion skips the drone launch overlay and switches instantly', async () => {
  function Launcher() {
    const { launch } = useDroneLaunch();
    return <Pressable accessibilityLabel="Launch" onPress={launch} />;
  }

  await act(async () => {
    setAccessibilityPreferences({ enabled: true, reduceMotion: true });
  });
  await render(
    <DroneLaunchProvider>
      <Launcher />
    </DroneLaunchProvider>,
  );

  await press('Launch');
  expect(tree.root.findAll((node) => node.props.testID === 'drone-launch-overlay')).toHaveLength(0);
});

test('reset returns every option to the standard app', async () => {
  await render(<AccessibilitySettingsScreen navigation={{ navigate: jest.fn() }} />);
  await press('Accessibility mode');
  await press('Largest text');
  await press('High-contrast colours');
  expect(textOf()).toContain('● ACCESSIBILITY MODE ON');

  await press('Reset accessibility options');
  expect(getAccessibilityPreferences()).toEqual(defaultAccessibilityPreferences);
  expect(textOf()).toContain('○ ACCESSIBILITY MODE OFF');
});

test('the account dashboard links to the accessibility screen', async () => {
  const navigation = { navigate: jest.fn() };
  await render(<DashboardScreen navigation={navigation} />);

  await press('Accessibility options');
  expect(navigation.navigate).toHaveBeenCalledWith('AccessibilitySettings');
});
