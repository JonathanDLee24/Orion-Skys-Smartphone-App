import { useSyncExternalStore } from 'react';
import { defaultNotificationSettings } from '../mockData';

export const settingsServiceConfig = {
  simulateFailure: process.env.EXPO_PUBLIC_SIMULATE_SETTINGS_FAILURE === 'true',
};

function clonePreferences(preferences) {
  return {
    notifications: { ...preferences.notifications },
    language: preferences.language,
    timeZone: preferences.timeZone,
  };
}

// In-memory preference store shared by account settings and the booking wizard.
// Replace with GET /api/clients/me/settings when the backend exists.
let currentPreferences = clonePreferences(defaultNotificationSettings);
const listeners = new Set();

export function getSettingsPreferences() {
  return currentPreferences;
}

export function subscribeSettingsPreferences(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function updateSettingsPreferences(nextPreferences) {
  currentPreferences = clonePreferences(nextPreferences);
  listeners.forEach((listener) => listener());
}

export function resetSettingsPreferences() {
  updateSettingsPreferences(defaultNotificationSettings);
}

export function useTimeZonePreference() {
  const preferences = useSyncExternalStore(
    subscribeSettingsPreferences,
    getSettingsPreferences,
    getSettingsPreferences,
  );
  return preferences.timeZone;
}

export async function saveNotificationSettings(settings) {
  // Replace this mock with PUT /api/clients/me/settings when the backend exists.
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (settingsServiceConfig.simulateFailure) {
    throw new Error('We could not save your preferences. Please try again.');
  }
  const saved = {
    notifications: { ...settings.notifications },
    language: settings.language,
    timeZone: settings.timeZone,
    savedAt: new Date().toISOString(),
  };
  updateSettingsPreferences(saved);
  return saved;
}
