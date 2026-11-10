/* ==========================================================================
   FLOCARDS CENTRAL PROFILE EDITOR MODAL
   Reusable 14-section comprehensive profile editor used across Customer & Admin.
   Includes:
   1. Basic Information
   2. Profile Picture & Logo (drag & zoom crop)
   3. Cover Banner & Appearance (gradient, image, solid color, zoom, position X/Y, overlay)
   4. Contact & Social Links (all social networks + maps URL)
   5. Business Hours (all 7 days open/close/closed)
   6. Appointment Booking (slot duration, days ahead, pricing, approval calendar)
   7. Services Showcase (add, update, delete, badges, images)
   8. Portfolio Gallery (add, delete, categories, links)
   9. Videos (YouTube, Vimeo, MP4 embeds)
   10. Payments & UPI (UPI ID validation, instructions, QR)
   11. Public Bank Details (IFSC validation, visibility toggles)
   12. QR Code Companion (high-res PNG, SVG, vCard)
   13. Upload Usage & Quotas (storage calculation)
   14. Visibility & Publishing (status, opening preference)
   + Live Device Mockup Preview (desktop / mobile frame)
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
import { resolveMapUrl } from '../../lib/constants';
import FullScreenDigitalProfile from './FullScreenDigitalProfile';
import { AVAILABLE_PROFILE_THEMES, getProfileTheme, applyThemeToProfile } from '../../lib/themeService';



export default function ProfileEditorModal({
  profile,
  customer,
  onClose,
  onSave,
  onDelete
}) {
  const { saveProfile } = useData();

  const [editorSection, setEditorSection] = useState('basic');
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [showGoldUpgradeModal, setShowGoldUpgradeModal] = useState(false);

  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [profileAppointments, setProfileAppointments] = useState([]);
  const [appointmentFilter, setAppointmentFilter] = useState('all');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const avatarInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const serviceInputRef = useRef(null);
  const portfolioInputRef = useRef(null);
  const paymentQrInputRef = useRef(null);

  const buildInitialFormData = (p) => {
    if (!p) return {};
    const initialThemeKey = p.theme || (p.edition === 'gold' ? 'gold' : p.edition === 'platinum' || p.edition === 'steel' ? 'platinum' : p.edition === 'metal' ? 'metal' : (p.cardFinish || 'purple'));
    const resolvedTheme = getProfileTheme(initialThemeKey);

    return {
      ...p,
      theme: resolvedTheme.id,
      cardFinish: resolvedTheme.id === 'platinum' ? 'steel' : resolvedTheme.id,
      edition: resolvedTheme.id,
      openingPreference: p.openingPreference || 'full',
      cardColor: p.cardColor || resolvedTheme.accentColor,
      gradientStart: p.gradientStart || resolvedTheme.bannerGradientStart,
      gradientMid: p.gradientMid || resolvedTheme.bannerSolid,
      gradientEnd: p.gradientEnd || resolvedTheme.bannerGradientEnd,
      accentColor: p.accentColor || resolvedTheme.accentColor,
      glowColor: p.glowColor || resolvedTheme.glowColor,
      creamHighlight: p.creamHighlight || '#F5EDE5',
      borderGlowIntensity: p.borderGlowIntensity || 'medium',
      photoShape: p.photoShape || 'circle',
      backgroundTypography: p.backgroundTypography || 'FLOCARD',
      banner: {
        enabled: Boolean(p.banner?.enabled),
        type: p.banner?.type || 'gradient',
        url: p.banner?.url || '',
        height: p.banner?.height || 280,
        zoom: p.banner?.zoom || 100,
        positionX: p.banner?.positionX ?? 50,
        positionY: p.banner?.positionY ?? 45,
        gradientStart: p.banner?.gradientStart || '#2e1065',
        gradientEnd: p.banner?.gradientEnd || '#090514',
        solidColor: p.banner?.solidColor || '#1a0b2e',
        overlayOpacity: p.banner?.overlayOpacity ?? 0.38,
        overlayColor: p.banner?.overlayColor || '#08060D',
        ...(p.banner || {})
      },
      businessHours: {
        ...DEFAULT_BUSINESS_HOURS,
        ...(p.businessHours || {})
      },
      bookingConfig: {
        ...DEFAULT_BOOKING_CONFIG,
        ...(p.bookingConfig || {})
      },
      paymentConfig: {
        enabled: Boolean(p.paymentConfig?.enabled),
        upiId: p.paymentConfig?.upiId || '',
        recipientName: p.paymentConfig?.recipientName || p.name || '',
        qrUrl: p.paymentConfig?.qrUrl || '',
        instructions: p.paymentConfig?.instructions || 'Scan with any UPI app to pay securely.',
        ...(p.paymentConfig || {})
      },
      bankDetails: {
        enabled: Boolean(p.bankDetails?.enabled),
        isPublic: Boolean(p.bankDetails?.isPublic),
        accountHolder: p.bankDetails?.accountHolder || p.name || p.company || '',
        bankName: p.bankDetails?.bankName || '',
        branch: p.bankDetails?.branch || '',
        accountNumber: p.bankDetails?.accountNumber || '',
        ifsc: p.bankDetails?.ifsc || '',
        visibleFields: {
          accountHolder: true,
          bankName: true,
          branch: true,
          accountNumber: true,
          ifsc: true,
          ...(p.bankDetails?.visibleFields || {})
        },
        ...(p.bankDetails || {})
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
        ...(p.sectionVisibility || {})
      },
      services: Array.isArray(p.services) ? [...p.services] : [],
      portfolio: Array.isArray(p.portfolio) ? [...p.portfolio] : [],
      videos: Array.isArray(p.videos) ? [...p.videos] : [],
      whatsapp: p.whatsapp || p.socialLinks?.whatsapp || '',
      linkedin: p.linkedin || p.socialLinks?.linkedin || '',
      instagram: p.instagram || p.socialLinks?.instagram || '',
      twitter: p.twitter || p.socialLinks?.twitter || '',
      github: p.github || p.socialLinks?.github || '',
      youtube: p.youtube || p.socialLinks?.youtube || '',
      customLinks: Array.isArray(p.customLinks) ? [...p.customLinks] : []
    };
  };

  const [formData, setFormData] = useState(() => buildInitialFormData(profile));

  useEffect(() => {
    if (profile) {
      setFormData(buildInitialFormData(profile));
      setEditorSection('basic');
      setUploadError('');
      setSaveSuccess(false);
    }
  }, [profile?.id]);

  const storageUsage = useMemo(() => {
    return calculateProfileUsage(formData);
  }, [formData]);

  useEffect(() => {
    if (formData?.slug) {
      getAppointments(formData.slug)
        .then(setProfileAppointments)
        .catch(() => {});
    }
  }, [formData?.slug]);

  // Drag state for Profile Picture (Avatar)
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const avatarDragStartRef = useRef({ x: 0, y: 0, initialPosX: 50, initialPosY: 50 });

  const handleAvatarDragStart = (e) => {
    setIsDraggingAvatar(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    avatarDragStartRef.current = {
      x: clientX,
      y: clientY,
      initialPosX: typeof formData.avatarPosX === 'number' ? formData.avatarPosX : 50,
      initialPosY: typeof formData.avatarPosY === 'number' ? formData.avatarPosY : 50
    };
  };

  const handleAvatarDragMove = (e) => {
    if (!isDraggingAvatar) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - avatarDragStartRef.current.x;
    const deltaY = clientY - avatarDragStartRef.current.y;
    const nextPosX = Math.max(0, Math.min(100, Math.round(avatarDragStartRef.current.initialPosX - deltaX * 0.4)));
    const nextPosY = Math.max(0, Math.min(100, Math.round(avatarDragStartRef.current.initialPosY - deltaY * 0.4)));
    setFormData(prev => ({ ...prev, avatarPosX: nextPosX, avatarPosY: nextPosY }));
  };

  const handleAvatarDragEnd = () => {
    setIsDraggingAvatar(false);
  };

  // Drag state for Banner
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const bannerDragStartRef = useRef({ x: 0, y: 0, initialPosX: 50, initialPosY: 50 });

  const handleBannerDragStart = (e) => {
    setIsDraggingBanner(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    bannerDragStartRef.current = {
      x: clientX,
      y: clientY,
      initialPosX: typeof formData.banner?.positionX === 'number' ? formData.banner.positionX : 50,
      initialPosY: typeof formData.banner?.positionY === 'number' ? formData.banner.positionY : 50
    };
  };

  const handleBannerDragMove = (e) => {
    if (!isDraggingBanner) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - bannerDragStartRef.current.x;
    const deltaY = clientY - bannerDragStartRef.current.y;
    const nextPosX = Math.max(0, Math.min(100, Math.round(bannerDragStartRef.current.initialPosX - deltaX * 0.3)));
    const nextPosY = Math.max(0, Math.min(100, Math.round(bannerDragStartRef.current.initialPosY - deltaY * 0.3)));
    setFormData(prev => ({
      ...prev,
      banner: { ...(prev.banner || {}), positionX: nextPosX, positionY: nextPosY }
    }));
  };

  const handleBannerDragEnd = () => {
    setIsDraggingBanner(false);
  };

  // Upload Avatar with Validation
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    if (!file.type.startsWith('image/')) {
      setUploadError('Invalid file type: Please select an image file (PNG, JPG, WebP, SVG).');
      if (e.target) e.target.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed profile picture size is 8MB.`);
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImage(file, 'avatar', customer?.id || 'anon', formData);
      setFormData(prev => ({
        ...prev,
        avatar: url,
        avatarSizeBytes: file.size,
        avatarZoom: 100,
        avatarPosX: 50,
        avatarPosY: 50
      }));
    } catch (err) {
      setUploadError(err.message || 'Avatar upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Upload Business Logo with Validation
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    if (!file.type.startsWith('image/')) {
      setUploadError('Invalid file type: Please select an image file (PNG, JPG, WebP, SVG).');
      if (e.target) e.target.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed logo size is 8MB.`);
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImage(file, 'logo', customer?.id || 'anon', formData);
      setFormData(prev => ({
        ...prev,
        logo: url,
        logoSizeBytes: file.size
      }));
    } catch (err) {
      setUploadError(err.message || 'Logo upload failed.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Upload Banner with Validation
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    const isVideo = file.type?.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name || '');
    const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name || '');

    if (!isVideo && !isImage) {
      setUploadError('Invalid format: Please upload an image (PNG, JPG, WebP) or video (MP4, WebM).');
      if (e.target) e.target.value = '';
      return;
    }

    const maxSize = isVideo ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is ${isVideo ? '25MB for video' : '10MB for image'}.`);
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImage(file, 'banner', customer?.id || 'anon', formData);
      setFormData(prev => ({
        ...prev,
        banner: {
          ...(prev.banner || {}),
          url,
          enabled: true,
          type: isVideo ? 'video' : 'image',
          sizeBytes: file.size,
          positionX: 50,
          positionY: 50,
          zoom: 100
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


  // Save profile changes
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.slug || isSavingProfile) return;

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

    setIsSavingProfile(true);
    try {
      const saved = await saveProfile(formData);
      if (onSave) onSave(saved);

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onClose) onClose();
      }, 1200);
    } finally {
      setIsSavingProfile(false);
    }
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

  // Simplified and intuitive editor sections
  const SECTIONS = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'avatar', label: 'Photo & Logo', icon: CameraIcon },
    { id: 'contact', label: 'Contact & Socials', icon: Phone },
    { id: 'theme', label: 'Theme & Finish', icon: Palette },
    { id: 'banner', label: 'Cover Banner', icon: ImageIcon },
    { id: 'services', label: 'Services Showcase', icon: Layers },
    { id: 'portfolio', label: 'Portfolio Gallery', icon: BriefcaseIcon },
    { id: 'hours', label: 'Business Hours', icon: Clock },
    { id: 'booking', label: 'Bookings & Slots', icon: Calendar },
    { id: 'payments', label: 'Payments & UPI', icon: CreditCard },
    { id: 'qr', label: 'QR Code Companion', icon: QrCode },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'publishing', label: 'Visibility', icon: Globe }
  ];



  if (!profile) return null;

  return (
    <>
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
            padding: isMobile ? '8px' : '16px',
            boxSizing: 'border-box'
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '980px',
              width: '100%',
              backgroundColor: 'var(--card-surface)',
              borderRadius: isMobile ? '16px' : '24px',
              border: '1.5px solid var(--border-highlight)',
              maxHeight: isMobile ? '98vh' : '94vh',
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
                padding: isMobile ? '14px 16px' : '20px 24px',
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
                  onClick={() => (onClose || (() => {}))()}
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
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, overflow: 'hidden' }}>
              {/* Left Nav List */}
              <div
                style={{
                  width: isMobile ? '100%' : '260px',
                  backgroundColor: 'var(--elevated-surface, #130B22)',
                  borderRight: isMobile ? 'none' : '1px solid var(--border-color)',
                  borderBottom: isMobile ? '1px solid var(--border-color)' : 'none',
                  padding: isMobile ? '8px 10px' : '16px 12px',
                  overflowX: isMobile ? 'auto' : 'hidden',
                  overflowY: isMobile ? 'hidden' : 'auto',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: isMobile ? 'row' : 'column',
                  gap: isMobile ? '6px' : '4px',
                  WebkitOverflowScrolling: 'touch'
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
                      <Icon size={isMobile ? 14 : 15} style={{ flexShrink: 0 }} />
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
                  padding: isMobile ? '16px 12px' : '24px',
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
                          placeholder="e.g. Bengaluru, India"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Office / Street Address (Optional)</label>
                        <input
                          type="text"
                          value={formData.address || ''}
                          onChange={e => setFormData({ ...formData, address: e.target.value })}
                          placeholder="e.g. Archierio Experience Center, HSR Layout"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Google Maps Location URL (Optional)</label>
                          {resolveMapUrl(formData) && (
                            <a
                              href={resolveMapUrl(formData)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '0.74rem', color: 'var(--accent-purple)', fontWeight: 700, textDecoration: 'none' }}
                            >
                              Test Map Link ↗
                            </a>
                          )}
                        </div>
                        <input
                          type="url"
                          value={formData.mapsUrl || ''}
                          onChange={e => setFormData({ ...formData, mapsUrl: e.target.value })}
                          placeholder="https://maps.google.com/..."
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          When visitors click your location on your card or profile, they will open this map link directly.
                        </div>
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

                {/* 2. PROFILE PICTURE & BUSINESS LOGO */}
                {editorSection === 'avatar' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>2. Profile Picture &amp; Business Logo</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Click &amp; drag photo inside the preview box to crop &amp; position. Adjust zoom with the slider below.
                        </p>
                      </div>
                      {formData.avatar && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, avatar: '', avatarZoom: 100, avatarPosX: 50, avatarPosY: 50 }))}
                          className="btn btn-sm"
                          style={{ color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)', gap: '6px' }}
                        >
                          <Trash2 size={13} />
                          <span>Remove Photo</span>
                        </button>
                      )}
                    </div>

                    {/* Interactive Draggable Avatar Preview & Controls Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      {/* Avatar Drag Box */}
                      <div
                        onMouseDown={handleAvatarDragStart}
                        onMouseMove={handleAvatarDragMove}
                        onMouseUp={handleAvatarDragEnd}
                        onMouseLeave={handleAvatarDragEnd}
                        onTouchStart={handleAvatarDragStart}
                        onTouchMove={handleAvatarDragMove}
                        onTouchEnd={handleAvatarDragEnd}
                        style={{
                          width: '160px',
                          height: '160px',
                          borderRadius: formData.photoShape === 'rounded_rect' ? '32px' : '50%',
                          position: 'relative',
                          overflow: 'hidden',
                          border: '3px solid var(--accent-purple)',
                          boxShadow: '0 8px 24px rgba(107, 0, 255, 0.25)',
                          cursor: isDraggingAvatar ? 'grabbing' : 'grab',
                          userSelect: 'none',
                          flexShrink: 0,
                          backgroundColor: '#130d24'
                        }}
                      >
                        {formData.avatar ? (
                          <img
                            src={formData.avatar}
                            alt="Avatar Preview"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: `${formData.avatarPosX ?? 50}% ${formData.avatarPosY ?? 50}%`,
                              transform: `scale(${(formData.avatarZoom || 100) / 100})`,
                              transformOrigin: `${formData.avatarPosX ?? 50}% ${formData.avatarPosY ?? 50}%`,
                              pointerEvents: 'none',
                              userSelect: 'none',
                              transition: isDraggingAvatar ? 'none' : 'transform 0.15s ease, object-position 0.15s ease'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              color: 'var(--text-muted)',
                              padding: '12px',
                              textAlign: 'center'
                            }}
                          >
                            <CameraIcon size={32} style={{ opacity: 0.4 }} />
                            <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>No photo uploaded</span>
                          </div>
                        )}
                        {/* Interactive Pill */}
                        {formData.avatar && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'rgba(0, 0, 0, 0.72)',
                              backdropFilter: 'blur(6px)',
                              color: '#FFFFFF',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: '9999px',
                              whiteSpace: 'nowrap',
                              pointerEvents: 'none',
                              letterSpacing: '0.02em'
                            }}
                          >
                            {isDraggingAvatar ? 'Dragging...' : '✋ Drag image'}
                          </div>
                        )}
                      </div>

                      {/* Upload and Reset Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                            <span>{isUploading ? 'Uploading...' : (formData.avatar ? 'Change Photo' : 'Upload Personal Photo')}</span>
                          </button>
                          {formData.avatar && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, avatarZoom: 100, avatarPosX: 50, avatarPosY: 50 }))}
                              className="btn btn-outline btn-sm"
                              style={{ gap: '6px' }}
                            >
                              <RefreshCw size={13} />
                              <span>Reset Crop</span>
                            </button>
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Personal portrait / avatar. Formats: JPG, PNG, WebP, SVG. Max file size: 8MB.
                        </span>

                        {/* Shape Toggle */}
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                            Avatar Frame Shape
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                              { id: 'circle', label: 'Circular (Classic)' },
                              { id: 'rounded_rect', label: 'Rounded Square (Modern)' }
                            ].map(shape => (
                              <button
                                key={shape.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, photoShape: shape.id })}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  border: formData.photoShape === shape.id ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                                  backgroundColor: formData.photoShape === shape.id ? 'var(--primary-purple)' : 'transparent',
                                  color: formData.photoShape === shape.id ? '#FFFFFF' : 'var(--text-secondary)',
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
                      </div>
                    </div>

                    {/* Sliders for Zoom, Horizontal X, Vertical Y (Only active when avatar exists) */}
                    {formData.avatar && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: 'rgba(255, 255, 255, 0.02)', padding: isMobile ? '8px' : '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span>Zoom / Scale</span>
                            <span style={{ color: 'var(--accent-purple)' }}>{formData.avatarZoom || 100}%</span>
                          </label>
                          <input
                            type="range"
                            min="60"
                            max="200"
                            step="1"
                            value={formData.avatarZoom || 100}
                            onChange={(e) => setFormData(prev => ({ ...prev, avatarZoom: Number(e.target.value) }))}
                            style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span>Horizontal Position (X)</span>
                            <span style={{ color: 'var(--accent-purple)' }}>{formData.avatarPosX ?? 50}%</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.avatarPosX ?? 50}
                            onChange={(e) => setFormData(prev => ({ ...prev, avatarPosX: Number(e.target.value) }))}
                            style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span>Vertical Position (Y)</span>
                            <span style={{ color: 'var(--accent-purple)' }}>{formData.avatarPosY ?? 50}%</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.avatarPosY ?? 50}
                            onChange={(e) => setFormData(prev => ({ ...prev, avatarPosY: Number(e.target.value) }))}
                            style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Business / Company Logo Subsection */}
                    <div style={{ marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <h5 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800 }}>Business / Company Logo</h5>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Transparent brand logo shown across your digital profiles and cards. If you don't have a logo, leave this empty — no placeholder or default icon will ever be displayed.
                          </p>
                        </div>
                        {formData.logo && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                            className="btn btn-sm"
                            style={{ color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)', gap: '6px' }}
                          >
                            <Trash2 size={13} />
                            <span>Remove Logo</span>
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.02)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                        {/* Logo Preview with transparent checkerboard */}
                        <div
                          style={{
                            width: '180px',
                            height: '100px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px',
                            backgroundColor: '#1E172E',
                            backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)',
                            backgroundSize: '16px 16px',
                            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                            flexShrink: 0
                          }}
                        >
                          {formData.logo ? (
                            <img
                              src={formData.logo}
                              alt="Company Logo Preview"
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>
                              No logo uploaded
                            </span>
                          )}
                        </div>

                        {/* Logo Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '200px' }}>
                          <input
                            type="file"
                            ref={logoInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => logoInputRef.current?.click()}
                              className="btn btn-primary btn-sm"
                              style={{ gap: '6px' }}
                            >
                              <Upload size={14} />
                              <span>{isUploading ? 'Uploading...' : (formData.logo ? 'Replace Logo' : 'Upload Business Logo')}</span>
                            </button>
                            {formData.logo && (
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                                className="btn btn-outline btn-sm"
                                style={{ gap: '6px' }}
                              >
                                <Trash2 size={13} />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Supports PNG (transparent recommended), SVG, WebP, JPG. Max 8MB.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section Quick Save Bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => (onClose || (() => {}))()}
                        className="btn btn-outline btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="btn btn-primary btn-sm"
                        style={{ gap: '6px' }}
                      >
                        {saveSuccess ? <Check size={14} /> : <Save size={14} />}
                        <span>{saveSuccess ? 'Saved successfully!' : 'Save Profile Picture'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. PROFILE THEME & CARD FINISH */}
                {editorSection === 'theme' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>3. Digital Profile Theme &amp; Card Finish</h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Select the luxury theme preset for your digital profile card and public identity page. Choosing an edition instantly synchronizes the champagne gold, platinum, or signature ultraviolet accents across your buttons, badges, avatar glows, and backgrounds.
                      </p>
                    </div>

                    {/* Active Theme Highlight Banner */}
                    {(() => {
                      const curTheme = getProfileTheme(formData.theme || formData.cardFinish || formData.edition);
                      return (
                        <div
                          style={{
                            padding: '16px 20px',
                            borderRadius: '16px',
                            background: `linear-gradient(135deg, ${curTheme.cardBg} 0%, #15111E 100%)`,
                            border: `1.5px solid ${curTheme.borderColor || curTheme.accentColor}`,
                            boxShadow: `0 8px 30px ${curTheme.glowColor}25`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '14px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: curTheme.swatchGradient,
                                border: `1px solid ${curTheme.accentColor}60`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: curTheme.buttonText,
                                boxShadow: `0 4px 14px ${curTheme.glowColor}50`
                              }}
                            >
                              <Sparkles size={20} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>{curTheme.name}</span>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    backgroundColor: `${curTheme.accentColor}25`,
                                    color: curTheme.accentColor,
                                    border: `1px solid ${curTheme.accentColor}40`
                                  }}
                                >
                                  {curTheme.badge}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {curTheme.subtitle} • {curTheme.description}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPreviewProfile(formData)}
                            className="btn btn-sm"
                            style={{
                              backgroundColor: curTheme.accentColor,
                              color: curTheme.buttonText,
                              border: 'none',
                              fontWeight: 700,
                              gap: '6px'
                            }}
                          >
                            <Eye size={14} />
                            <span>Preview Theme</span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Theme Presets Grid */}
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '10px', color: 'var(--text-primary)' }}>
                        Available Card Edition Themes:
                      </label>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: '14px'
                        }}
                      >
                        {AVAILABLE_PROFILE_THEMES.map((theme) => {
                          const isSelected = (formData.theme || formData.cardFinish || formData.edition) === theme.id ||
                            (theme.id === 'platinum' && (formData.theme === 'steel' || formData.cardFinish === 'steel'));

                          const isGoldTier = Boolean(formData.isGoldUnlocked || formData.isPremium);
                          const isLocked = theme.isPremium && !isGoldTier;

                          return (
                            <div
                              key={theme.id}
                              onClick={() => {
                                if (isLocked) {
                                  setShowGoldUpgradeModal(true);
                                  return;
                                }
                                setFormData(prev => applyThemeToProfile(prev, theme.id));
                              }}
                              style={{
                                padding: '16px',
                                borderRadius: '16px',
                                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                border: isSelected
                                  ? `2px solid ${theme.accentColor}`
                                  : isLocked
                                    ? '1px dashed rgba(233, 199, 102, 0.4)'
                                    : '1px solid var(--border-color)',
                                boxShadow: isSelected
                                  ? `0 10px 30px ${theme.glowColor}35, 0 0 16px ${theme.accentColor}25`
                                  : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.18s ease',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                              }}
                            >
                              {/* Swatch & Selection Indicator */}
                              <div
                                style={{
                                  height: '42px',
                                  borderRadius: '10px',
                                  background: theme.swatchGradient,
                                  position: 'relative',
                                  overflow: 'hidden',
                                  border: `1px solid ${theme.accentColor}40`,
                                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2)`
                                }}
                              >
                                {isSelected && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: '6px',
                                      right: '6px',
                                      width: '22px',
                                      height: '22px',
                                      borderRadius: '50%',
                                      backgroundColor: theme.accentColor,
                                      color: theme.buttonText,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                                    }}
                                  >
                                    <Check size={13} strokeWidth={3} />
                                  </div>
                                )}
                                {isLocked && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: '6px',
                                      left: '8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      backgroundColor: 'rgba(0,0,0,0.75)',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      color: '#E9C766',
                                      fontSize: '0.65rem',
                                      fontWeight: 800,
                                      backdropFilter: 'blur(4px)'
                                    }}
                                  >
                                    <span>👑 PRO UPGRADE</span>
                                  </div>
                                )}
                              </div>

                              {/* Title & Badge */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.94rem', color: isSelected ? theme.accentColor : '#FFFFFF' }}>
                                  {theme.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    backgroundColor: isLocked ? 'rgba(233, 199, 102, 0.15)' : `${theme.accentColor}20`,
                                    color: isLocked ? '#E9C766' : theme.accentColor,
                                    border: isLocked ? '1px solid rgba(233, 199, 102, 0.3)' : 'none'
                                  }}
                                >
                                  {isLocked ? '₹1,999 PRO' : theme.badge}
                                </span>
                              </div>

                              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                                {theme.description}
                              </p>

                              {/* Palette Swatches */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: theme.accentColor, display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }} />
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Accent</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: theme.glowColor, display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }} />
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Glow</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: theme.cardBg, display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }} />
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Canvas</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Fine-Tuning & Custom Accents */}
                    <div
                      style={{
                        padding: '18px 20px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h5 style={{ margin: '0 0 3px', fontSize: '0.92rem', fontWeight: 800 }}>Custom Palette &amp; Glow Fine-Tuning</h5>
                          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            Override the theme preset colors or adjust border glow intensity.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const cur = getProfileTheme(formData.theme);
                            setFormData(prev => ({
                              ...prev,
                              accentColor: cur.accentColor,
                              glowColor: cur.glowColor
                            }));
                          }}
                          className="btn btn-sm"
                          style={{ fontSize: '0.74rem', gap: '5px' }}
                        >
                          <RefreshCw size={12} />
                          <span>Reset to Theme Defaults</span>
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Primary Accent Color</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="color"
                              value={formData.accentColor || '#A855F7'}
                              onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                              style={{ width: '38px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', background: 'none', padding: '2px' }}
                            />
                            <input
                              type="text"
                              value={formData.accentColor || '#A855F7'}
                              onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                              className="form-input"
                              style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.84rem' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Glow &amp; Radiance Color</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="color"
                              value={formData.glowColor || '#6B00FF'}
                              onChange={e => setFormData({ ...formData, glowColor: e.target.value })}
                              style={{ width: '38px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', background: 'none', padding: '2px' }}
                            />
                            <input
                              type="text"
                              value={formData.glowColor || '#6B00FF'}
                              onChange={e => setFormData({ ...formData, glowColor: e.target.value })}
                              className="form-input"
                              style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.84rem' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Border Glow Intensity</label>
                          <select
                            value={formData.borderGlowIntensity || 'medium'}
                            onChange={e => setFormData({ ...formData, borderGlowIntensity: e.target.value })}
                            className="form-input"
                            style={{ width: '100%', height: '38px' }}
                          >
                            <option value="subtle">Subtle Minimal</option>
                            <option value="medium">Medium Standard</option>
                            <option value="high">High Luminous Foil</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Photo Silhouette Shape</label>
                          <select
                            value={formData.photoShape || 'circle'}
                            onChange={e => setFormData({ ...formData, photoShape: e.target.value })}
                            className="form-input"
                            style={{ width: '100%', height: '38px' }}
                          >
                            <option value="circle">Circular (Classic)</option>
                            <option value="rounded_rect">Rounded Square (Modern)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. BANNER AND APPEARANCE */}
                {editorSection === 'banner' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>4. Cover Banner &amp; Appearance</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Customizable top banner. Drag the image inside the preview box to position horizontal and vertical alignment.
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Banner Visibility Toggle */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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

                        {formData.banner?.url && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              banner: { ...(prev.banner || {}), url: '', enabled: false }
                            }))}
                            className="btn btn-sm"
                            style={{ color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)', gap: '6px' }}
                          >
                            <Trash2 size={13} />
                            <span>Remove Banner</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Interactive Draggable Live Banner Preview */}
                    <div
                      onMouseDown={handleBannerDragStart}
                      onMouseMove={handleBannerDragMove}
                      onMouseUp={handleBannerDragEnd}
                      onMouseLeave={handleBannerDragEnd}
                      onTouchStart={handleBannerDragStart}
                      onTouchMove={handleBannerDragMove}
                      onTouchEnd={handleBannerDragEnd}
                      style={{
                        width: '100%',
                        height: `${formData.banner?.height || 220}px`,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        backgroundColor: formData.banner?.solidColor || '#1a0b2e',
                        cursor: (formData.banner?.type === 'image' || !formData.banner?.type || formData.banner?.type === 'video') ? (isDraggingBanner ? 'grabbing' : 'grab') : 'default',
                        userSelect: 'none',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.35)'
                      }}
                    >
                      {/* Image Banner */}
                      {(formData.banner?.type === 'image' || !formData.banner?.type) && (
                        formData.banner?.url ? (
                          <img
                            src={formData.banner.url}
                            alt="Banner Preview"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: `${formData.banner?.positionX ?? 50}% ${formData.banner?.positionY ?? 50}%`,
                              transform: `scale(${(formData.banner?.zoom || 100) / 100})`,
                              transformOrigin: `${formData.banner?.positionX ?? 50}% ${formData.banner?.positionY ?? 50}%`,
                              pointerEvents: 'none',
                              userSelect: 'none',
                              transition: isDraggingBanner ? 'none' : 'transform 0.15s ease, object-position 0.15s ease'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              background: `linear-gradient(135deg, ${formData.banner?.gradientStart || '#2e1065'} 0%, ${formData.banner?.gradientEnd || '#090514'} 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'rgba(255, 255, 255, 0.6)',
                              fontSize: '0.85rem'
                            }}
                          >
                            <span>No banner image uploaded (Theme gradient active)</span>
                          </div>
                        )
                      )}

                      {/* Video Banner */}
                      {formData.banner?.type === 'video' && formData.banner?.url && (
                        <video
                          src={formData.banner.url}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: `${formData.banner?.positionX ?? 50}% ${formData.banner?.positionY ?? 50}%`,
                            transform: `scale(${(formData.banner?.zoom || 100) / 100})`,
                            pointerEvents: 'none'
                          }}
                        />
                      )}

                      {/* Gradient Banner */}
                      {formData.banner?.type === 'gradient' && (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            background: `linear-gradient(135deg, ${formData.banner?.gradientStart || '#2e1065'}, ${formData.banner?.gradientEnd || '#090514'})`
                          }}
                        />
                      )}

                      {/* Dark Gradient Overlay for readability */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: `linear-gradient(to bottom, transparent 35%, rgba(8,6,13,${formData.banner?.overlayOpacity ?? 0.4}) 100%)`,
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Drag Hint Overlay Tag */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(0, 0, 0, 0.72)',
                          backdropFilter: 'blur(6px)',
                          color: '#FFFFFF',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          pointerEvents: 'none',
                          letterSpacing: '0.02em'
                        }}
                      >
                        {isDraggingBanner ? 'Dragging...' : '✋ Click & drag to reposition'}
                      </div>
                    </div>

                    {/* Banner Style Type Tabs */}
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
                              border: (formData.banner?.type || 'image') === t.id ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                              backgroundColor: (formData.banner?.type || 'image') === t.id ? 'var(--primary-purple)' : 'transparent',
                              color: (formData.banner?.type || 'image') === t.id ? '#FFFFFF' : 'var(--text-secondary)',
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

                    {/* Upload Image/Video Actions */}
                    {(formData.banner?.type === 'image' || !formData.banner?.type || formData.banner?.type === 'video') && (
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
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            banner: { ...(prev.banner || {}), positionX: 50, positionY: 50, zoom: 100 }
                          }))}
                          className="btn btn-outline btn-sm"
                          style={{ gap: '6px' }}
                        >
                          <RefreshCw size={13} />
                          <span>Reset Alignment</span>
                        </button>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Aspect Ratio ~3:1 (e.g. 1500x500px). Max 10MB (Image) or 25MB (Video).
                        </span>
                      </div>
                    )}

                    {/* Gradient color controls if gradient selected */}
                    {formData.banner?.type === 'gradient' && (
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Gradient Start Color</label>
                          <input
                            type="color"
                            value={formData.banner?.gradientStart || '#2e1065'}
                            onChange={(e) => setFormData({
                              ...formData,
                              banner: { ...(formData.banner || {}), gradientStart: e.target.value }
                            })}
                            style={{ width: '60px', height: '36px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Gradient End Color</label>
                          <input
                            type="color"
                            value={formData.banner?.gradientEnd || '#090514'}
                            onChange={(e) => setFormData({
                              ...formData,
                              banner: { ...(formData.banner || {}), gradientEnd: e.target.value }
                            })}
                            style={{ width: '60px', height: '36px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Solid color control if solid color selected */}
                    {formData.banner?.type === 'color' && (
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Solid Background Color</label>
                        <input
                          type="color"
                          value={formData.banner?.solidColor || '#1a0b2e'}
                          onChange={(e) => setFormData({
                            ...formData,
                            banner: { ...(formData.banner || {}), solidColor: e.target.value }
                          })}
                          style={{ width: '60px', height: '36px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                        />
                      </div>
                    )}

                    {/* Sliders: Zoom, Horizontal X, Vertical Y, Height, Darkness */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: 'rgba(255, 255, 255, 0.02)', padding: isMobile ? '8px' : '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>Zoom</span>
                          <span style={{ color: 'var(--accent-purple)' }}>{formData.banner?.zoom || 100}%</span>
                        </label>
                        <input
                          type="range"
                          min="60"
                          max="200"
                          value={formData.banner?.zoom || 100}
                          onChange={(e) => setFormData({
                            ...formData,
                            banner: { ...(formData.banner || {}), zoom: Number(e.target.value) }
                          })}
                          style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>Horizontal Position (X)</span>
                          <span style={{ color: 'var(--accent-purple)' }}>{formData.banner?.positionX ?? 50}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formData.banner?.positionX ?? 50}
                          onChange={(e) => setFormData({
                            ...formData,
                            banner: { ...(formData.banner || {}), positionX: Number(e.target.value) }
                          })}
                          style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>Vertical Position (Y)</span>
                          <span style={{ color: 'var(--accent-purple)' }}>{formData.banner?.positionY ?? 50}%</span>
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
                          style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>Banner Height</span>
                          <span style={{ color: 'var(--accent-purple)' }}>{formData.banner?.height || 220}px</span>
                        </label>
                        <input
                          type="range"
                          min="140"
                          max="320"
                          value={formData.banner?.height || 220}
                          onChange={(e) => setFormData({
                            ...formData,
                            banner: { ...(formData.banner || {}), height: Number(e.target.value) }
                          })}
                          style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>Overlay Darkness</span>
                          <span style={{ color: 'var(--accent-purple)' }}>{Math.round((formData.banner?.overlayOpacity ?? 0.38) * 100)}%</span>
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
                          style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                        />
                      </div>
                    </div>

                    {/* Section Quick Save Bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => (onClose || (() => {}))()}
                        className="btn btn-outline btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="btn btn-primary btn-sm"
                        style={{ gap: '6px' }}
                      >
                        {saveSuccess ? <Check size={14} /> : <Save size={14} />}
                        <span>{saveSuccess ? 'Saved successfully!' : 'Save Banner'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. CONTACT AND SOCIAL LINKS */}
                {editorSection === 'contact' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>5. Contact and Social Links</h4>
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
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Office / Street Address (Optional)</label>
                        <input
                          type="text"
                          value={formData.address || ''}
                          onChange={e => setFormData({ ...formData, address: e.target.value })}
                          placeholder="e.g. Archierio Center, HSR Layout"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Google Maps Location URL (Optional)</label>
                          {resolveMapUrl(formData) && (
                            <a
                              href={resolveMapUrl(formData)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '0.74rem', color: 'var(--accent-purple)', fontWeight: 700, textDecoration: 'none' }}
                            >
                              Test Map Link ↗
                            </a>
                          )}
                        </div>
                        <input
                          type="url"
                          value={formData.mapsUrl || ''}
                          onChange={e => setFormData({ ...formData, mapsUrl: e.target.value })}
                          placeholder="https://maps.google.com/..."
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
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>6. Business Hours</h4>
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
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>7. Appointment Booking</h4>
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
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>8. Services Showcase</h4>
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
                            padding: isMobile ? '8px' : '16px',
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
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>9. Portfolio Gallery</h4>
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
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>10. Videos Section</h4>
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
                            padding: isMobile ? '8px' : '16px',
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

                {/* 11. PAYMENTS */}
                {editorSection === 'payments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>11. Payments and UPI</h4>
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

                {/* 12. PUBLIC BANK DETAILS */}
                {editorSection === 'bank' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>12. Public Bank Settlement Details</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Protected bank account information for NEFT/RTGS wire transfers.
                        </p>
                      </div>
                    </div>

                    {/* MANDATORY EXPLICIT CONSENT WARNING & CHECKBOX */}
                    <div
                      style={{
                        padding: isMobile ? '8px' : '16px',
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

                {/* 13. QR CODE */}
                {editorSection === 'qr' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>13. Smart QR Code Companion</h4>
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

                {/* 14. UPLOAD USAGE */}
                {editorSection === 'usage' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>14. Upload Usage and Storage Quotas</h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Real measured usage of images, videos, and storage on your account.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      <div style={{ padding: isMobile ? '8px' : '16px', borderRadius: '14px', backgroundColor: 'var(--elevated-surface)', border: '1px solid var(--border-color)' }}>
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

                      <div style={{ padding: isMobile ? '8px' : '16px', borderRadius: '14px', backgroundColor: 'var(--elevated-surface)', border: '1px solid var(--border-color)' }}>
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

                      <div style={{ padding: isMobile ? '8px' : '16px', borderRadius: '14px', backgroundColor: 'var(--elevated-surface)', border: '1px solid var(--border-color)' }}>
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

                {/* 15. PUBLISHING */}
                {editorSection === 'publishing' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>15. Profile Visibility and Publishing</h4>
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
                onClick={() => (onClose || (() => {}))()}
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
              height: '100%',
              minHeight: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: '#08060D',
              position: 'relative'
            }}
          >
            <div
              style={{
                width: previewDevice === 'mobile' ? 'min(100%, 420px)' : '100%',
                maxWidth: previewDevice === 'mobile' ? 'min(100%, 420px)' : '100%',
                margin: previewDevice === 'mobile' ? '16px auto 40px' : '0 auto',
                borderRadius: previewDevice === 'mobile' ? '24px' : 0,
                border: previewDevice === 'mobile' ? '3px solid rgba(255,255,255,0.15)' : 'none',
                boxShadow: previewDevice === 'mobile' ? '0 20px 60px rgba(0,0,0,0.8)' : 'none',
                minHeight: '100%'
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

      {/* Luxury 24K Gold Edition Paywall Modal */}
      {showGoldUpgradeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 3, 10, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 3500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#0C0B0A',
              border: '2px solid rgba(233, 199, 102, 0.45)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(201, 151, 44, 0.25)',
              color: '#FFFFFF',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #E9C766 0%, #C9972C 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0C0B0A',
                  fontSize: '1.4rem'
                }}
              >
                👑
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#E9C766', fontFamily: 'var(--font-heading, Sora)' }}>
                  Unlock 24K Gold Edition
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#C5A059', fontWeight: 600 }}>
                  Exclusive Executive Identity Tier • ₹1,999 One-Time
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#CBD5E1', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              The 24K Gold Edition is handcrafted with near-black charcoal obsidian textures, metallic champagne typography, and an executive VIP profile seal.
            </p>

            <div
              style={{
                backgroundColor: 'rgba(233, 199, 102, 0.06)',
                border: '1px solid rgba(233, 199, 102, 0.2)',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.82rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF0A6' }}>
                <Check size={16} color="#E9C766" strokeWidth={3} />
                <span>24K Champagne Gold typography & metallic accents</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF0A6' }}>
                <Check size={16} color="#E9C766" strokeWidth={3} />
                <span>Obsidian luxury backdrop with golden radiant reflections</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF0A6' }}>
                <Check size={16} color="#E9C766" strokeWidth={3} />
                <span>Executive Verified 24K Crown Seal on live web link</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF0A6' }}>
                <Check size={16} color="#E9C766" strokeWidth={3} />
                <span>Instant profile synchronization across iOS & Android</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowGoldUpgradeModal(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Maybe Later
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...applyThemeToProfile(prev, 'gold'),
                    isGoldUnlocked: true,
                    isPremium: true
                  }));
                  setShowGoldUpgradeModal(false);
                }}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #E9C766 0%, #C9972C 100%)',
                  color: '#0C0B0A',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(201, 151, 44, 0.4)'
                }}
              >
                <span>Confirm & Activate 24K Gold</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </>
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

