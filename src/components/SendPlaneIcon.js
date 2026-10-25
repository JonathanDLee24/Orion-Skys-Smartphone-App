import React from 'react';
import { View } from 'react-native';

// Feather-style "send" paper plane. Drawn as thin rotated bars so it renders
// identically on iOS, Android and web without adding an icon-font dependency.
const VIEWBOX = 24;
const SEGMENTS = [
  [[22, 2], [15, 22]],
  [[15, 22], [11, 13]],
  [[11, 13], [2, 9]],
  [[2, 9], [22, 2]],
  [[22, 2], [11, 13]],
];

export default function SendPlaneIcon({ size = 18, color = '#000000', strokeWidth = 1.5 }) {
  const scale = size / VIEWBOX;

  return (
    <View accessible={false} style={{ width: size, height: size }}>
      {SEGMENTS.map(([[x1, y1], [x2, y2]], index) => {
        const dx = (x2 - x1) * scale;
        const dy = (y2 - y1) * scale;
        const length = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const centerX = ((x1 + x2) / 2) * scale;
        const centerY = ((y1 + y2) / 2) * scale;

        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              width: length,
              height: strokeWidth,
              borderRadius: strokeWidth / 2,
              backgroundColor: color,
              left: centerX - length / 2,
              top: centerY - strokeWidth / 2,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
    </View>
  );
}
