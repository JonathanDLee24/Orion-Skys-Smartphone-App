import { saveNotificationSettings, settingsServiceConfig } from '../src/services/settingsService';

const payload = {
  notifications: { email: true, push: false, shows: true, billing: true },
  language: 'en',
  timeZone: 'Asia/Singapore',
};

beforeEach(() => {
  jest.useFakeTimers();
  settingsServiceConfig.simulateFailure = false;
});
afterEach(() => { jest.useRealTimers(); });

test('resolves the saved payload after the mock delay without mutating the input', async () => {
  const request = saveNotificationSettings(payload);
  await jest.advanceTimersByTimeAsync(500);
  const result = await request;
  expect(result.notifications).toEqual(payload.notifications);
  expect(result.language).toBe('en');
  expect(result.timeZone).toBe('Asia/Singapore');
  expect(typeof result.savedAt).toBe('string');
  result.notifications.push = undefined;
  expect(payload.notifications.push).toBe(false);
});

test('can simulate a save failure', async () => {
  settingsServiceConfig.simulateFailure = true;
  const failure = expect(saveNotificationSettings(payload)).rejects.toThrow('could not save');
  await jest.advanceTimersByTimeAsync(500);
  await failure;
});
