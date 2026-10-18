/* ==========================================================================
   FLOCARD ADMIN LOGIN PORTAL (/admin-login)
   Secure entry for authorized administrators and owners via Google OAuth or credentials.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginCard from '../../components/spectrum/LoginCard';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const { user, isAdmin, loginWithGoogle, login, loading: authLoading } = useAuth();
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already logged in as authorized admin, redirect to /admin
  useEffect(() => {
    if (user && isAdmin) {
      window.history.pushState({}, '', '/admin');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [user, isAdmin]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setAccessDenied(false);
    setLoading(true);

    try {
      const res = await loginWithGoogle('/admin');
      if (res.success) {
        window.history.pushState({}, '', '/admin');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        setError(res.error || 'Failed to authenticate with Google.');
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (email, password) => {
    setError(null);
    setAccessDenied(false);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        window.history.pushState({}, '', '/admin');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        if (res.error && res.error.includes('not authorized')) {
          setAccessDenied(true);
        }
        setError(res.error || 'Invalid credentials or unauthorized account.');
      }
    } catch (err) {
      setError(err.message || 'Sign in error.');
    } finally {
      setLoading(false);
    }
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
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Purple Radial Glow Background */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(107, 0, 255, 0.22) 0%, rgba(76, 29, 149, 0.08) 50%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Back to Homepage Link */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10 }}>
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#B8AEC8',
            fontSize: '0.86rem',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(21, 16, 29, 0.8)',
            border: '1px solid #30223F',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#6B00FF'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#B8AEC8'; e.currentTarget.style.borderColor = '#30223F'; }}
        >
          <ArrowLeft size={16} />
          <span>FLOCARD Public Portal</span>
        </a>
      </div>

      {/* Main Login Card */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <LoginCard
          onGoogleSignIn={handleGoogleSignIn}
          onEmailSignIn={handleEmailSignIn}
          loading={loading || authLoading}
          error={error}
          accessDenied={accessDenied}
        />
      </div>

      {/* Security badge footer */}
      <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', gap: '6px', color: '#82758F', fontSize: '0.78rem' }}>
        <ShieldCheck size={14} color="#6B00FF" />
        <span>Hardware-Isolated Keys & Enterprise RLS Policies Enforced</span>
      </div>
    </div>
  );
}
