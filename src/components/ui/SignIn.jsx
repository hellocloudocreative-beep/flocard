/* ==========================================================================
   UI ARC - SIGN IN BLOCK (Email Code / Magic Code / Passkey / SSO)
   A sign-in card that morphs from email to a six-digit code to signed-in account.
   ========================================================================== */

import React, { useState, useRef, useEffect } from 'react';
import { Mail, KeyRound, ArrowRight, CheckCircle2, ChevronLeft, AlertCircle } from 'lucide-react';
import Spinner from '../spectrum/SpinnerDemo';

export function SignIn({
  demoCode = '123456',
  onSignIn,
  className = '',
  style = {}
}) {
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const [account, setAccount] = useState(null);

  const otpInputsRef = useRef([]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setError(null);
    setLoading(true);
    setStatusAnnouncement('Sending verification code...');

    setTimeout(() => {
      setLoading(false);
      setStep('code');
      setStatusAnnouncement(`Verification code sent to ${email}. Code is ${demoCode}`);
    }, 700);
  };

  const handleOtpChange = (index, value) => {
    const char = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // Auto advance to next input
    if (char && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits entered
    const codeEntered = newOtp.join('');
    if (codeEntered.length === 6) {
      verifyCode(codeEntered);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().slice(0, 6);
    if (/^\d+$/.test(pasted)) {
      const newOtp = pasted.split('');
      while (newOtp.length < 6) newOtp.push('');
      setOtp(newOtp);
      if (pasted.length === 6) {
        verifyCode(pasted);
      }
    }
  };

  const verifyCode = (code) => {
    setLoading(true);
    setError(null);
    setStatusAnnouncement('Verifying security code...');

    setTimeout(() => {
      setLoading(false);
      if (code === demoCode || code.length === 6) {
        const signedAccount = {
          name: email.split('@')[0],
          email: email,
          avatar: null
        };
        setAccount(signedAccount);
        setStep('done');
        setStatusAnnouncement('Sign in successful. Redirecting to your dashboard...');
        if (onSignIn) {
          onSignIn(signedAccount, 'Email code');
        }
      } else {
        setError(`Invalid code. Enter demo code: ${demoCode}`);
        setStatusAnnouncement('Incorrect verification code entered.');
      }
    }, 800);
  };

  const handleSSO = (provider) => {
    setLoading(true);
    setStatusAnnouncement(`Initiating ${provider} authentication...`);
    setTimeout(() => {
      setLoading(false);
      const signedAccount = {
        name: `${provider} User`,
        email: `user@${provider.toLowerCase()}.com`
      };
      setAccount(signedAccount);
      setStep('done');
      if (onSignIn) onSignIn(signedAccount, provider);
    }, 800);
  };

  const handlePasskey = () => {
    setLoading(true);
    setStatusAnnouncement('Authenticating with hardware passkey...');
    setTimeout(() => {
      setLoading(false);
      const signedAccount = {
        name: 'Passkey Verified',
        email: email || 'passkey@flocard.in'
      };
      setAccount(signedAccount);
      setStep('done');
      if (onSignIn) onSignIn(signedAccount, 'Passkey');
    }, 700);
  };

  return (
    <div
      className={`arc-signin-card ${className}`}
      style={{
        width: '100%',
        maxWidth: '430px',
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        border: '1px solid #E8E3EF',
        padding: '36px 30px',
        boxShadow: '0 20px 50px -10px rgba(107, 0, 255, 0.1)',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {/* Live Accessibility Status Announcement */}
      <div role="status" aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {statusAnnouncement}
      </div>

      {/* STEP 1: EMAIL INPUT & SSO */}
      {step === 'email' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#191522', fontFamily: 'var(--font-heading, Sora)' }}>
              Sign In
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#777184' }}>
              Enter your email for passwordless verification code
            </p>
          </div>

          {error && (
            <div role="alert" style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FEF2F2', color: '#DC4545', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#191522', marginBottom: '6px' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#777184" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
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
            </div>

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
                marginTop: '4px'
              }}
            >
              {loading ? <Spinner size={18} color="#FFFFFF" /> : <><span>Continue with Email</span><ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Passkey Button */}
          <button
            type="button"
            onClick={handlePasskey}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid #E8E3EF',
              backgroundColor: '#FFFFFF',
              color: '#191522',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '12px'
            }}
          >
            <KeyRound size={16} color="#6B00FF" />
            <span>Sign in with Passkey</span>
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E8E3EF' }} />
            <span style={{ fontSize: '0.72rem', color: '#777184', textTransform: 'uppercase', fontWeight: 600 }}>Or continue with</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E8E3EF' }} />
          </div>

          {/* SSO Buttons Group */}
          <div role="group" aria-label="Single sign-on providers" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleSSO('Google')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #E8E3EF',
                backgroundColor: '#FFFFFF',
                color: '#191522',
                fontSize: '0.78rem',
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
              onClick={() => handleSSO('Apple')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #E8E3EF',
                backgroundColor: '#FFFFFF',
                color: '#191522',
                fontSize: '0.78rem',
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
              onClick={() => handleSSO('GitHub')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #E8E3EF',
                backgroundColor: '#FFFFFF',
                color: '#191522',
                fontSize: '0.78rem',
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
        </div>
      )}

      {/* STEP 2: 6-DIGIT OTP CODE */}
      {step === 'code' && (
        <div>
          <button
            type="button"
            onClick={() => setStep('email')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: '#777184',
              fontSize: '0.8rem',
              cursor: 'pointer',
              padding: 0,
              marginBottom: '16px'
            }}
          >
            <ChevronLeft size={16} />
            <span>Change email</span>
          </button>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#191522', fontFamily: 'var(--font-heading, Sora)' }}>
              Check your inbox
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: '#777184' }}>
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          {error && (
            <div role="alert" style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FEF2F2', color: '#DC4545', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 6 OTP Inputs Group */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpInputsRef.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={handlePaste}
                style={{
                  width: '44px',
                  height: '52px',
                  borderRadius: '12px',
                  border: '1.5px solid #E8E3EF',
                  backgroundColor: '#F7F6FA',
                  textAlign: 'center',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: '#191522',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#6B00FF'; e.target.style.backgroundColor = '#FFFFFF'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E8E3EF'; e.target.style.backgroundColor = '#F7F6FA'; }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => verifyCode(otp.join(''))}
            disabled={loading || otp.join('').length < 6}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#6B00FF',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: loading || otp.join('').length < 6 ? 'not-allowed' : 'pointer',
              opacity: otp.join('').length < 6 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? <Spinner size={18} color="#FFFFFF" /> : <span>Confirm & Sign In</span>}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: '#777184' }}>
            Didn't receive it?{' '}
            <button
              type="button"
              onClick={() => verifyCode(demoCode)}
              style={{ background: 'none', border: 'none', color: '#6B00FF', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Use demo code ({demoCode})
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DONE / SIGNED IN */}
      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#EEFAF5', color: '#16A36A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={36} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#191522', fontFamily: 'var(--font-heading, Sora)' }}>
            Welcome back!
          </h3>
          <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#777184' }}>
            Signed in as <strong>{account?.email}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export default SignIn;
