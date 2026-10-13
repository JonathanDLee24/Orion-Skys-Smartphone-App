export const settingsServiceConfig = {
  simulateFailure: process.env.EXPO_PUBLIC_SIMULATE_SETTINGS_FAILURE === 'true',
};

export async function saveNotificationSettings(settings) {
  // Replace this mock with PUT /api/clients/me/settings when the backend exists.
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (settingsServiceConfig.simulateFailure) {
    throw new Error('We could not save your preferences. Please try again.');
  }
  return {
    notifications: { ...settings.notifications },
    language: settings.language,
    timeZone: settings.timeZone,
    savedAt: new Date().toISOString(),
  };
}
