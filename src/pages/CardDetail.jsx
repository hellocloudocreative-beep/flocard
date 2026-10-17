/* ==========================================================================
   FLOCARD CARD DETAIL PAGE (Gold / Platinum / Custom Purple)
   ========================================================================== */

import React from 'react';
import { ArrowRight, Sparkles, Check, ShieldCheck, Cpu, Droplets, Zap, ArrowLeft } from 'lucide-react';
import Card3DPreview from '../components/Card3DPreview';
import { EDITIONS } from '../lib/constants';

export default function CardDetail({ editionKey = 'purple' }) {
  const edition = EDITIONS[editionKey] || EDITIONS.purple;

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 40px)', paddingBottom: '100px' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ marginBottom: '32px' }}>
          <a
            href="/cards"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.88rem',
              color: 'var(--text-secondary)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Collection</span>
          </a>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '60px',
            alignItems: 'center',
            marginBottom: '80px'
          }}
        >
          {/* Left: 3D Interactive Card Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Card3DPreview edition={editionKey} width={420} allowFlip={true} />
            <p style={{ marginTop: '20px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Hover to tilt &bull; Click to flip front & back
            </p>
          </div>

          {/* Right: Edition Details & CTAs */}
          <div>
            <div className="badge-tag" style={{ marginBottom: '16px' }}>
              {edition.badge} EDITION
            </div>

            <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.4rem)', textTransform: 'uppercase', marginBottom: '14px' }}>
              {edition.name}
            </h1>

            <p style={{ fontSize: '1.15rem', color: 'var(--light-lavender)', fontWeight: 600, marginBottom: '20px' }}>
              {edition.tagline}
            </p>

            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
              {edition.description}
            </p>

            {/* Hardware highlights */}
            <div
              style={{
                background: 'rgba(23, 16, 32, 0.8)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                marginBottom: '36px'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Surface Finish</div>
                  <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>{edition.specs.finish}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>NFC Chip</div>
                  <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>{edition.specs.chip}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Durability</div>
                  <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>{edition.specs.durability}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Storage</div>
                  <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>{edition.specs.capacity}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href={`/designer?edition=${editionKey}`} className="btn btn-primary btn-lg">
                <span>Customize This Card</span>
                <ArrowRight size={18} />
              </a>

              <a href="/how-it-works" className="btn btn-secondary btn-lg">
                <span>How Tap Works</span>
              </a>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid-3">
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(107, 0, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)', marginBottom: '16px' }}>
              <Cpu size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '8px' }}>High-Speed Contactless</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              13.56 MHz frequency protocol with instantaneous NFC coupling on all iOS 13+ and Android devices.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', marginBottom: '16px' }}>
              <Droplets size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '8px' }}>IP68 Weatherproof</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Hermetically sealed internal antenna protects against water submersion, sweat, friction, and humidity.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-primary)', marginBottom: '16px' }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '8px' }}>Permanent Dynamic URL</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Reprogram destination links anytime in the cloud without ever replacing or reprinting your physical card.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
