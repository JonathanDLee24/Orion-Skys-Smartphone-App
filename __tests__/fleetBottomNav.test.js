import React from 'react';
import { act, create } from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';
import FleetBottomNav from '../src/components/FleetBottomNav';
import { colors } from '../src/theme';

global.IS_REACT_ACT_ENVIRONMENT = true;

const flatten = (node) => StyleSheet.flatten(node?.props?.style) || {};

const tab = (tree, label) => tree.root
  .findAll((node) => node.props.accessibilityLabel === `${label} navigation` && node.props.accessibilityState)
  [0];

const paintsIn = (node) => node
  .findAll(() => true)
  .map((child) => flatten(child))
  .flatMap((style) => [style.color, style.borderColor, style.backgroundColor])
  .filter(Boolean);

// OSPSA-63: the fleet shell is shared by the manifest and the LAANC dashboard.
// Keep the active tab on the lime accent and the bar on the card surface so a
// later merge cannot quietly restore the old cyan / #0B111C treatment.
test.each(['LAANC', 'AIRSPACE'])(
  'fleet tab bar uses the lime theme when %s is active',
  async (activeTab) => {
    let tree;
    await act(async () => {
      tree = create(<FleetBottomNav active={activeTab} />);
    });

    const bar = tree.root.findAll((node) => node.props.accessibilityRole === 'tablist')[0];
    const barStyle = flatten(bar);
    expect(barStyle.backgroundColor).toBe(colors.card);
    expect(barStyle.backgroundColor).not.toBe(colors.cyan);
    expect(barStyle.backgroundColor).not.toBe('#0B111C');

    const active = tab(tree, activeTab);
    expect(active.props.accessibilityState.selected).toBe(true);

    const activeLabel = active.findAllByType(Text).find((node) => node.props.children === activeTab);
    expect(flatten(activeLabel).color).toBe(colors.accent);
    expect(flatten(activeLabel).color).not.toBe(colors.cyan);

    const activePaints = paintsIn(active);
    expect(activePaints).toContain(colors.accent);
    expect(activePaints).not.toContain(colors.cyan);
    expect(activePaints).not.toContain('#00E5FF');

    for (const label of ['MAP', 'AIRSPACE', 'LAANC', 'NOTAM', 'PAIR']) {
      if (label === activeTab) continue;
      const inactive = tab(tree, label);
      expect(inactive.props.accessibilityState.selected).toBe(false);
      const inactiveLabel = inactive.findAllByType(Text).find((node) => node.props.children === label);
      expect(flatten(inactiveLabel).color).toBe(colors.muted);
    }

    expect(paintsIn(bar)).not.toContain(colors.cyan);
    expect(paintsIn(bar)).not.toContain('#00E5FF');

    await act(async () => tree.unmount());
  },
);
