/* ==========================================================================
   FLOCARD FOOTER COMPONENT
   Theme-aware footer with dynamic logo, semantic tokens, and copyright.
   ========================================================================== */

import React from 'react';
import { ArrowUpRight, Zap } from 'lucide-react';
import { BRAND } from '../lib/constants';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { isLight } = useTheme();

  return (
    <footer
      style={{
        background: isLight 
          ? 'linear-gradient(180deg, var(--bg-main) 0%, var(--bg-secondary) 100%)' 
          : 'linear-gradient(180deg, var(--bg-main) 0%, #050409 100%)',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '64px',
        paddingBottom: '36px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.25s ease, border-color 0.25s ease'
      }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '240px',
          background: isLight 
            ? 'radial-gradient(ellipse at 50% 100%, rgba(167, 139, 250, 0.15), transparent 70%)'
            : 'radial-gradient(ellipse at 50% 100%, rgba(107, 0, 255, 0.15), transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '48px'
          }}
        >
          {/* Brand Info */}
          <div style={{ maxWidth: '320px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <img
                src={isLight ? "/assets/logo-dark.png" : "/assets/logo-light.png"}
                alt="FLOCARD"
                style={{ height: '28px', width: 'auto', display: 'block' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                }}
              />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', display: 'none' }}>
                <span style={{ color: 'var(--primary-purple)' }}>FLO</span>CARD
              </span>
            </a>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Premium customizable NFC business cards and interactive digital identity portfolios for modern professionals.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--primary-purple)', fontWeight: 600 }}>
              <Zap size={14} color="var(--primary-purple)" />
              <span>{BRAND.tagline}</span>
            </div>
          </div>

          {/* Card Collection */}
          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '18px' }}>
              Card Collection
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li><a href="/cards" style={{ color: 'var(--text-secondary)' }}>All Editions</a></li>
              <li><a href="/cards/custom-purple" style={{ color: 'var(--primary-purple)', fontWeight: 600 }}>Purple Edition (Signature)</a></li>
              <li><a href="/cards/gold" style={{ color: 'var(--text-secondary)' }}>Gold Edition</a></li>
              <li><a href="/cards/platinum" style={{ color: 'var(--text-secondary)' }}>Platinum Edition</a></li>
              <li><a href="/designer" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Interactive Designer <ArrowUpRight size={13} /></a></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '18px' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li><a href="/digital-profiles" style={{ color: 'var(--text-secondary)' }}>Digital Profiles</a></li>
              <li><a href="/how-it-works" style={{ color: 'var(--text-secondary)' }}>How It Works</a></li>
              <li><a href="/examples" style={{ color: 'var(--text-secondary)' }}>Example Profiles</a></li>
              <li><a href="/p/akhil" style={{ color: 'var(--primary-purple)', fontWeight: 500 }}>Live Profile Demo (@akhil)</a></li>
              <li><a href="/faq" style={{ color: 'var(--text-secondary)' }}>Frequently Asked Questions</a></li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '18px' }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li><a href="/about" style={{ color: 'var(--text-secondary)' }}>About FLOCARD</a></li>
              <li><a href="/contact" style={{ color: 'var(--text-secondary)' }}>Contact & Inquiries</a></li>
              <li><a href="/account" style={{ color: 'var(--text-secondary)' }}>Customer Account</a></li>
              <li><a href="/admin" style={{ color: 'var(--primary-purple)', fontWeight: 600 }}>Admin Platform</a></li>
              <li><span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>contact@flocard.in</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}
        >
          <div>
            &copy; {currentYear} {BRAND.name} Technologies. All rights reserved.
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</a>
            <a href="/terms" style={{ color: 'var(--text-secondary)' }}>Terms and Conditions</a>
            <a href="/admin/settings/security" style={{ color: 'var(--text-muted)' }}>Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
