// ── In-memory user store (persists for the browser session only)
// Replace with real API calls when backend is ready.
const memoryDB = {
  users: [],
};

let activeSession = null;

// ── Role hierarchy
const ROLE_HIERARCHY = {
  student: 0,
  supervisor: 1,
  coordinator: 2,
};

// ── Simple password hash (replace with bcrypt via backend in production)
export const hashPassword = (password) => {
  let hash = 0;
  const salted = `wil_salt_${password}_2024`;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hashed_${Math.abs(hash).toString(36)}_${salted.length}`;
};

// ── Generate a random session token
const generateToken = () => {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// ── Register a new user
export const registerUser = (userData) => {
  const { idNumber, password, role, fullName, email, employeeNumber } = userData;

  // Duplicate ID check
  if (memoryDB.users.find(u => u.id === idNumber.trim())) {
    return { success: false, error: 'This ID number is already registered.' };
  }

  // Duplicate email check
  if (memoryDB.users.find(u => u.email === email.trim().toLowerCase())) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  // Employee number required for staff roles
  if (role !== 'student' && !employeeNumber?.trim()) {
    return { success: false, error: 'Employee number is required for staff accounts.' };
  }

  // Duplicate employee number check (staff only)
  if (role !== 'student' && memoryDB.users.find(u => u.employeeNumber === employeeNumber.trim())) {
    return { success: false, error: 'This employee number is already registered.' };
  }

  const newUser = {
    id: idNumber.trim(),
    password: hashPassword(password),
    role,
    name: fullName.trim(),
    email: email.trim().toLowerCase(),
    ...(role !== 'student' && { employeeNumber: employeeNumber.trim() }),
    createdAt: new Date().toISOString(),
  };

  memoryDB.users.push(newUser);
  return { success: true };
};

// ── Login
export const loginUser = (idNumber, password, expectedRole) => {
  const user = memoryDB.users.find(u => u.id === idNumber.trim());

  if (!user || user.password !== hashPassword(password)) {
    return { success: false, error: 'Invalid ID number or password.' };
  }

  // Strict role match — cannot login as a different role than registered
  if (user.role !== expectedRole) {
    return {
      success: false,
      error: `Access denied. This account is registered as ${user.role}.`,
    };
  }

  activeSession = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.employeeNumber && { employeeNumber: user.employeeNumber }),
    token: generateToken(),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
  };

  return { success: true, user: activeSession };
};

// ── Get current session (null if expired or not set)
export const getSession = () => {
  if (!activeSession) return null;
  if (Date.now() > activeSession.expiresAt) {
    activeSession = null;
    return null;
  }
  return activeSession;
};

// ── Logout
export const logoutUser = () => {
  activeSession = null;
};

// ── Check if a role meets the required access level
export const canAccess = (sessionRole, requiredRole) => {
  if (!sessionRole) return false;
  return ROLE_HIERARCHY[sessionRole] >= ROLE_HIERARCHY[requiredRole];
};