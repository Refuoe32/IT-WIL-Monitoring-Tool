import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/styles.css';
import { loginUser } from '../../api/api';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();

  const [formData, setFormData]     = useState({ email: '', password: '', role: 'student' });
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const roles = [
    { value: 'student',     icon: '🎓', label: 'Student' },
    { value: 'supervisor',  icon: '👨‍🏫', label: 'Supervisor' },
    { value: 'coordinator', icon: '🏛️', label: 'Coordinator' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    const result = await loginUser(formData.email.trim(), formData.password);
    setLoading(false);

    if (result.success) {
      // Make sure the selected role matches the account role
      if (result.user.role !== formData.role) {
        setError(
          `This account is registered as a ${result.user.role}, not a ${formData.role}. Please select the correct role tab.`
        );
        return;
      }
      onLogin(result.user.role, result.user);
    } else {
      // Make Firebase error messages friendlier
      const err = result.error || '';
      if (err.includes('user-not-found') || err.includes('wrong-password') ||
          err.includes('invalid-credential') || err.includes('Incorrect email')) {
        setError('Incorrect email or password. Please try again.');
      } else if (err.includes('too-many-requests')) {
        setError('Too many failed attempts. Please wait a few minutes and try again.');
      } else if (err.toLowerCase().includes('network') || err.toLowerCase().includes('fetch')) {
        setError('Cannot connect to server. Make sure the backend is running.');
      } else {
        setError(err);
      }
    }
  };

  // Helper — show the right placeholder based on selected role
  const getEmailPlaceholder = () => {
    if (formData.role === 'student')     return 'student@gmail.com';
    if (formData.role === 'supervisor')  return 'supervisor@gmail.com';
    if (formData.role === 'coordinator') return 'coordinator@gmail.com';
    return 'Enter your email';
  };

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-icon">
            <svg viewBox="0 0 40 40" fill="none">
              <rect x="4"  y="4"  width="14" height="14" rx="3" fill="currentColor" opacity="0.9"/>
              <rect x="22" y="4"  width="14" height="14" rx="3" fill="currentColor" opacity="0.6"/>
              <rect x="4"  y="22" width="14" height="14" rx="3" fill="currentColor" opacity="0.6"/>
              <rect x="22" y="22" width="14" height="14" rx="3" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
          <h1 className="auth-title">IT WIL Monitor</h1>
          <p className="auth-subtitle">Work-Integrated Learning Management</p>
        </div>

        {/* Role Tabs */}
        <div className="role-tabs">
          {roles.map(r => (
            <button
              key={r.value}
              type="button"
              className={`role-tab ${formData.role === r.value ? 'role-tab--active' : ''}`}
              onClick={() => { setFormData({ ...formData, role: r.value, email: '' }); setError(''); }}
            >
              <span className="role-tab__icon">{r.icon}</span>
              <span className="role-tab__label">{r.label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">

          {/* Email */}
          <div className="field">
            <label className="field__label">Email Address</label>
            <div className="field__wrap">
              <span className="field__icon">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </span>
              <input
                type="email"
                className="field__input"
                placeholder={getEmailPlaceholder()}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
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
              <button
                type="button"
                className="field__toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="auth-btn__spinner" /> : null}
            {loading ? 'Signing in...' : `Sign in as ${roles.find(r => r.value === formData.role)?.label}`}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button className="auth-link" onClick={() => navigate('/register')}>
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;