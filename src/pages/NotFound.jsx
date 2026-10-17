/* ==========================================================================
   FLOCARD 404 NOT FOUND PAGE
   ========================================================================== */

import React from 'react';
import { ArrowLeft, Radio, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px 60px',
        position: 'relative'
      }}
    >
      <div className="glass-panel" style={{ padding: '60px 36px', maxWidth: '520px', width: '100%' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(107, 0, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-purple)' }}>
          <Compass size={36} />
        </div>

        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#ffffff', letterSpacing: '-0.02em' }}>
          404
        </h1>

        <h2 style={{ fontSize: '1.4rem', color: 'var(--light-lavender)', textTransform: 'uppercase', margin: '8px 0 16px' }}>
          Signal Lost in Orbit
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '32px' }}>
          The requested coordinate does not exist or has moved to an updated digital NFC frequency.
        </p>

        <a href="/" className="btn btn-primary btn-lg">
          <ArrowLeft size={18} />
          <span>Return to Homepage</span>
        </a>
      </div>
    </div>
  );
}
