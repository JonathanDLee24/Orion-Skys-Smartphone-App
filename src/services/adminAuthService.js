// Temporary in-memory account store. Replace this object with a database lookup later.
const adminAccounts = {
  admin: 'admin1234',
};

export const MAX_ADMIN_LOGIN_ATTEMPTS = 5;

const failedLoginAttempts = new Map();
const lockedAdminAccounts = new Set();

export function addAdminAccount(username, password) {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername || !password) {
    throw new Error('A username and password are required.');
  }
  adminAccounts[normalizedUsername] = password;
  resetAdminLoginAttempts(normalizedUsername);
}

export function hasAdminUsername(username) {
  const normalizedUsername = username.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(adminAccounts, normalizedUsername);
}

export function validateAdminPassword(username, password) {
  const normalizedUsername = username.trim().toLowerCase();
  if (!hasAdminUsername(normalizedUsername) || lockedAdminAccounts.has(normalizedUsername)) {
    return false;
  }

  if (adminAccounts[normalizedUsername] === password) {
    failedLoginAttempts.delete(normalizedUsername);
    return true;
  }

  const attempts = (failedLoginAttempts.get(normalizedUsername) || 0) + 1;
  failedLoginAttempts.set(normalizedUsername, attempts);
  if (attempts >= MAX_ADMIN_LOGIN_ATTEMPTS) {
    lockedAdminAccounts.add(normalizedUsername);
  }
  return false;
}

export function isAdminAccountLocked(username) {
  const normalizedUsername = username.trim().toLowerCase();
  return lockedAdminAccounts.has(normalizedUsername);
}

export function resetAdminLoginAttempts(username) {
  const normalizedUsername = username.trim().toLowerCase();
  failedLoginAttempts.delete(normalizedUsername);
  lockedAdminAccounts.delete(normalizedUsername);
}
