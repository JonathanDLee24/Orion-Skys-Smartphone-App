import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, Text as ReactNativeText } from 'react-native';
import { useAccessibility } from './AccessibilityProvider';
import { highContrastTextColor } from '../theme';

// Multiplies every numeric fontSize/lineHeight in a (possibly nested) style
// value and brightens dim text colours in high-contrast mode. Returns the
// original style untouched when no option is active so nothing changes for
// users who leave accessibility mode off.
export function scaleTextStyle(style, fontScale = 1, highContrast = false) {
  if (!style || (fontScale === 1 && !highContrast)) return style;
  const flat = StyleSheet.flatten(style);
  if (!flat) return style;
  const next = { ...flat };

  if (fontScale !== 1) {
    if (typeof flat.fontSize === 'number') {
      next.fontSize = Math.round(flat.fontSize * fontScale * 10) / 10;
    }
    if (typeof flat.lineHeight === 'number') {
      next.lineHeight = Math.round(flat.lineHeight * fontScale);
    }
  }

  if (highContrast) {
    const mapped = highContrastTextColor(flat.color);
    if (mapped) next.color = mapped;
  }

  return next;
}

// Every screen imports Text from here instead of react-native so the text-size
// choice and high-contrast colours reach the whole app from one place.
const AppText = forwardRef(function AppText({ style, ...rest }, ref) {
  const { fontScale, highContrast } = useAccessibility();
  const scaledStyle = useMemo(
    () => scaleTextStyle(style, fontScale, highContrast),
    [style, fontScale, highContrast],
  );

  return <ReactNativeText ref={ref} {...rest} style={scaledStyle} />;
});

export default AppText;
