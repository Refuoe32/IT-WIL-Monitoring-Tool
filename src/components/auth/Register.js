import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { registerUser } from './authUtils';

const Register = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: 'student',
    fullName: '',
    email: '',
    idNumber: '',
    employeeNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const roles = [
    { value: 'student', icon: '🎓', label: 'Student', desc: 'Register to track your WIL progress' },
    { value: 'supervisor', icon: '👨‍🏫', label: 'Supervisor', desc: 'Monitor assigned student placements' },
    { value: 'coordinator', icon: '🏛️', label: 'Coordinator', desc: 'Manage the full WIL programme' },
  ];

  const validate = () => {
    const errs = {};
    if (step === 1) {
      if (!formData.fullName.trim()) errs.fullName = 'Full name is required.';
      if (!formData.email.includes('@')) errs.email = 'Enter a valid email address.';
      if (!formData.idNumber.trim()) errs.idNumber = 'ID number is required.';
      if (formData.role !== 'student' && !formData.employeeNumber.trim()) {
        errs.employeeNumber = 'Employee number is required.';
      }
    }
    if (step === 2) {
      if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters.';
      if (!/[A-Z]/.test(formData.password)) errs.password = 'Password must include an uppercase letter.';
      if (!/[0-9]/.test(formData.password)) errs.password = 'Password must include a number.';
      if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validate()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const result = registerUser(formData);
    setLoading(false);
    if (result.success) {
      setSuccess(true);
    } else {
      setErrors({ submit: result.error });
    }
  };

  const update = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength];
  const strengthClass = ['', 'weak', 'fair', 'good', 'strong', 'excellent'][strength];

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-glow auth-glow--1" />
        <div className="auth-glow auth-glow--2" />
        <div className="auth-card auth-card--success">
          <div className="success-icon">✅</div>
          <h2 className="auth-title">Account Created!</h2>
          <p className="auth-subtitle">
            Welcome, <strong>{formData.fullName}</strong>. Your {formData.role} account is ready.
          </p>
          <button className="auth-btn" onClick={() => navigate('/login')} style={{ marginTop: '1.5rem' }}>
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the WIL Monitoring System</p>
        </div>

        {/* Step Indicator */}
        <div className="steps">
          {[1, 2].map(s => (
            <React.Fragment key={s}>
              <div className={`step ${step >= s ? 'step--active' : ''} ${step > s ? 'step--done' : ''}`}>
                <div className="step__dot">{step > s ? '✓' : s}</div>
                <span className="step__label">{s === 1 ? 'Profile' : 'Security'}</span>
              </div>
              {s < 2 && <div className={`step__line ${step > 1 ? 'step__line--done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleNext} className="auth-form">
            <div className="field">
              <label className="field__label">I am registering as</label>
              <div className="role-cards">
                {roles.map(r => (
                  <div
                    key={r.value}
                    className={`role-card ${formData.role === r.value ? 'role-card--active' : ''}`}
                    onClick={() => update('role', r.value)}
                  >
                    <span className="role-card__icon">{r.icon}</span>
                    <span className="role-card__label">{r.label}</span>
                    <span className="role-card__desc">{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field__label">Full Name</label>
              <div className="field__wrap">
                <span className="field__icon">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                  </svg>
                </span>
                <input className="field__input" placeholder="Your full name" value={formData.fullName}
                  onChange={e => update('fullName', e.target.value)} />
              </div>
              {errors.fullName && <span className="field__error">{errors.fullName}</span>}
            </div>

            <div className="field">
              <label className="field__label">Email Address</label>
              <div className="field__wrap">
                <span className="field__icon">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                </span>
                <input className="field__input" type="email" placeholder="your@email.edu" value={formData.email}
                  onChange={e => update('email', e.target.value)} />
              </div>
              {errors.email && <span className="field__error">{errors.email}</span>}
            </div>

            <div className="field">
              <label className="field__label">{formData.role === 'student' ? 'Student Number' : 'Staff Number'}</label>
              <div className="field__wrap">
                <span className="field__icon">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
                  </svg>
                </span>
                <input
                  className="field__input"
                  placeholder={formData.role === 'student' ? 'e.g. STU2024001' : 'e.g. STAFF2024001'}
                  value={formData.idNumber}
                  onChange={e => update('idNumber', e.target.value)}
                />
              </div>
              {errors.idNumber && <span className="field__error">{errors.idNumber}</span>}
            </div>

            {formData.role !== 'student' && (
              <div className="field">
                <label className="field__label">Employee Number</label>
                <div className="field__wrap">
                  <span className="field__icon">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                      <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                    </svg>
                  </span>
                  <input
                    className="field__input"
                    placeholder={formData.role === 'coordinator' ? 'e.g. EMP-COORD-001' : 'e.g. EMP-SUP-001'}
                    value={formData.employeeNumber}
                    onChange={e => update('employeeNumber', e.target.value)}
                  />
                </div>
                {errors.employeeNumber && <span className="field__error">{errors.employeeNumber}</span>}
              </div>
            )}

            <button type="submit" className="auth-btn">Continue →</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label className="field__label">Password</label>
              <div className="field__wrap">
                <span className="field__icon">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/>
                  </svg>
                </span>
                <input className="field__input" type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password" value={formData.password}
                  onChange={e => update('password', e.target.value)} />
                <button type="button" className="field__toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`strength-bar__segment ${strength >= i ? `strength-bar__segment--${strengthClass}` : ''}`} />
                    ))}
                  </div>
                  <span className={`strength-label strength-label--${strengthClass}`}>{strengthLabel}</span>
                </div>
              )}
              {errors.password && <span className="field__error">{errors.password}</span>}
            </div>

            <div className="field">
              <label className="field__label">Confirm Password</label>
              <div className="field__wrap">
                <span className="field__icon">🔒</span>
                <input className="field__input" type="password" placeholder="Repeat your password"
                  value={formData.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
              </div>
              {errors.confirmPassword && <span className="field__error">{errors.confirmPassword}</span>}
            </div>

            {errors.submit && (
              <div className="auth-error">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
                </svg>
                {errors.submit}
              </div>
            )}

            <div className="auth-btn-group">
              <button type="button" className="auth-btn auth-btn--outline" onClick={() => setStep(1)}>← Back</button>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <span className="auth-btn__spinner" /> : null}
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>Already have an account?{' '}
            <button className="auth-link" onClick={() => navigate('/login')}>Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;