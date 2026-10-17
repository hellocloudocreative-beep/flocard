/* ==========================================================================
   UI ARC - LOGIN CENTERED BLOCK
   A passkey-first sign in and sign up card on a quiet ring backdrop that morphs
   through email and a six-digit code.
   ========================================================================== */

import React, { useState } from 'react';
import SignIn from './SignIn';
import SignupForm from './SignupForm';

export function LoginCentered({
  fullScreen = true,
  termsHref = '/terms',
  privacyHref = '/privacy',
  onSignIn,
  className = '',
  style = {}
}) {
  const [mode, setMode] = useState('sign-in'); // 'sign-in' | 'sign-up'

  return (
    <div
      className={`arc-login-centered ${className}`}
      style={{
        minHeight: fullScreen ? '100vh' : '600px',
        width: '100%',
        backgroundColor: '#08060D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '32px 16px',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {/* Quiet Geometric Ring Backdrop */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          border: '1px solid rgba(107, 0, 255, 0.12)',
          boxShadow: '0 0 100px rgba(107, 0, 255, 0.15), inset 0 0 80px rgba(76, 29, 149, 0.1)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          border: '1px solid rgba(168, 85, 247, 0.15)',
          pointerEvents: 'none'
        }}
      />

      {/* Brand Header */}
      <div style={{ position: 'relative', zIndex: 2, marginBottom: '24px', textAlign: 'center' }}>
        <a href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <img
            src="/assets/logo-light.png"
            alt="FLOCARD"
            style={{ height: '28px', width: 'auto', display: 'block' }}
          />
        </a>
      </div>

      {/* Toggle between Sign In and Sign Up */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'inline-flex',
          backgroundColor: '#15101D',
          border: '1px solid #30223F',
          borderRadius: '9999px',
          padding: '4px',
          gap: '4px',
          marginBottom: '20px'
        }}
      >
        <button
          type="button"
          onClick={() => setMode('sign-in')}
          style={{
            padding: '6px 20px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: mode === 'sign-in' ? '#6B00FF' : 'transparent',
            color: mode === 'sign-in' ? '#FFFFFF' : '#82758F',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('sign-up')}
          style={{
            padding: '6px 20px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: mode === 'sign-up' ? '#6B00FF' : 'transparent',
            color: mode === 'sign-up' ? '#FFFFFF' : '#82758F',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Create Account
        </button>
      </div>

      {/* Centered Auth Card */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', justifyContent: 'center' }}>
        {mode === 'sign-in' ? (
          <SignIn onSignIn={(account, method) => onSignIn && onSignIn(account.email, method, 'sign-in')} />
        ) : (
          <SignupForm onSubmit={(details) => onSignIn && onSignIn(details.email, 'Email code', 'sign-up')} />
        )}
      </div>

      {/* Footer Links */}
      <div style={{ position: 'relative', zIndex: 2, marginTop: '28px', fontSize: '0.76rem', color: '#82758F', display: 'flex', gap: '16px' }}>
        <a href={termsHref} style={{ color: '#82758F', textDecoration: 'none' }}>Terms of Service</a>
        <span>•</span>
        <a href={privacyHref} style={{ color: '#82758F', textDecoration: 'none' }}>Privacy Policy</a>
      </div>
    </div>
  );
}

export default LoginCentered;
