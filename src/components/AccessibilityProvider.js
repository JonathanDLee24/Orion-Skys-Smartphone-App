import React, { createContext, useContext, useMemo } from 'react';
import {
  defaultAccessibilityPreferences,
  getAccessibilityPreferences,
  resolveAccessibilityPreferences,
  resetAccessibilityPreferences,
  setAccessibilityPreferences,
  subscribeAccessibilityPreferences,
  useAccessibilityPreferences,
} from '../services/accessibilityService';
import { colors, highContrastColors } from '../theme';

const FALLBACK = {
  ...resolveAccessibilityPreferences(defaultAccessibilityPreferences),
  preferences: defaultAccessibilityPreferences,
  setPreferences: setAccessibilityPreferences,
  resetPreferences: resetAccessibilityPreferences,
};

const AccessibilityContext = createContext(FALLBACK);

// App-wide accessibility state. Screens and shared components read the
// resolved values (fontScale, highContrast, largeTargets, reduceMotion) while
// the settings screen also reads and writes the raw preferences.
export function AccessibilityProvider({ children }) {
  const preferences = useAccessibilityPreferences();
  const value = useMemo(() => ({
    ...resolveAccessibilityPreferences(preferences),
    preferences,
    setPreferences: setAccessibilityPreferences,
    resetPreferences: resetAccessibilityPreferences,
  }), [preferences]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

// Palette with the high-contrast tokens merged in. Everything that paints
// surfaces, borders or muted copy should read colours from here.
export function useAccessibilityColors() {
  const { highContrast } = useAccessibility();
  return useMemo(() => (highContrast ? { ...colors, ...highContrastColors } : colors), [highContrast]);
}

// Minimum tap size for interactive chrome. `style` is null in the default mode
// so the pre-existing layouts keep their own measurements.
export function useTapTargets() {
  const { largeTargets } = useAccessibility();
  return useMemo(() => ({
    largeTargets,
    minHeight: largeTargets ? 56 : 44,
    minWidth: largeTargets ? 56 : 44,
    hitSlop: largeTargets ? 8 : 0,
    style: largeTargets ? { minHeight: 56, minWidth: 56 } : null,
  }), [largeTargets]);
}
