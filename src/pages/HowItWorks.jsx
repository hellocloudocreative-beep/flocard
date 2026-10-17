/* ==========================================================================
   FLOCARD HOW IT WORKS PAGE
   Explains the contactless NFC physics, zero-app setup, and dynamic routing.
   ========================================================================== */

import React from 'react';
import { Radio, Smartphone, QrCode, Sparkles, Check, ArrowRight, ShieldCheck, Zap, Layers, RefreshCw } from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '../lib/constants';

export default function HowItWorks() {
  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 40px)', paddingBottom: '100px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 60px' }}>
          <div className="badge-tag" style={{ marginBottom: '14px' }}>
            TECHNOLOGY & PROTOCOLS
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', textTransform: 'uppercase', marginBottom: '16px' }}>
            HOW FLOCARD <span className="text-gradient-purple">WORKS</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            Seamless physical-to-digital transmission. No battery, no external apps, and 100% cloud-reprogrammable.
          </p>
        </div>

        {/* 4 Steps Section */}
        <div className="grid-4" style={{ marginBottom: '80px' }}>
          {HOW_IT_WORKS_STEPS.map((s, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '32px 24px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--accent-purple)',
                  marginBottom: '16px'
                }}
              >
                {s.step}
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                {s.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {s.description}
              </p>
            </div>
          ))}
        </div>

        {/* Deep Dive: NFC Near Field Communication Physics */}
        <div
          className="glass-panel"
          style={{
            padding: '44px 36px',
            marginBottom: '60px'
          }}
        >
          <div style={{ maxWidth: '800px' }}>
            <div className="badge-tag" style={{ marginBottom: '12px' }}>
              CORE HARDWARE
            </div>
            <h2 style={{ fontSize: '2rem', textTransform: 'uppercase', marginBottom: '16px', color: 'var(--text-primary)' }}>
              High-Frequency Electromagnetic Induction
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '24px' }}>
              FLOCARD utilizes high-precision passive NFC chips (NXP NTAG216). When placed within 1–4 cm of an NFC-capable smartphone, the phone&apos;s magnetic field inductively powers the card&apos;s micro-coil antenna, instantaneously relaying the encrypted redirect URL without draining any card battery.
            </p>

            <div className="grid-3" style={{ marginTop: '28px' }}>
              <div>
                <h4 style={{ color: 'var(--primary-purple)', fontSize: '0.95rem', marginBottom: '6px' }}>1. Zero Battery Required</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Card operates purely via wireless induction from the reader device.</p>
              </div>
              <div>
                <h4 style={{ color: 'var(--primary-purple)', fontSize: '0.95rem', marginBottom: '6px' }}>2. Instant Safari & Chrome</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Native iOS and Android notifications trigger automatically with zero app downloads.</p>
              </div>
              <div>
                <h4 style={{ color: 'var(--primary-purple)', fontSize: '0.95rem', marginBottom: '6px' }}>3. Dynamic Cloud Routing</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>The card links to your permanent URL. Update your links, socials, or job title anytime.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Device Compatibility Matrix */}
        <div className="glass-panel" style={{ padding: '36px' }}>
          <h3 style={{ fontSize: '1.4rem', textTransform: 'uppercase', marginBottom: '18px', textAlign: 'center', color: 'var(--text-primary)' }}>
            Universal Device Compatibility
          </h3>

          <div className="grid-2" style={{ gap: '32px' }}>
            <div style={{ background: 'var(--elevated-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Smartphone size={24} color="var(--primary-purple)" />
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>Apple iOS Compatibility</h4>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <li>&bull; <strong style={{ color: 'var(--text-primary)' }}>iPhone XR, XS, 11, 12, 13, 14, 15, 16, 17+</strong>: Automatic background NFC tag reading enabled by default.</li>
                <li>&bull; <strong style={{ color: 'var(--text-primary)' }}>iPhone 7, 8, X</strong>: NFC reader available in Control Center.</li>
                <li>&bull; <strong style={{ color: 'var(--text-primary)' }}>Older Models & iPads</strong>: Built-in camera scans the high-contrast back QR code seamlessly.</li>
              </ul>
            </div>

            <div style={{ background: 'var(--elevated-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Smartphone size={24} color="var(--primary-purple)" />
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>Android Compatibility</h4>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <li>&bull; <strong>Samsung, Google Pixel, OnePlus, Xiaomi, Oppo, Vivo</strong>: All modern NFC models (over 95% of active devices).</li>
                <li>&bull; Tap card against center or top back of phone.</li>
                <li>&bull; Real scannable laser-etched QR code as a universal 100% fallback.</li>
              </ul>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <a href="/designer" className="btn btn-primary btn-lg">
              <span>Start Designing Your Card</span>
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
