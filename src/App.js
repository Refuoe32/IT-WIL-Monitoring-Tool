import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import StudentDashboard from './components/Student/StudentDashboard';
import SupervisorDashboard from './components/Supervisor/SupervisorDashboard';
import CoordinatorDashboard from './components/Coordinator/CoordinatorDashboard';
import Toast from './components/nav/Toast';
import { getSession, logoutUser } from './components/auth/authUtils';
import './styles/global.css';

// ── Deterministic token derived from a fixed seed (same every run, looks professional)
// Format: /register-aBc3dEf9  — 8 alphanumeric chars, never changes between deploys
const REGISTER_TOKEN = (() => {
  const seed = 'WIL-MONITORING-SYSTEM-2024';
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  let val = (h >>> 0);
  for (let i = 0; i < 8; i++) {
    token += chars[val % chars.length];
    val = Math.floor(val / chars.length) || (val + i * 31337);
  }
  return token; // e.g. "nQ7mR2kP"
})();

export const REGISTER_PATH = `/register-${REGISTER_TOKEN}`;

// ── Toast manager (lives outside router so it survives navigation)
function ToastLayer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <Toast key={t.id} title={t.title} message={t.message} onClose={() => onRemove(t.id)} />
      ))}
    </div>
  );
}

// ── Protected route wrapper — redirects to /login if session missing or wrong role
function RequireAuth({ role, children }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to="/login" replace />;
  return children;
}

// ── Inner app that has access to router hooks
function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  const [toasts, setToasts]       = useState([]);
  const [currentUser, setCurrentUser] = useState(() => getSession());
  const [sharedState, setSharedState] = useState({
    proposals:     [],
    logbooks:      [],
    notifications: [],
  });

  // Redirect away from /login or register if already authenticated
  useEffect(() => {
    const session = getSession();
    const authPaths = ['/login', REGISTER_PATH];
    if (session && authPaths.includes(location.pathname)) {
      navigate(`/${session.role}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  const showToast = (title, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Called by Login — receives (role, userObject)
  const handleLogin = (role, user) => {
    setCurrentUser(user);
    if (role === 'student')          navigate('/student',     { replace: true });
    else if (role === 'supervisor')  navigate('/supervisor',  { replace: true });
    else if (role === 'coordinator') navigate('/coordinator', { replace: true });
    else {
      showToast('Access Denied', 'Unrecognised role. Contact your administrator.');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    navigate('/login', { replace: true });
    showToast('Logged Out', 'You have been successfully logged out.');
  };

  const dashboardProps = {
    onLogout: handleLogout,
    showToast,
    currentUser,
    sharedState,
    setSharedState,
  };

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login"          element={<Login onLogin={handleLogin} registerPath={REGISTER_PATH} />} />
        <Route path={REGISTER_PATH}   element={<Register onSwitchToLogin={() => navigate('/login')} />} />

        {/* Protected routes — each guarded by role */}
        <Route path="/student" element={
          <RequireAuth role="student">
            <StudentDashboard {...dashboardProps} />
          </RequireAuth>
        } />
        <Route path="/supervisor" element={
          <RequireAuth role="supervisor">
            <SupervisorDashboard {...dashboardProps} />
          </RequireAuth>
        } />
        <Route path="/coordinator" element={
          <RequireAuth role="coordinator">
            <CoordinatorDashboard {...dashboardProps} />
          </RequireAuth>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <ToastLayer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

// ── Root export
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}