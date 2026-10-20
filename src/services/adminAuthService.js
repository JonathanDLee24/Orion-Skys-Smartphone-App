// Temporary in-memory account store. Replace this object with a database lookup later.
const adminAccounts = {
  admin: 'admin1234',
};

export function addAdminAccount(username, password) {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername || !password) {
    throw new Error('A username and password are required.');
  }
  adminAccounts[normalizedUsername] = password;
}

export function hasAdminUsername(username) {
  const normalizedUsername = username.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(adminAccounts, normalizedUsername);
}

export function validateAdminPassword(username, password) {
  const normalizedUsername = username.trim().toLowerCase();
  return adminAccounts[normalizedUsername] === password;
}
