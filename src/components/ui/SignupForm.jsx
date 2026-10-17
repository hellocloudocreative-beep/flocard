/* ==========================================================================
   UI ARC - SIGN UP FORM BLOCK
   An account creation flow with field validation, password strength, and a clear completion state.
   ========================================================================== */

import React, { useState } from 'react';
import PasswordStrength from '../spectrum/PasswordStrength';
import Spinner from '../spectrum/SpinnerDemo';
import { Check, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export function SignupForm({
  onSubmit,
  serverError = null,
  onProvider,
  className = '',
  style = {}
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [productUpdates, setProductUpdates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError(null);

    if (name.trim().length < 2) {
      setClientError('Name must be at least 2 characters.');
      return;
    }
    if (!email || !email.includes('@')) {
      setClientError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setClientError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit({ name, email, password, productUpdates });
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
      setIsSuccess(true);
    } catch (err) {
      setClientError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialProvider = (provider) => {
    if (onProvider) {
      onProvider(provider);
    } else {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setIsSuccess(true);
      }, 900);
    }
  };

  if (isSuccess) {
    return (
      <div
        className={`arc-signup-card ${className}`}
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E8E3EF',
          padding: '44px 32px',
          textAlign: 'center',
          boxShadow: '0 20px 50px -10px rgba(107, 0, 255, 0.1)',
          ...style
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: '#EEFAF5',
            color: '#16A36A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 20px rgba(22, 163, 106, 0.2)'
          }}
        >
          <CheckCircle2 size={40} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#191522', fontFamily: 'var(--font-heading, Sora)' }}>
          Account Created!
        </h2>
        <p style={{ margin: '8px 0 24px', fontSize: '0.88rem', color: '#777184', lineHeight: 1.5 }}>
          Welcome to FLOCARD, <strong>{name}</strong>. Your digital portfolio and NFC manager are ready.
        </p>
        <a
          href="/account"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: '#6B00FF',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.92rem',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(107, 0, 255, 0.25)'
          }}
        >
          <span>Go to Account Portal</span>
          <ArrowRight size={16} />
        </a>
      </div>
    );
  }

  return (
    <div
      className={`arc-signup-card ${className}`}
      style={{
        width: '100%',
        maxWidth: '430px',
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        border: '1px solid #E8E3EF',
        padding: '36px 30px',
        boxShadow: '0 20px 50px -10px rgba(107, 0, 255, 0.1)',
        position: 'relative',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#191522', fontFamily: 'var(--font-heading, Sora)' }}>
          Create an Account
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#777184' }}>
          Get started with your FLOCARD digital profile
        </p>
      </div>

      {/* Social Provider Buttons */}
      <div role="group" aria-label="Sign up with social providers" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => handleSocialProvider('Google')}
          style={{
            padding: '9px 8px',
            borderRadius: '10px',
            border: '1px solid #E8E3EF',
            backgroundColor: '#FFFFFF',
            color: '#191522',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleSocialProvider('Apple')}
          style={{
            padding: '9px 8px',
            borderRadius: '10px',
            border: '1px solid #E8E3EF',
            backgroundColor: '#FFFFFF',
            color: '#191522',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span> Apple</span>
        </button>

        <button
          type="button"
          onClick={() => handleSocialProvider('GitHub')}
          style={{
            padding: '9px 8px',
            borderRadius: '10px',
            border: '1px solid #E8E3EF',
            backgroundColor: '#FFFFFF',
            color: '#191522',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>GitHub</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0', gap: '10px' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#E8E3EF' }} />
        <span style={{ fontSize: '0.72rem', color: '#777184', textTransform: 'uppercase', fontWeight: 600 }}>Or continue with email</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#E8E3EF' }} />
      </div>

      {(clientError || serverError) && (
        <div role="alert" style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FEF2F2', color: '#DC4545', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{clientError || serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#191522', marginBottom: '6px' }}>
            Full Name
          </label>
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid #E8E3EF',
              fontSize: '0.88rem',
              backgroundColor: '#F7F6FA',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => { e.target.style.borderColor = '#6B00FF'; e.target.style.backgroundColor = '#FFFFFF'; }}
            onBlur={(e) => { e.target.style.borderColor = '#E8E3EF'; e.target.style.backgroundColor = '#F7F6FA'; }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#191522', marginBottom: '6px' }}>
            Email Address
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid #E8E3EF',
              fontSize: '0.88rem',
              backgroundColor: '#F7F6FA',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => { e.target.style.borderColor = '#6B00FF'; e.target.style.backgroundColor = '#FFFFFF'; }}
            onBlur={(e) => { e.target.style.borderColor = '#E8E3EF'; e.target.style.backgroundColor = '#F7F6FA'; }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#191522', marginBottom: '6px' }}>
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid #E8E3EF',
              fontSize: '0.88rem',
              backgroundColor: '#F7F6FA',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => { e.target.style.borderColor = '#6B00FF'; e.target.style.backgroundColor = '#FFFFFF'; }}
            onBlur={(e) => { e.target.style.borderColor = '#E8E3EF'; e.target.style.backgroundColor = '#F7F6FA'; }}
          />
          <PasswordStrength password={password} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#777184', marginTop: '4px' }}>
          <input
            type="checkbox"
            checked={productUpdates}
            onChange={(e) => setProductUpdates(e.target.checked)}
            style={{ accentColor: '#6B00FF' }}
          />
          <span>Send me product updates and contactless NFC identity insights.</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#6B00FF',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(107, 0, 255, 0.25)',
            marginTop: '6px'
          }}
        >
          {loading ? <Spinner size={18} color="#FFFFFF" /> : <><span>Create Account</span><ArrowRight size={16} /></>}
        </button>
      </form>
    </div>
  );
}

export default SignupForm;
