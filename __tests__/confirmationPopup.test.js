import React from 'react';
import { act, create } from 'react-test-renderer';
import ConfirmationPopup from '../src/components/ConfirmationPopup';

global.IS_REACT_ACT_ENVIRONMENT = true;

// The JS driver is used here because native-driven values never update under
// Jest; the fade logic is the same either way.
function Harness({ message, showKey, onHide }) {
  return <ConfirmationPopup message={message} showKey={showKey} onHide={onHide} useNativeDriver={false} testID="popup" />;
}

const layerOpacity = (tree) => {
  const layer = tree.root.findAll(
    (node) => typeof node.type !== 'string'
      && Array.isArray(node.props.style)
      && node.props.style.some((style) => style && style.zIndex === 20)
  )[0];
  if (!layer) return null;
  return layer.props.style.find((style) => style && style.opacity !== undefined).opacity.__getValue();
};
const tapToClose = (tree) => tree.root.find((node) => node.props.testID === 'popup' && node.props.onPress).props.onPress();

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('fades in from invisible when it first appears', async () => {
  let tree;
  await act(async () => { tree = create(<Harness message="Saved" showKey={1} onHide={jest.fn()} />); });
  expect(layerOpacity(tree)).toBe(0);
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(layerOpacity(tree)).toBe(1);
  await act(async () => tree.unmount());
});

test('a popup shown after a tap-dismissed one starts invisible instead of flashing in', async () => {
  let message = 'First';
  const onHide = jest.fn(() => { message = null; });
  let tree;
  await act(async () => { tree = create(<Harness message={message} showKey={1} onHide={onHide} />); });
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(layerOpacity(tree)).toBe(1);

  // Tapped while fully visible: it closes at once and resets its opacity.
  await act(async () => tapToClose(tree));
  expect(onHide).toHaveBeenCalledTimes(1);
  await act(async () => tree.update(<Harness message={null} showKey={1} onHide={onHide} />));
  expect(layerOpacity(tree)).toBeNull();

  await act(async () => tree.update(<Harness message="Second" showKey={2} onHide={onHide} />));
  expect(layerOpacity(tree)).toBe(0);
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(layerOpacity(tree)).toBe(1);

  await act(async () => tree.unmount());
});

test('replaying while visible stays visible, then still closes itself', async () => {
  const onHide = jest.fn();
  let tree;
  await act(async () => { tree = create(<Harness message="First" showKey={1} onHide={onHide} />); });
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(layerOpacity(tree)).toBe(1);

  await act(async () => tree.update(<Harness message="Second" showKey={2} onHide={onHide} />));
  expect(layerOpacity(tree)).toBe(1);
  await act(async () => { jest.advanceTimersByTime(100); });
  expect(layerOpacity(tree)).toBe(1);

  // The replay restarts the timer: no early close from the first popup's timer.
  await act(async () => { jest.advanceTimersByTime(1900); });
  expect(onHide).not.toHaveBeenCalled();
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(onHide).toHaveBeenCalledTimes(1);

  await act(async () => tree.unmount());
});
