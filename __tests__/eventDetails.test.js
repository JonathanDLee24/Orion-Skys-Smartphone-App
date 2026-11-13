import React from 'react';
import { act, create } from 'react-test-renderer';
import EventDetailsScreen from '../src/screens/EventDetailsScreen';

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: false, assets: [{ name: 'show-brief.pdf' }] })),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

function textOf(tree) {
  return tree.root.findAllByType('Text').map((node) => node.props.children).flat().join(' ').replace(/\s+/g, ' ').trim();
}

function navigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

test('event details screen renders the Jira event profile and required sections', () => {
  let tree;
  act(() => { tree = create(<EventDetailsScreen route={{}} navigation={navigation()} />); });
  const text = textOf(tree);

  expect(text).toContain('EVENT // DSO-EVT-261114');
  expect(text).toContain('Apex Global Summit');
  expect(text).toContain('Sat, 14 Nov 2026 · 8:00 PM');
  expect(text).toContain('Marina Bay Event Deck');
  expect(text).toContain('200 drones · custom choreography');
  expect(text).toContain('Your show brief is still needed');
  expect(text).toContain('MANAGE YOUR EVENT');
  expect(text).toContain('Message show coordinator');
  expect(text).toContain('Request cancellation');
});

test('upload action records a selected brief and management rows route to a secondary view', async () => {
  const nav = navigation();
  let tree;
  act(() => { tree = create(<EventDetailsScreen route={{}} navigation={nav} />); });

  await act(async () => tree.root.findByProps({ testID: 'upload-show-brief' }).props.onPress());
  expect(textOf(tree)).toContain('SELECTED // show-brief.pdf');

  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Contracts & documents' }).props.onPress());
  expect(nav.navigate).toHaveBeenCalledWith('EventAction', expect.objectContaining({ title: 'Contracts & documents' }));

  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Request cancellation' }).props.onPress());
  expect(nav.navigate).toHaveBeenCalledWith('BookingManage', expect.any(Object));
});
