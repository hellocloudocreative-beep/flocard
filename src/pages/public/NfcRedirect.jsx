/* ==========================================================================
   FLOCARD PERMANENT NFC REDIRECT HANDLER (/t/:cardCode)
   Resolves physical NFC card taps to assigned profile and logs tap analytics.
   ========================================================================== */

import React, { useEffect, useState } from 'react';
import { Radio, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function NfcRedirect({ cardCode = 'flc-akhil-992' }) {
  const { getCardByCode, recordTap } = useData();
  const [status, setStatus] = useState('resolving'); // 'resolving' | 'redirecting' | 'unassigned' | 'not_found'
  const [targetSlug, setTargetSlug] = useState('akhil');
  const [card, setCard] = useState(null);

  useEffect(() => {
    const matchedCard = getCardByCode(cardCode);
    setCard(matchedCard);

    if (!matchedCard) {
      // Fallback for demo codes
      if (cardCode.toLowerCase().includes('akhil')) {
        recordTap(cardCode, { os: 'Mobile Web', browser: navigator.userAgent });
        setTargetSlug('akhil');
        setStatus('redirecting');
        const timer = setTimeout(() => {
          window.location.href = '/p/akhil';
        }, 1200);
        return () => clearTimeout(timer);
      }
      setStatus('not_found');
      return;
    }

    if (matchedCard.status === 'in_stock' || !matchedCard.profileSlug) {
      setStatus('unassigned');
      return;
    }

    // Record tap analytics
    recordTap(matchedCard.cardCode, {
      os: /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iOS' : /Android/.test(navigator.userAgent) ? 'Android' : 'Desktop',
      browser: navigator.userAgent
    });

    setTargetSlug(matchedCard.profileSlug);
    setStatus('redirecting');

    // Smooth redirect
    const timer = setTimeout(() => {
      window.location.href = `/p/${matchedCard.profileSlug}`;
    }, 1200);

    return () => clearTimeout(timer);
  }, [cardCode]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
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
          background: 'radial-gradient(circle, rgba(107, 0, 255, 0.35) 0%, transparent 70%)',
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
          boxShadow: '0 20px 60px rgba(107, 0, 255, 0.4)'
        }}
      >
        {status === 'redirecting' && (
          <>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-purple))',
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

            <p style={{ fontSize: '0.92rem', color: 'var(--light-lavender)', marginBottom: '16px' }}>
              Connecting to <strong style={{ color: '#ffffff' }}>@{targetSlug}</strong>...
            </p>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Card Identifier: <span style={{ color: 'var(--text-secondary)' }}>{cardCode}</span>
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
                  background: 'linear-gradient(90deg, var(--primary-purple), var(--accent-purple))',
                  animation: 'pulseGlow 1.2s infinite'
                }}
              />
            </div>
          </>
        )}

        {status === 'unassigned' && (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#f59e0b' }}>
              <AlertCircle size={32} />
            </div>

            <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px' }}>
              Unassigned NFC Card
            </h2>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              This physical card (<code style={{ color: 'var(--light-lavender)' }}>{cardCode}</code>) is registered in inventory but has not yet been linked to a customer digital profile.
            </p>

            <a href="/admin/cards" className="btn btn-primary" style={{ width: '100%' }}>
              <span>Assign in Admin Console</span>
              <ArrowRight size={16} />
            </a>
          </>
        )}

        {status === 'not_found' && (
          <>
            <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px' }}>
              Unrecognized Card Tag
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              The NFC chip tag {cardCode} was not found in the FLOCARD directory.
            </p>
            <a href="/" className="btn btn-primary">Return to Homepage</a>
          </>
        )}
      </div>
    </div>
  );
}
