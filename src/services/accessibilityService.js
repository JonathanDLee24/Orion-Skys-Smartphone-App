import { useSyncExternalStore } from 'react';

// Accessibility preferences are kept in memory for this prototype, like the
// other services in this folder. Replace with GET/PUT
// /api/clients/me/accessibility when a backend exists.
export const TEXT_SIZE_OPTIONS = [
  { value: 'normal', label: 'Normal', factor: 1, description: 'Default app text size' },
  { value: 'large', label: 'Large', factor: 1.25, description: '25% larger text' },
  { value: 'largest', label: 'Largest', factor: 1.5, description: '50% larger text' },
];

export const defaultAccessibilityPreferences = {
  enabled: false,
  textSize: 'normal',
  highContrast: false,
  largeTargets: false,
  reduceMotion: false,
};

export const TEXT_SIZE_VALUES = TEXT_SIZE_OPTIONS.map((option) => option.value);

export function textScaleFactor(textSize) {
  const option = TEXT_SIZE_OPTIONS.find((entry) => entry.value === textSize);
  return option ? option.factor : 1;
}

// The master toggle gates every option, so turning accessibility mode off goes
// back to the stock app without losing the choices picked underneath it.
export function resolveAccessibilityPreferences(preferences) {
  const merged = { ...defaultAccessibilityPreferences, ...(preferences || {}) };
  const enabled = merged.enabled === true;
  return {
    enabled,
    textSize: TEXT_SIZE_VALUES.includes(merged.textSize) ? merged.textSize : 'normal',
    fontScale: enabled ? textScaleFactor(merged.textSize) : 1,
    highContrast: enabled && merged.highContrast === true,
    largeTargets: enabled && merged.largeTargets === true,
    reduceMotion: enabled && merged.reduceMotion === true,
  };
}

let currentPreferences = { ...defaultAccessibilityPreferences };
const listeners = new Set();

export function getAccessibilityPreferences() {
  return currentPreferences;
}

export function subscribeAccessibilityPreferences(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(nextPreferences) {
  currentPreferences = nextPreferences;
  listeners.forEach((listener) => listener());
}

export function setAccessibilityPreferences(patch) {
  publish({ ...currentPreferences, ...patch });
  return currentPreferences;
}

export function resetAccessibilityPreferences() {
  publish({ ...defaultAccessibilityPreferences });
}

export function useAccessibilityPreferences() {
  return useSyncExternalStore(
    subscribeAccessibilityPreferences,
    getAccessibilityPreferences,
    getAccessibilityPreferences,
  );
}
