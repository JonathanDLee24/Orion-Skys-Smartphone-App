import React from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';
import { colors } from '../theme';

// Decorative icon: hide it from screen readers. On web, react-native-svg passes props
// straight to the DOM <svg>, where `accessible`/`focusable={false}` are invalid attributes.
const HIDDEN_PROPS = Platform.OS === 'web'
  ? { 'aria-hidden': true }
  : { accessible: false, focusable: false };

const ROTORS = [
  { cx: 16, cy: 16 },
  { cx: 48, cy: 16 },
  { cx: 16, cy: 48 },
  { cx: 48, cy: 48 },
];

export default function DroneGlyph({ size = 64, color = colors.accent, bodyColor = colors.background }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" {...HIDDEN_PROPS}>
      <G opacity={0.5}>
        {ROTORS.map(({ cx, cy }) => (
          <G key={`${cx}-${cy}`}>
            <Circle cx={cx} cy={cy} r={9} stroke={color} strokeWidth={1.3} fill="none" />
            <Line x1={cx - 9} y1={cy} x2={cx + 9} y2={cy} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
            <Circle cx={cx} cy={cy} r={1.8} fill={color} />
          </G>
        ))}
      </G>
      <Line x1={19} y1={19} x2={45} y2={45} stroke={color} strokeWidth={2.6} strokeLinecap="round" />
      <Line x1={45} y1={19} x2={19} y2={45} stroke={color} strokeWidth={2.6} strokeLinecap="round" />
      <Line x1={26} y1={43} x2={24} y2={49} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={38} y1={43} x2={40} y2={49} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={23} y={22} width={18} height={20} rx={6} fill={color} />
      <Rect x={27} y={26} width={10} height={3.5} rx={1.75} fill={bodyColor} opacity={0.65} />
      <Circle cx={32} cy={36} r={3.4} fill={bodyColor} />
      <Circle cx={32} cy={36} r={1.4} fill={color} />
    </Svg>
  );
}
