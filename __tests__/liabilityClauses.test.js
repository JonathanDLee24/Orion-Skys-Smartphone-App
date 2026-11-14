import React from 'react';
import { act, create } from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';
import LiabilityClausesScreen from '../src/screens/LiabilityClausesScreen';
import ShowAuthorizationScreen from '../src/screens/ShowAuthorizationScreen';
import { DEMO_EVENTS } from '../src/services/eventFeedService';
import {
  acceptLiabilityClauses,
  clearLiabilityAcceptances,
  getCheckedClauseIds,
  isLiabilityAccepted,
  LIABILITY_CLAUSES,
} from '../src/services/liabilityClausesService';
import { colors } from '../src/theme';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => clearLiabilityAcceptances());

const submission = DEMO_EVENTS[0];
const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
const byTestID = (tree, id) => tree.root.findAll((node) => node.props.testID === id && typeof node.type !== 'string')[0];
const clause = (tree, id) => tree.root.find((node) => node.props.testID === `clause-${id}` && node.props.onPress);
const proceed = (tree) => tree.root.find((node) => node.props.testID === 'liability-proceed' && node.props.onPress);
const selectAll = (tree) => tree.root.find((node) => node.props.accessibilityLabel === 'Select all clauses' && node.props.onPress);
const cardStyle = (tree, id) => StyleSheet.flatten(clause(tree, id).props.style({ pressed: false }));

async function render(navigation = { navigate: jest.fn() }, show = submission) {
  let tree;
  await act(async () => {
    tree = create(<LiabilityClausesScreen route={{ params: { submission: show } }} navigation={navigation} />);
  });
  return tree;
}

test('lists every required clause with its title, description and an unchecked checkbox', async () => {
  const tree = await render();
  const text = textOf(tree);

  expect(text).toContain('COMPLIANCE CHECK');
  expect(text).toContain('Liability Clauses');
  expect(text).toContain('● REQUIRED');
  LIABILITY_CLAUSES.forEach((item) => {
    expect(text).toContain(item.title);
    expect(text).toContain(item.description);
    expect(text).toContain(item.id);
    expect(clause(tree, item.id).props.accessibilityState).toEqual({ checked: false });
  });
  expect(text).toContain(`0 / ${LIABILITY_CLAUSES.length} COMPLETED`);

  await act(async () => tree.unmount());
});

test('checking a clause highlights its card and advances the agreement gauge', async () => {
  const tree = await render();
  expect(cardStyle(tree, 'L-01').borderColor).not.toBe(colors.accent);

  await act(async () => clause(tree, 'L-01').props.onPress());
  await act(async () => clause(tree, 'L-02').props.onPress());

  expect(clause(tree, 'L-01').props.accessibilityState).toEqual({ checked: true });
  expect(cardStyle(tree, 'L-01').borderColor).toBe(colors.accent);
  expect(textOf(tree)).toContain('2 / 5 COMPLETED');
  expect(StyleSheet.flatten(byTestID(tree, 'agreement-fill').props.style).width).toBe('40%');

  // Tapping again unchecks it.
  await act(async () => clause(tree, 'L-01').props.onPress());
  expect(clause(tree, 'L-01').props.accessibilityState).toEqual({ checked: false });
  expect(textOf(tree)).toContain('1 / 5 COMPLETED');

  await act(async () => tree.unmount());
});

test('select all checks and unchecks every clause at once', async () => {
  const tree = await render();

  await act(async () => selectAll(tree).props.onPress());
  LIABILITY_CLAUSES.forEach((item) => {
    expect(clause(tree, item.id).props.accessibilityState).toEqual({ checked: true });
  });
  expect(textOf(tree)).toContain('5 / 5 COMPLETED');
  expect(selectAll(tree).props.accessibilityState).toEqual({ checked: true });

  await act(async () => selectAll(tree).props.onPress());
  LIABILITY_CLAUSES.forEach((item) => {
    expect(clause(tree, item.id).props.accessibilityState).toEqual({ checked: false });
  });
  expect(textOf(tree)).toContain('0 / 5 COMPLETED');

  await act(async () => tree.unmount());
});

test('proceed stays disabled and counts the remaining clauses until all are accepted', async () => {
  const navigation = { navigate: jest.fn() };
  const tree = await render(navigation);

  expect(proceed(tree).props.disabled).toBe(true);
  expect(textOf(tree)).toContain('Proceed (5 clauses remain)');

  for (const item of LIABILITY_CLAUSES.slice(0, 4)) {
    await act(async () => clause(tree, item.id).props.onPress());
  }
  expect(proceed(tree).props.disabled).toBe(true);
  expect(textOf(tree)).toContain('Proceed (1 clause remains)');

  await act(async () => clause(tree, 'L-05').props.onPress());
  expect(proceed(tree).props.disabled).toBe(false);
  expect(textOf(tree)).not.toContain('remain');

  expect(isLiabilityAccepted(submission.id)).toBe(false);
  await act(async () => proceed(tree).props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('ShowAuthorization', {
    submission,
    acceptedNotice: expect.any(Number),
  });
  expect(isLiabilityAccepted(submission.id)).toBe(true);

  await act(async () => tree.unmount());
});

test('show authorization opens liability clauses and marks them accepted on return', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<ShowAuthorizationScreen route={{ params: { submission } }} navigation={navigation} />);
  });
  expect(textOf(tree)).not.toContain('ACCEPTED');

  const liability = tree.root.find((node) => node.props.accessibilityLabel === 'Liability Clauses' && node.props.onPress);
  await act(async () => liability.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('LiabilityClauses', { submission });
  await act(async () => tree.unmount());

  await act(async () => {
    tree = create(<ShowAuthorizationScreen route={{ params: { submission } }} navigation={navigation} />);
  });
  expect(textOf(tree)).not.toContain('ACCEPTED');

  // The open screen picks up the acceptance as soon as it is recorded.
  await act(async () => { acceptLiabilityClauses(submission.id); });
  expect(textOf(tree)).toContain('✓ ACCEPTED');
  await act(async () => tree.unmount());
});

test('acceptance is remembered per show', async () => {
  const otherShow = DEMO_EVENTS[1];
  let tree = await render();
  await act(async () => selectAll(tree).props.onPress());
  await act(async () => proceed(tree).props.onPress());
  await act(async () => tree.unmount());

  // Reopening the accepted show restores every checkbox and an enabled Proceed.
  tree = await render();
  LIABILITY_CLAUSES.forEach((item) => {
    expect(clause(tree, item.id).props.accessibilityState).toEqual({ checked: true });
  });
  expect(textOf(tree)).toContain('5 / 5 COMPLETED');
  expect(proceed(tree).props.disabled).toBe(false);
  await act(async () => tree.unmount());

  // A different show starts from scratch.
  tree = await render(undefined, otherShow);
  expect(textOf(tree)).toContain('0 / 5 COMPLETED');
  expect(proceed(tree).props.disabled).toBe(true);
  await act(async () => tree.unmount());

  let authorization;
  await act(async () => {
    authorization = create(
      <ShowAuthorizationScreen route={{ params: { submission: otherShow } }} navigation={{ navigate: jest.fn() }} />
    );
  });
  expect(textOf(authorization)).not.toContain('ACCEPTED');
  await act(async () => authorization.unmount());

  await act(async () => {
    authorization = create(
      <ShowAuthorizationScreen route={{ params: { submission } }} navigation={{ navigate: jest.fn() }} />
    );
  });
  expect(textOf(authorization)).toContain('✓ ACCEPTED');
  await act(async () => authorization.unmount());
});

test('backing out without proceeding does not record an acceptance', async () => {
  const navigation = { navigate: jest.fn() };
  const tree = await render(navigation);
  await act(async () => selectAll(tree).props.onPress());

  const back = tree.root.find((node) => node.props.accessibilityLabel === 'Back to show authorization' && node.props.onPress);
  await act(async () => back.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('ShowAuthorization', { submission });
  expect(isLiabilityAccepted(submission.id)).toBe(false);

  await act(async () => tree.unmount());
});

test('the checked boxes are remembered per show, even before Proceed', async () => {
  let tree = await render();
  await act(async () => clause(tree, 'L-01').props.onPress());
  await act(async () => clause(tree, 'L-03').props.onPress());
  await act(async () => tree.unmount());

  expect(getCheckedClauseIds(submission.id)).toEqual(['L-01', 'L-03']);
  expect(isLiabilityAccepted(submission.id)).toBe(false);

  tree = await render();
  expect(clause(tree, 'L-01').props.accessibilityState).toEqual({ checked: true });
  expect(clause(tree, 'L-02').props.accessibilityState).toEqual({ checked: false });
  expect(clause(tree, 'L-03').props.accessibilityState).toEqual({ checked: true });
  expect(textOf(tree)).toContain('2 / 5 COMPLETED');
  await act(async () => tree.unmount());

  tree = await render(undefined, DEMO_EVENTS[1]);
  expect(textOf(tree)).toContain('0 / 5 COMPLETED');
  await act(async () => tree.unmount());
});

test('unchecking a box after accepting withdraws the acceptance', async () => {
  let tree = await render();
  await act(async () => selectAll(tree).props.onPress());
  await act(async () => proceed(tree).props.onPress());
  await act(async () => tree.unmount());
  expect(isLiabilityAccepted(submission.id)).toBe(true);

  // Come back, uncheck one clause and leave with the back button.
  tree = await render();
  await act(async () => clause(tree, 'L-04').props.onPress());
  const back = tree.root.find((node) => node.props.accessibilityLabel === 'Back to show authorization' && node.props.onPress);
  await act(async () => back.props.onPress());
  await act(async () => tree.unmount());

  expect(isLiabilityAccepted(submission.id)).toBe(false);
  expect(getCheckedClauseIds(submission.id)).toEqual(['L-01', 'L-02', 'L-03', 'L-05']);

  let authorization;
  await act(async () => {
    authorization = create(
      <ShowAuthorizationScreen route={{ params: { submission } }} navigation={{ navigate: jest.fn() }} />
    );
  });
  expect(textOf(authorization)).not.toContain('ACCEPTED');
  await act(async () => authorization.unmount());

  // The unchecked clause is still unchecked on return, and re-checking it
  // alone is not enough: the pilot must press Proceed again.
  tree = await render();
  expect(clause(tree, 'L-04').props.accessibilityState).toEqual({ checked: false });
  expect(textOf(tree)).toContain('Proceed (1 clause remains)');
  await act(async () => clause(tree, 'L-04').props.onPress());
  expect(isLiabilityAccepted(submission.id)).toBe(false);
  await act(async () => proceed(tree).props.onPress());
  expect(isLiabilityAccepted(submission.id)).toBe(true);
  await act(async () => tree.unmount());
});

describe('accepted popup', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const popupText = (tree) => tree.root.findAll(
    (node) => node.props.testID === 'liability-accepted-popup' && typeof node.props.onPress === 'function'
  );

  test('Show Authorization shows "Liability Clauses accepted" with a checkmark after Proceed', async () => {
    acceptLiabilityClauses(submission.id);
    const navigation = { navigate: jest.fn(), setParams: jest.fn() };
    let tree;
    await act(async () => {
      tree = create(
        <ShowAuthorizationScreen route={{ params: { submission, acceptedNotice: 1 } }} navigation={navigation} />
      );
    });

    expect(popupText(tree).length).toBeGreaterThan(0);
    expect(textOf(tree)).toContain('Liability Clauses accepted');
    expect(textOf(tree)).toContain('✓');

    // It closes itself after a moment and clears the notice.
    await act(async () => { jest.advanceTimersByTime(3000); });
    expect(popupText(tree)).toHaveLength(0);
    expect(textOf(tree)).not.toContain('Liability Clauses accepted');
    expect(navigation.setParams).toHaveBeenCalledWith({ acceptedNotice: undefined });

    await act(async () => tree.unmount());
  });

  test('a tap anywhere on screen closes the popup, and no popup shows without a notice', async () => {
    const navigation = { navigate: jest.fn() };
    let tree;
    await act(async () => {
      tree = create(
        <ShowAuthorizationScreen route={{ params: { submission, acceptedNotice: 2 } }} navigation={navigation} />
      );
    });

    // The tap target is a full-screen layer, not just the popup card.
    const [target] = popupText(tree);
    expect(StyleSheet.flatten(target.props.style)).toEqual(expect.objectContaining({ flex: 1 }));
    const layerStyles = tree.root
      .findAll((node) => typeof node.type === 'string' && node.props.style)
      .map((node) => StyleSheet.flatten(node.props.style))
      .filter((style) => style.zIndex === 20);
    expect(layerStyles).toHaveLength(1);
    expect(layerStyles[0]).toEqual(
      expect.objectContaining({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 })
    );

    await act(async () => target.props.onPress());
    expect(popupText(tree)).toHaveLength(0);
    // The closing tap does not also press anything underneath.
    expect(navigation.navigate).not.toHaveBeenCalled();
    await act(async () => tree.unmount());

    await act(async () => {
      tree = create(<ShowAuthorizationScreen route={{ params: { submission } }} navigation={{ navigate: jest.fn() }} />);
    });
    expect(textOf(tree)).not.toContain('Liability Clauses accepted');
    await act(async () => tree.unmount());
  });
});
