import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { loginUser } from './authUtils';

const Login = ({ onLogin, registerPath }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ role: 'student', idNumber: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const roles = [
    { value: 'student', icon: '🎓', label: 'Student' },
    { value: 'supervisor', icon: '👨‍🏫', label: 'Supervisor' },
    { value: 'coordinator', icon: '🏛️', label: 'Coordinator' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate async call
    await new Promise(r => setTimeout(r, 700));

    const result = loginUser(formData.idNumber.trim(), formData.password, formData.role);
    setLoading(false);

    if (result.success) {
      // Pass role first, then full user object — matches App.js handleLogin(role, user)
      onLogin(result.user.role, result.user);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-icon">
            <svg viewBox="0 0 40 40" fill="none">
              <rect x="4" y="4" width="14" height="14" rx="3" fill="currentColor" opacity="0.9"/>
              <rect x="22" y="4" width="14" height="14" rx="3" fill="currentColor" opacity="0.6"/>
              <rect x="4" y="22" width="14" height="14" rx="3" fill="currentColor" opacity="0.6"/>
              <rect x="22" y="22" width="14" height="14" rx="3" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
          <h1 className="auth-title">IT WIL Monitor</h1>
          <p className="auth-subtitle">Work-Integrated Learning Management</p>
        </div>

        <div className="role-tabs">
          {roles.map(r => (
            <button
              key={r.value}
              type="button"
              className={`role-tab ${formData.role === r.value ? 'role-tab--active' : ''}`}
              onClick={() => { setFormData({ ...formData, role: r.value }); setError(''); }}
            >
              <span className="role-tab__icon">{r.icon}</span>
              <span className="role-tab__label">{r.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label className="field__label">Student / Staff ID</label>
            <div className="field__wrap">
              <span className="field__icon">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                </svg>
              </span>
              <input
                type="text"
                className="field__input"
                placeholder={`Enter your ${formData.role === 'student' ? 'student' : 'staff'} number`}
                value={formData.idNumber}
                onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="field">
            <label className="field__label">Password</label>
            <div className="field__wrap">
              <span className="field__icon">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/>
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="field__input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button type="button" className="field__toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="auth-btn__spinner" /> : null}
            {loading ? 'Authenticating...' : `Sign in as ${roles.find(r => r.value === formData.role)?.label}`}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account?{' '}
            <button className="auth-link" onClick={() => navigate(registerPath)}>Create account</button>
          </p>
        </div>


      </div>
    </div>
  );
};

export default Login;