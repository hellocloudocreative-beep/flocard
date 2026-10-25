/* ==========================================================================
   FLOCARDS ADMIN SMART QR MANAGEMENT
   Staff directory to search, inspect, preview, and download companion QRs.
   Includes placement studio and owner-only global QR configuration.
   ========================================================================== */

import React, { useState, useMemo, useEffect } from 'react';
import {
  QrCode,
  Search,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Settings,
  Layers,
  Sparkles,
  Radio,
  FileText,
  User,
  Sliders
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import {
  generateQrDataUrl,
  downloadQrPng,
  downloadQrSvg,
  getCanonicalProfileUrl
} from '../../../lib/qr';
import { StorageEngine } from '../../../lib/storage';
import QrPlacementStudio from '../../../components/qr/QrPlacementStudio';

export default function AdminQrManager() {
  const { profiles, cards, customers } = useData();
  const { user, isOwner } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('directory'); // 'directory' | 'studio' | 'config'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [previewQrUrl, setPreviewQrUrl] = useState('');
  const [copiedSlug, setCopiedSlug] = useState(null);

  // Global QR Configuration State (Owner Only)
  const [qrConfig, setQrConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('flocard_qr_config');
      return saved ? JSON.parse(saved) : {
        baseUrl: 'https://flocard.in',
        errorCorrection: 'H',
        quietZone: 3,
        primaryColor: '#000000'
      };
    } catch {
      return { baseUrl: 'https://flocard.in', errorCorrection: 'H', quietZone: 3, primaryColor: '#000000' };
    }
  });
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Default selected profile
  useEffect(() => {
    if (profiles && profiles.length > 0 && !selectedProfile) {
      setSelectedProfile(profiles[0]);
    }
  }, [profiles, selectedProfile]);

  // Update preview when selected profile changes
  useEffect(() => {
    if (selectedProfile?.slug) {
      const url = getCanonicalProfileUrl(selectedProfile.slug);
      generateQrDataUrl(url, {
        width: 360,
        margin: qrConfig.quietZone || 3,
        errorCorrectionLevel: qrConfig.errorCorrection || 'H'
      }).then(setPreviewQrUrl).catch(console.error);
    }
  }, [selectedProfile, qrConfig]);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    if (!searchQuery.trim()) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter((p) => {
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchSlug = (p.slug || '').toLowerCase().includes(q);
      const matchEmail = (p.email || '').toLowerCase().includes(q);
      const matchCompany = (p.company || '').toLowerCase().includes(q);
      return matchName || matchSlug || matchEmail || matchCompany;
    });
  }, [profiles, searchQuery]);

  const handleCopyLink = (slug) => {
    const url = getCanonicalProfileUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!isOwner) return;
    localStorage.setItem('flocard_qr_config', JSON.stringify(qrConfig));
    StorageEngine.addAuditLog({
      actorName: user?.name || 'Platform Owner',
      actorEmail: user?.email || 'admin@flocard.in',
      actorRole: 'owner',
      action: 'qr.config_update',
      entityType: 'Smart QR',
      entityId: 'global_qr_settings',
      description: 'Updated platform-wide Smart QR generation configuration',
      beforeValues: null,
      afterValues: qrConfig,
      status: 'success',
      severity: 'info'
    });
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#130B22',
          border: '1px solid #2B1B44',
          borderRadius: '14px',
          padding: '12px 18px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('directory')}
            style={{
              background: activeSubTab === 'directory' ? 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)' : '#1C1230',
              border: 'none',
              color: activeSubTab === 'directory' ? '#FFFFFF' : '#B8AEC8',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <QrCode size={15} />
            <span>Profile QR Directory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('studio')}
            style={{
              background: activeSubTab === 'studio' ? 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)' : '#1C1230',
              border: 'none',
              color: activeSubTab === 'studio' ? '#FFFFFF' : '#B8AEC8',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={15} />
            <span>Card & Poster Preview Studio</span>
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveSubTab('config')}
              style={{
                background: activeSubTab === 'config' ? 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)' : '#1C1230',
                border: 'none',
                color: activeSubTab === 'config' ? '#FFFFFF' : '#B8AEC8',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Settings size={15} />
              <span>Global QR Settings (Owner)</span>
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.8rem', color: '#9387A6' }}>
          Permanent Routing: <code style={{ color: '#C084FC' }}>https://flocard.in/:slug</code>
        </div>
      </div>

      {/* ===================== SUBTAB 1: DIRECTORY ===================== */}
      {activeSubTab === 'directory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 380px', gap: '20px' }}>
          {/* Left Column: Search & Profiles List */}
          <div
            style={{
              background: '#130B22',
              border: '1px solid #2B1B44',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {/* Search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#0B0515',
                border: '1px solid #362254',
                borderRadius: '10px',
                padding: '0 14px'
              }}
            >
              <Search size={16} color="#7D6F92" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by profile name, slug, or customer..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  padding: '10px 0'
                }}
              />
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '560px', overflowY: 'auto' }}>
              {filteredProfiles.map((p) => {
                const isSelected = selectedProfile?.id === p.id;
                const canonicalUrl = getCanonicalProfileUrl(p.slug);
                const linkedCard = (cards || []).find((c) => c.profileId === p.id || c.customerName === p.name);

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProfile(p)}
                    style={{
                      background: isSelected ? '#24143D' : '#19102B',
                      border: isSelected ? '1px solid #8B5CF6' : '1px solid #2F1C4E',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.92rem' }}>
                          {p.name}
                        </span>
                        <span style={{ fontSize: '0.72rem', background: '#39225F', color: '#D8B4FE', padding: '1px 7px', borderRadius: '6px', fontFamily: 'monospace' }}>
                          @{p.slug}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#9387A6', marginTop: '2px' }}>
                        {p.role} • {p.company}
                      </div>
                      {linkedCard && (
                        <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Radio size={12} />
                          <span>Linked Card: {linkedCard.cardCode}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(p.slug);
                        }}
                        title="Copy Canonical URL"
                        style={{
                          background: '#130B22',
                          border: '1px solid #362254',
                          color: '#C4B5FD',
                          padding: '6px',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedSlug === p.slug ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Profile QR Preview & Downloads */}
          {selectedProfile && (
            <div
              style={{
                background: '#130B22',
                border: '1px solid #2B1B44',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                Companion Smart QR
              </h3>
              <p style={{ margin: '4px 0 16px', fontSize: '0.78rem', color: '#8F82A4' }}>
                Opens {selectedProfile.name}’s authoritative public profile
              </p>

              {/* QR Canvas Box */}
              <div
                style={{
                  background: '#FFFFFF',
                  padding: '16px',
                  borderRadius: '16px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                  marginBottom: '18px'
                }}
              >
                {previewQrUrl ? (
                  <img
                    src={previewQrUrl}
                    alt={`${selectedProfile.name} Smart QR`}
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '220px', height: '220px', background: '#F3F4F6' }} />
                )}
              </div>

              {/* Destination Link */}
              <div style={{ marginBottom: '20px' }}>
                <a
                  href={getCanonicalProfileUrl(selectedProfile.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#C084FC',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>{getCanonicalProfileUrl(selectedProfile.slug)}</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Download Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => downloadQrPng(getCanonicalProfileUrl(selectedProfile.slug), `flocard-qr-${selectedProfile.slug}.png`, 2048)}
                  style={{
                    background: '#24143D',
                    border: '1px solid #48297A',
                    color: '#C4B5FD',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} />
                  <span>Download High-Res PNG (2048px)</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadQrSvg(getCanonicalProfileUrl(selectedProfile.slug), `flocard-qr-${selectedProfile.slug}.svg`)}
                  style={{
                    background: 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} />
                  <span>Download Scalable Vector SVG</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== SUBTAB 2: STUDIO PREVIEW ===================== */}
      {activeSubTab === 'studio' && (
        <QrPlacementStudio profile={selectedProfile || profiles[0]} />
      )}

      {/* ===================== SUBTAB 3: GLOBAL CONFIG (OWNER ONLY) ===================== */}
      {activeSubTab === 'config' && isOwner && (
        <div
          style={{
            background: '#130B22',
            border: '1px solid #2B1B44',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '640px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={18} color="#A855F7" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
              Owner Global Smart QR Configuration
            </h3>
          </div>
          <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: '#8F82A4' }}>
            Platform-wide parameters applied when encoding digital profile URLs and generating export assets.
          </p>

          {configSavedToast && (
            <div style={{ background: '#10B98120', border: '1px solid #10B98140', color: '#6EE7B7', padding: '10px 14px', borderRadius: '10px', fontSize: '0.84rem', marginBottom: '16px' }}>
              ✓ Global QR settings updated and logged to audit ledger.
            </div>
          )}

          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#C4B5FD', fontWeight: 600, marginBottom: '6px' }}>
                Canonical Production Domain
              </label>
              <input
                type="text"
                value={qrConfig.baseUrl}
                onChange={(e) => setQrConfig({ ...qrConfig, baseUrl: e.target.value })}
                style={{
                  width: '100%',
                  background: '#0B0515',
                  border: '1px solid #362254',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#FFFFFF',
                  fontSize: '0.86rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: '#7E7194', marginTop: '4px', display: 'block' }}>
                Never change away from official flocard.in domain without DNS redirect validation.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#C4B5FD', fontWeight: 600, marginBottom: '6px' }}>
                Error Correction Level
              </label>
              <select
                value={qrConfig.errorCorrection}
                onChange={(e) => setQrConfig({ ...qrConfig, errorCorrection: e.target.value })}
                style={{
                  width: '100%',
                  background: '#0B0515',
                  border: '1px solid #362254',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#FFFFFF',
                  fontSize: '0.86rem',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="H">High (H) — Up to 30% damage recovery (Recommended for Card Laser Engraving)</option>
                <option value="Q">Quartile (Q) — Up to 25% damage recovery</option>
                <option value="M">Medium (M) — Up to 15% damage recovery</option>
                <option value="L">Low (L) — Up to 7% damage recovery</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#C4B5FD', fontWeight: 600, marginBottom: '6px' }}>
                Quiet Zone Margin: {qrConfig.quietZone} modules
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={qrConfig.quietZone}
                onChange={(e) => setQrConfig({ ...qrConfig, quietZone: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#6B00FF' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#7E7194' }}>
                Maintains required white border margin around QR code pattern for instant camera auto-focus.
              </span>
            </div>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)',
                border: 'none',
                color: '#FFFFFF',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Save Global QR Configuration
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
