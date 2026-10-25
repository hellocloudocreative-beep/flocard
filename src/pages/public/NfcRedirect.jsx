/* ==========================================================================
   FLOCARD PERMANENT NFC REDIRECT HANDLER (/t/:cardCode)
   Resolves physical NFC card taps to assigned profile and logs tap analytics.
   Enforces live database activation checks:
   - Active: Redirects to assigned public digital profile.
   - Disabled / Revoked: Displays luxury branded FLOCARDS "Card Inactive" screen
     without leaking private customer details.
   - Unassigned / Pending: Explains card is registered but pending assignment.
   - Not Found: Shows unrecognized card tag message.
   ========================================================================== */

import React, { useEffect, useState } from 'react';
import { Radio, ShieldAlert, Sparkles, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Home, HelpCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { getAuthoritativeCardByCode } from '../../lib/cardService';

export default function NfcRedirect({ cardCode = 'flc-alex-001' }) {
  const { recordTap } = useData();
  const [status, setStatus] = useState('resolving'); // 'resolving' | 'redirecting' | 'disabled' | 'unassigned' | 'not_found'
  const [targetSlug, setTargetSlug] = useState('');
  const [card, setCard] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function resolveTap() {
      setStatus('resolving');

      // Fetch live authoritative card record from Supabase / Local storage
      const matchedCard = await getAuthoritativeCardByCode(cardCode);
      if (isCancelled) return;

      setCard(matchedCard);

      if (!matchedCard) {
        // Fallback for legacy demo links
        if (cardCode.toLowerCase().includes('alex') || cardCode.toLowerCase().includes('akhil') || cardCode.toLowerCase().includes('demo')) {
          recordTap(cardCode, { os: 'Mobile Web', browser: navigator.userAgent });
          setTargetSlug('alex');
          setStatus('redirecting');
          const timer = setTimeout(() => {
            window.location.href = '/alex';
          }, 1200);
          return () => clearTimeout(timer);
        }
        setStatus('not_found');
        return;
      }

      // Check for disabled / revoked status
      const cardStatus = (matchedCard.status || '').toLowerCase();
      if (cardStatus === 'disabled' || cardStatus === 'revoked' || cardStatus === 'suspended') {
        setStatus('disabled');
        return;
      }

      // Check for unassigned or pending without slug
      if (cardStatus === 'in_stock' || cardStatus === 'pending' || !matchedCard.profileSlug) {
        setStatus('unassigned');
        return;
      }

      // Active card: Record tap analytics
      recordTap(matchedCard.cardCode, {
        os: /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iOS' : /Android/.test(navigator.userAgent) ? 'Android' : 'Desktop',
        browser: navigator.userAgent
      });

      setTargetSlug(matchedCard.profileSlug);
      setStatus('redirecting');

      // Smooth redirect to canonical profile
      const timer = setTimeout(() => {
        window.location.href = `/${matchedCard.profileSlug}`;
      }, 1200);

      return () => clearTimeout(timer);
    }

    resolveTap();

    return () => {
      isCancelled = true;
    };
  }, [cardCode]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main, #08060D)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          background: status === 'disabled'
            ? 'radial-gradient(circle, rgba(239, 68, 68, 0.22) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(107, 0, 255, 0.35) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />

      <div
        className="glass-panel"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '44px 28px',
          borderRadius: '24px',
          position: 'relative',
          zIndex: 2,
          boxShadow: status === 'disabled'
            ? '0 20px 60px rgba(239, 68, 68, 0.25)'
            : '0 20px 60px rgba(107, 0, 255, 0.4)',
          border: status === 'disabled'
            ? '1px solid rgba(239, 68, 68, 0.3)'
            : '1px solid rgba(107, 0, 255, 0.25)'
        }}
      >
        {/* State: Resolving */}
        {status === 'resolving' && (
          <>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(107, 0, 255, 0.15)',
                border: '1px solid rgba(107, 0, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: 'var(--accent-purple, #A855F7)'
              }}
            >
              <RefreshCw size={32} className="animate-spin" />
            </div>
            <h2 style={{ fontSize: '1.4rem', color: '#ffffff', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
              Verifying NFC Connection
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--light-lavender, #C4B5FD)', margin: 0 }}>
              Resolving secure smart card destination...
            </p>
          </>
        )}

        {/* State: Redirecting Active Card */}
        {status === 'redirecting' && (
          <>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-purple, #6B00FF), var(--accent-purple, #A855F7))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 0 35px rgba(107, 0, 255, 0.7)'
              }}
            >
              <Radio size={36} color="#ffffff" className="animate-pulse-glow" />
            </div>

            <h2 style={{ fontSize: '1.6rem', color: '#ffffff', textTransform: 'uppercase', marginBottom: '8px' }}>
              NFC CONNECTED
            </h2>

            <p style={{ fontSize: '0.92rem', color: 'var(--light-lavender, #C4B5FD)', marginBottom: '16px' }}>
              Connecting to <strong style={{ color: '#ffffff' }}>@{targetSlug}</strong>...
            </p>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94A3B8)', marginBottom: '24px' }}>
              Card Identifier: <span style={{ color: 'var(--text-secondary, #CBD5E1)', fontFamily: 'monospace' }}>{cardCode}</span>
            </div>

            <div
              style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '100%',
                  background: 'linear-gradient(90deg, var(--primary-purple, #6B00FF), var(--accent-purple, #A855F7))',
                  animation: 'pulseGlow 1.2s infinite'
                }}
              />
            </div>
          </>
        )}

        {/* State: Disabled / Deactivated Card (Spec Requirement 3 & 6) */}
        {status === 'disabled' && (
          <>
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 22px',
                color: '#EF4444',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)'
              }}
            >
              <ShieldAlert size={36} />
            </div>

            <div
              style={{
                display: 'inline-block',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: '1.2px',
                color: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '4px 12px',
                borderRadius: '9999px',
                marginBottom: '12px'
              }}
            >
              Card Currently Disabled
            </div>

            <h2 style={{ fontSize: '1.5rem', color: '#FFFFFF', fontWeight: 800, marginBottom: '10px' }}>
              Card Inactive
            </h2>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #CBD5E1)', lineHeight: 1.6, marginBottom: '20px' }}>
              This physical NFC card has been deactivated by its owner. Its contactless redirect is temporarily paused.
            </p>

            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                padding: '12px 16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '26px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.76rem'
              }}
            >
              <span style={{ color: 'var(--text-muted, #94A3B8)' }}>Card Identifier</span>
              <span style={{ fontFamily: 'monospace', color: '#FFFFFF', fontWeight: 700 }}>{cardCode}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="/"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #6B00FF, #4D00B3)'
                }}
              >
                <Home size={15} />
                <span>Return to FLOCARDS</span>
              </a>
              <a
                href="/faq"
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--light-lavender, #C4B5FD)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '8px'
                }}
              >
                <HelpCircle size={13} />
                <span>Need help with your NFC card? Visit FAQ</span>
              </a>
            </div>
          </>
        )}

        {/* State: Unassigned / Pending */}
        {status === 'unassigned' && (
          <>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#F59E0B'
              }}
            >
              <AlertCircle size={34} />
            </div>

            <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px', fontWeight: 800 }}>
              Pending Card Setup
            </h2>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #CBD5E1)', marginBottom: '20px', lineHeight: 1.5 }}>
              This physical card (<code style={{ color: 'var(--light-lavender, #C4B5FD)', fontFamily: 'monospace' }}>{cardCode}</code>) has not yet been linked to a customer digital profile.
            </p>

            <a href="/admin" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <span>Assign in Admin Console</span>
              <ArrowRight size={16} />
            </a>
          </>
        )}

        {/* State: Not Found */}
        {status === 'not_found' && (
          <>
            <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px', fontWeight: 800 }}>
              Unrecognized Card Tag
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #CBD5E1)', marginBottom: '24px' }}>
              The NFC chip tag <span style={{ fontFamily: 'monospace', color: '#FFFFFF' }}>{cardCode}</span> was not found in the FLOCARD directory.
            </p>
            <a href="/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Home size={15} />
              <span>Return to Homepage</span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}
