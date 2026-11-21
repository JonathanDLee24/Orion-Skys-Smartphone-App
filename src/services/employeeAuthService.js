// Temporary in-memory account store. Replace this object with a database lookup later.
const employeeAccounts = {
  test: 'password1234',
};
export const MAX_EMPLOYEE_LOGIN_ATTEMPTS = 5;
const failedLoginAttempts = new Map();
const lockedEmployeeAccounts = new Set();

export function addEmployeeAccount(username, password) {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername || !password) {
    throw new Error('A username and password are required.');
  }
  employeeAccounts[normalizedUsername] = password;
  resetEmployeeLoginAttempts(normalizedUsername);
}

export function hasEmployeeUsername(username) {
  const normalizedUsername = username.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(employeeAccounts, normalizedUsername);
}

export function validateEmployeePassword(username, password) {
  const normalizedUsername = username.trim().toLowerCase();
  if (!hasEmployeeUsername(normalizedUsername) || isEmployeeAccountLocked(normalizedUsername)) return false;
  if (employeeAccounts[normalizedUsername] === password) {
    failedLoginAttempts.delete(normalizedUsername);
    return true;
  }
  const attempts = (failedLoginAttempts.get(normalizedUsername) || 0) + 1;
  failedLoginAttempts.set(normalizedUsername, attempts);
  if (attempts >= MAX_EMPLOYEE_LOGIN_ATTEMPTS) lockedEmployeeAccounts.add(normalizedUsername);
  return false;
}

export function isEmployeeAccountLocked(username) {
  return lockedEmployeeAccounts.has(username.trim().toLowerCase());
}

export function resetEmployeeLoginAttempts(username) {
  const normalizedUsername = username.trim().toLowerCase();
  failedLoginAttempts.delete(normalizedUsername);
  lockedEmployeeAccounts.delete(normalizedUsername);
}
