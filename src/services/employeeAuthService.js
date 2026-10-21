// Temporary in-memory account store. Replace this object with a database lookup later.
const employeeAccounts = {
  test: 'password1234',
};

export function addEmployeeAccount(username, password) {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername || !password) {
    throw new Error('A username and password are required.');
  }
  employeeAccounts[normalizedUsername] = password;
}

export function hasEmployeeUsername(username) {
  const normalizedUsername = username.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(employeeAccounts, normalizedUsername);
}

export function validateEmployeePassword(username, password) {
  const normalizedUsername = username.trim().toLowerCase();
  return employeeAccounts[normalizedUsername] === password;
}
