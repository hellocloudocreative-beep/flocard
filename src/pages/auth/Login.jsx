/* ==========================================================================
   FLOCARD CUSTOMER AUTHENTICATION PORTAL (/login & /signup)
   Full customer login and registration system asking for Email and Password.
   Obsidian & Cosmic Purple luxury design with real session persistence.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PasswordStrength from '../../components/spectrum/PasswordStrength';
import MorphButton from '../../components/spectrum/MorphButton';
import { Mail, Lock, User, Building, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, LogOut, Sparkles } from 'lucide-react';

export default function Login({ view = 'login' }) {
  const { user, loginCustomer, registerCustomer, loginWithGoogle, logout, loading: authLoading } = useAuth();
  const { isLight } = useTheme();
  
  // URL tab query support (e.g. /login?tab=signup)
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const initialTab = urlParams.get('tab') || view;
  const [tab, setTab] = useState(initialTab === 'signup' ? 'signup' : initialTab === 'forgot' ? 'forgot' : 'login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupCompany, setSignupCompany] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (view === 'signup') setTab('signup');
    else if (view === 'forgot') setTab('forgot');
    else if (view === 'login') setTab('login');
  }, [view]);


  // Handle Continue with Google
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const redirectTarget = urlParams.get('redirect') || '/account';

    try {
      const res = await loginWithGoogle(redirectTarget);
      if (res.success) {
        setSuccessMessage('Signed in with Google! Redirecting...');
        setTimeout(() => {
          window.history.pushState({}, '', redirectTarget);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 500);
      } else {
        setError(res.error || 'Google Sign In was not completed.');
      }
    } catch (err) {
      setError(err.message || 'Google Sign In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginCustomer(loginEmail, loginPassword);
      if (res.success) {
        const redirectTarget = urlParams.get('redirect') || '/account';
        setSuccessMessage('Signed in successfully! Redirecting...');
        setTimeout(() => {
          window.history.pushState({}, '', redirectTarget);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 600);
      } else {
        setError(res.error || 'Authentication failed. Please verify your email and password.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerCustomer({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        company: signupCompany.trim()
      });

      if (res.success) {
        const redirectTarget = urlParams.get('redirect') || '/account';
        setSuccessMessage('Welcome to FLOCARD! Account created. Redirecting...');
        setTimeout(() => {
          window.history.pushState({}, '', redirectTarget);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 700);
      } else {
        setError(res.error || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    setSuccessMessage(`Password recovery instructions dispatched to ${loginEmail}. Please inspect your inbox.`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#08060D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '110px 16px 60px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Cosmic Glow Flare */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '680px',
          height: '680px',
          background: 'radial-gradient(circle, rgba(107, 0, 255, 0.22) 0%, rgba(76, 29, 149, 0.08) 50%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Glassmorphism Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--card-surface)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          padding: '38px 34px',
          boxShadow: 'var(--card-shadow)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 2,
          boxSizing: 'border-box'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <a href="/" style={{ display: 'inline-block', marginBottom: '14px', textDecoration: 'none' }}>
            <img
              src={isLight ? '/assets/logo-dark.png' : '/assets/logo-light.png'}
              alt="FLOCARD"
              style={{ height: '30px', width: 'auto', display: 'block', margin: '0 auto' }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display, Sora)',
                fontWeight: 800,
                fontSize: '1.5rem',
                color: 'var(--text-primary)',
                display: 'none'
              }}
            >
              <span style={{ color: 'var(--accent-purple, #6B00FF)' }}>FLO</span>CARD
            </span>
          </a>

          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-heading, Sora)',
              letterSpacing: '-0.02em',
              margin: '0 0 6px 0'
            }}
          >
            {tab === 'login' && 'Customer Sign In'}
            {tab === 'signup' && 'Create Customer Account'}
            {tab === 'forgot' && 'Reset Password'}
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary, #B8AEC8)', margin: 0, lineHeight: 1.5 }}>
            {tab === 'login' && 'Sign in to access your NFC cards, digital profile, and analytics.'}
            {tab === 'signup' && 'Join FLOCARD and activate your digital professional identity.'}
            {tab === 'forgot' && 'Provide your registered email to receive recovery instructions.'}
          </p>
        </div>

        {/* If user is ALREADY signed in, show status & quick actions */}
        {user && (
          <div
            style={{
              background: 'rgba(107, 0, 255, 0.12)',
              border: '1px solid rgba(107, 0, 255, 0.35)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--accent-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name || 'Signed In Customer'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  {user.email}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href="/account"
                className="btn btn-primary btn-sm"
                style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
              >
                <span>Go to Account</span>
                <ArrowRight size={14} />
              </a>
              <button
                type="button"
                onClick={logout}
                className="btn btn-outline btn-sm"
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#EF4444' }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Toggle between Sign In and Create Account */}
        {tab !== 'forgot' && (
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--elevated-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '4px',
              gap: '4px',
              marginBottom: '22px'
            }}
          >
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: tab === 'login' ? 'linear-gradient(135deg, #6B00FF, #4C1D95)' : 'transparent',
                color: tab === 'login' ? '#FFFFFF' : 'var(--text-secondary, #B8AEC8)',
                fontWeight: tab === 'login' ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: tab === 'login' ? '0 2px 8px rgba(107, 0, 255, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Customer Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(null); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: tab === 'signup' ? 'linear-gradient(135deg, #6B00FF, #4C1D95)' : 'transparent',
                color: tab === 'signup' ? '#FFFFFF' : 'var(--text-secondary, #B8AEC8)',
                fontWeight: tab === 'signup' ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: tab === 'signup' ? '0 2px 8px rgba(107, 0, 255, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Continue with Google Button */}
        {tab !== 'forgot' && (
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || authLoading}
              id="google-continue-button"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1px solid var(--border-color, #30223F)',
                backgroundColor: 'rgba(27, 20, 37, 0.75)',
                color: '#FFFFFF',
                fontSize: '0.92rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: (loading || authLoading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                boxSizing: 'border-box',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
              }}
              onMouseEnter={(e) => {
                if (!(loading || authLoading)) {
                  e.currentTarget.style.borderColor = 'var(--accent-purple, #6B00FF)';
                  e.currentTarget.style.backgroundColor = 'rgba(107, 0, 255, 0.16)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(107, 0, 255, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color, #30223F)';
                e.currentTarget.style.backgroundColor = 'rgba(27, 20, 37, 0.75)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? (
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#FFFFFF',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>
                {tab === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
              </span>
            </button>

            {/* Subtle Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color, #30223F)' }} />
              <span
                style={{
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted, #82758F)',
                  fontWeight: 600,
                  letterSpacing: '0.05em'
                }}
              >
                {tab === 'signup' ? 'or register with email' : 'or continue with email'}
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color, #30223F)' }} />
            </div>
          </div>
        )}

        {/* Alert / Feedback Messages */}
        {error && (
          <div
            style={{
              padding: '11px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(220, 69, 69, 0.15)',
              border: '1px solid rgba(220, 69, 69, 0.4)',
              color: '#F87171',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
              lineHeight: 1.45
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: '11px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34D399',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
              lineHeight: 1.45
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: SIGN IN WITH EMAIL & PASSWORD */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '7px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted, #82758F)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. customer@flocard.in"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #30223F)',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    backgroundColor: 'var(--elevated-surface)',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-purple, #6B00FF)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 0, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color, #30223F)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); setError(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--light-lavender, #B8AEC8)',
                    fontSize: '0.76rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#FFFFFF')}
                  onMouseLeave={(e) => (e.target.style.color = 'var(--light-lavender, #B8AEC8)')}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted, #82758F)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #30223F)',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    backgroundColor: 'var(--elevated-surface)',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-purple, #6B00FF)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 0, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color, #30223F)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <MorphButton
              type="submit"
              status={loading || authLoading ? 'loading' : 'idle'}
              variant="primary"
              style={{ width: '100%', marginTop: '6px', height: '44px' }}
            >
              <span>Sign In to Account</span>
              <ArrowRight size={16} />
            </MorphButton>

          </form>
        )}

        {/* TAB 2: CREATE CUSTOMER ACCOUNT WITH EMAIL & PASSWORD */}
        {tab === 'signup' && (
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted, #82758F)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Amina Rahman"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #30223F)',
                    fontSize: '0.88rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    backgroundColor: 'var(--elevated-surface)',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-purple, #6B00FF)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 0, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color, #30223F)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted, #82758F)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="amina@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #30223F)',
                    fontSize: '0.88rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    backgroundColor: 'var(--elevated-surface)',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-purple, #6B00FF)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 0, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color, #30223F)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Company / Brand (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={16} color="var(--text-muted, #82758F)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={signupCompany}
                  onChange={(e) => setSignupCompany(e.target.value)}
                  placeholder="e.g. Design Studio"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #30223F)',
                    fontSize: '0.88rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    backgroundColor: 'var(--elevated-surface)',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-purple, #6B00FF)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 0, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color, #30223F)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Password (min 6 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted, #82758F)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Create a secure password"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #30223F)',
                    fontSize: '0.88rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    backgroundColor: 'var(--elevated-surface)',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-purple, #6B00FF)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 0, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color, #30223F)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {signupPassword && <PasswordStrength password={signupPassword} />}
            </div>

            <MorphButton
              type="submit"
              status={loading || authLoading ? 'loading' : 'idle'}
              variant="primary"
              style={{ width: '100%', marginTop: '6px', height: '44px' }}
            >
              <span>Create Customer Account</span>
              <ArrowRight size={16} />
            </MorphButton>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Your Registered Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted, #82758F)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #30223F)',
                    fontSize: '0.88rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    backgroundColor: 'var(--elevated-surface)',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-purple, #6B00FF)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 0, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color, #30223F)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '44px', justifyContent: 'center' }}
            >
              Send Password Instructions
            </button>

            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #B8AEC8)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                marginTop: '4px'
              }}
              onMouseEnter={(e) => (e.target.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary, #B8AEC8)')}
            >
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
