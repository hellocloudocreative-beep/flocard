/* ==========================================================================
   SPECTRUM UI - LOGIN CARD COMPONENT
   FLOCARD Dark Luxury Admin Authentication Card with Real Credentials Verification.
   ========================================================================== */
import React, { useState } from 'react';
import MorphButton from './MorphButton';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

export default function LoginCard({
  onGoogleSignIn,
  onEmailSignIn,
  loading = false,
  error = null,
  accessDenied = false
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onEmailSignIn && email.trim()) {
      onEmailSignIn(email.trim(), password);
    }
  };

  const handleQuickAdminFill = () => {
    setEmail('akhil@flocard.in');
    setPassword('admin123');
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(21, 16, 29, 0.95)',
        borderRadius: '24px',
        border: '1px solid var(--border-color, #30223F)',
        padding: '38px 32px',
        boxShadow: '0 25px 60px -15px rgba(107, 0, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* Header with Official FLOCARD Brand */}
      <div style={{ textAlign: 'center', marginBottom: '26px' }}>
        <a href="/" style={{ display: 'inline-block', marginBottom: '14px', textDecoration: 'none' }}>
          <img
            src="/assets/logo-light.png"
            alt="FLOCARD"
            style={{ height: '30px', margin: '0 auto', display: 'block' }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display, Sora)',
              fontWeight: 800,
              fontSize: '1.45rem',
              color: '#ffffff',
              display: 'none'
            }}
          >
            <span style={{ color: 'var(--accent-purple, #6B00FF)' }}>FLO</span>CARD
          </span>
        </a>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(107, 0, 255, 0.15)', border: '1px solid rgba(107, 0, 255, 0.3)', padding: '4px 10px', borderRadius: '100px', marginBottom: '10px' }}>
          <KeyRound size={12} color="var(--accent-purple, #6B00FF)" />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Restricted Admin Access
          </span>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading, Sora)', letterSpacing: '-0.02em', margin: 0 }}>
          Admin Sign In
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary, #B8AEC8)', marginTop: '6px', lineHeight: 1.45 }}>
          Enter authorized administrator email and password to access platform management.
        </p>
      </div>

      {/* Access Denied / Error Feedback */}
      {(error || accessDenied) && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: 'rgba(220, 69, 69, 0.15)',
            border: '1px solid rgba(220, 69, 69, 0.4)',
            color: '#F87171',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '20px',
            lineHeight: 1.45
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Access Denied:</strong> {error || 'This account is not authorized as a FLOCARD administrator.'}
          </div>
        </div>
      )}

      {/* Primary Administrator Email & Password Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '7px' }}>
            Administrator Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} color="var(--text-muted, #82758F)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. akhil@flocard.in"
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '11px 12px 11px 38px',
                borderRadius: '10px',
                border: '1px solid var(--border-color, #30223F)',
                fontSize: '0.9rem',
                color: '#FFFFFF',
                outline: 'none',
                backgroundColor: 'rgba(27, 20, 37, 0.85)',
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
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '7px' }}>
            Administrator Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} color="var(--text-muted, #82758F)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter administrator password"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '11px 12px 11px 38px',
                borderRadius: '10px',
                border: '1px solid var(--border-color, #30223F)',
                fontSize: '0.9rem',
                color: '#FFFFFF',
                outline: 'none',
                backgroundColor: 'rgba(27, 20, 37, 0.85)',
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
          status={loading ? 'loading' : 'idle'}
          variant="primary"
          style={{ width: '100%', marginTop: '6px', height: '44px' }}
        >
          <span>Sign In to Admin Console</span>
          <ArrowRight size={16} />
        </MorphButton>

        {/* Quick Demo Fill Pill for Local Testing */}
        <div
          style={{
            marginTop: '4px',
            padding: '10px 12px',
            background: 'rgba(23, 16, 32, 0.7)',
            border: '1px dashed var(--border-color, #30223F)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.76rem',
            color: 'var(--text-muted, #82758F)'
          }}
        >
          <span>Demo Admin Account:</span>
          <button
            type="button"
            onClick={handleQuickAdminFill}
            style={{
              background: 'rgba(107, 0, 255, 0.2)',
              border: '1px solid rgba(107, 0, 255, 0.4)',
              color: 'var(--light-lavender, #B8AEC8)',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Auto-fill Admin Credentials
          </button>
        </div>
      </form>

      {/* Or Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0 16px', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color, #30223F)' }} />
        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted, #82758F)', fontWeight: 600 }}>
          Or OAuth Entry
        </span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color, #30223F)' }} />
      </div>

      {/* Google OAuth Button with Verification Check */}
      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '11px 16px',
          borderRadius: '10px',
          border: '1px solid var(--border-color, #30223F)',
          backgroundColor: 'rgba(27, 20, 37, 0.7)',
          color: '#FFFFFF',
          fontSize: '0.86rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-purple, #6B00FF)';
          e.currentTarget.style.backgroundColor = 'rgba(107, 0, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color, #30223F)';
          e.currentTarget.style.backgroundColor = 'rgba(27, 20, 37, 0.7)';
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Verify with Google Enterprise</span>
      </button>

      {/* Footer info */}
      <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted, #82758F)', borderTop: '1px solid rgba(48, 36, 61, 0.6)', paddingTop: '16px' }}>
        Protected by FLOCARD Hardware Security Policies & RLS.
      </div>
    </div>
  );
}
