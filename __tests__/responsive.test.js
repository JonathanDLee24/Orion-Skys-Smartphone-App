import React from 'react';
import { act, create } from 'react-test-renderer';
import { Dimensions, StyleSheet, Text } from 'react-native';
import ScreenLayout from '../src/components/ScreenLayout';
import { getResponsiveLayout } from '../src/theme';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

describe('responsive layout', () => {
  test.each([
    [320, 'phone', false, 767, 18],
    [390, 'phone', false, 767, 18],
    [767, 'phone', false, 767, 18],
    [768, 'tablet', true, 1100, 32],
    [834, 'tablet', true, 1100, 32],
    [1199, 'tablet', true, 1100, 32],
    [1200, 'desktop', true, 1280, 48],
    [1440, 'desktop', true, 1280, 48],
  ])('%i selects %s mode', (width, mode, wide, maxWidth, padding) => {
    expect(getResponsiveLayout(width)).toMatchObject({ mode, wide, maxWidth, padding });
  });
});

describe('footer actions', () => {
  let tree;

  afterEach(() => {
    if (tree) act(() => tree.unmount());
    tree = null;
    jest.restoreAllMocks();
  });

  function renderFooter(width) {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
    act(() => {
      tree = create(<ScreenLayout title="Schedule a show" footer={<Text>Continue</Text>} />);
    });
    return StyleSheet.flatten(tree.root.findAll((node) => node.props.testID === 'footer-actions')[0].props.style);
  }

  test('are centered in a readable column on wide screens', () => {
    const style = renderFooter(1280);
    expect(style.alignSelf).toBe('center');
    expect(style.maxWidth).toBe(360);
  });

  test('span the full width on phones', () => {
    const style = renderFooter(390);
    expect(style.width).toBe('100%');
    expect(style.maxWidth).toBeUndefined();
  });
});
