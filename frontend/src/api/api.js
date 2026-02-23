// ─────────────────────────────────────────────────────────────────────────────
//  src/api/api.js
//  Talks to the Express/PostgreSQL backend.
//  Every exported function keeps the EXACT same name and return shape as the
//  old firebase.js, so NO changes are needed in any Dashboard component.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// ── Token storage (localStorage — no Supabase involved at all) ───────────────
const getToken  = ()        => localStorage.getItem('wil_token');
const setToken  = (t)       => localStorage.setItem('wil_token', t);
const clearToken = ()       => localStorage.removeItem('wil_token');

// ── Base fetch helper ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type' : 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// ═════════════════════════════════════════════════════════════════════════════
//  AUTH
// ═════════════════════════════════════════════════════════════════════════════

/**
 * registerUser(formData)
 */
export async function registerUser(formData) {
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body  : JSON.stringify({
        role           : formData.role,
        fullName       : formData.fullName,
        email          : formData.email.trim().toLowerCase(),
        password       : formData.password,
        idNumber       : formData.idNumber,
        employeeNumber : formData.employeeNumber,
        program        : formData.program,
      }),
    });
    // Store token so the user is immediately logged in after registering
    if (data.token) setToken(data.token);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * loginUser(email, password)
 */
export async function loginUser(email, password) {
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body  : JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    setToken(data.token);
    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * logoutUser()
 */
export async function logoutUser() {
  clearToken();
}

/**
 * onAuthChange(callback)
 * On page load, checks if a saved token is still valid.
 * Returns an unsubscribe function (no-op here since there's no live socket).
 */
export function onAuthChange(callback) {
  const token = getToken();
  if (!token) {
    callback(null);
    return () => {};
  }

  apiFetch('/auth/me')
    .then(data => callback(data.user))
    .catch(() => {
      clearToken();
      callback(null);
    });

  return () => {};   // nothing to unsubscribe
}

// ═════════════════════════════════════════════════════════════════════════════
//  SUPERVISORS
// ═════════════════════════════════════════════════════════════════════════════

export async function getAllSupervisors() {
  try {
    const data = await apiFetch('/supervisors');
    return data;
  } catch {
    return [];
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  PROPOSALS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * submitProposal(proposalObj)
 */
export async function submitProposal(proposalObj) {
  await apiFetch('/proposals', {
    method: 'POST',
    body  : JSON.stringify(proposalObj),
  });
}

export function listenStudentProposals(studentUid, callback) {
  const fetch = async () => {
    try {
      const data = await apiFetch(`/proposals?submittedBy=${studentUid}`);
      callback(data);
    } catch { callback([]); }
  };
  fetch();
  const id = setInterval(fetch, 4000);
  return () => clearInterval(id);
}

export function listenSupervisorProposals(supervisorUid, callback) {
  const fetch = async () => {
    try {
      const data = await apiFetch(`/proposals?supervisorId=${supervisorUid}`);
      callback(data);
    } catch { callback([]); }
  };
  fetch();
  const id = setInterval(fetch, 4000);
  return () => clearInterval(id);
}

export function listenAllProposals(callback) {
  const fetch = async () => {
    try {
      const data = await apiFetch('/proposals');
      callback(data);
    } catch { callback([]); }
  };
  fetch();
  const id = setInterval(fetch, 4000);
  return () => clearInterval(id);
}

export async function approveProposal(proposalId, supervisorName, supervisorUid) {
  const now = new Date().toISOString();
  await apiFetch(`/proposals/${proposalId}`, {
    method: 'PATCH',
    body  : JSON.stringify({
      status                 : 'approved',
      forwardedToCoordinator : true,
      supervisorApproval     : { approvedBy: supervisorName, uid: supervisorUid, timestamp: now },
      reviewedAt             : now,
    }),
  });
}

export async function rejectProposal(proposalId, feedback, supervisorName) {
  await apiFetch(`/proposals/${proposalId}`, {
    method: 'PATCH',
    body  : JSON.stringify({
      status            : 'rejected',
      supervisorFeedback: feedback,
      rejectedBy        : supervisorName,
      reviewedAt        : new Date().toISOString(),
    }),
  });
}

export async function activateProposal(proposalId, coordinatorName) {
  await apiFetch(`/proposals/${proposalId}`, {
    method: 'PATCH',
    body  : JSON.stringify({
      status                : 'activated',
      coordinatorApprovedAt : new Date().toISOString(),
      coordinatorApprovedBy : coordinatorName,
    }),
  });
}

export async function coordinatorRejectProposal(proposalId, feedback, coordinatorName) {
  await apiFetch(`/proposals/${proposalId}`, {
    method: 'PATCH',
    body  : JSON.stringify({
      status              : 'rejected',
      coordinatorFeedback : feedback,
      rejectedBy          : coordinatorName,
      reviewedAt          : new Date().toISOString(),
    }),
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  LOGBOOKS
// ═════════════════════════════════════════════════════════════════════════════

export async function submitLogbook(logbookObj) {
  await apiFetch('/logbooks', {
    method: 'POST',
    body  : JSON.stringify(logbookObj),
  });
}

export function listenStudentLogbooks(studentUid, callback) {
  const fetch = async () => {
    try {
      const data = await apiFetch(`/logbooks?studentId=${studentUid}`);
      callback(data);
    } catch { callback([]); }
  };
  fetch();
  const id = setInterval(fetch, 4000);
  return () => clearInterval(id);
}

export function listenSupervisorLogbooks(supervisorUid, callback) {
  const fetch = async () => {
    try {
      const data = await apiFetch(`/logbooks?supervisorId=${supervisorUid}`);
      callback(data);
    } catch { callback([]); }
  };
  fetch();
  const id = setInterval(fetch, 4000);
  return () => clearInterval(id);
}

export function listenAllLogbooks(callback) {
  const fetch = async () => {
    try {
      const data = await apiFetch('/logbooks');
      callback(data);
    } catch { callback([]); }
  };
  fetch();
  const id = setInterval(fetch, 4000);
  return () => clearInterval(id);
}

export async function approveLogbook(logbookId, supervisorName, supervisorUid) {
  const now = new Date().toISOString();
  await apiFetch(`/logbooks/${logbookId}`, {
    method: 'PATCH',
    body  : JSON.stringify({
      status         : 'approved',
      locked         : true,
      digitalApproval: { approvedBy: supervisorName, uid: supervisorUid, timestamp: now },
      reviewedAt     : now,
    }),
  });
}

export async function rejectLogbook(logbookId, feedback, supervisorName) {
  await apiFetch(`/logbooks/${logbookId}`, {
    method: 'PATCH',
    body  : JSON.stringify({
      status            : 'rejected',
      supervisorFeedback: feedback,
      rejectedBy        : supervisorName,
      reviewedAt        : new Date().toISOString(),
    }),
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════════════

export async function pushNotification(toUid, title, message, type = 'info') {
  try {
    await apiFetch('/notifications', {
      method: 'POST',
      body  : JSON.stringify({ toUid, title, message, type }),
    });
  } catch (err) {
    console.error('pushNotification error:', err.message);
  }
}

export function listenNotifications(uid, callback) {
  const fetch = async () => {
    try {
      const data = await apiFetch(`/notifications?uid=${uid}`);
      callback(data);
    } catch { callback([]); }
  };
  fetch();
  const id = setInterval(fetch, 4000);
  return () => clearInterval(id);
}

export async function markNotificationRead(notificationId) {
  try {
    await apiFetch(`/notifications/${notificationId}/read`, { method: 'PATCH' });
  } catch (err) {
    console.error('markNotificationRead error:', err.message);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  SETTINGS
// ═════════════════════════════════════════════════════════════════════════════

export async function getSettings() {
  try {
    return await apiFetch('/settings');
  } catch {
    return {
      maxSupervisionLimit: 4,
      similarityThreshold: 70,
      logbookDeadline    : 'Friday 17:00',
      autoAssignment     : true,
      emailNotifications : true,
    };
  }
}

export async function saveSettings(settingsObj) {
  await apiFetch('/settings', {
    method: 'PUT',
    body  : JSON.stringify(settingsObj),
  });
}