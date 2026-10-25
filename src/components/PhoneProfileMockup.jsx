/* ==========================================================================
   REALISTIC SMARTPHONE DIGITAL PROFILE MOCKUP
   Matches the uploaded design composition with interactive tabs and vCard actions.
   ========================================================================== */

import React, { useState } from 'react';
import { Phone, Mail, Bookmark, Share2, Check, ExternalLink, Sparkles, MapPin, Building2, Briefcase } from 'lucide-react';
import { LinkedinIcon, InstagramIcon, WhatsappIcon } from './SocialIcons';
import { downloadVCard } from '../lib/vcard';

export default function PhoneProfileMockup({ profile, scale = 1, className = '' }) {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [copied, setCopied] = useState(false);

  const sampleProfile = profile || {
    name: 'Alex Morgan',
    role: 'CEO & Founder',
    company: 'FLOCARDS',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    location: 'Bengaluru, India',
    bio: 'Pioneering connected NFC identity for executives and global tech pioneers.',
    phone: '+91 97782 78552',
    email: 'contact@flocard.in',
    whatsapp: '919778278552',
    website: 'https://flocard.in',
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com',
    portfolio: [
      { id: '1', title: 'FLOCARD Core Platform', category: 'Hardware & Web' },
      { id: '2', title: 'Obsidian NFC Architecture', category: 'Industrial Design' }
    ],
    services: [
      { id: 's1', title: 'Enterprise Smart Cards', desc: 'Custom metal NFC rollout.' },
      { id: 's2', title: 'Executive Networking', desc: 'Contactless identity infrastructure.' }
    ]
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${sampleProfile.name} — FLOCARDS Profile`,
        url: window.location.origin + `/${sampleProfile.slug || 'alex'}`
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin + `/${sampleProfile.slug || 'alex'}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`phone-mockup-wrapper ${className}`}
      style={{
        width: '320px',
        maxWidth: '100%',
        boxSizing: 'border-box',
        height: '630px',
        background: '#040306',
        borderRadius: '44px',
        padding: '10px',
        border: '3px solid #2d243b',
        boxShadow: '0 25px 60px -15px rgba(107, 0, 255, 0.4), 0 0 0 1px rgba(168, 85, 247, 0.2)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        margin: '0 auto'
      }}
    >
      {/* Dynamic Island / Notch */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90px',
          height: '22px',
          background: '#0a0810',
          borderRadius: '20px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1c152a' }} />
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#251b38' }} />
      </div>

      {/* Screen Container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, #120b1e 0%, #08060d 100%)',
          borderRadius: '36px',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          paddingBottom: '24px'
        }}
      >
        {/* Status Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 22px 6px',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            zIndex: 10
          }}
        >
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem' }}>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Ambient Top Glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '160px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(107, 0, 255, 0.45), transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Profile Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 16px 0', zIndex: 5, textAlign: 'center' }}>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              padding: '3px',
              background: 'linear-gradient(135deg, var(--accent-purple), var(--primary-purple))',
              boxShadow: '0 8px 24px rgba(107, 0, 255, 0.4)',
              position: 'relative',
              marginBottom: '10px'
            }}
          >
            <img
              src={sampleProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
              alt={sampleProfile.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--primary-purple)',
                border: '2px solid #08060d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={11} color="#ffffff" />
            </div>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
            {sampleProfile.name}
          </h3>

          <p style={{ fontSize: '0.78rem', color: 'var(--light-lavender)', fontWeight: 600, marginTop: '2px' }}>
            {sampleProfile.role}
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            {sampleProfile.logo && (
              <img
                src={sampleProfile.logo}
                alt=""
                style={{ height: '14px', width: 'auto', maxHeight: '16px', objectFit: 'contain', borderRadius: '2px' }}
              />
            )}
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {sampleProfile.company}
            </span>
          </div>

          {/* Quick Round Action Icons */}
          <div style={{ display: 'flex', gap: '8px', margin: '14px 0 12px' }}>
            {sampleProfile.phone && (
              <a
                href={`tel:${sampleProfile.phone}`}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
              >
                <Phone size={15} />
              </a>
            )}
            {sampleProfile.whatsapp && (
              <a
                href={`https://wa.me/${sampleProfile.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                }}
              >
                <WhatsappIcon size={16} color="#ffffff" />
              </a>
            )}
            {sampleProfile.linkedin && (
              <a
                href={sampleProfile.linkedin}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#0a66c2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(10, 102, 194, 0.3)'
                }}
              >
                <LinkedinIcon size={15} />
              </a>
            )}
            {sampleProfile.instagram && (
              <a
                href={sampleProfile.instagram}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(220, 39, 67, 0.3)'
                }}
              >
                <InstagramIcon size={15} />
              </a>
            )}
            {sampleProfile.email && (
              <a
                href={`mailto:${sampleProfile.email}`}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--primary-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(107, 0, 255, 0.3)'
                }}
              >
                <Mail size={15} />
              </a>
            )}
          </div>

          {/* Primary Profile CTA Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => downloadVCard(sampleProfile)}
              style={{
                background: '#ffffff',
                color: '#08060d',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '9px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255,255,255,0.2)'
              }}
            >
              <Bookmark size={13} />
              <span>Save Contact</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              style={{
                background: 'rgba(31, 22, 44, 0.9)',
                color: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                padding: '9px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={13} color="#10b981" /> : <Share2 size={13} />}
              <span>{copied ? 'Copied!' : 'Share Profile'}</span>
            </button>
          </div>

          {/* Profile Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(23, 16, 32, 0.8)',
              padding: '3px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              width: '100%',
              marginBottom: '12px'
            }}
          >
            {['portfolio', 'about', 'services'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  background: activeTab === tab ? 'var(--primary-purple)' : 'transparent',
                  color: activeTab === tab ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div style={{ width: '100%', textAlign: 'left' }}>
            {activeTab === 'portfolio' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {(sampleProfile.portfolio || []).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      background: 'rgba(23, 16, 32, 0.9)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    {item.image ? (
                      <div style={{ width: '100%', height: '62px', borderRadius: '8px', overflow: 'hidden', background: '#08060d' }}>
                        <img
                          src={item.image}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '52px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, rgba(107, 0, 255, 0.25) 0%, rgba(32, 11, 59, 0.6) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#C4B5FD',
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}
                      >
                        FLOCARD
                      </div>
                    )}
                    <div style={{ fontSize: '0.58rem', color: 'var(--accent-purple)', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                      {item.category || 'Showcase'}
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'about' && (
              <div
                style={{
                  background: 'rgba(23, 16, 32, 0.9)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '0.74rem',
                  lineHeight: '1.45',
                  color: 'var(--text-secondary)'
                }}
              >
                {sampleProfile.bio}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', color: 'var(--light-lavender)', fontSize: '0.68rem' }}>
                  <MapPin size={12} />
                  <span>{sampleProfile.location || 'Global'}</span>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(sampleProfile.services || []).map((srv, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(23, 16, 32, 0.9)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '10px 12px'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff' }}>
                      {srv.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {srv.desc}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Verified Footer inside phone */}
        <div style={{ marginTop: 'auto', textAlign: 'center', paddingTop: '16px', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
          Powered by FLOCARD NFC
        </div>
      </div>
    </div>
  );
}
