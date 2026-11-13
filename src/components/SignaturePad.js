import React, { useCallback, useEffect, useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, monoFont } from '../theme';

const STROKE_WIDTH = 2.5;

function pointFromEvent(event) {
  const { locationX, locationY } = event.nativeEvent;
  return { x: Number(locationX) || 0, y: Number(locationY) || 0 };
}

function pathFor(stroke) {
  return stroke
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' ');
}

export default function SignaturePad({
  strokes = [],
  onChange,
  placeholder = 'Draw your signature here',
  disabled = false,
  height = 190,
  testID = 'signature-pad',
}) {
  const strokesRef = useRef(strokes);
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);
  onChangeRef.current = onChange;
  disabledRef.current = disabled;

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  const emit = useCallback((next) => {
    strokesRef.current = next;
    onChangeRef.current?.(next);
  }, []);

  const responder = useRef(null);
  if (!responder.current) {
    responder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        emit([...strokesRef.current, [pointFromEvent(event)]]);
      },
      onPanResponderMove: (event) => {
        const current = strokesRef.current;
        if (!current.length) return;
        const last = current[current.length - 1];
        emit([...current.slice(0, -1), [...last, pointFromEvent(event)]]);
      },
    });
  }

  const visibleStrokes = strokes.filter((stroke) => Array.isArray(stroke) && stroke.length > 0);

  return (
    <View
      testID={testID}
      accessibilityLabel="Signature drawing pad"
      accessibilityHint="Draw your signature with your finger or stylus"
      style={[styles.pad, { height }, disabled && styles.disabled]}
      {...responder.current.panHandlers}
    >
      <Svg width="100%" height="100%">
        {visibleStrokes.map((stroke, index) => (stroke.length === 1
          ? <Circle key={`dot-${index}`} cx={stroke[0].x} cy={stroke[0].y} r={STROKE_WIDTH / 2} fill={colors.text} />
          : (
            <Path
              key={`stroke-${index}`}
              d={pathFor(stroke)}
              stroke={colors.text}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )))}
      </Svg>
      {!visibleStrokes.length && (
        <View pointerEvents="none" style={styles.placeholderLayer}>
          <Text style={styles.placeholder}>{placeholder}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    width: '100%',
    backgroundColor: colors.field,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  disabled: { opacity: 0.5 },
  placeholderLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  placeholder: { color: colors.muted, fontFamily: monoFont, fontSize: 11, textAlign: 'center' },
});
