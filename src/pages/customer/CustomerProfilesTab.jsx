/* ==========================================================================
   FLOCARDS CUSTOMER DASHBOARD — CENTRAL PROFILE EDITOR
   Organized into 14 dedicated, comprehensive sections:
   1. Basic Information
   2. Profile Picture
   3. Banner and Appearance
   4. Contact and Social Links
   5. Business Hours
   6. Appointment Booking
   7. Services
   8. Portfolio Gallery
   9. Videos
   10. Payments
   11. Public Bank Details
   12. QR Code
   13. Upload Usage
   14. Profile Visibility and Publishing
   ========================================================================== */

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Image as ImageIcon,
  Clock,
  Calendar,
  CreditCard,
  Landmark,
  Video,
  HardDrive,
  QrCode,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
  ArrowRight
} from 'lucide-react';
import { downloadVCard } from '../../lib/vcard';
import { useData } from '../../context/DataContext';
import { uploadImage } from '../../lib/uploadImage';
import { generateQrDataUrl, downloadQrPng, downloadQrSvg, getCanonicalProfileUrl } from '../../lib/qr';
import { DAYS_OF_WEEK, DAY_LABELS, DEFAULT_BUSINESS_HOURS } from '../../lib/businessHoursService';
import { getAppointments, updateAppointmentStatus, DEFAULT_BOOKING_CONFIG } from '../../lib/appointmentService';
import { calculateProfileUsage, validateUploadQuota, DEFAULT_STORAGE_QUOTAS } from '../../lib/storageQuotaService';
import { validateUpiId, validateIfsc, validateBankDetails } from '../../lib/paymentValidator';
import FullScreenDigitalProfile from '../../components/profile/FullScreenDigitalProfile';

export default function CustomerProfilesTab({ profiles = [], customer, onSaveProfile }) {
  const { saveProfile, recordTap } = useData();

  const [editingProfile, setEditingProfile] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'

  // Central Editor Active Section
  const [editorSection, setEditorSection] = useState('basic');

  // Form states
  const [formData, setFormData] = useState({});
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Appointment management inside owner editor
  const [profileAppointments, setProfileAppointments] = useState([]);
  const [appointmentFilter, setAppointmentFilter] = useState('all');

  // Image upload refs
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const serviceInputRef = useRef(null);
  const portfolioInputRef = useRef(null);
  const paymentQrInputRef = useRef(null);

  // Measured storage usage
  const storageUsage = useMemo(() => {
    return calculateProfileUsage(formData);
  }, [formData]);

  // Load appointments when editor opens
  useEffect(() => {
    if (editingProfile?.slug) {
      getAppointments(editingProfile.slug)
        .then(setProfileAppointments)
        .catch(() => {});
    }
  }, [editingProfile?.slug]);

  // Handle Opening the Profile Editor
  const handleOpenEdit = (profile) => {
    setEditingProfile(profile);
    setEditorSection('basic');
    setUploadError('');
    setSaveSuccess(false);

    setFormData({
      ...profile,
      openingPreference: profile.openingPreference || 'full',
      cardFinish: profile.cardFinish || (profile.edition === 'gold' ? 'gold' : profile.edition === 'platinum' || profile.edition === 'steel' ? 'steel' : 'purple'),
      cardColor: profile.cardColor || '#A855F7',
      gradientStart: profile.gradientStart || '#130B22',
      gradientMid: profile.gradientMid || '#240F3E',
      gradientEnd: profile.gradientEnd || '#0B0813',
      accentColor: profile.accentColor || '#A855F7',
      glowColor: profile.glowColor || '#6B00FF',
      creamHighlight: profile.creamHighlight || '#F5EDE5',
      borderGlowIntensity: profile.borderGlowIntensity || 'medium',
      photoShape: profile.photoShape || 'circle',
      backgroundTypography: profile.backgroundTypography || 'FLOCARD',
      banner: {
        enabled: true,
        type: 'image',
        url: '/assets/hero-bg.jpg',
        height: 280,
        zoom: 100,
        positionX: 50,
        positionY: 45,
        gradientStart: '#2e1065',
        gradientEnd: '#090514',
        solidColor: '#1a0b2e',
        overlayOpacity: 0.38,
        overlayColor: '#08060D',
        ...(profile.banner || {})
      },
      businessHours: {
        ...DEFAULT_BUSINESS_HOURS,
        ...(profile.businessHours || {})
      },
      bookingConfig: {
        ...DEFAULT_BOOKING_CONFIG,
        ...(profile.bookingConfig || {})
      },
      paymentConfig: {
        enabled: true,
        upiId: 'flocards@icici',
        recipientName: profile.name || 'FLOCARDS Merchant',
        qrUrl: '',
        instructions: 'Scan with any UPI app (GPay, PhonePe, Paytm, BHIM) to pay securely.',
        ...(profile.paymentConfig || {})
      },
      bankDetails: {
        enabled: false,
        isPublic: false,
        accountHolder: profile.company ? `${profile.company} PRIVATE LIMITED` : 'FLOCARDS DIGITAL SYSTEMS PRIVATE LIMITED',
        bankName: 'HDFC Bank',
        branch: 'Indiranagar, Bengaluru',
        accountNumber: '50200084729103',
        ifsc: 'HDFC0000123',
        visibleFields: {
          accountHolder: true,
          bankName: true,
          branch: true,
          accountNumber: true,
          ifsc: true
        },
        ...(profile.bankDetails || {})
      },
      sectionVisibility: {
        banner: true,
        about: true,
        hours: true,
        booking: true,
        services: true,
        portfolio: true,
        videos: true,
        payments: true,
        bankDetails: false,
        experience: true,
        contact: true,
        qrCompanion: true,
        ...(profile.sectionVisibility || {})
      },
      services: Array.isArray(profile.services) ? [...profile.services] : [],
      portfolio: Array.isArray(profile.portfolio) ? [...profile.portfolio] : [],
      videos: Array.isArray(profile.videos) ? [...profile.videos] : [],
      whatsapp: profile.whatsapp || profile.socialLinks?.whatsapp || '',
      linkedin: profile.linkedin || profile.socialLinks?.linkedin || '',
      instagram: profile.instagram || profile.socialLinks?.instagram || '',
      twitter: profile.twitter || profile.socialLinks?.twitter || '',
      github: profile.github || profile.socialLinks?.github || '',
      youtube: profile.youtube || profile.socialLinks?.youtube || '',
      customLinks: Array.isArray(profile.customLinks) ? [...profile.customLinks] : []
    });
  };

  // Upload Avatar
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setIsUploading(true);
    try {
      const url = await uploadImage(file, 'avatar', customer?.id || 'anon', formData);
      setFormData(prev => ({ ...prev, avatar: url, avatarSizeBytes: file.size }));
    } catch (err) {
      setUploadError(err.message || 'Avatar upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Upload Banner
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setIsUploading(true);
    try {
      const isVideo = file.type?.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name || '');
      const url = await uploadImage(file, 'banner', customer?.id || 'anon', formData);
      setFormData(prev => ({
        ...prev,
        banner: {
          ...(prev.banner || {}),
          url,
          type: isVideo ? 'video' : 'image',
          sizeBytes: file.size
        }
      }));
    } catch (err) {
      setUploadError(err.message || 'Banner upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Upload Portfolio Image
  const handlePortfolioImageUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setIsUploading(true);
    try {
      const url = await uploadImage(file, 'portfolio', customer?.id || 'anon', formData);
      setFormData(prev => {
        const next = [...(prev.portfolio || [])];
        next[index] = { ...next[index], image: url, sizeBytes: file.size };
        return { ...prev, portfolio: next };
      });
    } catch (err) {
      setUploadError(err.message || 'Portfolio image upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Upload Service Image
  const handleServiceImageUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setIsUploading(true);
    try {
      const url = await uploadImage(file, 'service', customer?.id || 'anon', formData);
      setFormData(prev => {
        const next = [...(prev.services || [])];
        next[index] = { ...next[index], image: url, sizeBytes: file.size };
        return { ...prev, services: next };
      });
    } catch (err) {
      setUploadError(err.message || 'Service thumbnail upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Upload Payment QR
  const handlePaymentQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setIsUploading(true);
    try {
      const url = await uploadImage(file, 'general', customer?.id || 'anon', formData);
      setFormData(prev => ({
        ...prev,
        paymentConfig: { ...(prev.paymentConfig || {}), qrUrl: url }
      }));
    } catch (err) {
      setUploadError(err.message || 'Payment QR upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Save profile changes
  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.slug) return;

    // Validate bank details if marked public
    if (formData.bankDetails?.isPublic && formData.bankDetails?.enabled) {
      const check = validateBankDetails(formData.bankDetails);
      if (!check.valid) {
        setUploadError(Object.values(check.errors)[0] || 'Please review bank details.');
        setEditorSection('bank');
        return;
      }
    }

    // Validate UPI ID if enabled
    if (formData.paymentConfig?.enabled && formData.paymentConfig?.upiId) {
      const upiCheck = validateUpiId(formData.paymentConfig.upiId);
      if (!upiCheck.valid) {
        setUploadError(upiCheck.error);
        setEditorSection('payments');
        return;
      }
    }

    const saved = saveProfile(formData);
    if (onSaveProfile) onSaveProfile(saved);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setEditingProfile(null);
    }, 1200);
  };

  const handleCopyLink = (slug) => {
    const url = `https://flocard.in/p/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  // Appointment actions
  const handleAppointmentStatusChange = async (aptId, newStatus) => {
    try {
      await updateAppointmentStatus({
        id: aptId,
        profileSlug: formData.slug,
        status: newStatus,
        actorName: customer?.name || 'Owner'
      });
      const fresh = await getAppointments(formData.slug);
      setProfileAppointments(fresh);
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  // 14 Editor Navigation Sections definition
  const SECTIONS = [
    { id: 'basic', label: '1. Basic Information', icon: User },
    { id: 'avatar', label: '2. Profile Picture', icon: CameraIcon },
    { id: 'banner', label: '3. Banner & Appearance', icon: ImageIcon },
    { id: 'contact', label: '4. Contact & Social Links', icon: Phone },
    { id: 'hours', label: '5. Business Hours', icon: Clock },
    { id: 'booking', label: '6. Appointment Booking', icon: Calendar },
    { id: 'services', label: '7. Services Showcase', icon: Layers },
    { id: 'portfolio', label: '8. Portfolio Gallery', icon: BriefcaseIcon },
    { id: 'videos', label: '9. Videos', icon: Video },
    { id: 'payments', label: '10. Payments & UPI', icon: CreditCard },
    { id: 'bank', label: '11. Public Bank Details', icon: Landmark },
    { id: 'qr', label: '12. QR Code Companion', icon: QrCode },
    { id: 'usage', label: '13. Upload Usage & Quotas', icon: HardDrive },
    { id: 'publishing', label: '14. Visibility & Publishing', icon: Globe }
  ];

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
            onClick={() => handleOpenEdit(profiles[0])}
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
                <img
                  src={prof.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={prof.name}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: prof.photoShape === 'rounded_rect' ? '12px' : '50%',
                    border: '2px solid #FFFFFF',
                    objectFit: 'cover'
                  }}
                />
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
                  onClick={() => handleOpenEdit(prof)}
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
          CENTRAL PROFILE EDITOR MODAL (14 SECTIONS)
          ========================================================================= */}
      {editingProfile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 3, 10, 0.88)',
            backdropFilter: 'blur(12px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '980px',
              width: '100%',
              backgroundColor: 'var(--card-surface)',
              borderRadius: '24px',
              border: '1.5px solid var(--border-highlight)',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
              position: 'relative'
            }}
          >
            {/* Modal Header Bar */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                backgroundColor: 'var(--card-surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sliders size={20} color="var(--accent-purple)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  Profile Appearance & Business Platform Editor
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewProfile(formData)}
                  className="btn btn-secondary btn-xs"
                  style={{ gap: '6px' }}
                >
                  <Eye size={14} />
                  <span>Live Preview</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="btn btn-primary btn-xs"
                  style={{ gap: '6px' }}
                >
                  <Save size={14} />
                  <span>Save All Changes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Success & Error Banner */}
            {saveSuccess && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', borderBottom: '1px solid #10B981', color: '#10B981', padding: '10px 24px', fontSize: '0.86rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>Profile customizations saved successfully across all digital cards and URLs!</span>
              </div>
            )}
            {uploadError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', borderBottom: '1px solid #EF4444', color: '#F87171', padding: '10px 24px', fontSize: '0.86rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Split Body: Sidebar Navigation + Active Section Form */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left Nav List */}
              <div
                style={{
                  width: '260px',
                  backgroundColor: 'var(--elevated-surface)',
                  borderRight: '1px solid var(--border-color)',
                  padding: '16px 12px',
                  overflowY: 'auto',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                {SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  const active = editorSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setEditorSection(sec.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: active ? 'var(--primary-purple)' : 'transparent',
                        color: active ? '#FFFFFF' : 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left',
                        transition: 'all 0.16s ease'
                      }}
                    >
                      <Icon size={15} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sec.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Active Section Form */}
              <div
                style={{
                  flex: 1,
                  padding: '24px',
                  overflowY: 'auto',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                {/* 1. BASIC INFORMATION */}
                {editorSection === 'basic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>1. Basic Information</h4>
                    <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Core professional identity shown at the top of your full-screen digital profile.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Full Name *</label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Job Title / Professional Role</label>
                        <input
                          type="text"
                          value={formData.role || ''}
                          onChange={e => setFormData({ ...formData, role: e.target.value })}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Company / Organization</label>
                        <input
                          type="text"
                          value={formData.company || ''}
                          onChange={e => setFormData({ ...formData, company: e.target.value })}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Location / City</label>
                        <input
                          type="text"
                          value={formData.location || ''}
                          onChange={e => setFormData({ ...formData, location: e.target.value })}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Short Biography / Mission</label>
                      <textarea
                        rows={3}
                        value={formData.bio || ''}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        className="form-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}

                {/* 2. PROFILE PICTURE */}
                {editorSection === 'avatar' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>2. Profile Picture</h4>
                    <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      High-resolution portrait picture that overlaps the cover banner.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <img
                        src={formData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                        alt="Avatar Preview"
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: formData.photoShape === 'rounded_rect' ? '22px' : '50%',
                          objectFit: 'cover',
                          border: '3px solid var(--accent-purple)'
                        }}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input
                          type="file"
                          ref={avatarInputRef}
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={handleAvatarUpload}
                        />
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => avatarInputRef.current?.click()}
                          className="btn btn-primary btn-sm"
                          style={{ gap: '6px' }}
                        >
                          <Upload size={14} />
                          <span>{isUploading ? 'Uploading...' : 'Upload New Photo'}</span>
                        </button>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Recommended: Square image 400x400 or larger (PNG, JPG, WebP)
                        </span>
                      </div>
                    </div>

                    {/* Shape Toggle */}
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                        Photo Shape
                      </label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {[
                          { id: 'circle', label: 'Circular Avatar (Classic)' },
                          { id: 'rounded_rect', label: 'Rounded Square (Modern)' }
                        ].map(shape => (
                          <button
                            key={shape.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, photoShape: shape.id })}
                            style={{
                              padding: '10px 18px',
                              borderRadius: '10px',
                              border: formData.photoShape === shape.id ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                              backgroundColor: formData.photoShape === shape.id ? 'var(--primary-purple)' : 'transparent',
                              color: formData.photoShape === shape.id ? '#FFFFFF' : 'var(--text-secondary)',
                              fontSize: '0.84rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {shape.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. BANNER AND APPEARANCE */}
                {editorSection === 'banner' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>3. Banner and Appearance</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Facebook/Discord-style customizable cover banner at top of your digital profile.
                        </p>
                      </div>

                      {/* Banner Visibility Toggle */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.banner?.enabled !== false}
                          onChange={(e) => setFormData({
                            ...formData,
                            banner: { ...(formData.banner || {}), enabled: e.target.checked }
                          })}
                        />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Enable Banner</span>
                      </label>
                    </div>

                    {/* Banner Live Mini Preview */}
                    <div style={{ width: '100%', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${formData.banner?.height || 220}px`,
                          maxHeight: '240px',
                          backgroundColor: formData.banner?.solidColor || '#1a0b2e',
                          backgroundImage: formData.banner?.type === 'image' && formData.banner?.url ? `url(${formData.banner.url})` : (formData.banner?.type === 'gradient' ? `linear-gradient(135deg, ${formData.banner.gradientStart || '#2e1065'}, ${formData.banner.gradientEnd || '#090514'})` : 'none'),
                          backgroundSize: 'cover',
                          backgroundPosition: `${formData.banner?.positionX ?? 50}% ${formData.banner?.positionY ?? 50}%`,
                          transform: `scale(${(formData.banner?.zoom || 100) / 100})`,
                          transformOrigin: 'center center',
                          position: 'relative'
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(to bottom, transparent 40%, rgba(8,6,13,${formData.banner?.overlayOpacity ?? 0.4}) 100%)`
                          }}
                        />
                      </div>
                    </div>

                    {/* Banner Type Tabs: Image vs Gradient vs Solid Color vs Video */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                        Banner Style Type
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                          { id: 'image', label: 'Uploaded Image' },
                          { id: 'gradient', label: 'Gradient Palette' },
                          { id: 'color', label: 'Solid Color' },
                          { id: 'video', label: 'Looping Video (MP4/WebM)' }
                        ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              banner: { ...(formData.banner || {}), type: t.id }
                            })}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              border: formData.banner?.type === t.id ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                              backgroundColor: formData.banner?.type === t.id ? 'var(--primary-purple)' : 'transparent',
                              color: formData.banner?.type === t.id ? '#FFFFFF' : 'var(--text-secondary)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Upload Image/Video Action */}
                    {(formData.banner?.type === 'image' || formData.banner?.type === 'video') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <input
                          type="file"
                          ref={bannerInputRef}
                          style={{ display: 'none' }}
                          accept={formData.banner?.type === 'video' ? 'video/mp4,video/webm' : 'image/*'}
                          onChange={handleBannerUpload}
                        />
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => bannerInputRef.current?.click()}
                          className="btn btn-primary btn-sm"
                          style={{ gap: '6px' }}
                        >
                          <Upload size={14} />
                          <span>{isUploading ? 'Uploading...' : `Upload ${formData.banner?.type === 'video' ? 'Video' : 'Cover Image'}`}</span>
                        </button>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Aspect Ratio ~3:1 (e.g. 1500x500px). Max 5MB (Image) or 15MB (Video).
                        </span>
                      </div>
                    )}

                    {/* Zoom, Position X & Y sliders */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                          <span>Zoom</span>
                          <span>{formData.banner?.zoom || 100}%</span>
                        </label>
                        <input
                          type="range"
                          min="80"
                          max="150"
                          value={formData.banner?.zoom || 100}
                          onChange={(e) => setFormData({
                            ...formData,
                            banner: { ...(formData.banner || {}), zoom: Number(e.target.value) }
                          })}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                          <span>Vertical Position (Y)</span>
                          <span>{formData.banner?.positionY ?? 50}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formData.banner?.positionY ?? 50}
                          onChange={(e) => setFormData({
                            ...formData,
                            banner: { ...(formData.banner || {}), positionY: Number(e.target.value) }
                          })}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                          <span>Overlay Darkness</span>
                          <span>{Math.round((formData.banner?.overlayOpacity ?? 0.38) * 100)}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round((formData.banner?.overlayOpacity ?? 0.38) * 100)}
                          onChange={(e) => setFormData({
                            ...formData,
                            banner: { ...(formData.banner || {}), overlayOpacity: Number(e.target.value) / 100 }
                          })}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CONTACT AND SOCIAL LINKS */}
                {editorSection === 'contact' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>4. Contact and Social Links</h4>
                    <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Direct contact phone, WhatsApp, and social media links.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Phone Number</label>
                        <input
                          type="text"
                          value={formData.phone || ''}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>WhatsApp Number</label>
                        <input
                          type="text"
                          value={formData.whatsapp || ''}
                          onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                          placeholder="919876543210"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Email Address</label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          placeholder="alex@example.com"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Website URL</label>
                        <input
                          type="text"
                          value={formData.website || ''}
                          onChange={e => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://flocard.in"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>LinkedIn Profile</label>
                        <input
                          type="text"
                          value={formData.linkedin || ''}
                          onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                          placeholder="https://linkedin.com/in/username"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Instagram</label>
                        <input
                          type="text"
                          value={formData.instagram || ''}
                          onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                          placeholder="https://instagram.com/username"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. BUSINESS HOURS */}
                {editorSection === 'hours' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>5. Business Hours</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Configure daily opening and closing hours, closed days, and business timezone.
                        </p>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.sectionVisibility?.hours !== false}
                          onChange={(e) => setFormData({
                            ...formData,
                            sectionVisibility: { ...(formData.sectionVisibility || {}), hours: e.target.checked }
                          })}
                        />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Show Hours on Profile</span>
                      </label>
                    </div>

                    {/* Timezone Selection */}
                    <div style={{ maxWidth: '300px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Business Timezone</label>
                      <select
                        value={formData.businessHours?.timezone || 'Asia/Kolkata'}
                        onChange={(e) => setFormData({
                          ...formData,
                          businessHours: { ...(formData.businessHours || {}), timezone: e.target.value }
                        })}
                        className="form-input"
                        style={{ width: '100%' }}
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                        <option value="Europe/London">Europe/London (GMT/BST)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                      </select>
                    </div>

                    {/* Weekly Schedule Editors */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {DAYS_OF_WEEK.map((day) => {
                        const dayCfg = formData.businessHours?.schedule?.[day] || { isOpen: false, slots: [{ open: '09:00', close: '17:00' }] };
                        return (
                          <div
                            key={day}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '12px',
                              backgroundColor: 'var(--elevated-surface)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}
                          >
                            <div style={{ width: '120px', fontWeight: 700, fontSize: '0.88rem' }}>
                              {DAY_LABELS[day]}
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={dayCfg.isOpen}
                                onChange={(e) => {
                                  const updated = {
                                    ...(formData.businessHours?.schedule || {}),
                                    [day]: { ...dayCfg, isOpen: e.target.checked }
                                  };
                                  setFormData({
                                    ...formData,
                                    businessHours: { ...(formData.businessHours || {}), schedule: updated }
                                  });
                                }}
                              />
                              <span>{dayCfg.isOpen ? 'Open' : 'Closed'}</span>
                            </label>

                            {dayCfg.isOpen && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="time"
                                  value={dayCfg.slots?.[0]?.open || '09:00'}
                                  onChange={(e) => {
                                    const slots = [...(dayCfg.slots || [{ open: '09:00', close: '17:00' }])];
                                    slots[0] = { ...slots[0], open: e.target.value };
                                    const updated = {
                                      ...(formData.businessHours?.schedule || {}),
                                      [day]: { ...dayCfg, slots }
                                    };
                                    setFormData({
                                      ...formData,
                                      businessHours: { ...(formData.businessHours || {}), schedule: updated }
                                    });
                                  }}
                                  className="form-input"
                                  style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                                />
                                <span>to</span>
                                <input
                                  type="time"
                                  value={dayCfg.slots?.[0]?.close || '18:00'}
                                  onChange={(e) => {
                                    const slots = [...(dayCfg.slots || [{ open: '09:00', close: '17:00' }])];
                                    slots[0] = { ...slots[0], close: e.target.value };
                                    const updated = {
                                      ...(formData.businessHours?.schedule || {}),
                                      [day]: { ...dayCfg, slots }
                                    };
                                    setFormData({
                                      ...formData,
                                      businessHours: { ...(formData.businessHours || {}), schedule: updated }
                                    });
                                  }}
                                  className="form-input"
                                  style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 6. APPOINTMENT BOOKING */}
                {editorSection === 'booking' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>6. Appointment Booking</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Configure consultation availability, slot durations, and review incoming bookings.
                        </p>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.sectionVisibility?.booking !== false}
                          onChange={(e) => setFormData({
                            ...formData,
                            sectionVisibility: { ...(formData.sectionVisibility || {}), booking: e.target.checked }
                          })}
                        />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Enable Booking</span>
                      </label>
                    </div>

                    {/* Booking Parameters */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Slot Duration</label>
                        <select
                          value={formData.bookingConfig?.slotDurationMinutes || 30}
                          onChange={(e) => setFormData({
                            ...formData,
                            bookingConfig: { ...(formData.bookingConfig || {}), slotDurationMinutes: Number(e.target.value) }
                          })}
                          className="form-input"
                          style={{ width: '100%' }}
                        >
                          <option value={15}>15 Minutes</option>
                          <option value={30}>30 Minutes</option>
                          <option value={45}>45 Minutes</option>
                          <option value={60}>60 Minutes</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Buffer Time Between Slots</label>
                        <select
                          value={formData.bookingConfig?.bufferMinutes || 10}
                          onChange={(e) => setFormData({
                            ...formData,
                            bookingConfig: { ...(formData.bookingConfig || {}), bufferMinutes: Number(e.target.value) }
                          })}
                          className="form-input"
                          style={{ width: '100%' }}
                        >
                          <option value={0}>No Buffer</option>
                          <option value={5}>5 Minutes</option>
                          <option value={10}>10 Minutes</option>
                          <option value={15}>15 Minutes</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Min Notice Window</label>
                        <select
                          value={formData.bookingConfig?.minNoticeHours || 2}
                          onChange={(e) => setFormData({
                            ...formData,
                            bookingConfig: { ...(formData.bookingConfig || {}), minNoticeHours: Number(e.target.value) }
                          })}
                          className="form-input"
                          style={{ width: '100%' }}
                        >
                          <option value={0}>Instant / No Notice</option>
                          <option value={2}>2 Hours</option>
                          <option value={4}>4 Hours</option>
                          <option value={24}>24 Hours</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Confirmation Mode</label>
                        <select
                          value={formData.bookingConfig?.autoConfirm !== false ? 'auto' : 'manual'}
                          onChange={(e) => setFormData({
                            ...formData,
                            bookingConfig: { ...(formData.bookingConfig || {}), autoConfirm: e.target.value === 'auto' }
                          })}
                          className="form-input"
                          style={{ width: '100%' }}
                        >
                          <option value="auto">Auto-Confirm Booking</option>
                          <option value="manual">Manual Approval Required</option>
                        </select>
                      </div>
                    </div>

                    {/* Bookings Review Table */}
                    <div style={{ marginTop: '14px' }}>
                      <h5 style={{ margin: '0 0 10px', fontSize: '0.94rem', fontWeight: 700 }}>
                        Scheduled Appointments ({profileAppointments.length})
                      </h5>

                      {profileAppointments.length === 0 ? (
                        <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--elevated-surface)', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                          No appointments booked yet.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {profileAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              style={{
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--elevated-surface)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '10px'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                                  {apt.customerName} • {apt.referenceCode}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                  📅 {apt.bookingDate} at {apt.startTime} • 📞 {apt.customerPhone}
                                  {apt.serviceName ? ` • 💼 ${apt.serviceName}` : ''}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: apt.status === 'confirmed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: apt.status === 'confirmed' ? '#10B981' : '#F87171'
                                  }}
                                >
                                  {apt.status}
                                </span>

                                {apt.status !== 'confirmed' && (
                                  <button
                                    type="button"
                                    onClick={() => handleAppointmentStatusChange(apt.id, 'confirmed')}
                                    className="btn btn-outline btn-xs"
                                  >
                                    Approve
                                  </button>
                                )}
                                {apt.status !== 'cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => handleAppointmentStatusChange(apt.id, 'cancelled')}
                                    className="btn btn-outline btn-xs"
                                    style={{ color: '#F87171' }}
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. SERVICES SHOWCASE */}
                {editorSection === 'services' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>7. Services Showcase</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Add, edit, reorder, or hide the services you offer.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const next = [...(formData.services || [])];
                          next.push({
                            id: `srv_${Date.now()}`,
                            title: 'New Service Offering',
                            description: 'Service description goes here.',
                            price: '₹1,999',
                            duration: '30 mins',
                            actionType: 'book',
                            visible: true,
                            displayOrder: next.length + 1
                          });
                          setFormData({ ...formData, services: next });
                        }}
                        className="btn btn-primary btn-xs"
                        style={{ gap: '6px' }}
                      >
                        <Plus size={14} />
                        <span>Add Service</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(formData.services || []).map((srv, idx) => (
                        <div
                          key={srv.id || idx}
                          style={{
                            padding: '16px',
                            borderRadius: '14px',
                            backgroundColor: 'var(--elevated-surface)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Service #{idx + 1}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={srv.visible !== false}
                                  onChange={(e) => {
                                    const next = [...(formData.services || [])];
                                    next[idx] = { ...next[idx], visible: e.target.checked };
                                    setFormData({ ...formData, services: next });
                                  }}
                                />
                                <span>Published</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => {
                                  const next = formData.services.filter((_, i) => i !== idx);
                                  setFormData({ ...formData, services: next });
                                }}
                                style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                            <input
                              type="text"
                              value={srv.title || ''}
                              onChange={(e) => {
                                const next = [...(formData.services || [])];
                                next[idx] = { ...next[idx], title: e.target.value };
                                setFormData({ ...formData, services: next });
                              }}
                              placeholder="Service Title"
                              className="form-input"
                            />
                            <input
                              type="text"
                              value={srv.price || ''}
                              onChange={(e) => {
                                const next = [...(formData.services || [])];
                                next[idx] = { ...next[idx], price: e.target.value };
                                setFormData({ ...formData, services: next });
                              }}
                              placeholder="Price (e.g. ₹1,999 or Contact for price)"
                              className="form-input"
                            />
                            <input
                              type="text"
                              value={srv.duration || ''}
                              onChange={(e) => {
                                const next = [...(formData.services || [])];
                                next[idx] = { ...next[idx], duration: e.target.value };
                                setFormData({ ...formData, services: next });
                              }}
                              placeholder="Duration (e.g. 30 mins)"
                              className="form-input"
                            />
                            <select
                              value={srv.actionType || 'book'}
                              onChange={(e) => {
                                const next = [...(formData.services || [])];
                                next[idx] = { ...next[idx], actionType: e.target.value };
                                setFormData({ ...formData, services: next });
                              }}
                              className="form-input"
                            >
                              <option value="book">Action: Book Appointment</option>
                              <option value="contact">Action: WhatsApp / Contact</option>
                            </select>
                          </div>

                          <textarea
                            rows={2}
                            value={srv.description || srv.desc || ''}
                            onChange={(e) => {
                              const next = [...(formData.services || [])];
                              next[idx] = { ...next[idx], description: e.target.value };
                              setFormData({ ...formData, services: next });
                            }}
                            placeholder="Describe what is included in this service..."
                            className="form-input"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. PORTFOLIO GALLERY */}
                {editorSection === 'portfolio' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>8. Portfolio Gallery</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Showcase previous work, designs, and achievements in full-screen lightbox gallery.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const next = [...(formData.portfolio || [])];
                          next.push({
                            id: `port_${Date.now()}`,
                            title: 'New Project Showcase',
                            category: 'Design & Tech',
                            description: '',
                            image: '/assets/cardbg-purple.png',
                            link: ''
                          });
                          setFormData({ ...formData, portfolio: next });
                        }}
                        className="btn btn-primary btn-xs"
                        style={{ gap: '6px' }}
                      >
                        <Plus size={14} />
                        <span>Add Project</span>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                      {(formData.portfolio || []).map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            padding: '14px',
                            borderRadius: '14px',
                            backgroundColor: 'var(--elevated-surface)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ width: '100%', height: '120px', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                            <img
                              src={item.image || '/assets/cardbg-purple.png'}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <label
                              style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '8px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: '#FFFFFF',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Upload size={12} />
                              <span>Replace</span>
                              <input
                                type="file"
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={(e) => handlePortfolioImageUpload(idx, e)}
                              />
                            </label>
                          </div>

                          <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => {
                              const next = [...(formData.portfolio || [])];
                              next[idx] = { ...next[idx], title: e.target.value };
                              setFormData({ ...formData, portfolio: next });
                            }}
                            placeholder="Project Title"
                            className="form-input"
                          />

                          <input
                            type="text"
                            value={item.category || ''}
                            onChange={(e) => {
                              const next = [...(formData.portfolio || [])];
                              next[idx] = { ...next[idx], category: e.target.value };
                              setFormData({ ...formData, portfolio: next });
                            }}
                            placeholder="Category (e.g. Architecture, UI/UX)"
                            className="form-input"
                          />

                          <input
                            type="text"
                            value={item.link || ''}
                            onChange={(e) => {
                              const next = [...(formData.portfolio || [])];
                              next[idx] = { ...next[idx], link: e.target.value };
                              setFormData({ ...formData, portfolio: next });
                            }}
                            placeholder="External Link (Optional)"
                            className="form-input"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const next = formData.portfolio.filter((_, i) => i !== idx);
                              setFormData({ ...formData, portfolio: next });
                            }}
                            style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 9. VIDEOS */}
                {editorSection === 'videos' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>9. Videos Section</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Embed YouTube videos and YouTube Shorts directly on your public profile.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const next = [...(formData.videos || [])];
                          next.push({
                            id: `vid_${Date.now()}`,
                            title: 'Featured Demonstration',
                            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                            description: '',
                            visible: true
                          });
                          setFormData({ ...formData, videos: next });
                        }}
                        className="btn btn-primary btn-xs"
                        style={{ gap: '6px' }}
                      >
                        <Plus size={14} />
                        <span>Add Video</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(formData.videos || []).map((vid, idx) => (
                        <div
                          key={vid.id || idx}
                          style={{
                            padding: '16px',
                            borderRadius: '14px',
                            backgroundColor: 'var(--elevated-surface)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Video #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = formData.videos.filter((_, i) => i !== idx);
                                setFormData({ ...formData, videos: next });
                              }}
                              style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={vid.url || ''}
                            onChange={(e) => {
                              const next = [...(formData.videos || [])];
                              next[idx] = { ...next[idx], url: e.target.value };
                              setFormData({ ...formData, videos: next });
                            }}
                            placeholder="YouTube Video / Shorts URL (e.g. https://youtube.com/watch?v=...)"
                            className="form-input"
                          />

                          <input
                            type="text"
                            value={vid.title || ''}
                            onChange={(e) => {
                              const next = [...(formData.videos || [])];
                              next[idx] = { ...next[idx], title: e.target.value };
                              setFormData({ ...formData, videos: next });
                            }}
                            placeholder="Video Title"
                            className="form-input"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 10. PAYMENTS */}
                {editorSection === 'payments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>10. Payments and UPI</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Allow visitors and clients to pay you via UPI apps and QR code.
                        </p>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.sectionVisibility?.payments !== false}
                          onChange={(e) => setFormData({
                            ...formData,
                            sectionVisibility: { ...(formData.sectionVisibility || {}), payments: e.target.checked }
                          })}
                        />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Show Payments Section</span>
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>UPI ID (VPA) *</label>
                        <input
                          type="text"
                          value={formData.paymentConfig?.upiId || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            paymentConfig: { ...(formData.paymentConfig || {}), upiId: e.target.value.trim() }
                          })}
                          placeholder="e.g. yourname@icici or 9876543210@paytm"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Recipient Name *</label>
                        <input
                          type="text"
                          value={formData.paymentConfig?.recipientName || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            paymentConfig: { ...(formData.paymentConfig || {}), recipientName: e.target.value }
                          })}
                          placeholder="e.g. FLOCARDS Merchant"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Payment Instructions (Optional)</label>
                      <textarea
                        rows={2}
                        value={formData.paymentConfig?.instructions || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          paymentConfig: { ...(formData.paymentConfig || {}), instructions: e.target.value }
                        })}
                        placeholder="e.g. Please add your name in payment remarks. Instant settlement."
                        className="form-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}

                {/* 11. PUBLIC BANK DETAILS */}
                {editorSection === 'bank' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>11. Public Bank Settlement Details</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Protected bank account information for NEFT/RTGS wire transfers.
                        </p>
                      </div>
                    </div>

                    {/* MANDATORY EXPLICIT CONSENT WARNING & CHECKBOX */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '14px',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        border: '1.5px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F87171', fontWeight: 700, fontSize: '0.86rem' }}>
                        <Lock size={16} />
                        <span>Security & Privacy Safeguard</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        Bank account details remain private and hidden by default. You must give explicit consent to publish them on your public profile.
                      </p>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(formData.bankDetails?.isPublic && formData.bankDetails?.enabled)}
                          onChange={(e) => setFormData({
                            ...formData,
                            bankDetails: {
                              ...(formData.bankDetails || {}),
                              isPublic: e.target.checked,
                              enabled: e.target.checked
                            },
                            sectionVisibility: {
                              ...(formData.sectionVisibility || {}),
                              bankDetails: e.target.checked
                            }
                          })}
                        />
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>
                          I explicitly authorize FLOCARDS to publish these bank details publicly on my digital profile.
                        </span>
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Account Holder Name</label>
                        <input
                          type="text"
                          value={formData.bankDetails?.accountHolder || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            bankDetails: { ...(formData.bankDetails || {}), accountHolder: e.target.value }
                          })}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Bank Name</label>
                        <input
                          type="text"
                          value={formData.bankDetails?.bankName || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            bankDetails: { ...(formData.bankDetails || {}), bankName: e.target.value }
                          })}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Branch</label>
                        <input
                          type="text"
                          value={formData.bankDetails?.branch || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            bankDetails: { ...(formData.bankDetails || {}), branch: e.target.value }
                          })}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Account Number</label>
                        <input
                          type="text"
                          value={formData.bankDetails?.accountNumber || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            bankDetails: { ...(formData.bankDetails || {}), accountNumber: e.target.value.replace(/[^0-9]/g, '') }
                          })}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>IFSC Code (e.g. HDFC0000123)</label>
                        <input
                          type="text"
                          value={formData.bankDetails?.ifsc || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            bankDetails: { ...(formData.bankDetails || {}), ifsc: e.target.value.toUpperCase().trim() }
                          })}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 12. QR CODE */}
                {editorSection === 'qr' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>12. Smart QR Code Companion</h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      High-resolution companion QR code pointing to your permanent canonical URL.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div
                        style={{
                          padding: '12px',
                          borderRadius: '16px',
                          backgroundColor: '#FFFFFF',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                        }}
                      >
                        <QrCodePreview slug={formData.slug} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                          Target URL: flocard.in/{formData.slug}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => downloadQrPng(`https://flocard.in/p/${formData.slug}`, `FLOCARD-${formData.slug}`)}
                            className="btn btn-primary btn-sm"
                            style={{ gap: '6px' }}
                          >
                            <Download size={14} />
                            <span>Download PNG (Print Ready)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadQrSvg(`https://flocard.in/p/${formData.slug}`, `FLOCARD-${formData.slug}`)}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: '6px' }}
                          >
                            <Download size={14} />
                            <span>Download Vector SVG</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 13. UPLOAD USAGE */}
                {editorSection === 'usage' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>13. Upload Usage and Storage Quotas</h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Real measured usage of images, videos, and storage on your account.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--elevated-surface)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                          Gallery Images
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                          {storageUsage.galleryCount} / {storageUsage.maxGalleryImages} used
                        </div>
                        <div style={{ width: '100%', height: '6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (storageUsage.galleryCount / storageUsage.maxGalleryImages) * 100)}%`, height: '100%', backgroundColor: 'var(--accent-purple)' }} />
                        </div>
                      </div>

                      <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--elevated-surface)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                          Services
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                          {storageUsage.serviceImageCount} / {storageUsage.maxServiceImages} used
                        </div>
                        <div style={{ width: '100%', height: '6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (storageUsage.serviceImageCount / storageUsage.maxServiceImages) * 100)}%`, height: '100%', backgroundColor: 'var(--accent-purple)' }} />
                        </div>
                      </div>

                      <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--elevated-surface)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                          Total Storage
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                          {storageUsage.totalStorageMb} MB / {storageUsage.maxTotalStorageMb} MB
                        </div>
                        <div style={{ width: '100%', height: '6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ width: `${storageUsage.percentUsed}%`, height: '100%', backgroundColor: storageUsage.isAtStorageCap ? '#EF4444' : '#10B981' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 14. PUBLISHING */}
                {editorSection === 'publishing' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>14. Profile Visibility and Publishing</h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Control live profile publication status and canonical slug.
                    </p>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Unique Profile URL Slug *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>https://flocard.in/</span>
                        <input
                          type="text"
                          value={formData.slug || ''}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                          className="form-input"
                          style={{ maxWidth: '240px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Publication Status</label>
                      <select
                        value={formData.status || 'active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="form-input"
                        style={{ maxWidth: '240px' }}
                      >
                        <option value="active">Active & Published</option>
                        <option value="draft">Draft (Hidden)</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px' }}
              >
                <Save size={14} />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>
        </div>
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

// Subcomponent: Live QR Preview for Section 12
function QrCodePreview({ slug }) {
  const [dataUrl, setDataUrl] = useState('');
  const targetUrl = `https://flocard.in/p/${slug || 'alex'}`;

  useEffect(() => {
    generateQrDataUrl(targetUrl, { width: 150, margin: 2 })
      .then(setDataUrl)
      .catch(() => {});
  }, [targetUrl]);

  if (!dataUrl) {
    return <div style={{ width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading QR...</div>;
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      style={{ width: '130px', height: '130px', display: 'block' }}
    />
  );
}

// Icon helper components
function CameraIcon(props) {
  return <User {...props} />;
}
function BriefcaseIcon(props) {
  return <Briefcase {...props} />;
}
function Briefcase(props) {
  return (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}
