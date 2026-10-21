/* ==========================================================================
   FLOCARD CUSTOMER DASHBOARD — PROFILES TAB & APPEARANCE STUDIO
   Displays customer's digital profiles with full morphing appearance controls:
   - Opening behavior (Expandable Card vs Full Profile vs Compact Only)
   - Card gradients, border glows, photo shape (circle vs rounded_rect)
   - Subtle background typography
   - Section visibility & content editing
   - Interactive Live Morphing Preview Studio
   ========================================================================== */

import React, { useState, useRef } from 'react';
import {
  FileText,
  ExternalLink,
  Edit3,
  Download,
  Share2,
  Copy,
  Check,
  Plus,
  Trash2,
  Save,
  Eye,
  Globe,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  X,
  Palette,
  Maximize2,
  Minimize2,
  Sliders,
  Layers,
  ArrowUpRight,
  Upload,
  User,
  Building2,
  Image as ImageIcon
} from 'lucide-react';
import { downloadVCard } from '../../lib/vcard';
import { useData } from '../../context/DataContext';
import { uploadImage } from '../../lib/uploadImage';
import CompactProfileCard from '../../components/profile/CompactProfileCard';
import ExpandedPortfolioView from '../../components/profile/ExpandedPortfolioView';

export default function CustomerProfilesTab({ profiles = [], customer, onSaveProfile }) {
  const { saveProfile } = useData();

  const [editingProfile, setEditingProfile] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [editorTab, setEditorTab] = useState('appearance'); // 'appearance' | 'info' | 'sections'

  // Form states for editing profile
  const [formData, setFormData] = useState({});

  // Image upload refs
  const avatarInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // Handle Avatar Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file, 'avatar', customer?.id || 'anon');
      setFormData(prev => ({ ...prev, avatar: url }));
    } catch (err) {
      console.error('Avatar upload failed:', err);
    }
    e.target.value = '';
  };

  // Handle Logo Upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file, 'logo', customer?.id || 'anon');
      setFormData(prev => ({ ...prev, logo: url }));
    } catch (err) {
      console.error('Logo upload failed:', err);
    }
    e.target.value = '';
  };

  // Handle Portfolio Item Image Upload
  const handlePortfolioImageUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file, 'portfolio', customer?.id || 'anon');
      setFormData(prev => {
        const next = [...(prev.portfolio || [])];
        next[index] = { ...next[index], image: url };
        return { ...prev, portfolio: next };
      });
    } catch (err) {
      console.error('Portfolio image upload failed:', err);
    }
    e.target.value = '';
  };

  const handleOpenEdit = (profile) => {
    setEditingProfile(profile);
    setEditorTab('appearance');
    setFormData({
      ...profile,
      openingPreference: profile.openingPreference || 'expandable',
      cardFinish: profile.cardFinish || (profile.edition === 'gold' ? 'gold' : profile.edition === 'platinum' || profile.edition === 'steel' ? 'steel' : 'purple'),
      cardColor: profile.cardColor || (
        (profile.cardFinish === 'gold' || profile.edition === 'gold')
          ? '#F3CF8A'
          : (profile.cardFinish === 'steel' || profile.edition === 'platinum' || profile.edition === 'steel')
            ? '#E2E8F0'
            : '#A855F7'
      ),
      gradientStart: profile.gradientStart || '#130B22',
      gradientMid: profile.gradientMid || '#240F3E',
      gradientEnd: profile.gradientEnd || '#0B0813',
      accentColor: profile.accentColor || '#A855F7',
      glowColor: profile.glowColor || '#6B00FF',
      creamHighlight: profile.creamHighlight || '#F5EDE5',
      borderGlowIntensity: profile.borderGlowIntensity || 'medium',
      photoShape: profile.photoShape || 'circle',
      backgroundTypography: profile.backgroundTypography || 'FLOCARD',
      sectionVisibility: profile.sectionVisibility || {
        about: true,
        portfolio: true,
        services: true,
        experience: true,
        contact: true
      },
      services: profile.services ? [...profile.services] : [],
      portfolio: profile.portfolio ? [...profile.portfolio] : [],
      whatsapp: profile.whatsapp || profile.socialLinks?.whatsapp || '',
      linkedin: profile.linkedin || profile.socialLinks?.linkedin || '',
      instagram: profile.instagram || profile.socialLinks?.instagram || '',
      customLinks: Array.isArray(profile.customLinks) ? [...profile.customLinks] : [],
      socialLinks: profile.socialLinks ? { ...profile.socialLinks } : {}
    });
  };

  const handleCopyLink = (slug) => {
    const url = `https://flocard.in/p/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) return;

    saveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setEditingProfile(null);
    }, 1200);
  };

  const handleOpenPreview = (profileToPreview) => {
    setPreviewProfile(profileToPreview || formData);
    setPreviewExpanded(profileToPreview?.openingPreference === 'full');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            My Digital Profiles & Morphing Studio
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Customize your compact identity card, shared-element morphing animations, and portfolio presentation.
          </p>
        </div>
      </div>

      {/* Profiles List or Empty State */}
      {profiles.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--card-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)'
          }}
        >
          <FileText size={42} color="var(--border-color)" style={{ margin: '0 auto 14px', display: 'block' }} />
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 6px', fontWeight: 700 }}>
            Create your first digital profile.
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            When you complete a card design and production order, your personalized digital profile is automatically provisioned and ready to share.
          </p>
          <a href="/designer" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', gap: '6px' }}>
            <Sparkles size={14} />
            <span>Design a Card to Create Profile</span>
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {profiles.map((profile) => (
            <div
              key={profile.id || profile.slug}
              className="glass-panel"
              style={{
                padding: '28px',
                backgroundColor: 'var(--card-surface)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              {/* Profile Top Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: profile.photoShape === 'rounded_rect' ? '16px' : '50%',
                      padding: '2px',
                      background: `linear-gradient(135deg, ${profile.glowColor || 'var(--accent-purple)'}, ${profile.accentColor || 'var(--primary-purple)'})`,
                      boxShadow: `0 0 16px ${(profile.glowColor || '#6B00FF')}40`,
                      flexShrink: 0
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: profile.photoShape === 'rounded_rect' ? '14px' : '50%',
                        backgroundColor: 'var(--elevated-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.3rem',
                        color: 'var(--accent-purple)',
                        overflow: 'hidden'
                      }}
                    >
                      {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        profile.name?.charAt(0) || 'P'
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                        {profile.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(168, 85, 247, 0.15)',
                          color: '#A855F7',
                          border: '1px solid rgba(168, 85, 247, 0.3)'
                        }}
                      >
                        {profile.openingPreference === 'full' ? 'Direct Full View' : profile.openingPreference === 'compact_only' ? 'Compact Locked' : 'Morphing Card'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {profile.role || 'Executive'} {profile.company ? `at ${profile.company}` : ''}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-purple)', marginTop: '4px', fontFamily: 'monospace' }}>
                      flocard.in/p/{profile.slug}
                    </div>
                  </div>
                </div>

                {/* Profile Primary Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(profile)}
                    className="btn btn-outline btn-xs"
                    style={{ gap: '6px' }}
                  >
                    <Sliders size={13} />
                    <span>Appearance & Studio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPreview(profile)}
                    className="btn btn-secondary btn-xs"
                    style={{ gap: '6px' }}
                  >
                    <Eye size={13} />
                    <span>Test Morph</span>
                  </button>

                  <a
                    href={`/p/${profile.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-xs"
                    style={{ gap: '6px' }}
                  >
                    <ExternalLink size={12} />
                    <span>Live URL</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(profile.slug)}
                    className="btn btn-outline btn-xs"
                    style={{ gap: '6px' }}
                  >
                    {copiedSlug === profile.slug ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                    <span>{copiedSlug === profile.slug ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadVCard(profile)}
                    className="btn btn-primary btn-xs"
                    style={{ gap: '6px' }}
                  >
                    <Download size={13} />
                    <span>vCard</span>
                  </button>
                </div>
              </div>

              {/* Bio & Details Excerpt */}
              <div
                style={{
                  backgroundColor: 'var(--elevated-surface)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '0.82rem'
                }}
              >
                {profile.bio && (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {profile.bio}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {profile.phone && <span>📞 {profile.phone}</span>}
                  {profile.email && <span>✉️ {profile.email}</span>}
                  {profile.location && <span>📍 {profile.location}</span>}
                  <span>🎨 Glow: {profile.glowColor || '#6B00FF'}</span>
                  <span>🖼️ Shape: {profile.photoShape === 'rounded_rect' ? 'Rounded Rectangle' : 'Circle'}</span>
                  <span>🔤 BG Watermark: {profile.backgroundTypography || 'FLOCARD'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Edit & Morphing Studio Modal */}
      {editingProfile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '720px',
              width: '100%',
              backgroundColor: 'var(--card-surface)',
              borderRadius: '24px',
              border: '1px solid var(--border-highlight)',
              padding: '28px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sliders size={20} color="var(--accent-purple)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  Profile Appearance & Morphing Studio
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Studio Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
              {[
                { id: 'appearance', label: '1. Card Morphing & Colors', icon: Palette },
                { id: 'info', label: '2. Identity Info', icon: Edit3 },
                { id: 'sections', label: '3. Section Visibility', icon: Layers }
              ].map(tab => {
                const Icon = tab.icon;
                const active = editorTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEditorTab(tab.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: active ? 'var(--primary-purple)' : 'transparent',
                      color: active ? '#FFFFFF' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* TAB 1: APPEARANCE & MORPHING CONTROLS */}
              {editorTab === 'appearance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Opening Behavior */}
                  <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--elevated-surface)', border: '1px solid var(--border-color)' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                      Opening Experience Behavior
                    </label>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                      Choose how your profile displays when visitors tap your card or open your link.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {[
                        { id: 'expandable', title: 'Expandable Card', desc: 'Shows compact card; morphs into portfolio on click (Recommended)' },
                        { id: 'full', title: 'Direct Full Profile', desc: 'Opens expanded portfolio view immediately' },
                        { id: 'compact_only', title: 'Compact Card Only', desc: 'Locked as compact card without expanding' }
                      ].map(opt => (
                        <div
                          key={opt.id}
                          onClick={() => setFormData({ ...formData, openingPreference: opt.id })}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            backgroundColor: formData.openingPreference === opt.id ? 'rgba(107, 0, 255, 0.15)' : 'var(--card-surface)',
                            border: `1.5px solid ${formData.openingPreference === opt.id ? 'var(--primary-purple)' : 'var(--border-color)'}`,
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: formData.openingPreference === opt.id ? '#A855F7' : 'var(--text-primary)' }}>
                            {opt.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.35 }}>
                            {opt.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Background & Edition Theme */}
                  <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--elevated-surface)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={15} color="var(--accent-purple)" />
                        <span>Card Background & Edition Theme</span>
                      </label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Active: {formData.cardFinish === 'gold' ? '24K Mirror Gold' : formData.cardFinish === 'steel' ? 'Brushed Steel' : formData.cardFinish === 'metal' ? 'Gunmetal Metal' : 'Signature Purple'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
                      Choose your digital card's portrait background artwork: Signature Purple, 24K Gold, Brushed Steel, or Gunmetal Metal.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                      {[
                        {
                          id: 'purple',
                          name: 'Signature Purple',
                          desc: 'Official FLOCARD obsidian purple portrait artwork',
                          tint: '#A855F7',
                          accent: '#A855F7',
                          glow: '#6B00FF',
                          portrait: '/assets/cardbg-purple-portrait.png',
                          gradient: 'linear-gradient(135deg, #C084FC 0%, #7928CA 50%, #4338CA 100%)'
                        },
                        {
                          id: 'gold',
                          name: '24K Mirror Gold',
                          desc: 'Prestige radiant gold portrait edition',
                          tint: '#F3CF8A',
                          accent: '#F59E0B',
                          glow: '#D97706',
                          portrait: '/assets/cardbg-gold-portrait.png',
                          gradient: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #B45309 100%)'
                        },
                        {
                          id: 'steel',
                          name: 'Brushed Steel',
                          desc: 'Platinum & silver portrait edition',
                          tint: '#E2E8F0',
                          accent: '#94A3B8',
                          glow: '#64748B',
                          portrait: '/assets/cardbg-platinum-portrait.png',
                          gradient: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)'
                        },
                        {
                          id: 'metal',
                          name: 'Gunmetal Metal',
                          desc: 'Brushed titanium gunmetal portrait edition',
                          tint: '#CBD5E1',
                          accent: '#94A3B8',
                          glow: '#475569',
                          portrait: '/assets/cardbg-metal-portrait.png',
                          gradient: 'linear-gradient(135deg, #CBD5E1 0%, #475569 50%, #1E293B 100%)'
                        }
                      ].map(edition => {
                        const isSelected = (formData.cardFinish === edition.id) || (!formData.cardFinish && edition.id === 'purple');
                        return (
                          <button
                            key={edition.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                cardFinish: edition.id,
                                cardColor: edition.tint,
                                glowColor: edition.glow,
                                accentColor: edition.accent
                              });
                            }}
                            style={{
                              padding: '12px 10px',
                              borderRadius: '12px',
                              border: isSelected ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                              backgroundColor: isSelected ? 'rgba(107, 0, 255, 0.18)' : 'var(--card-surface)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                              boxShadow: isSelected ? '0 4px 16px rgba(107, 0, 255, 0.25)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  background: edition.gradient,
                                  boxShadow: `0 0 8px ${edition.accent}80`,
                                  flexShrink: 0
                                }}
                              />
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {edition.name}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                              {edition.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom tint fine-tuning */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Custom Metallic Plate Tint:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={formData.cardColor || (formData.cardFinish === 'gold' ? '#F3CF8A' : formData.cardFinish === 'steel' ? '#E2E8F0' : '#A855F7')}
                          onChange={e => setFormData({ ...formData, cardColor: e.target.value, cardFinish: 'custom' })}
                          style={{ width: '34px', height: '30px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'none' }}
                          title="Choose custom metallic tint"
                        />
                        <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {formData.cardColor || (formData.cardFinish === 'gold' ? '#F3CF8A' : formData.cardFinish === 'steel' ? '#E2E8F0' : '#A855F7')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Photo Shape & Background Watermark */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--elevated-surface)', border: '1px solid var(--border-color)' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                        Profile Photo Shape
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {[
                          { id: 'circle', label: 'Circular Shape' },
                          { id: 'rounded_rect', label: 'Rounded Portrait' }
                        ].map(shape => (
                          <button
                            key={shape.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, photoShape: shape.id })}
                            style={{
                              flex: 1,
                              padding: '10px',
                              borderRadius: '8px',
                              border: `1.5px solid ${formData.photoShape === shape.id ? 'var(--primary-purple)' : 'var(--border-color)'}`,
                              backgroundColor: formData.photoShape === shape.id ? 'rgba(107, 0, 255, 0.15)' : 'transparent',
                              color: formData.photoShape === shape.id ? '#A855F7' : 'var(--text-secondary)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {shape.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--elevated-surface)', border: '1px solid var(--border-color)' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                        Subtle Oversized Watermark
                      </label>
                      <input
                        type="text"
                        value={formData.backgroundTypography || ''}
                        onChange={e => setFormData({ ...formData, backgroundTypography: e.target.value })}
                        placeholder="e.g. FLOCARD or COMPANY"
                        className="input"
                        style={{ width: '100%', fontSize: '0.84rem' }}
                      />
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Appears as faint cinematic typography behind the card.
                      </div>
                    </div>
                  </div>

                  {/* Gradient & Glow Colors */}
                  <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--elevated-surface)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Colors & Ambient Lighting
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[
                          { label: 'Obsidian Violet', start: '#130B22', mid: '#240F3E', end: '#0B0813', glow: '#6B00FF', accent: '#A855F7' },
                          { label: 'Cosmic Purple', start: '#1F1138', mid: '#3B0764', end: '#090514', glow: '#9333EA', accent: '#C084FC' },
                          { label: 'Deep Royal', start: '#0F172A', mid: '#1E1B4B', end: '#020617', glow: '#4F46E5', accent: '#818CF8' }
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              gradientStart: preset.start,
                              gradientMid: preset.mid,
                              gradientEnd: preset.end,
                              glowColor: preset.glow,
                              accentColor: preset.accent
                            })}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--card-surface)',
                              fontSize: '0.7rem',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Gradient Mid</span>
                        <input
                          type="color"
                          value={formData.gradientMid || '#240F3E'}
                          onChange={e => setFormData({ ...formData, gradientMid: e.target.value })}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'none' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Gradient End</span>
                        <input
                          type="color"
                          value={formData.gradientEnd || '#0B0813'}
                          onChange={e => setFormData({ ...formData, gradientEnd: e.target.value })}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'none' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Glow Accent</span>
                        <input
                          type="color"
                          value={formData.glowColor || '#6B00FF'}
                          onChange={e => setFormData({ ...formData, glowColor: e.target.value })}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'none' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Highlight</span>
                        <input
                          type="color"
                          value={formData.accentColor || '#A855F7'}
                          onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: IDENTITY INFO */}
              {editorTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* ── PHOTO & LOGO UPLOAD ROW ── */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      padding: '16px',
                      backgroundColor: 'var(--elevated-surface)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {/* Avatar / Headshot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '2px solid var(--border-color)',
                          background: 'var(--card-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        onClick={() => avatarInputRef.current?.click()}
                        title="Click to upload headshot"
                      >
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={28} color="var(--text-muted)" />
                        )}
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s'
                        }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        >
                          <Upload size={16} color="#fff" />
                        </div>
                      </div>
                      <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Profile Photo</div>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          style={{
                            marginTop: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '5px 12px',
                            borderRadius: '9999px',
                            border: '1px solid var(--border-color)',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          <Upload size={11} />
                          {formData.avatar ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        {formData.avatar && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                            style={{
                              marginTop: '4px',
                              display: 'block',
                              fontSize: '0.68rem',
                              color: '#F87171',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              width: '100%'
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Company Logo */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          border: '2px solid var(--border-color)',
                          background: 'var(--card-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        onClick={() => logoInputRef.current?.click()}
                        title="Click to upload company logo"
                      >
                        {formData.logo ? (
                          <img src={formData.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
                        ) : (
                          <Building2 size={28} color="var(--text-muted)" />
                        )}
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '14px',
                          background: 'rgba(0,0,0,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s'
                        }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        >
                          <Upload size={16} color="#fff" />
                        </div>
                      </div>
                      <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Company Logo</div>
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          style={{
                            marginTop: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '5px 12px',
                            borderRadius: '9999px',
                            border: '1px solid var(--border-color)',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          <Upload size={11} />
                          {formData.logo ? 'Change Logo' : 'Upload Logo'}
                        </button>
                        {formData.logo && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                            style={{
                              marginTop: '4px',
                              display: 'block',
                              fontSize: '0.68rem',
                              color: '#F87171',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              width: '100%'
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── NAME / ROLE ROW ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="input"
                        style={{ width: '100%', fontSize: '0.84rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Role / Professional Title</label>
                      <input
                        type="text"
                        value={formData.role || ''}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        className="input"
                        style={{ width: '100%', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Company</label>
                      <input
                        type="text"
                        value={formData.company || ''}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                        className="input"
                        style={{ width: '100%', fontSize: '0.84rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Slug (flocard.in/p/:slug)</label>
                      <input
                        type="text"
                        required
                        value={formData.slug || ''}
                        onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        className="input"
                        style={{ width: '100%', fontSize: '0.84rem', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Short Biography</label>
                    <textarea
                      rows={3}
                      value={formData.bio || ''}
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      className="input"
                      style={{ width: '100%', fontSize: '0.84rem', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Phone</label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="input"
                        style={{ width: '100%', fontSize: '0.84rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="input"
                        style={{ width: '100%', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>WhatsApp (Phone or wa.me link)</label>
                      <input
                        type="text"
                        value={formData.whatsapp || ''}
                        onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="+91 97782 78552"
                        className="input"
                        style={{ width: '100%', fontSize: '0.84rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Location</label>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Bengaluru, India"
                        className="input"
                        style={{ width: '100%', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>LinkedIn URL</label>
                      <input
                        type="text"
                        value={formData.linkedin || ''}
                        onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/username"
                        className="input"
                        style={{ width: '100%', fontSize: '0.84rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Instagram URL</label>
                      <input
                        type="text"
                        value={formData.instagram || ''}
                        onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="https://instagram.com/username"
                        className="input"
                        style={{ width: '100%', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Website URL</label>
                    <input
                      type="text"
                      value={formData.website || ''}
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://flocard.in"
                      className="input"
                      style={{ width: '100%', fontSize: '0.84rem' }}
                    />
                  </div>

                  {/* ── DYNAMIC CUSTOM CONTACT / SOCIAL LINKS ── */}
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--elevated-surface)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Globe size={14} color="var(--accent-purple)" />
                          Additional Custom Links (Auto-detected Icons & Favicons)
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Add YouTube, GitHub, Telegram, or any custom website. Favicons and official icons are fetched automatically.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const current = Array.isArray(formData.customLinks) ? [...formData.customLinks] : [];
                          current.push({ id: `link_${Date.now()}`, label: '', url: '' });
                          setFormData({ ...formData, customLinks: current });
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--accent-purple)',
                          backgroundColor: 'rgba(107, 0, 255, 0.12)',
                          color: '#A855F7',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={13} />
                        Add Link
                      </button>
                    </div>

                    {(formData.customLinks || []).length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {formData.customLinks.map((link, lIdx) => (
                          <div
                            key={link.id || lIdx}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '130px 1fr 34px',
                              gap: '8px',
                              alignItems: 'center'
                            }}
                          >
                            <input
                              type="text"
                              value={link.label || ''}
                              onChange={e => {
                                const next = [...formData.customLinks];
                                next[lIdx] = { ...next[lIdx], label: e.target.value };
                                setFormData({ ...formData, customLinks: next });
                              }}
                              placeholder="Label (e.g. YouTube)"
                              className="input"
                              style={{ width: '100%', fontSize: '0.8rem' }}
                            />
                            <input
                              type="text"
                              value={link.url || ''}
                              onChange={e => {
                                const next = [...formData.customLinks];
                                next[lIdx] = { ...next[lIdx], url: e.target.value };
                                setFormData({ ...formData, customLinks: next });
                              }}
                              placeholder="URL (e.g. https://youtube.com/@channel or website)"
                              className="input"
                              style={{ width: '100%', fontSize: '0.8rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = formData.customLinks.filter((_, idx) => idx !== lIdx);
                                setFormData({ ...formData, customLinks: next });
                              }}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'transparent',
                                color: '#F87171',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                              title="Delete Link"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── PORTFOLIO IMAGES ── */}
                  {(formData.portfolio || []).length > 0 && (
                    <div
                      style={{
                        padding: '14px',
                        backgroundColor: 'var(--elevated-surface)',
                        borderRadius: '14px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ImageIcon size={14} color="var(--accent-purple)" />
                        Portfolio Images
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px' }}>
                        {(formData.portfolio || []).map((item, idx) => (
                          <label
                            key={item.id || idx}
                            title={item.title || `Work ${idx + 1}`}
                            style={{
                              position: 'relative',
                              display: 'block',
                              width: '100%',
                              paddingBottom: '100%',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              background: 'var(--card-surface)',
                              border: '1px dashed var(--border-color)',
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handlePortfolioImageUpload(idx, e)}
                              style={{ display: 'none' }}
                            />
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title || `Work ${idx + 1}`}
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                color: 'var(--text-muted)'
                              }}>
                                <Upload size={16} />
                                <span style={{ fontSize: '0.62rem' }}>Add Image</span>
                              </div>
                            )}
                            {/* Hover overlay */}
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(107,0,255,0.55)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              borderRadius: '11px'
                            }}
                              onMouseEnter={e => e.currentTarget.style.opacity = 1}
                              onMouseLeave={e => e.currentTarget.style.opacity = 0}
                            >
                              <Upload size={18} color="#fff" />
                            </div>
                            {/* Title chip */}
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: 'rgba(0,0,0,0.6)',
                              color: '#fff',
                              fontSize: '0.6rem',
                              padding: '3px 5px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {item.title || `Work ${idx + 1}`}
                            </div>
                          </label>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '8px', margin: '8px 0 0' }}>
                        Click any tile to upload / replace its image.
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: SECTIONS VISIBILITY */}
              {editorTab === 'sections' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Toggle which sections appear in the expanded portfolio view.
                  </p>
                  {[
                    { key: 'portfolio', label: 'Portfolio Gallery', desc: 'Display grid of published work and project showcase' },
                    { key: 'about', label: 'About Section', desc: 'Detailed biography and company background' },
                    { key: 'services', label: 'Services Offered', desc: 'List of services and capabilities' },
                    { key: 'experience', label: 'Work Experience', desc: 'Career history and milestones' },
                    { key: 'contact', label: 'Contact Details', desc: 'Direct contact info, QR code, and location map' }
                  ].map(sec => {
                    const isVisible = formData.sectionVisibility ? formData.sectionVisibility[sec.key] !== false : true;
                    return (
                      <div
                        key={sec.key}
                        onClick={() => {
                          const current = formData.sectionVisibility || {};
                          setFormData({
                            ...formData,
                            sectionVisibility: { ...current, [sec.key]: !isVisible }
                          });
                        }}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--elevated-surface)',
                          border: `1.5px solid ${isVisible ? 'var(--primary-purple)' : 'var(--border-color)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sec.label}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{sec.desc}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => {}}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-purple)' }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {saveSuccess && (
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.84rem', fontWeight: 600, textAlign: 'center' }}>
                  <Check size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  Profile updated successfully!
                </div>
              )}

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenPreview(formData)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Eye size={14} />
                  <span>Test Morphing Preview</span>
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(null)}
                    className="btn btn-outline btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <Save size={14} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Live Morphing Preview Modal */}
      {previewProfile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 6, 13, 0.95)',
            backdropFilter: 'blur(16px)',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflowY: 'auto',
            padding: '24px 16px'
          }}
        >
          {/* Preview Controller Bar */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: '880px',
              width: '100%',
              padding: '12px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(23, 17, 31, 0.85)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              marginBottom: '28px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#A855F7" />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>
                Live Morphing Simulator: {previewExpanded ? 'Expanded Portfolio State' : 'Compact Card State'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPreviewExpanded(!previewExpanded)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(107, 0, 255, 0.25)',
                  border: '1px solid #A855F7',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {previewExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span>{previewExpanded ? 'Trigger Collapse' : 'Trigger Expand'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewProfile(null)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Morphing Component Preview in Center */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
            {!previewExpanded ? (
              <CompactProfileCard
                profile={previewProfile}
                onExpand={() => setPreviewExpanded(true)}
              />
            ) : (
              <ExpandedPortfolioView
                profile={previewProfile}
                onCollapse={() => setPreviewExpanded(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
