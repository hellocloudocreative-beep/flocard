/* ==========================================================================
   FLOCARD CUSTOMER ACCOUNT DASHBOARD
   ========================================================================== */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { User, Layers, Radio, ExternalLink, ArrowRight, Eye, CheckCircle2, Clock, Sparkles, LogOut, Copy, Check } from 'lucide-react';
import Card3DPreview from '../../components/Card3DPreview';

export default function AccountDashboard() {
  const { user, logout } = useAuth();
  const { profiles, cards, designs } = useData();
  const [copiedProfile, setCopiedProfile] = useState(false);

  if (!user) {
    return (
      <div style={{ paddingTop: 'calc(var(--header-height) + 60px)', paddingBottom: '80px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container" style={{ maxWidth: '480px', textAlign: 'center' }}>
          <div className="glass-panel" style={{ padding: '42px 32px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(107, 0, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-purple)' }}>
              <User size={30} />
            </div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '10px' }}>Customer Portal</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: 1.6 }}>
              Please sign in with your email and password to access your active NFC cards, saved designs, and tap analytics.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="/login" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Sign In to Account</span>
                <ArrowRight size={18} />
              </a>
              <a href="/signup" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Create New Account</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userProfile = profiles.find(p => p.slug === (user?.profileSlug || 'alex')) || profiles[0];
  const userCards = cards.filter(c => c.customerId === user?.id || c.profileSlug === userProfile?.slug);
  const userDesigns = designs.filter(d => d.customerId === user?.id || d.customerName === user?.name);

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 30px)', paddingBottom: '80px' }}>
      <div className="container">
        {/* Welcome Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '32px',
            marginBottom: '32px',
            background: 'var(--card-surface)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                padding: '2px',
                background: 'linear-gradient(135deg, var(--accent-purple), var(--primary-purple))'
              }}
            >
              <img
                src={userProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                alt={user?.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div className="badge-tag" style={{ marginBottom: '6px' }}>
                CUSTOMER PORTAL
              </div>
              <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>
                Welcome back, {user?.name || 'Partner'}
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Managing digital profile{' '}
                <button
                  type="button"
                  onClick={() => {
                    const url = `https://flocard.in/p/${userProfile?.slug}`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(url);
                      setCopiedProfile(true);
                      setTimeout(() => setCopiedProfile(false), 2000);
                    }
                  }}
                  title="Click to copy digital profile URL"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: copiedProfile ? '#10B981' : 'var(--accent-purple)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    fontFamily: 'inherit'
                  }}
                >
                  <span>flocard.in/p/{userProfile?.slug}</span>
                  {copiedProfile ? <Check size={13} color="#10B981" /> : <Copy size={13} style={{ opacity: 0.7 }} />}
                  {copiedProfile && <span style={{ fontSize: '0.74rem' }}>Copied!</span>}
                </button>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <a href={`/p/${userProfile?.slug}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
              <span>View Live Profile</span>
              <ExternalLink size={14} />
            </a>
            <a href="/designer" className="btn btn-primary btn-sm">
              <span>New Card Design</span>
              <ArrowRight size={14} />
            </a>
            <button
              type="button"
              onClick={logout}
              className="btn btn-outline btn-sm"
              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#EF4444' }}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid-3" style={{ marginBottom: '36px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Profile Views</span>
              <Eye size={18} color="var(--accent-purple)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {userProfile?.viewsCount || 1420}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '4px' }}>
              &uarr; +18% this month
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active NFC Cards</span>
              <Radio size={18} color="var(--accent-purple)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {userCards.length || 1}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--accent-purple)', marginTop: '4px' }}>
              Encrypted NTAG216 chip
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Saved Card Designs</span>
              <Layers size={18} color="var(--accent-purple)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {userDesigns.length || 1}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Ready for production export
            </p>
          </div>
        </div>

        {/* Active Cards & Saved Designs Showcase */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'clamp(16px, 3vw, 28px)' }}>
          {/* Active Card */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                Active NFC Card
              </h3>
              <span className="badge-tag" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                Active &bull; Tap Enabled
              </span>
            </div>

            <div style={{ margin: '20px 0', textAlign: 'center' }}>
              <Card3DPreview edition={userCards[0]?.edition || 'purple'} width={310} allowFlip={true} />
            </div>

            <div style={{ background: 'var(--elevated-surface)', padding: '14px', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Card Identifier:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{userCards[0]?.cardCode || 'flc-vip-001'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Tap Tally:</span>
                <strong style={{ color: 'var(--accent-purple)' }}>{userCards[0]?.tapCount || 142} scans</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Permanent Link:</span>
                <a href={`/t/${userCards[0]?.cardCode || 'flc-vip-001'}`} style={{ color: 'var(--accent-purple)' }}>
                  /t/{userCards[0]?.cardCode || 'flc-vip-001'}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '16px' }}>
                Manage Account
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a
                  href="/account/designs"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'space-between', width: '100%', padding: '14px 18px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Layers size={18} color="var(--accent-purple)" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>My Saved Designs</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>View, edit, or export print artwork</div>
                    </div>
                  </div>
                  <ArrowRight size={16} />
                </a>

                <a
                  href="/account/profile"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'space-between', width: '100%', padding: '14px 18px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <User size={18} color="var(--accent-purple)" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Edit Digital Profile</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Update contact info, bio, & portfolio</div>
                    </div>
                  </div>
                  <ArrowRight size={16} />
                </a>

                <a
                  href="/account/settings"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'space-between', width: '100%', padding: '14px 18px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles size={18} color="var(--accent-purple)" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Profile URL & Settings</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Customize slug and security settings</div>
                    </div>
                  </div>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(107, 0, 255, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--light-lavender)', fontWeight: 600 }}>Need an additional card?</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                You can create unlimited designs in the studio and link them to your existing identity.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
