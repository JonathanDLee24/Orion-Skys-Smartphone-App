import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, TextInput as ReactNativeTextInput } from 'react-native';
import { useAccessibility, useTapTargets } from './AccessibilityProvider';
import { highContrastTextColor } from '../theme';

// Text inputs follow the same text-size and contrast rules as AppText, and grow
// with the large tap-target option.
const AppTextInput = forwardRef(function AppTextInput({ style, ...rest }, ref) {
  const { fontScale, highContrast } = useAccessibility();
  const tapTargets = useTapTargets();

  const resolvedStyle = useMemo(() => {
    if (fontScale === 1 && !highContrast && !tapTargets.style) return style;
    const flat = StyleSheet.flatten(style);
    if (!flat) return style;
    const next = { ...flat };
    if (fontScale !== 1) {
      if (typeof flat.fontSize === 'number') next.fontSize = Math.round(flat.fontSize * fontScale * 10) / 10;
      if (typeof flat.lineHeight === 'number') next.lineHeight = Math.round(flat.lineHeight * fontScale);
    }
    if (highContrast) {
      const mapped = highContrastTextColor(flat.color);
      if (mapped) next.color = mapped;
    }
    if (tapTargets.style) next.minHeight = Math.max(flat.minHeight || 0, tapTargets.minHeight);
    return next;
  }, [style, fontScale, highContrast, tapTargets]);

  return <ReactNativeTextInput ref={ref} {...rest} style={resolvedStyle} />;
});

export default AppTextInput;
