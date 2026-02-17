import React from 'react';
import { getSession, canAccess } from './authUtils';

/**
 * ProtectedRoute - Wraps dashboard components and enforces role-based access.
 *
 * Usage:
 *   <ProtectedRoute requiredRole="supervisor" onUnauthorized={handleLogout}>
 *     <SupervisorDashboard />
 *   </ProtectedRoute>
 *
 * Role hierarchy: student < supervisor < coordinator
 * A coordinator can access all panels; a supervisor can access supervisor + student;
 * a student can ONLY access the student panel.
 */
const ProtectedRoute = ({ children, requiredRole, onUnauthorized }) => {
  const session = getSession();

  // Not logged in
  if (!session) {
    if (onUnauthorized) onUnauthorized();
    return (
      <div style={styles.denied}>
        <div style={styles.card}>
          <div style={styles.icon}>🚫</div>
          <h2 style={styles.title}>Session Expired</h2>
          <p style={styles.msg}>Your session has expired. Please sign in again.</p>
          <button style={styles.btn} onClick={onUnauthorized}>Return to Login</button>
        </div>
      </div>
    );
  }

  // Logged in but insufficient role
  if (!canAccess(session.role, requiredRole)) {
    return (
      <div style={styles.denied}>
        <div style={styles.card}>
          <div style={styles.icon}>⛔</div>
          <h2 style={styles.title}>Access Denied</h2>
          <p style={styles.msg}>
            Your account ({session.role}) does not have permission to view this area.
          </p>
          <button style={styles.btn} onClick={onUnauthorized}>Go Back</button>
        </div>
      </div>
    );
  }

  return children;
};

const styles = {
  denied: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f9fa',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    padding: '3rem',
    textAlign: 'center',
    maxWidth: '400px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  },
  icon: { fontSize: '4rem', marginBottom: '1rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem', color: '#1a1a1a' },
  msg: { color: '#666', marginBottom: '1.5rem', lineHeight: 1.6 },
  btn: {
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
};

export default ProtectedRoute;
