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
            Administrator Username or Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} color="var(--text-muted, #82758F)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. flocard"
              required
              autoComplete="username"
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

      </form>

      {/* Footer info */}
      <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted, #82758F)', borderTop: '1px solid rgba(48, 36, 61, 0.6)', paddingTop: '16px' }}>
        Protected by FLOCARD Hardware Security Policies & RLS.
      </div>
    </div>
  );
}
