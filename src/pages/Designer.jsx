/* ==========================================================================
   FLOCARD INTERACTIVE CARD DESIGNER STUDIO
   Supports Theme 1 (Pages 1–3) & Theme 2 (Pages 4–6), Logo Scaling,
   Color Customization, Admin-Only Studio Background, and 300 DPI Export.
   ========================================================================== */

import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCw,
  Eye,
  Download,
  FileCheck,
  Check,
  Sparkles,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Layers,
  QrCode,
  Radio,
  FileText,
  ChevronDown,
  ChevronUp,
  Save,
  ArrowRight,
  ExternalLink,
  Palette,
  Image as ImageIcon,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Lock,
  Plus,
  Minus,
  Type,
  X,
  Copy,
  Share2,
  CheckCircle2,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';
import CardCanvas from '../components/CardCanvas';
import Card3DPreview from '../components/Card3DPreview';
import { motion, AnimatePresence } from 'motion/react';
import { EDITIONS, TEMPLATES, BRAND } from '../lib/constants';
import {
  exportCardPDF,
  downloadCanvasPNG,
  downloadBothSides,
  createCombinedArtworkCanvas,
  copyCanvasToClipboard
} from '../lib/pdfExport';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrencyINR } from '../lib/storage';

export const FONT_OPTIONS = [
  { id: 'Space Grotesk', name: 'Space Grotesk', style: 'Modern Tech & Bold' },
  { id: 'Sora', name: 'Sora', style: 'Geometric Luxury' },
  { id: 'Inter', name: 'Inter', style: 'Ultra Clean & Minimal' },
  { id: 'Outfit', name: 'Outfit', style: 'Contemporary Editorial' },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', style: 'Sleek Corporate' },
  { id: 'Cinzel', name: 'Cinzel', style: 'Regal Roman Classical' },
  { id: 'Playfair Display', name: 'Playfair Display', style: 'Luxury Serif' },
  { id: 'Montserrat', name: 'Montserrat', style: 'Geometric Bold' }
];

function InteractiveFontPicker({
  label,
  value,
  onChange,
  fieldName,
  hoveredFont,
  setHoveredFont
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setHoveredFont(prev => (prev?.field === fieldName ? null : prev));
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, fieldName, setHoveredFont]);

  const isFieldHovered = hoveredFont?.field === fieldName;
  const displayFont = isFieldHovered ? hoveredFont.font : (value || 'Space Grotesk');

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
        {isFieldHovered ? (
          <span style={{ fontSize: '0.66rem', color: '#10B981', fontWeight: 700 }}>
            Hovering: {hoveredFont.font}
          </span>
        ) : (
          <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
            {value}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 10px',
          background: 'var(--card-surface)',
          border: isFieldHovered ? '1px solid #10B981' : isOpen ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ fontFamily: `"${displayFont}", sans-serif`, fontSize: '0.84rem', fontWeight: 600 }}>
          {displayFont}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 120,
            background: 'var(--card-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            boxShadow: 'var(--card-shadow)',
            padding: '6px',
            maxHeight: '220px',
            overflowY: 'auto',
            backdropFilter: 'blur(16px)'
          }}
        >
          {FONT_OPTIONS.map(font => {
            const isSelected = value === font.id;
            const isThisHovered = isFieldHovered && hoveredFont.font === font.id;
            return (
              <div
                key={font.id}
                onMouseEnter={() => setHoveredFont({ field: fieldName, font: font.id })}
                onMouseLeave={() => setHoveredFont(null)}
                onClick={() => {
                  onChange(font.id);
                  setHoveredFont(null);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: isThisHovered ? 'rgba(168, 85, 247, 0.3)' : isSelected ? 'rgba(107, 0, 255, 0.2)' : 'transparent',
                  transform: isThisHovered ? 'translateX(4px)' : 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: `"${font.id}", sans-serif`, fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {font.name}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    {font.style}
                  </span>
                </div>
                {isSelected && <Check size={14} color="var(--accent-purple)" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Designer() {
  const { user, isAdmin } = useAuth();
  const { isLight } = useTheme();
  const { saveDesign, designs, studioBackground, updateStudioBackground, resetStudioBg, createOrderFromDesign, getProductByEdition } = useData();

  // URL query params support (e.g. /designer?edition=gold&template=customer_logo&tagline=...&font=...)
  const urlParams = new URLSearchParams(window.location.search);
  const initialEdition = urlParams.get('edition') || 'purple';
  const initialTemplate = urlParams.get('template') || 'standard';
  const initialTagline = urlParams.get('tagline');
  const initialFont = urlParams.get('font');
  const initialDesignId = urlParams.get('id');

  const existingDesign = initialDesignId ? designs.find(d => d.id === initialDesignId) : null;

  // Active template: 'standard' (Pages 1-3) or 'customer_logo' (Pages 4-6)
  const [templateType, setTemplateType] = useState(
    existingDesign?.templateType || initialTemplate
  );

  // Active color edition: 'purple' | 'gold' | 'platinum'
  const [edition, setEdition] = useState(
    existingDesign?.edition || initialEdition
  );

  const currentEditionProduct = getProductByEdition(edition);

  const [side, setSide] = useState('front'); // 'front' | 'back'
  const [zoom, setZoom] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [showBleed, setShowBleed] = useState(false);
  const [activeTab, setActiveTab] = useState('identity'); // 'identity' | 'logos' | 'nfc' | 'qr'
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [logoWarning, setLogoWarning] = useState(false);
  const [adminBgMessage, setAdminBgMessage] = useState('');
  const [hoveredFont, setHoveredFont] = useState(null); // { field: 'name' | 'role' | 'details' | 'tagline', font: string }
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOrderSubmittedModal, setShowOrderSubmittedModal] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  // Helper to dynamically format card name as `<Username>'s FLOCARD (<Edition> Edition)`
  const getDynamicCardTitle = (name, editionKey) => {
    const raw = (name || user?.name || 'Customer').trim();
    const edName = EDITIONS[editionKey]?.name || 'Purple Edition';
    return `${raw}'s FLOCARD (${edName})`;
  };

  // Responsive mobile scaling
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const BASE_CARD_WIDTH = 520;
  const BASE_CARD_HEIGHT = Math.round(520 / 1.585); // 328px
  const maxAvailableCardWidth = Math.max(260, Math.min(BASE_CARD_WIDTH, viewportWidth - (viewportWidth < 640 ? 56 : 96)));
  const fitScale = Math.min(1, maxAvailableCardWidth / BASE_CARD_WIDTH);

  // Default color palette for current edition
  const currentEditionDefaults = EDITIONS[edition]?.defaults || {};

  // Custom Colors configuration
  const [customColors, setCustomColors] = useState({
    primaryAccent: existingDesign?.customColors?.primaryAccent || currentEditionDefaults.primaryAccent,
    secondaryAccent: existingDesign?.customColors?.secondaryAccent || currentEditionDefaults.secondaryAccent,
    nameColor: existingDesign?.customColors?.nameColor || currentEditionDefaults.nameColor,
    roleColor: existingDesign?.customColors?.roleColor || currentEditionDefaults.roleColor,
    detailsColor: existingDesign?.customColors?.detailsColor || currentEditionDefaults.roleColor || '#D8B4FE',
    taglineColor: existingDesign?.customColors?.taglineColor || currentEditionDefaults.taglineColor,
    nfcColor: existingDesign?.customColors?.nfcColor || currentEditionDefaults.nfcColor,
    qrColor: existingDesign?.customColors?.qrColor || currentEditionDefaults.qrColor
  });

  // Customer Logo state (with scale, offset, and badge)
  const [customerLogo, setCustomerLogo] = useState({
    url: existingDesign?.customerLogo?.url || existingDesign?.front?.customLogo || null,
    size: existingDesign?.customerLogo?.size ?? 100, // 50 to 180%
    posX: existingDesign?.customerLogo?.posX ?? 0,
    posY: existingDesign?.customerLogo?.posY ?? 0,
    showCircleBadge: existingDesign?.customerLogo?.showCircleBadge ?? true
  });

  // FLOCARD Logo state (independent scale & position presets)
  const [flocardLogo, setFlocardLogo] = useState({
    size: existingDesign?.flocardLogo?.size ?? 100, // 60 to 150%
    position: existingDesign?.flocardLogo?.position || (templateType === 'customer_logo' ? 'bottom-right' : 'top-left')
  });

  // Front side configuration
  const [frontConfig, setFrontConfig] = useState({
    name: existingDesign?.front?.name || (user?.name || 'AKHIL ANVAR'),
    role: existingDesign?.front?.role || 'CEO & FOUNDER',
    details: existingDesign?.front?.details || '',
    tagline: existingDesign?.front?.tagline || initialTagline || 'One Tap Every Connection',
    showTagline: existingDesign?.front?.showTagline ?? true,
    showNfc: true,
    nfcPosition: existingDesign?.front?.nfcPosition || 'top-right',
    showSubtext: false,
    subtext: 'TAP TO CONNECT',
    fontSize: existingDesign?.front?.fontSize || 'medium',
    alignment: existingDesign?.front?.alignment || 'left',
    fontFamily: existingDesign?.front?.fontFamily || initialFont || 'Space Grotesk',
    roleFontFamily: existingDesign?.front?.roleFontFamily || 'Inter',
    detailsFontFamily: existingDesign?.front?.detailsFontFamily || 'Inter',
    taglineFontFamily: existingDesign?.front?.taglineFontFamily || 'Inter'
  });

  // Back side configuration
  const [backConfig, setBackConfig] = useState({
    qrUrl: existingDesign?.back?.qrUrl || `https://flocard.in/p/${user?.profileSlug || 'akhil'}`,
    subtext: existingDesign?.back?.subtext || 'SCAN ME',
    showNfcSpecs: existingDesign?.back?.showNfcSpecs ?? true,
    specsText: existingDesign?.back?.specsText || 'NFC | PORTFOLIO | CONTACT | CONNECT',
    brandUrl: existingDesign?.back?.brandUrl || `flocard.in/${user?.profileSlug || 'akhil'}`
  });

  const [designTitle, setDesignTitle] = useState(
    existingDesign?.title || getDynamicCardTitle(existingDesign?.front?.name || user?.name || 'AKHIL ANVAR', existingDesign?.edition || initialEdition)
  );
  const [designStatus, setDesignStatus] = useState(existingDesign?.status || 'draft');

  // Hidden export canvases for 300 DPI exports
  const frontExportCanvasRef = useRef(null);
  const backExportCanvasRef = useRef(null);

  // Clipboard & Web Share API states for automatic attachments & copy
  const [copiedClipboard, setCopiedClipboard] = useState(false);
  const [clipboardTarget, setClipboardTarget] = useState('both');
  const [shareSupported, setShareSupported] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setShareSupported(true);
    }
  }, []);

  // Switch edition: dynamically updates card title, preserves template, logos, text, and updates colors
  const handleEditionChange = (newEdition) => {
    setEdition(newEdition);
    setDesignTitle(getDynamicCardTitle(frontConfig.name, newEdition));
    const def = EDITIONS[newEdition]?.defaults || {};
    setCustomColors({
      primaryAccent: def.primaryAccent,
      secondaryAccent: def.secondaryAccent,
      nameColor: def.nameColor,
      roleColor: def.roleColor,
      detailsColor: def.detailsColor || def.roleColor || '#D8B4FE',
      taglineColor: def.taglineColor,
      nfcColor: def.nfcColor,
      qrColor: def.qrColor
    });
  };

  // Reset colors to active edition defaults
  const handleResetColors = () => {
    const def = EDITIONS[edition]?.defaults || {};
    setCustomColors({
      primaryAccent: def.primaryAccent,
      secondaryAccent: def.secondaryAccent,
      nameColor: def.nameColor,
      roleColor: def.roleColor,
      taglineColor: def.taglineColor,
      nfcColor: def.nfcColor,
      qrColor: def.qrColor
    });
  };

  // Switch template (Standard vs Customer Logo) while preserving all customer info
  const handleTemplateChange = (newTemplate) => {
    setTemplateType(newTemplate);
    if (newTemplate === 'customer_logo') {
      setFlocardLogo(prev => ({ ...prev, position: 'bottom-right' }));
    } else {
      setFlocardLogo(prev => ({ ...prev, position: 'top-left' }));
    }
  };

  // Customer Logo upload with robust validation
  const handleCustomerLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type - support all image MIME types or file extensions
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|svg|webp|gif|bmp|avif)$/i.test(file.name);
    if (!isImage) {
      alert('Please upload a valid image file (PNG, SVG, JPG, or WEBP). Transparent PNG is recommended.');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please select a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setCustomerLogo(prev => ({ ...prev, url: dataUrl }));
      setFrontConfig(prev => ({ ...prev, customLogo: dataUrl }));
      // Automatically switch to customer logo template and front face so the logo is immediately visible
      setTemplateType('customer_logo');
      setSide('front');
    };
    reader.readAsDataURL(file);
    // Reset file input so re-uploading the same file works
    e.target.value = '';
  };

  // Admin-only studio background upload
  const handleStudioBgUpload = (e) => {
    if (!isAdmin) {
      setAdminBgMessage('Unauthorized: Only administrators can modify the studio environment.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const res = updateStudioBackground(reader.result, user?.role);
      if (res.success) {
        setAdminBgMessage('Studio background updated successfully!');
        setTimeout(() => setAdminBgMessage(''), 3000);
      } else {
        setAdminBgMessage(res.error);
      }
    };
    reader.readAsDataURL(file);
  };

  // Auto-sync initial name and card title with logged in user if currently default
  useEffect(() => {
    if (user && !existingDesign) {
      if ((frontConfig.name === 'AKHIL ANVAR' || !frontConfig.name) && user.name) {
        setFrontConfig(prev => ({ ...prev, name: user.name }));
        setDesignTitle(getDynamicCardTitle(user.name, edition));
      }
    }
  }, [user, existingDesign, edition]);

  const hasRestoredPendingRef = useRef(false);

  // Auto-restore and submit pending design after login redirect directly to Admin Panel
  useEffect(() => {
    const isSubmitQuery = urlParams.get('submit') === 'true';
    if (isSubmitQuery && user && !hasRestoredPendingRef.current) {
      const savedPending = localStorage.getItem('flocard_pending_design');
      if (savedPending) {
        hasRestoredPendingRef.current = true;
        try {
          const parsed = JSON.parse(savedPending);
          if (parsed.front) setFrontConfig(parsed.front);
          if (parsed.back) setBackConfig(parsed.back);
          if (parsed.customColors) setCustomColors(parsed.customColors);
          if (parsed.customerLogo) setCustomerLogo(parsed.customerLogo);
          if (parsed.flocardLogo) setFlocardLogo(parsed.flocardLogo);
          if (parsed.templateType) setTemplateType(parsed.templateType);
          if (parsed.edition) setEdition(parsed.edition);
          if (parsed.title) setDesignTitle(parsed.title);

          const clientName = user?.name || parsed.front?.name || 'Valued Client';
          const clientSlug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
          const designObj = {
            id: `des_${Date.now()}`,
            customerId: user?.id || (user?.email ? `cust_${user.email}` : `cust_${Date.now()}`),
            customerName: clientName,
            customerEmail: user?.email || `${clientSlug}@example.com`,
            customerPhone: user?.phone || '+91 6238 578 552',
            company: user?.company || parsed.front?.company || 'FLOCARD Enterprise',
            title: parsed.title || getDynamicCardTitle(clientName, parsed.edition || 'purple'),
            templateType: parsed.templateType || 'standard',
            edition: parsed.edition || 'purple',
            customColors: parsed.customColors,
            customerLogo: parsed.customerLogo,
            flocardLogo: parsed.flocardLogo,
            front: parsed.front,
            back: parsed.back,
            status: 'submitted'
          };
          saveDesign(designObj);
          setDesignStatus('submitted');
          setSaveSuccess('Welcome back! Your design has been submitted directly to the Admin Panel.');
          localStorage.removeItem('flocard_pending_design');

          const order = createOrderFromDesign(
            designObj,
            'Submitted via Card Designer for Print Production (Post-Login)',
            user
          );
          setSubmittedOrder(order);

          setTimeout(() => {
            try {
              handleDownloadBothSides();
            } catch (e) {}
            setShowOrderSubmittedModal(true);
          }, 400);

          setTimeout(() => setSaveSuccess(''), 4500);
        } catch (e) {
          console.error('Error restoring pending design:', e);
        }
      }
    }
  }, [user]);

  // Save design to account / data context (Customer must be logged in to submit)
  const handleSaveDesign = (submit = false) => {
    if (submit && !user) {
      const pendingDesign = {
        title: designTitle,
        templateType,
        edition,
        customColors,
        customerLogo,
        flocardLogo,
        front: frontConfig,
        back: backConfig
      };
      try {
        localStorage.setItem('flocard_pending_design', JSON.stringify(pendingDesign));
      } catch (e) {
        console.error('Failed to store pending design:', e);
      }
      setShowAuthModal(true);
      return;
    }

    const newStatus = submit ? 'submitted' : designStatus;
    const clientName = user?.name || frontConfig.name || 'Valued Client';
    const clientSlug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
    const designObj = {
      id: existingDesign?.id || `des_${Date.now()}`,
      customerId: user?.id || (user?.email ? `cust_${user.email}` : `cust_${Date.now()}`),
      customerName: clientName,
      customerEmail: user?.email || `${clientSlug}@example.com`,
      customerPhone: user?.phone || '+91 6238 578 552',
      company: user?.company || frontConfig.company || 'FLOCARD Enterprise',
      title: designTitle,
      templateType,
      edition,
      customColors,
      customerLogo,
      flocardLogo,
      front: frontConfig,
      back: backConfig,
      status: newStatus
    };

    saveDesign(designObj);
    setDesignStatus(newStatus);
    setSaveSuccess(submit ? 'Design submitted directly to Admin Panel for print production!' : 'Design saved to account!');
    setTimeout(() => setSaveSuccess(''), 3500);

    if (submit) {
      // 1. Create order directly in Admin Panel
      const createdOrder = createOrderFromDesign(
        designObj,
        'Submitted via Card Designer for Print Production',
        user
      );
      setSubmittedOrder(createdOrder);

      // 2. Download both front & back card artworks cleanly (300 DPI PNG sheet)
      try {
        handleDownloadBothSides();
      } catch (e) {
        console.warn('Artwork download issue:', e);
      }

      // 3. Display in-app confirmation modal with live order tracking
      setShowOrderSubmittedModal(true);
    }
  };

  // Export high-res individual PNG
  const handleExportPNG = (exportSide) => {
    const canvas = exportSide === 'front' ? frontExportCanvasRef.current : backExportCanvasRef.current;
    if (canvas) {
      downloadCanvasPNG(canvas, `${designTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${exportSide}_300dpi.png`);
    }
  };

  // Download both sides (guaranteed combined dual-sided sheet + front + back)
  const handleDownloadBothSides = () => {
    downloadBothSides({
      frontCanvas: frontExportCanvasRef.current,
      backCanvas: backExportCanvasRef.current,
      designName: designTitle,
      editionName: EDITIONS[edition]?.name
    });
  };

  // Copy card artwork to clipboard (both sides combined or individual)
  const handleCopyArtwork = async (target = 'both') => {
    let targetCanvas = null;
    if (target === 'both') {
      targetCanvas = createCombinedArtworkCanvas({
        frontCanvas: frontExportCanvasRef.current,
        backCanvas: backExportCanvasRef.current,
        designName: designTitle,
        editionName: EDITIONS[edition]?.name
      });
    } else if (target === 'front') {
      targetCanvas = frontExportCanvasRef.current;
    } else {
      targetCanvas = backExportCanvasRef.current;
    }

    if (targetCanvas) {
      const ok = await copyCanvasToClipboard(targetCanvas);
      if (ok) {
        setCopiedClipboard(true);
        setClipboardTarget(target);
        setTimeout(() => setCopiedClipboard(false), 3500);
        return true;
      }
    }
    return false;
  };

  // Export print-ready double-sided PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportCardPDF({
        frontCanvas: frontExportCanvasRef.current,
        backCanvas: backExportCanvasRef.current,
        designName: designTitle,
        edition: EDITIONS[edition]?.name
      });
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Pack combined config for CardCanvas with live hovered font preview support
  const combinedConfig = {
    front: {
      ...frontConfig,
      fontFamily: (hoveredFont?.field === 'name' ? hoveredFont.font : frontConfig.fontFamily) || 'Space Grotesk',
      roleFontFamily: (hoveredFont?.field === 'role' ? hoveredFont.font : frontConfig.roleFontFamily) || 'Inter',
      detailsFontFamily: (hoveredFont?.field === 'details' ? hoveredFont.font : frontConfig.detailsFontFamily) || 'Inter',
      taglineFontFamily: (hoveredFont?.field === 'tagline' ? hoveredFont.font : frontConfig.taglineFontFamily) || 'Inter'
    },
    back: backConfig,
    customColors,
    customerLogo,
    flocardLogo,
    templateType
  };

  return (
    <div
      className="designer-studio-page"
      style={{
        paddingTop: 'calc(var(--header-height) + 16px)',
        paddingBottom: '80px',
        minHeight: '100vh',
        background: 'var(--bg-main)'
      }}
    >
      <div className="container" style={{ maxWidth: '1440px' }}>
        {/* Top Control Header */}
        <div
          className="designer-top-bar glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
            padding: '16px 20px',
            background: 'var(--glass-panel-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="designer-title-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <span className="badge-tag" style={{ flexShrink: 0 }}>
              {TEMPLATES[templateType]?.badge}
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: edition === 'gold' ? 'rgba(233, 199, 102, 0.15)' : edition === 'platinum' ? 'rgba(203, 213, 225, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                color: edition === 'gold' ? '#E9C766' : edition === 'platinum' ? '#CBD5E1' : '#A855F7',
                border: `1px solid ${edition === 'gold' ? '#E9C76644' : edition === 'platinum' ? '#CBD5E144' : '#A855F744'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0
              }}
            >
              <span>{EDITIONS[edition]?.name || 'Edition'}</span>
              <span>&bull;</span>
              <span>{formatCurrencyINR(currentEditionProduct?.price) || 'Price coming soon'}</span>
            </span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <input
                type="text"
                value={designTitle}
                onChange={(e) => setDesignTitle(e.target.value)}
                className="designer-title-input"
                placeholder="e.g. Username's FLOCARD (Purple Edition)"
                title="Card Design Title (Click refresh icon to re-sync with your name & edition)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  outline: 'none',
                  padding: '4px 28px 4px 8px',
                  flex: 1,
                  minWidth: 0,
                  width: '100%'
                }}
              />
              <button
                type="button"
                onClick={() => setDesignTitle(getDynamicCardTitle(frontConfig.name, edition))}
                title="Sync title with name & edition"
                style={{
                  position: 'absolute',
                  right: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-purple)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="designer-action-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {saveSuccess && (
              <span className="designer-save-msg" style={{ fontSize: '0.85rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={16} /> {saveSuccess}
              </span>
            )}


            <button
              type="button"
              onClick={() => handleSaveDesign(false)}
              className="btn btn-secondary btn-sm designer-btn"
            >
              <Save size={15} />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveDesign(true)}
              className="btn btn-primary btn-sm designer-btn"
            >
              <FileCheck size={15} />
              <span>Submit for Print</span>
            </button>
          </div>
        </div>

        {/* 3-Column Layout: Left Controls | Center Canvas | Right Properties & Export */}
        <div
          className="designer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '350px 1fr 310px',
            gap: '24px',
            alignItems: 'start'
          }}
        >
          {/* ==================================================================
              LEFT SIDEBAR: CUSTOMIZATION PANELS
              ================================================================== */}
          <div
            className="designer-left-panel glass-panel"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Template Selector (Theme 1 vs Theme 2) */}
            <div>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                Design Template Layout
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {Object.values(TEMPLATES).map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    className="template-select-btn"
                    onClick={() => handleTemplateChange(tmpl.id)}
                    style={{
                      background: templateType === tmpl.id ? 'rgba(107, 0, 255, 0.25)' : 'var(--elevated-surface)',
                      border: templateType === tmpl.id ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 8px',
                      color: templateType === tmpl.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxShadow: templateType === tmpl.id ? '0 4px 14px rgba(107, 0, 255, 0.25)' : 'none',
                      transform: templateType === tmpl.id ? 'scale(1.02)' : 'scale(1)',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>{tmpl.name}</div>
                    <div style={{ fontSize: '0.68rem', color: templateType === tmpl.id ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                      {tmpl.pdfPages}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Edition Preset Selector (Purple, Gold, Platinum) */}
            <div>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                Color Edition Preset
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {Object.entries(EDITIONS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    className="edition-select-btn"
                    onClick={() => handleEditionChange(key)}
                    style={{
                      background: edition === key ? 'rgba(107, 0, 255, 0.25)' : 'var(--elevated-surface)',
                      border: edition === key ? `2px solid ${item.accentColor}` : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 4px',
                      color: edition === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxShadow: edition === key ? `0 4px 14px ${item.accentColor}35` : 'none',
                      transform: edition === key ? 'scale(1.03)' : 'scale(1)',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: item.accentColor,
                        margin: '0 auto 4px',
                        boxShadow: `0 0 8px ${item.accentColor}`,
                        transition: 'transform 0.2s ease'
                      }}
                    />
                    {item.name.replace(' Edition', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Studio Navigation Tabs (Text, Logos, NFC, QR) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                background: 'var(--elevated-surface)',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid var(--border-color)',
                gap: '2px'
              }}
            >
              {[
                { id: 'identity', label: 'Text', icon: FileText },
                { id: 'logos', label: 'Logos', icon: ImageIcon },
                { id: 'nfc', label: 'NFC', icon: Radio },
                { id: 'qr', label: 'QR', icon: QrCode }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className="studio-tab-btn"
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'qr') setSide('back');
                      else if (tab.id === 'logos' && templateType === 'customer_logo') setSide('front');
                      else if (tab.id === 'identity') setSide('front');
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 2px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: active ? 'var(--primary-purple)' : 'transparent',
                      color: active ? '#ffffff' : 'var(--text-secondary)',
                      boxShadow: active ? '0 2px 8px rgba(107, 0, 255, 0.4)' : 'none',
                      transform: active ? 'scale(1.02)' : 'scale(1)',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, color 0.2s ease'
                    }}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* TAB 2: TWO INDEPENDENT LOGOS & SCALING */}
                {activeTab === 'logos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Customer Logo Section */}
                <div style={{ background: 'var(--elevated-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>Customer Logo (Front)</div>
                    <span style={{ fontSize: '0.68rem', color: templateType === 'customer_logo' ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                      {templateType === 'customer_logo' ? 'Theme 2 Center Badge' : 'Theme 1 Header Logo'}
                    </span>
                  </div>

                  {/* Logo thumbnail preview if uploaded */}
                  {customerLogo.url && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px',
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: customerLogo.showCircleBadge ? '50%' : '6px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          background: 'rgba(0, 0, 0, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        <img
                          src={customerLogo.url}
                          alt="Customer logo preview"
                          style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 600 }}>Active Logo</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Displayed on card front</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerLogo(prev => ({ ...prev, url: null }));
                          setFrontConfig(prev => ({ ...prev, customLogo: null }));
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <label className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.75rem', cursor: 'pointer', justifyContent: 'center' }}>
                      <Upload size={13} />
                      <span>{customerLogo.url ? 'Replace Logo' : 'Upload Customer Logo'}</span>
                      <input type="file" accept="image/*" onChange={handleCustomerLogoUpload} style={{ display: 'none' }} />
                    </label>
                  </div>

                  {/* Template Style Switcher */}
                  <div style={{ marginBottom: '14px', background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Display Layout:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setTemplateType('customer_logo');
                          setSide('front');
                        }}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: templateType === 'customer_logo' ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                          background: templateType === 'customer_logo' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                          color: templateType === 'customer_logo' ? '#ffffff' : 'var(--text-muted)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Center Badge (Theme 2)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTemplateType('standard');
                          setSide('front');
                        }}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: templateType === 'standard' ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                          background: templateType === 'standard' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                          color: templateType === 'standard' ? '#ffffff' : 'var(--text-muted)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Top-Left (Theme 1)
                      </button>
                    </div>
                  </div>

                  {/* Size slider & buttons */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>Logo Scale:</span>
                      <strong>{customerLogo.size}%</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setCustomerLogo(p => ({ ...p, size: Math.max(40, p.size - 5) }))}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '26px', height: '26px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <Minus size={13} />
                      </button>
                      <input
                        type="range"
                        min="40"
                        max="180"
                        value={customerLogo.size}
                        onChange={(e) => setCustomerLogo(p => ({ ...p, size: Number(e.target.value) }))}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => setCustomerLogo(p => ({ ...p, size: Math.min(180, p.size + 5) }))}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '26px', height: '26px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerLogo(p => ({ ...p, size: 100, posX: 0, posY: 0 }))}
                        title="Reset size to 100%"
                        style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--light-lavender)', fontSize: '0.7rem', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        100%
                      </button>
                    </div>
                  </div>

                  {/* Position offset controls */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Offset X ({customerLogo.posX}px)</div>
                      <input
                        type="range"
                        min="-60"
                        max="60"
                        value={customerLogo.posX}
                        onChange={(e) => setCustomerLogo(p => ({ ...p, posX: Number(e.target.value) }))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Offset Y ({customerLogo.posY}px)</div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        value={customerLogo.posY}
                        onChange={(e) => setCustomerLogo(p => ({ ...p, posY: Number(e.target.value) }))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Circular badge toggle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Circular Badge Outline</span>
                    <input
                      type="checkbox"
                      checked={customerLogo.showCircleBadge}
                      onChange={(e) => setCustomerLogo(p => ({ ...p, showCircleBadge: e.target.checked }))}
                    />
                  </div>
                </div>

                {/* 2. Official FLOCARD Logo Section - NON-EDITABLE */}
                <div style={{ background: 'var(--elevated-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={12} style={{ color: 'var(--accent-purple)' }} />
                      <span>Official FLOCARD Logo</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                      Non-Editable
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    The FLOCARD brand emblem is a protected trademark. Canonical dimensions and positioning are locked on the card back according to brand design specifications.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: IDENTITY & TYPOGRAPHY WITH LIVE HOVER FONT PREVIEW */}
            {activeTab === 'identity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Full Name */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ marginBottom: '6px' }}>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={frontConfig.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFrontConfig({ ...frontConfig, name: newName });
                      setDesignTitle(getDynamicCardTitle(newName, edition));
                    }}
                    placeholder="e.g. AKHIL ANVAR"
                    style={{ marginBottom: '8px' }}
                  />
                  <InteractiveFontPicker
                    label="Name Font Style (Hover to preview)"
                    value={frontConfig.fontFamily || 'Space Grotesk'}
                    onChange={(fontId) => setFrontConfig({ ...frontConfig, fontFamily: fontId })}
                    fieldName="name"
                    hoveredFont={hoveredFont}
                    setHoveredFont={setHoveredFont}
                  />

                  {/* Name Scale */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Name Font Size</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['small', 'medium', 'large'].map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setFrontConfig({ ...frontConfig, fontSize: size })}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '6px',
                            border: frontConfig.fontSize === size ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                            background: frontConfig.fontSize === size ? 'rgba(107, 0, 255, 0.25)' : 'var(--elevated-surface)',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            cursor: 'pointer'
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Title / Role */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ marginBottom: '6px' }}>Title / Role</label>
                  <input
                    type="text"
                    className="form-input"
                    value={frontConfig.role}
                    onChange={(e) => setFrontConfig({ ...frontConfig, role: e.target.value })}
                    placeholder="e.g. CEO & FOUNDER"
                    style={{ marginBottom: '8px' }}
                  />
                  <InteractiveFontPicker
                    label="Role Font Style (Hover to preview)"
                    value={frontConfig.roleFontFamily || 'Inter'}
                    onChange={(fontId) => setFrontConfig({ ...frontConfig, roleFontFamily: fontId })}
                    fieldName="role"
                    hoveredFont={hoveredFont}
                    setHoveredFont={setHoveredFont}
                  />
                </div>

                {/* 3. Details (New Text at Bottom of Role & Name) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Details (Bottom of Role & Name)
                    </label>
                    <span style={{ fontSize: '0.68rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
                      New Text
                    </span>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={frontConfig.details || ''}
                    onChange={(e) => setFrontConfig({ ...frontConfig, details: e.target.value })}
                    placeholder="location • number • website • etc"
                    style={{ marginBottom: '8px' }}
                  />
                  <InteractiveFontPicker
                    label="Details Font Style (Hover to preview)"
                    value={frontConfig.detailsFontFamily || frontConfig.roleFontFamily || 'Inter'}
                    onChange={(fontId) => setFrontConfig({ ...frontConfig, detailsFontFamily: fontId })}
                    fieldName="details"
                    hoveredFont={hoveredFont}
                    setHoveredFont={setHoveredFont}
                  />
                </div>

                {/* 4. Tagline */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Tagline Statement</label>
                    <input
                      type="checkbox"
                      checked={frontConfig.showTagline}
                      onChange={(e) => setFrontConfig({ ...frontConfig, showTagline: e.target.checked })}
                    />
                  </div>
                  {frontConfig.showTagline && (
                    <>
                      <input
                        type="text"
                        className="form-input"
                        value={frontConfig.tagline}
                        onChange={(e) => setFrontConfig({ ...frontConfig, tagline: e.target.value })}
                        placeholder="One Tap Every Connection"
                        style={{ marginBottom: '8px' }}
                      />
                      <InteractiveFontPicker
                        label="Tagline Font Style (Hover to preview)"
                        value={frontConfig.taglineFontFamily || 'Inter'}
                        onChange={(fontId) => setFrontConfig({ ...frontConfig, taglineFontFamily: fontId })}
                        fieldName="tagline"
                        hoveredFont={hoveredFont}
                        setHoveredFont={setHoveredFont}
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: NFC CONTROLS */}
            {activeTab === 'nfc' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(107, 0, 255, 0.1)',
                    border: '1px solid rgba(107, 0, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: 'rgba(107, 0, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-purple)'
                    }}
                  >
                    <Radio size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>
                      NFC Antenna Hardware
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      High-Capacity NTAG216 Chip &bull; 13.56 MHz ISO 14443A
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  The authentic <strong style={{ color: '#fff' }}>FLOCARD NFC Wave symbol</strong> is permanently embedded at standard card tap coordinates for instant recognition and 100% reliable contactless scanning.
                </div>

                <div
                  style={{
                    background: 'var(--elevated-surface)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.74rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Antenna Status</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>Active & Encoded</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Target URL</span>
                    <span style={{ color: 'var(--accent-purple)', fontWeight: 500 }}>{backConfig.qrUrl}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Compatibility</span>
                    <span style={{ color: '#ffffff' }}>iOS 13+ & Android (No App Required)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: BACK & QR CODE CONTROLS */}
            {activeTab === 'qr' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Destination Profile URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={backConfig.qrUrl}
                    onChange={(e) => setBackConfig({ ...backConfig, qrUrl: e.target.value })}
                    placeholder="https://flocard.in/p/akhil"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Display Brand URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={backConfig.brandUrl}
                    onChange={(e) => setBackConfig({ ...backConfig, brandUrl: e.target.value })}
                    placeholder="flocard.in/akhil"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

          {/* ==================================================================
              CENTER CANVAS: REAL-TIME INTERACTIVE VIEW
              ================================================================== */}
          <div
            className="designer-canvas-center glass-panel"
            style={{
              padding: '36px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '540px',
              position: 'relative',
              overflow: 'hidden',
              backgroundImage: isLight
                ? `radial-gradient(circle at 50% 50%, rgba(248, 247, 252, 0.65), #f1edfa), url(${studioBackground})`
                : `radial-gradient(circle at 50% 50%, rgba(8, 6, 13, 0.45), #08060d), url(${studioBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* View Controls Toolbar */}
            <div
              className="canvas-view-toolbar"
              style={{
                position: 'absolute',
                top: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--glass-panel-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 14px',
                zIndex: 20
              }}
            >
              {/* Flip Switch */}
              <button
                type="button"
                onClick={() => setSide(side === 'front' ? 'back' : 'front')}
                className="interactive-chip"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--light-lavender)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(107, 0, 255, 0.15)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <RotateCw
                  size={14}
                  style={{
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: side === 'back' ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
                <span>Showing: {side.toUpperCase()}</span>
              </button>

              <div className="toolbar-divider" style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />

              {/* Safe Area Guides Toggle */}
              <button
                type="button"
                onClick={() => setShowGuides(!showGuides)}
                style={{
                  background: showGuides ? 'rgba(107, 0, 255, 0.3)' : 'transparent',
                  border: 'none',
                  color: showGuides ? '#ffffff' : 'var(--text-muted)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Safe Area Guides
              </button>

              {/* Trim Bleed Toggle */}
              <button
                type="button"
                onClick={() => setShowBleed(!showBleed)}
                style={{
                  background: showBleed ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                  border: 'none',
                  color: showBleed ? '#ffffff' : 'var(--text-muted)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Bleed Trim (3mm)
              </button>
            </div>

            {/* Logo Exceeding Safe Area Warning Banner */}
            {logoWarning && (
              <div
                style={{
                  position: 'absolute',
                  top: '64px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 20,
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
              >
                <AlertTriangle size={14} />
                <span>Logo extends beyond the 3mm safe printable area. Adjust size or offset.</span>
              </div>
            )}

            {/* The Live Interactive Card Canvas - Responsively Scaled */}
            <div
              className="designer-canvas-viewport-box"
              style={{
                width: `${Math.round(BASE_CARD_WIDTH * fitScale)}px`,
                height: `${Math.round(BASE_CARD_HEIGHT * fitScale)}px`,
                position: 'relative',
                margin: viewportWidth < 640 ? '24px auto 28px' : '40px auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '100%'
              }}
            >
              <div
                style={{
                  width: `${BASE_CARD_WIDTH}px`,
                  height: `${BASE_CARD_HEIGHT}px`,
                  transform: `scale(${fitScale * zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0
                }}
              >
                <Card3DPreview
                  side={side}
                  onSideChange={setSide}
                  templateType={templateType}
                  edition={edition}
                  config={combinedConfig}
                  showGuides={showGuides}
                  showBleed={showBleed}
                  width={BASE_CARD_WIDTH}
                  onLogoWarningChange={setLogoWarning}
                />
              </div>
            </div>

            {/* Bottom Dimensions & Aspect Ratio Spec Indicator */}
            <div
              className="canvas-spec-bar"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: '10px'
              }}
            >
              <span>{TEMPLATES[templateType]?.name}</span>
              <span className="spec-dot">&bull;</span>
              <span>CR80 ISO/IEC 7810 ID-1 (85.60 &times; 53.98 mm)</span>
              <span className="spec-dot">&bull;</span>
              <span>Corner Radius: 3.18mm</span>
            </div>
          </div>

          {/* ==================================================================
              RIGHT SIDEBAR: EXPORTS, STATUS & ADMIN STUDIO BG
              ================================================================== */}
          <div
            className="designer-right-panel glass-panel"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            {/* Status Card */}
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
                Design Status
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: designStatus === 'approved'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : designStatus === 'submitted' || designStatus === 'in_review'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'var(--elevated-surface)',
                  border: '1px solid var(--border-color)',
                  color: designStatus === 'approved' ? '#10b981' : designStatus === 'submitted' ? '#d97706' : 'var(--text-primary)'
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: designStatus === 'approved' ? '#10b981' : designStatus === 'submitted' ? '#f59e0b' : '#94a3b8'
                  }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {designStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* High-Resolution Artwork Exports - ADMIN ONLY */}
            {isAdmin && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Industrial Artwork Export
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-purple)', fontWeight: 700 }}>Admin Only</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleDownloadBothSides}
                    className="btn btn-secondary btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      background: 'rgba(168, 85, 247, 0.12)',
                      borderColor: 'rgba(168, 85, 247, 0.35)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <Download size={14} color="var(--accent-purple)" />
                    <span style={{ fontWeight: 600 }}>Download Both Sides (Combined PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyArtwork('both')}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    {copiedClipboard ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedClipboard ? 'Artwork Copied to Clipboard!' : 'Copy Artwork to Clipboard'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportPNG('front')}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <Download size={14} />
                    <span>Download Front (300 DPI PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportPNG('back')}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <Download size={14} />
                    <span>Download Back (300 DPI PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <FileCheck size={14} />
                    <span>{isExporting ? 'Generating PDF...' : 'Export Print-Ready PDF'}</span>
                  </button>
                </div>

                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                  Generates vector double-sided PDF with standard 3mm bleed margin and trim crop marks suitable for industrial printers.
                </p>
              </div>
            )}

            {/* Admin-Only Studio Background Control */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Studio Environment
                </div>
                {isAdmin ? (
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-purple)', fontWeight: 700 }}>Admin Access</span>
                ) : (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Lock size={10} /> Locked
                  </span>
                )}
              </div>

              {isAdmin ? (
                <div>
                  <label className="btn btn-secondary btn-sm" style={{ width: '100%', cursor: 'pointer', fontSize: '0.75rem', justifyContent: 'center' }}>
                    <Upload size={13} />
                    <span>Upload Global Studio BG</span>
                    <input type="file" accept="image/*" onChange={handleStudioBgUpload} style={{ display: 'none' }} />
                  </label>

                  <button
                    type="button"
                    onClick={() => resetStudioBg(user?.role)}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', marginTop: '6px', fontSize: '0.72rem' }}
                  >
                    Reset Studio Background
                  </button>

                  {adminBgMessage && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: '6px' }}>
                      {adminBgMessage}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Permanent studio ambiance is configured globally by platform administrators.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Hidden Master Renderers for Front & Back 300 DPI Generation */}
        <div style={{ display: 'none' }}>
          <CardCanvas
            side="front"
            templateType={templateType}
            edition={edition}
            config={combinedConfig}
            canvasRef={frontExportCanvasRef}
          />
          <CardCanvas
            side="back"
            templateType={templateType}
            edition={edition}
            config={combinedConfig}
            canvasRef={backExportCanvasRef}
          />
        </div>
      </div>


      {/* Customer Login Required Modal */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 3, 10, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '32px 28px',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, rgba(23, 16, 32, 0.98), rgba(13, 9, 21, 0.98))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(107, 0, 255, 0.25)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(107, 0, 255, 0.2)',
                border: '1px solid var(--accent-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--accent-purple)'
              }}
            >
              <Lock size={26} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
              Sign In to Submit Design
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '24px' }}>
              Your design draft has been safely saved! To submit your card for high-resolution print review and production, please log in or create a customer account.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/login?redirect=/designer&submit=true');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <span>Log In to Existing Account</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/login?tab=signup&redirect=/designer&submit=true');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <span>Create New Account</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', marginTop: '6px', fontSize: '0.8rem' }}
              >
                Keep Editing Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Admin Panel Order Submission Modal */}
      {showOrderSubmittedModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 3, 10, 0.88)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '32px 28px',
              borderRadius: '24px',
              background: 'linear-gradient(145deg, rgba(23, 16, 35, 0.98), rgba(12, 8, 20, 0.98))',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 50px rgba(107, 0, 255, 0.3)',
              position: 'relative'
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowOrderSubmittedModal(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            >
              <X size={16} />
            </button>

            {/* Header Icon & Title */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(34, 197, 94, 0.2))',
                  border: '1.5px solid rgba(168, 85, 247, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)'
                }}
              >
                <PackageCheck size={32} color="#A855F7" />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
                Order Sent Directly to Admin Panel!
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Your custom smart card design has been received and queued in the production & manufacturing pipeline.
              </p>
            </div>

            {/* Order Reference & Specs Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Order Reference</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#D8B4FE', fontFamily: 'monospace' }}>
                  {submittedOrder?.orderReference || submittedOrder?.id || 'FLC-ORD-PENDING'}
                </span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Customer</span>
                <span style={{ fontSize: '0.84rem', color: '#ffffff', fontWeight: 600 }}>{user?.name || frontConfig.name || 'Valued Client'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Card Title</span>
                <span style={{ fontSize: '0.84rem', color: '#ffffff', fontWeight: 600, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {submittedOrder?.designTitle || designTitle}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Finish Edition</span>
                <span style={{ fontSize: '0.84rem', color: EDITIONS[edition]?.accentColor || '#A855F7', fontWeight: 700 }}>
                  {EDITIONS[edition]?.name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Authoritative Price</span>
                <span style={{ fontSize: '0.92rem', color: '#FFFFFF', fontWeight: 800 }}>
                  {formatCurrencyINR(currentEditionProduct?.price) || 'Price coming soon'}
                </span>
              </div>
            </div>

            {/* 6-Stage Progress Indicator Preview */}
            <div
              style={{
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '16px',
                padding: '14px 16px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="#4ade80" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4ade80' }}>
                    Stage 1 of 6: Design Submitted
                  </span>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>In Admin Queue</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                The operations team will verify your safe-zone bleed, prep laser vector engraving, and embed the NXP NTAG216 chip. Once delivered, your digital profile & NFC routing will activate instantly.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowOrderSubmittedModal(false);
                  const targetUrl = submittedOrder?.id
                    ? `/customer?tab=orders&orderId=${submittedOrder.id}`
                    : '/customer?tab=orders';
                  window.history.pushState({}, '', targetUrl);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px 18px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  gap: '8px'
                }}
              >
                <span>Track Order in Customer Dashboard</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={handleDownloadBothSides}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '10px 16px',
                  fontSize: '0.84rem',
                  gap: '8px'
                }}
                title="Download high-resolution dual-sided 300 DPI production files"
              >
                <Download size={15} color="var(--accent-purple)" />
                <span>Download Print Artwork (300 DPI)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOrderSubmittedModal(false)}
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '9px' }}
              >
                Return to Card Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive layout styles for mobile/tablet */}
      <style>{`
        @media (max-width: 1080px) {
          .designer-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            align-items: start !important;
          }
          .designer-canvas-center {
            order: -1;
            position: sticky !important;
            top: calc(var(--header-height, 70px) + 8px) !important;
            z-index: 40 !important;
            background: rgba(12, 9, 18, 0.96) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(168, 85, 247, 0.3) !important;
            border-radius: 16px !important;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85) !important;
            padding: 12px 10px 14px !important;
            min-height: auto !important;
          }
          .designer-canvas-viewport-box {
            margin: 6px auto !important;
          }
          .canvas-view-toolbar {
            position: relative !important;
            top: auto !important;
            margin: 0 auto 8px auto !important;
            padding: 4px 8px !important;
            transform: scale(0.92);
          }
          .canvas-spec-bar {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .designer-studio-page {
            padding-top: calc(var(--header-height) + 8px) !important;
            padding-bottom: 40px !important;
          }
          .designer-studio-page .container {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
          .designer-top-bar {
            padding: 12px 14px !important;
            gap: 12px !important;
          }
          .designer-title-row {
            width: 100% !important;
            gap: 8px !important;
          }
          .badge-tag {
            font-size: 0.65rem !important;
            padding: 2px 8px !important;
          }
          .designer-title-input {
            font-size: 0.95rem !important;
            min-width: 0 !important;
          }
          .designer-action-group {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .designer-save-msg {
            grid-column: span 2;
            text-align: center;
            justify-content: center;
          }
          .designer-btn {
            width: 100% !important;
            min-height: 40px !important;
            padding: 8px 10px !important;
            font-size: 0.78rem !important;
            justify-content: center !important;
          }
          .canvas-view-toolbar {
            position: relative !important;
            top: auto !important;
            margin: 0 auto 10px auto !important;
            padding: 4px 8px !important;
            gap: 6px !important;
            max-width: 100% !important;
            width: auto !important;
            justify-content: center !important;
          }
          .canvas-view-toolbar button {
            font-size: 0.7rem !important;
            padding: 4px 6px !important;
          }
          .designer-canvas-center {
            padding: 10px 6px 12px !important;
            min-height: auto !important;
          }
          .canvas-spec-bar {
            display: none !important;
          }
          .designer-left-panel,
          .designer-right-panel {
            padding: 16px 12px !important;
            border-radius: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
