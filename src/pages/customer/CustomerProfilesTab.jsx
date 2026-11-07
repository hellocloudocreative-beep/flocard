/* ==========================================================================
   FLOCARDS CUSTOMER DASHBOARD — PROFILES TAB
   Displays customer digital profiles and launches the comprehensive 14-section
   ProfileEditorModal for rich editing, live previews, and customization.
   ========================================================================== */

import React, { useState } from 'react';
import {
  Sliders,
  Edit3,
  Eye,
  Copy,
  Check,
  Download,
  ExternalLink,
  X
} from 'lucide-react';
import { downloadVCard } from '../../lib/vcard';
import { useData } from '../../context/DataContext';
import ProfileEditorModal from '../../components/profile/ProfileEditorModal';
import FullScreenDigitalProfile from '../../components/profile/FullScreenDigitalProfile';

export default function CustomerProfilesTab({ profiles = [], customer, onSaveProfile }) {
  const { saveProfile } = useData();
  const [editingProfile, setEditingProfile] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'

  const handleCopyLink = (slug) => {
    const url = `https://flocard.in/p/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Card */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          borderRadius: '20px',
          backgroundColor: 'var(--card-surface)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Digital Business Profiles
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
            Full-screen digital business profile platform accessible through NFC smart cards and unique URLs.
          </p>
        </div>

        {profiles.length > 0 && (
          <button
            type="button"
            onClick={() => setEditingProfile(profiles[0])}
            className="btn btn-primary btn-sm"
            style={{ gap: '8px' }}
          >
            <Sliders size={16} />
            <span>Customize Digital Profile</span>
          </button>
        )}
      </div>

      {/* Profiles Cards List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {profiles.map((prof) => (
          <div
            key={prof.id}
            className="glass-panel"
            style={{
              borderRadius: '20px',
              backgroundColor: 'var(--card-surface)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Mini Banner Preview */}
            <div
              style={{
                width: '100%',
                height: '110px',
                backgroundColor: prof.banner?.solidColor || '#1a0b2e',
                backgroundImage: prof.banner?.url ? `url(${prof.banner.url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(8,6,13,0.85) 100%)'
                }}
              />
              <div style={{ position: 'absolute', bottom: '12px', left: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {prof.avatar ? (
                  <img
                    src={prof.avatar}
                    alt={prof.name}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: prof.photoShape === 'rounded_rect' ? '12px' : '50%',
                      border: '2px solid #FFFFFF',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: prof.photoShape === 'rounded_rect' ? '12px' : '50%',
                      border: '2px solid #FFFFFF',
                      backgroundColor: 'var(--primary-purple, #6B004F)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    {((prof.name || 'P').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('')).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                    {prof.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#CBD5E1' }}>
                    {prof.role} {prof.company ? `• ${prof.company}` : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info Summary */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Canonical Profile URL:</span>
                <a
                  href={`/p/${prof.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-purple)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>flocard.in/{prof.slug}</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setEditingProfile(prof)}
                  className="btn btn-primary btn-xs"
                  style={{ gap: '6px' }}
                >
                  <Edit3 size={13} />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewProfile(prof)}
                  className="btn btn-secondary btn-xs"
                  style={{ gap: '6px' }}
                >
                  <Eye size={13} />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyLink(prof.slug)}
                  className="btn btn-outline btn-xs"
                  style={{ gap: '6px' }}
                >
                  {copiedSlug === prof.slug ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                  <span>{copiedSlug === prof.slug ? 'Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadVCard(prof)}
                  className="btn btn-outline btn-xs"
                  style={{ gap: '6px' }}
                >
                  <Download size={13} />
                  <span>vCard</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================================
          REUSABLE 14-SECTION PROFILE EDITOR MODAL
          ========================================================================= */}
      {editingProfile && (
        <ProfileEditorModal
          profile={editingProfile}
          customer={customer}
          onClose={() => setEditingProfile(null)}
          onSave={(saved) => {
            if (onSaveProfile) onSaveProfile(saved);
            setEditingProfile(null);
          }}
        />
      )}

      {/* =========================================================================
          LIVE PROFILE PREVIEW MODAL
          ========================================================================= */}
      {previewProfile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 3, 10, 0.95)',
            backdropFilter: 'blur(16px)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}
        >
          {/* Top Preview Controls Bar */}
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: '#0F091C',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Eye size={18} color="var(--accent-purple)" />
              <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#FFFFFF' }}>
                Live Profile Preview — {previewProfile.name}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: previewDevice === 'desktop' ? 'var(--primary-purple)' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Desktop View
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: previewDevice === 'mobile' ? 'var(--primary-purple)' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Mobile View
              </button>

              <button
                type="button"
                onClick={() => setPreviewProfile(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  marginLeft: '8px'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Scrollable Preview Window */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: '#08060D'
            }}
          >
            <div
              style={{
                width: previewDevice === 'mobile' ? '410px' : '100%',
                maxWidth: previewDevice === 'mobile' ? '410px' : '100%',
                margin: previewDevice === 'mobile' ? '24px auto' : '0 auto',
                borderRadius: previewDevice === 'mobile' ? '32px' : 0,
                border: previewDevice === 'mobile' ? '4px solid #334155' : 'none',
                overflow: 'hidden',
                boxShadow: previewDevice === 'mobile' ? '0 20px 60px rgba(0,0,0,0.8)' : 'none'
              }}
            >
              <FullScreenDigitalProfile
                profile={previewProfile}
                isLight={previewProfile.themeMode === 'light'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
