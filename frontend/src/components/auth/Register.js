import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/styles.css';
import { registerUser } from '../../api/api';

const Register = () => {
  const navigate = useNavigate();

  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]       = useState({});

  const [formData, setFormData] = useState({
    role           : 'student',
    fullName       : '',
    email          : '',
    idNumber       : '',
    employeeNumber : '',
    program        : '',
    password       : '',
    confirmPassword: '',
  });

  const roles = [
    { value: 'student',     icon: '🎓', label: 'Student',     desc: 'Register to track your WIL progress' },
    { value: 'supervisor',  icon: '👨‍🏫', label: 'Supervisor',  desc: 'Monitor assigned student placements' },
    { value: 'coordinator', icon: '🏛️', label: 'Coordinator', desc: 'Manage the full WIL programme' },
  ];

  const programs = [
    'BSc Software Engineering with Multimedia',
    'Information Technology',
    'Business Information Technology',
  ];

  const update = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    const errs = {};

    if (step === 1) {
      if (!formData.fullName.trim())
        errs.fullName = 'Full name is required.';
      if (!formData.email.includes('@'))
        errs.email = 'Enter a valid email address.';
      if (!formData.idNumber.trim())
        errs.idNumber = 'ID / student number is required.';
      if (formData.role === 'student' && !formData.program)
        errs.program = 'Please select your programme.';
      if (formData.role !== 'student' && !formData.employeeNumber.trim())
        errs.employeeNumber = 'Employee number is required.';
    }

    if (step === 2) {
      if (formData.password.length < 8)
        errs.password = 'Password must be at least 8 characters.';
      if (!/[A-Z]/.test(formData.password))
        errs.password = 'Password must include at least one uppercase letter.';
      if (!/[0-9]/.test(formData.password))
        errs.password = 'Password must include at least one number.';
      if (formData.password !== formData.confirmPassword)
        errs.confirmPassword = 'Passwords do not match.';
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
    const result = await registerUser(formData);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
    } else {
      const err = result.error || '';
      if (err.includes('email-already-in-use') || err.includes('already registered')) {
        setErrors({ submit: 'This email is already registered. Please sign in instead.' });
      } else if (err.toLowerCase().includes('network') || err.toLowerCase().includes('fetch')) {
        setErrors({ submit: 'Cannot connect to server. Make sure the backend is running.' });
      } else {
        setErrors({ submit: err });
      }
    }
  };

  // ── Password strength ────────────────────────────────────────
  const getStrength = () => {
    const p = formData.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)          s++;
    if (p.length >= 12)         s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength      = getStrength();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength];
  const strengthClass = ['', 'weak', 'fair', 'good', 'strong', 'excellent'][strength];

  // ── Success screen ───────────────────────────────────────────
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-glow auth-glow--1" />
        <div className="auth-glow auth-glow--2" />
        <div className="auth-card auth-card--success">
          <div className="success-icon">✅</div>
          <h2 className="auth-title">Account Created!</h2>
          <p className="auth-subtitle">
            Welcome, <strong>{formData.fullName}</strong>.<br />
            Your {formData.role} account has been created successfully.
          </p>
          <button
            className="auth-btn"
            onClick={() => navigate('/login')}
            style={{ marginTop: '1.5rem' }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the WIL Monitoring System</p>
        </div>

        {/* Step indicator */}
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

        {/* ── STEP 1 — Profile ── */}
        {step === 1 && (
          <form onSubmit={handleNext} className="auth-form">

            {/* Role selection */}
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

            {/* Full name */}
            <div className="field">
              <label className="field__label">Full Name</label>
              <div className="field__wrap">
                <span className="field__icon">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                  </svg>
                </span>
                <input
                  className="field__input"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={e => update('fullName', e.target.value)}
                />
              </div>
              {errors.fullName && <span className="field__error">{errors.fullName}</span>}
            </div>

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
                  className="field__input"
                  type="email"
                  placeholder={
                    formData.role === 'student'
                      ? 'e.g. 901015219@gmail.com'
                      : 'e.g. h.batloung@gmail.com'
                  }
                  value={formData.email}
                  onChange={e => update('email', e.target.value)}
                />
              </div>
              {errors.email && <span className="field__error">{errors.email}</span>}
            </div>

            {/* Student / Staff number */}
            <div className="field">
              <label className="field__label">
                {formData.role === 'student' ? 'Student Number' : 'Staff Number'}
              </label>
              <div className="field__wrap">
                <span className="field__icon">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </span>
                <input
                  className="field__input"
                  placeholder={formData.role === 'student' ? 'e.g. 901015219' : 'e.g. STAFF-BHILA-001'}
                  value={formData.idNumber}
                  onChange={e => update('idNumber', e.target.value)}
                />
              </div>
              {errors.idNumber && <span className="field__error">{errors.idNumber}</span>}
            </div>

            {/* Programme — students only */}
            {formData.role === 'student' && (
              <div className="field">
                <label className="field__label">Programme</label>
                <div className="field__wrap">
                  <span className="field__icon">🎓</span>
                  <select
                    className="field__input"
                    value={formData.program}
                    onChange={e => update('program', e.target.value)}
                  >
                    <option value="">Select your programme...</option>
                    {programs.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                {errors.program && <span className="field__error">{errors.program}</span>}
              </div>
            )}

            {/* Employee number — supervisors & coordinators */}
            {formData.role !== 'student' && (
              <div className="field">
                <label className="field__label">Employee Number</label>
                <div className="field__wrap">
                  <span className="field__icon">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2z"/>
                    </svg>
                  </span>
                  <input
                    className="field__input"
                    placeholder={
                      formData.role === 'coordinator'
                        ? 'e.g. COORD-WIL-001'
                        : 'e.g. STAFF-BHILA-001'
                    }
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

        {/* ── STEP 2 — Security ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="auth-form">

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
                  className="field__input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={e => update('password', e.target.value)}
                />
                <button
                  type="button"
                  className="field__toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Strength bar */}
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`strength-bar__segment ${strength >= i ? `strength-bar__segment--${strengthClass}` : ''}`}
                      />
                    ))}
                  </div>
                  <span className={`strength-label strength-label--${strengthClass}`}>
                    {strengthLabel}
                  </span>
                </div>
              )}
              {errors.password && <span className="field__error">{errors.password}</span>}
            </div>

            {/* Confirm password */}
            <div className="field">
              <label className="field__label">Confirm Password</label>
              <div className="field__wrap">
                <span className="field__icon">🔒</span>
                <input
                  className="field__input"
                  type="password"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                />
              </div>
              {errors.confirmPassword && <span className="field__error">{errors.confirmPassword}</span>}
            </div>

            {/* Submit error */}
            {errors.submit && (
              <div className="auth-error">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
                </svg>
                {errors.submit}
              </div>
            )}

            <div className="auth-btn-group">
              <button
                type="button"
                className="auth-btn auth-btn--outline"
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <span className="auth-btn__spinner" /> : null}
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button className="auth-link" onClick={() => navigate('/login')}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;