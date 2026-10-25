/* ==========================================================================
   FLOCARD DIGITAL PROFILES SHOWCASE
   ========================================================================== */

import React, { useState } from 'react';
import { ArrowRight, Bookmark, Share2, Check, ExternalLink, Sparkles, Smartphone, ShieldCheck, Zap, Globe, Layers } from 'lucide-react';
import PhoneProfileMockup from '../components/PhoneProfileMockup';
import CompactProfileCard from '../components/profile/CompactProfileCard';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

export default function DigitalProfiles() {
  const { profiles, demoConfig } = useData();
  const { isLight } = useTheme();

  const baseProfile = profiles.find(p => p.slug === 'alex') || profiles[0] || {};
  const demoProfile = {
    ...baseProfile,
    name: (demoConfig?.name && demoConfig.name !== 'Your Name') ? demoConfig.name : (baseProfile?.name && baseProfile.name !== 'Your Name' ? baseProfile.name : 'Alex Morgan'),
    role: (demoConfig?.role && demoConfig.role !== 'Your Role') ? demoConfig.role : (baseProfile?.role && baseProfile.role !== 'Your Role' ? baseProfile.role : 'Founder & CEO'),
    tagline: (demoConfig?.tagline && demoConfig.tagline !== 'Your Tagline') ? demoConfig.tagline : (baseProfile?.tagline || 'Pioneering connected NFC identity for executives and pioneers.'),
    company: (demoConfig?.company && demoConfig.company !== 'Your Company') ? demoConfig.company : (baseProfile?.company && baseProfile.company !== 'Your Company' ? baseProfile.company : 'FLOCARDS'),
    avatar: demoConfig?.avatar || baseProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    logo: demoConfig?.logo || baseProfile?.logo || '',
    phone: demoConfig?.phone || baseProfile?.phone || '+91 97782 78552',
    email: demoConfig?.email || baseProfile?.email || 'contact@flocard.in',
    website: demoConfig?.website || baseProfile?.website || 'https://flocard.in',
    cardFinish: demoConfig?.cardFinish || baseProfile?.cardFinish || 'purple'
  };

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 40px)', paddingBottom: '100px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 60px' }}>
          <div className="badge-tag" style={{ marginBottom: '14px' }}>
            DIGITAL IDENTITY CLOUD
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', textTransform: 'uppercase', marginBottom: '16px' }}>
            YOUR COMPLETE <span className="text-gradient-purple">DIGITAL IDENTITY</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            One single, elegant link that contains everything you do: contact numbers, social links, portfolio galleries, and direct vCard phonebook integration.
          </p>
        </div>

        {/* Split Phone Showcase */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 'clamp(24px, 5vw, 60px)',
            alignItems: 'center',
            marginBottom: '90px'
          }}
        >
          {/* Left: Shiny Card Demo Showcase */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '580px', alignItems: 'center' }}>
            <CompactProfileCard
              profile={demoProfile}
              onExpand={() => window.open(`/${demoProfile?.slug || 'alex'}`, '_blank')}
              isLight={isLight}
            />
          </div>

          <div>
            <h2 style={{ fontSize: '2.2rem', textTransform: 'uppercase', marginBottom: '18px' }}>
              Designed to Win <span className="text-gradient-purple">Every Connection</span>
            </h2>

            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '28px' }}>
              Paper business cards end up in trash cans or lost in pockets within 48 hours. A FLOCARD digital profile is saved straight into your client&apos;s Apple or Google address book with photo, phone, job title, and website intact.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
              {[
                { title: 'Direct .vcf Address Book Download', desc: 'Recipients click "Save Contact" and your full contact card is imported into their phonebook in one tap.' },
                { title: 'Rich Portfolio & Case Studies', desc: 'Showcase high-resolution images, project summaries, and client results right on your card profile.' },
                { title: 'Interactive Social Matrix', desc: 'Direct links to LinkedIn, WhatsApp, Instagram, GitHub, Twitter, and custom website domains.' },
                { title: 'Permanent Custom URL', desc: 'Secure your unique username (flocard.in/p/yourname) and never worry about reprints.' }
              ].map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(107, 0, 255, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)', flexShrink: 0, marginTop: '2px' }}>
                    <Check size={14} />
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>{feat.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="/examples" className="btn btn-primary btn-lg">
                <span>View Example Profiles</span>
                <ArrowRight size={18} />
              </a>

              <a href="/alex" target="_blank" rel="noreferrer" className="btn btn-secondary btn-lg">
                <span>Try Live Demo</span>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
