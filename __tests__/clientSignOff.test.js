import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text, TextInput } from 'react-native';
import ClientSignOffScreen from '../src/screens/ClientSignOffScreen';
import PrimaryButton from '../src/components/PrimaryButton';
import {
  DEFAULT_CREDENTIAL_PROFILE,
  buildSignatureRecord,
  clearSignOffSession,
  describeStrokes,
  formatSignatureTimestamp,
  formatVerificationDate,
  getLatestSignature,
  hasSignature,
  submitSignature,
} from '../src/services/signOffService';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const profile = DEFAULT_CREDENTIAL_PROFILE;
const strokes = [[{ x: 10, y: 20 }, { x: 30, y: 45 }]];

beforeEach(() => clearSignOffSession());

// PanResponder reads touchHistory to derive the gesture centroid, so tests must
// supply the same event shape a real touch produces.
function gestureEvent(x, y, previous = { x, y }) {
  const timestamp = Date.now();
  return {
    nativeEvent: { locationX: x, locationY: y, pageX: x, pageY: y, timestamp, touches: [], changedTouches: [], identifier: 0 },
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: timestamp,
      touchBank: [{
        touchActive: true,
        startPageX: x,
        startPageY: y,
        startTimeStamp: timestamp,
        currentPageX: x,
        currentPageY: y,
        currentTimeStamp: timestamp,
        previousPageX: previous.x,
        previousPageY: previous.y,
        previousTimeStamp: timestamp,
      }],
    },
  };
}

describe('signOffService', () => {
  test('drawing mode needs at least one stroke', () => {
    expect(hasSignature({ mode: 'draw', strokes: [] })).toBe(false);
    expect(() => buildSignatureRecord({ profile, mode: 'draw', strokes: [] })).toThrow('draw your signature');
  });

  test('keypad mode needs a typed name', () => {
    expect(hasSignature({ mode: 'keypad', typedName: '   ' })).toBe(false);
    expect(() => buildSignatureRecord({ profile, mode: 'keypad', typedName: '   ' })).toThrow('full legal name');
  });

  test('drawn record carries the credential details, a path, and a timestamp', async () => {
    const before = Date.now();
    const record = await submitSignature({ profile, mode: 'draw', strokes });
    expect(record).toMatchObject({
      signerName: profile.signerName,
      title: profile.title,
      company: profile.company,
      signatureType: 'draw',
      signatureText: '',
      pointCount: 2,
      status: 'signed',
    });
    expect(record.signaturePath).toBe('M10.0,20.0 L30.0,45.0');
    expect(new Date(record.timestamp).getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(getLatestSignature()).toEqual(record);
  });

  test('keypad record trims the typed name and stores no path', async () => {
    const record = await submitSignature({ profile, mode: 'keypad', typedName: '  Jordan Matthews  ' });
    expect(record.signatureType).toBe('keypad');
    expect(record.signatureText).toBe('Jordan Matthews');
    expect(record.signaturePath).toBe('');
    expect(record.pointCount).toBe(0);
  });

  test('stored records are copies, not live references', async () => {
    const saved = await submitSignature({ profile, mode: 'draw', strokes });
    saved.signerName = 'Someone Else';
    expect(getLatestSignature().signerName).toBe(profile.signerName);
  });

  test('describeStrokes renders one M/L segment per stroke', () => {
    expect(describeStrokes([])).toBe('');
    expect(describeStrokes([[], [{ x: 1, y: 2 }]])).toBe('M1.0,2.0');
    expect(describeStrokes([[{ x: 0, y: 0 }, { x: 5, y: 5 }], [{ x: 9, y: 9 }]])).toBe('M0.0,0.0 L5.0,5.0 M9.0,9.0');
  });

  test('an incomplete credential profile is rejected instead of saving blanks', () => {
    expect(() => buildSignatureRecord({ profile: { signerName: '', company: '' }, mode: 'keypad', typedName: 'Jo' }))
      .toThrow('credential profile is incomplete');
  });
});

describe('ClientSignOffScreen', () => {
  let tree;

  afterEach(async () => {
    if (tree) await act(async () => tree.unmount());
    tree = null;
  });

  async function render() {
    const navigation = { navigate: jest.fn() };
    await act(async () => {
      tree = create(<ClientSignOffScreen route={{ params: { profile } }} navigation={navigation} />);
    });
    return navigation;
  }

  const text = () => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
  const byTestID = (id) => tree.root.findAll((node) => node.props.testID === id && node.type === 'Text');
  const pad = () => tree.root.findAll((node) => node.props.testID === 'signature-pad' && node.props.onResponderGrant)[0];
  const press = (label) => act(async () => {
    tree.root.findAll((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function')[0].props.onPress();
  });

  test('shows the pre-filled credential profile as read-only text', async () => {
    await render();
    expect(byTestID('credential-signer-name')[0].props.children).toBe(profile.signerName);
    expect(byTestID('credential-title')[0].props.children).toBe(profile.title);
    expect(byTestID('credential-company')[0].props.children).toBe(profile.company);
    expect(byTestID('credential-verification-date')[0].props.children).toBe(formatVerificationDate(profile.verifiedAt));
    const inputs = tree.root.findAllByType(TextInput);
    expect(inputs).toHaveLength(1);
    expect(inputs[0].props.testID).toBe('typed-signature');
    expect(inputs[0].props.value).toBe('');
    expect(text()).toContain('cannot be edited here');
  });

  test('pulls the default verified client when routed without a profile', async () => {
    await act(async () => {
      tree = create(<ClientSignOffScreen route={{ params: {} }} navigation={{ navigate: jest.fn() }} />);
    });
    expect(byTestID('credential-signer-name')[0].props.children).toBe(DEFAULT_CREDENTIAL_PROFILE.signerName);
    expect(byTestID('credential-title')[0].props.children).toBe(DEFAULT_CREDENTIAL_PROFILE.title);
    expect(byTestID('credential-company')[0].props.children).toBe(DEFAULT_CREDENTIAL_PROFILE.company);
  });

  test('Submit stays disabled until a signature is drawn or typed', async () => {
    await render();
    expect(tree.root.findByType(PrimaryButton).props.disabled).toBe(true);
    expect(text()).toContain('AWAITING SIGNATURE');

    await act(async () => tree.root.findByType(TextInput).props.onChangeText('Jordan Matthews'));
    expect(tree.root.findByType(PrimaryButton).props.disabled).toBe(false);
    expect(text()).toContain('SIGNATURE CAPTURED');

    await act(async () => tree.root.findByType(TextInput).props.onChangeText('   '));
    expect(tree.root.findByType(PrimaryButton).props.disabled).toBe(true);

    await act(async () => pad().props.onResponderGrant(gestureEvent(14, 22)));
    expect(tree.root.findByType(PrimaryButton).props.disabled).toBe(false);
  });

  test('submit without a signature shows an error and saves nothing', async () => {
    await render();
    await act(async () => tree.root.findByType(PrimaryButton).props.onPress());
    expect(text()).toContain('Please draw or type your signature before submitting.');
    expect(getLatestSignature()).toBeNull();
  });

  test('drawing hides the placeholder, and Submit saves the signature with a timestamp', async () => {
    await render();
    expect(text()).toContain('Draw your signature here');

    await act(async () => pad().props.onResponderGrant(gestureEvent(14, 22)));
    await act(async () => pad().props.onResponderMove(gestureEvent(48, 60, { x: 14, y: 22 })));

    expect(text()).not.toContain('Draw your signature here');
    expect(tree.root.findByType(PrimaryButton).props.disabled).toBe(false);

    await act(async () => tree.root.findByType(PrimaryButton).props.onPress());

    const saved = getLatestSignature();
    expect(saved).toMatchObject({
      signerName: profile.signerName,
      title: profile.title,
      company: profile.company,
      signatureType: 'draw',
      pointCount: 2,
    });
    expect(saved.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(text()).toContain('Authorization signed');
    expect(byTestID('signed-timestamp')[0].props.children).toBe(formatSignatureTimestamp(saved.timestamp));
    expect(tree.root.findByType(PrimaryButton).props.disabled).toBe(true);
  });

  test('Clear Signature erases both inputs and disables Submit again', async () => {
    await render();
    await act(async () => pad().props.onResponderGrant(gestureEvent(20, 20)));
    await act(async () => tree.root.findByType(TextInput).props.onChangeText('Jordan Matthews'));
    expect(tree.root.findByType(PrimaryButton).props.disabled).toBe(false);

    await press('Clear Signature');
    expect(text()).toContain('Draw your signature here');
    expect(tree.root.findByType(TextInput).props.value).toBe('');
    expect(tree.root.findByType(PrimaryButton).props.disabled).toBe(true);
    expect(getLatestSignature()).toBeNull();
  });

  test('typing a name below the pad signs and submits without drawing', async () => {
    await render();
    expect(tree.root.findByType(PrimaryButton).props.disabled).toBe(true);

    await act(async () => tree.root.findByType(TextInput).props.onChangeText('Jordan Matthews'));
    expect(tree.root.findByType(PrimaryButton).props.disabled).toBe(false);

    await act(async () => tree.root.findByType(PrimaryButton).props.onPress());

    expect(getLatestSignature()).toMatchObject({ signatureType: 'keypad', signatureText: 'Jordan Matthews' });
    expect(text()).toContain('Keypad input');
  });

  test('a drawn signature takes precedence when a name is also typed', async () => {
    await render();
    await act(async () => pad().props.onResponderGrant(gestureEvent(20, 20)));
    await act(async () => tree.root.findByType(TextInput).props.onChangeText('Jordan Matthews'));
    await act(async () => tree.root.findByType(PrimaryButton).props.onPress());

    expect(getLatestSignature()).toMatchObject({ signatureType: 'draw', pointCount: 1, signatureText: '' });
  });
});
