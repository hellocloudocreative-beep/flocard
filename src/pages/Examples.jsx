/* ==========================================================================
   FLOCARD EXAMPLE PROFILES DIRECTORY (/examples)
   ========================================================================== */

import React, { useState } from 'react';
import { ArrowRight, ExternalLink, Sparkles, Building, Briefcase } from 'lucide-react';
import PhoneProfileMockup from '../components/PhoneProfileMockup';
import { useData } from '../context/DataContext';

export default function Examples() {
  const { profiles } = useData();
  const [selectedSlug, setSelectedSlug] = useState('akhil');

  const selectedProfile = profiles.find(p => p.slug === selectedSlug) || profiles[0];

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 40px)', paddingBottom: '100px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 50px' }}>
          <div className="badge-tag" style={{ marginBottom: '14px' }}>
            PORTFOLIO DIRECTORY
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)', textTransform: 'uppercase', marginBottom: '16px' }}>
            REAL FLOCARD <span className="text-gradient-purple">PROFILES</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            See how top executives, architects, and venture partners leverage FLOCARD to power their digital identity.
          </p>
        </div>

        {/* Profile Selector Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '48px' }}>
          {profiles.map(p => (
            <button
              key={p.slug}
              type="button"
              onClick={() => setSelectedSlug(p.slug)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                background: selectedSlug === p.slug ? 'var(--primary-purple)' : 'var(--elevated-surface)',
                border: selectedSlug === p.slug ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                color: selectedSlug === p.slug ? '#ffffff' : 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <img
                src={p.avatar || '/assets/akhil.jpg'}
                alt={p.name}
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span>{p.name} ({p.role.split(' ')[0]})</span>
            </button>
          ))}
        </div>

        {/* Live Phone Preview Showcase */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 'clamp(24px, 5vw, 60px)',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PhoneProfileMockup profile={selectedProfile} />
          </div>

          <div>
            <div className="badge-tag" style={{ marginBottom: '12px' }}>
              PROFILE SPOTLIGHT
            </div>
            <h2 style={{ fontSize: '2.2rem', textTransform: 'uppercase', marginBottom: '12px' }}>
              {selectedProfile.name}
            </h2>
            <div style={{ fontSize: '1.1rem', color: 'var(--accent-purple)', fontWeight: 600, marginBottom: '6px' }}>
              {selectedProfile.role} at {selectedProfile.company}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Location: {selectedProfile.location || 'Global'}
            </div>

            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
              {selectedProfile.bio}
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a
                href={`/p/${selectedProfile.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-lg"
              >
                <span>Open Fullscreen Profile</span>
                <ExternalLink size={18} />
              </a>

              <a href="/designer" className="btn btn-secondary btn-lg">
                <span>Design Card for Yourself</span>
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
