import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthChange, logoutUser } from './api/api';

import Login      from './components/auth/Login';
import Register   from './components/auth/Register';
import StudentDashboard     from './components/Student/StudentDashboard';
import SupervisorDashboard  from './components/Supervisor/SupervisorDashboard';
import CoordinatorDashboard from './components/Coordinator/CoordinatorDashboard';

// ── Simple toast notification state ─────────────────────────
const TOAST_DURATION = 3500;

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);   // true while Firebase checks session
  const [toast, setToast]             = useState(null);   // { title, message }

  // ── Listen to Firebase auth state ──────────────────────────
  // This fires on every page load — if the user was already signed in
  // Firebase restores the session automatically, no login needed.
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Toast helper (passed down to dashboards) ───────────────
  const showToast = (title, message) => {
    setToast({ title, message });
    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  // ── Logout ─────────────────────────────────────────────────
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  // ── Login callback (called by Login.jsx after success) ─────
  const handleLogin = (role, user) => {
    setCurrentUser(user);
  };

  // ── Loading screen while Firebase checks session ───────────
  if (authLoading) {
    return (
      <div style={{
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'center',
        height         : '100vh',
        background     : '#0a0a0a',
        color          : '#fff',
        flexDirection  : 'column',
        gap            : '1rem',
        fontFamily     : 'Arial, sans-serif',
      }}>
        <div style={{
          width        : '40px',
          height       : '40px',
          border       : '3px solid rgba(255,255,255,0.1)',
          borderTop    : '3px solid #fff',
          borderRadius : '50%',
          animation    : 'spin 0.8s linear infinite',
        }} />
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Loading WIL Monitor...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* ── Global Toast ──────────────────────────────────── */}
      {toast && (
        <div style={{
          position     : 'fixed',
          bottom       : '2rem',
          right        : '2rem',
          background   : '#1a1a1a',
          color        : '#fff',
          padding      : '1rem 1.5rem',
          borderRadius : '12px',
          boxShadow    : '0 8px 32px rgba(0,0,0,0.4)',
          borderLeft   : '4px solid #4ade80',
          zIndex       : 9999,
          maxWidth     : '360px',
          animation    : 'slideIn 0.3s ease',
        }}>
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{toast.title}</strong>
          <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>{toast.message}</span>
        </div>
      )}

      <Routes>
        {/* ── Public routes (only accessible when NOT logged in) ── */}
        <Route
          path="/login"
          element={
            !currentUser
              ? <Login onLogin={handleLogin} />
              : <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="/register"
          element={
            !currentUser
              ? <Register />
              : <Navigate to="/dashboard" replace />
          }
        />

        {/* ── Protected dashboard route ── */}
        <Route
          path="/dashboard"
          element={
            !currentUser
              ? <Navigate to="/login" replace />
              : <DashboardRouter
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  showToast={showToast}
                />
          }
        />

        {/* ── Default redirect ── */}
        <Route
          path="*"
          element={<Navigate to={currentUser ? '/dashboard' : '/login'} replace />}
        />
      </Routes>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </BrowserRouter>
  );
}

// ── DashboardRouter — picks the right dashboard based on role ──
function DashboardRouter({ currentUser, onLogout, showToast }) {
  const role = currentUser?.role;

  if (role === 'student') {
    return (
      <StudentDashboard
        currentUser={currentUser}
        onLogout={onLogout}
        showToast={showToast}
      />
    );
  }

  if (role === 'supervisor') {
    return (
      <SupervisorDashboard
        currentUser={currentUser}
        onLogout={onLogout}
        showToast={showToast}
      />
    );
  }

  if (role === 'coordinator') {
    return (
      <CoordinatorDashboard
        currentUser={currentUser}
        onLogout={onLogout}
        showToast={showToast}
      />
    );
  }

  // Unknown role — log out and redirect
  onLogout();
  return <Navigate to="/login" replace />;
}