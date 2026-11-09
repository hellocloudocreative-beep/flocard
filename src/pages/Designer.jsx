/* ==========================================================================
   FLOCARD INTERACTIVE CARD DESIGNER STUDIO
   Premium Dark Violet Studio UI matching reference image
   Supports Theme 1 (Pages 1–3) & Theme 2 (Pages 4–6), Signature Finishes,
   CR80 Real-Time 3D/2D NFC Preview, GradientASCII horizon background,
   SwipeToast notifications, SlideCommit for print submission & 300 DPI exports.
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
  Layers,
  QrCode,
  Radio,
  FileText,
  ChevronDown,
  Save,
  ArrowRight,
  ExternalLink,
  Palette,
  Image as ImageIcon,
  AlertTriangle,
  RefreshCw,
  Lock,
  Type,
  X,
  Copy,
  Share2,
  CheckCircle2,
  ShieldCheck,
  PackageCheck,
  Sun,
  Moon,
  ChevronLeft,
  ChevronUp,
  Sliders,
  Box,
  Maximize2,
  ZoomIn,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CardCanvas from '../components/CardCanvas';
import Card3DPreview from '../components/Card3DPreview';
import GradientASCII from '../components/GradientASCII';
import SwipeToast from '../components/SwipeToast';
import SlideCommit from '../components/SlideCommit';
import OrderSummaryPrintModal from '../components/designer/OrderSummaryPrintModal';
import SmartLogoEditorModal from '../components/designer/SmartLogoEditorModal';

import { EDITIONS, TEMPLATES, BRAND } from '../lib/constants';
import {
  exportCardPDF,
  downloadCanvasPNG,
  downloadBothSides,
  downloadArtworkFile,
  createCombinedArtworkCanvas,
  copyCanvasToClipboard,
  removeLogoBackground
} from '../lib/pdfExport';
import { uploadImage } from '../lib/uploadImage';
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
  setHoveredFont,
  isLight = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
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
      // Auto-detect available viewport space
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 230 && rect.top > 230) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, fieldName, setHoveredFont]);

  const isFieldHovered = hoveredFont?.field === fieldName;
  const displayFont = isFieldHovered ? hoveredFont.font : (value || 'Space Grotesk');

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 99999 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 600 }}>{label}</span>
        {isFieldHovered ? (
          <span style={{ fontSize: '0.66rem', color: '#10B981', fontWeight: 600 }}>
            Hovering: {hoveredFont.font}
          </span>
        ) : (
          <span style={{ fontSize: '0.7rem', color: isLight ? '#7038f8' : '#cda5ff', fontWeight: 600 }}>
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
          padding: '8px 12px',
          background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.04)',
          border: isFieldHovered
            ? '1.5px solid #10B981'
            : isOpen
              ? '1.5px solid #7038f8'
              : isLight
                ? '1px solid rgba(112, 56, 248, 0.25)'
                : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: isLight ? '#1e1040' : '#f8fafc',
          cursor: 'pointer',
          textAlign: 'left',
          boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ fontFamily: `"${displayFont}", sans-serif`, fontSize: '0.82rem', fontWeight: 600 }}>
          {displayFont}
        </span>
        <ChevronDown size={14} style={{ color: isLight ? '#7038f8' : '#94a3b8', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...(openUpward ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
            left: 0,
            right: 0,
            zIndex: 999999,
            background: isLight ? '#FFFFFF' : '#130d22',
            border: isLight ? '1.5px solid rgba(112, 56, 248, 0.35)' : '1px solid rgba(112, 56, 248, 0.4)',
            borderRadius: '10px',
            boxShadow: isLight ? '0 16px 40px rgba(112, 56, 248, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)' : '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(112, 56, 248, 0.3)',
            padding: '6px',
            maxHeight: '220px',
            overflowY: 'auto',
            backdropFilter: 'blur(20px)'
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
                  background: isThisHovered
                    ? (isLight ? 'rgba(112, 56, 248, 0.12)' : 'rgba(112, 56, 248, 0.35)')
                    : isSelected
                      ? (isLight ? 'rgba(112, 56, 248, 0.08)' : 'rgba(112, 56, 248, 0.2)')
                      : 'transparent',
                  transform: isThisHovered ? 'translateX(3px)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: `"${font.id}", sans-serif`, fontSize: '0.82rem', fontWeight: 600, color: isLight ? '#1e1040' : '#f8fafc' }}>
                    {font.name}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                    {font.style}
                  </span>
                </div>
                {isSelected && <Check size={14} color="#7038f8" />}
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
  const { isLight, toggleTheme } = useTheme();
  const {
    saveDesign,
    designs,
    products,
    studioBackground,
    updateStudioBackground,
    resetStudioBg,
    createOrderFromDesign,
    submitPrintOrder,
    getProductByEdition,
    orders,
    saveAdminOrderDesign
  } = useData();

  // URL query params
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const initialEdition = urlParams.get('edition') || 'purple';
  const initialTemplate = urlParams.get('template') || 'standard';
  const initialTagline = urlParams.get('tagline');
  const initialFont = urlParams.get('font');
  const initialDesignId = urlParams.get('id');
  const editingOrderId = urlParams.get('orderId');
  const isAdminEditMode = urlParams.get('mode') === 'admin_edit' || Boolean(editingOrderId && isAdmin);

  const editingOrder = editingOrderId
    ? (orders || []).find(o => o.id === editingOrderId || o.orderReference === editingOrderId) ||
      (typeof window !== 'undefined' && window.StorageEngine ? window.StorageEngine.getOrderById(editingOrderId) : null)
    : null;

  const orderDesignSource = editingOrder
    ? (editingOrder.editedDesign || editingOrder.design || {
        front: editingOrder.frontConfig || {},
        back: editingOrder.backConfig || {},
        customColors: editingOrder.customColors || {},
        customerLogo: editingOrder.customerLogo,
        flocardLogo: editingOrder.flocardLogo,
        templateType: editingOrder.templateType,
        edition: editingOrder.edition,
        title: editingOrder.designTitle
      })
    : null;

  const existingDesign = orderDesignSource || (initialDesignId ? (designs || []).find(d => d.id === initialDesignId) : null);

  // Active products configured by admin (hidden if disabled)
  const activeProducts = (products || [])
    .filter(p => p.status !== 'disabled' && p.isActive !== false)
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  const activeEditionKeys = activeProducts.map(p => p.editionKey);

  // Active template: 'standard' | 'customer_logo'
  const [templateType, setTemplateType] = useState(
    existingDesign?.templateType || initialTemplate
  );

  // Active signature finish: 'platinum' | 'purple' | 'gold' | 'metal' | 'white'
  const [edition, setEdition] = useState(() => {
    const candidate = existingDesign?.edition || initialEdition;
    if (activeEditionKeys.length > 0 && !activeEditionKeys.includes(candidate)) {
      return activeEditionKeys[0];
    }
    return candidate;
  });

  useEffect(() => {
    if (activeEditionKeys.length > 0 && !activeEditionKeys.includes(edition)) {
      handleEditionChange(activeEditionKeys[0]);
    }
  }, [activeEditionKeys, edition]);

  const currentEditionProduct = getProductByEdition(edition);

  const [side, setSide] = useState('front'); // 'front' | 'back'
  const [previewMode, setPreviewMode] = useState('front'); // 'front' | 'back' | 'angled' | 'floating' | 'close-up'
  const [showGuides, setShowGuides] = useState(false);
  const [showBleed, setShowBleed] = useState(false);
  const [dynamicLighting, setDynamicLighting] = useState(true);
  const [is3DPreview, setIs3DPreview] = useState(true);

  // Active element tab in step 3: 'text' | 'logo' | 'nfc' | 'qr'
  const [activeElementTab, setActiveElementTab] = useState('text');

  // SwipeToast feedback state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', desc: '', actionLabel: '', onAction: null });

  const notify = (title, desc = '', actionLabel = '', onAction = null) => {
    setToastMessage({ title, desc, actionLabel, onAction });
    setToastOpen(true);
  };

  const [isExporting, setIsExporting] = useState(false);
  const [logoWarning, setLogoWarning] = useState(false);
  const [adminBgMessage, setAdminBgMessage] = useState('');
  const [hoveredFont, setHoveredFont] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOrderSummaryModal, setShowOrderSummaryModal] = useState(false);
  const [showOrderSubmittedModal, setShowOrderSubmittedModal] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  // Helper to dynamically format card name
  const getDynamicCardTitle = (name, editionKey) => {
    const raw = (name || user?.name || 'Customer').trim();
    const edName = EDITIONS[editionKey]?.name || 'Purple Edition';
    return `${raw}'s FLOCARD`;
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

  // Mobile scroll tracking and preview pop-up
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobilePreviewCollapsed, setMobilePreviewCollapsed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 120);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const BASE_CARD_WIDTH = 560;
  const BASE_CARD_HEIGHT = Math.round(560 / 1.585); // 353px
  const maxAvailableCardWidth = Math.max(260, Math.min(BASE_CARD_WIDTH, viewportWidth - (viewportWidth < 640 ? 40 : 80)));
  const fitScale = Math.min(1, maxAvailableCardWidth / BASE_CARD_WIDTH);
  const [mobileTab, setMobileTab] = useState('preview'); // 'preview' | 'customise' | 'specs'
  const activeCardScale = viewportWidth < 1024 && mobileTab !== 'preview'
    ? Math.min(0.55, Math.max(0.44, (viewportWidth - 28) / BASE_CARD_WIDTH))
    : fitScale;

  // Prompt sign up if guest visits Design Studio directly
  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
    }
  }, [user]);

  // Theme-aware styles for panels, inputs, and text
  const panelBg = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(17, 12, 28, 0.75)';
  const panelBorder = isLight ? '1px solid rgba(112, 56, 248, 0.2)' : '1px solid rgba(112, 56, 248, 0.16)';
  const panelShadow = isLight ? '0 4px 24px rgba(112, 56, 248, 0.08)' : 'none';
  const headingColor = isLight ? '#1e1040' : '#f8fafc';
  const subtextColor = isLight ? '#64748b' : '#94a3b8';
  const inputBg = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const inputBorder = isLight ? '1px solid rgba(112, 56, 248, 0.24)' : '1px solid rgba(255, 255, 255, 0.08)';
  const inputColor = isLight ? '#1e1040' : '#ffffff';

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

  // Customer Logo state
  const [customerLogo, setCustomerLogo] = useState({
    url: existingDesign?.customerLogo?.url || (typeof existingDesign?.customerLogo === 'string' ? existingDesign.customerLogo : existingDesign?.front?.customLogo) || null,
    originalUrl: existingDesign?.customerLogo?.originalUrl || existingDesign?.customerLogo?.url || (typeof existingDesign?.customerLogo === 'string' ? existingDesign.customerLogo : existingDesign?.front?.customLogo) || null,
    transparentUrl: existingDesign?.customerLogo?.transparentUrl || existingDesign?.customerLogo?.url || (typeof existingDesign?.customerLogo === 'string' ? existingDesign.customerLogo : null),
    size: existingDesign?.customerLogo?.size ?? 100,
    rotation: existingDesign?.customerLogo?.rotation ?? 0,
    posX: existingDesign?.customerLogo?.posX ?? 0,
    posY: existingDesign?.customerLogo?.posY ?? 0,
    showCircleBadge: existingDesign?.customerLogo?.showCircleBadge ?? true
  });
  const [showSmartLogoModal, setShowSmartLogoModal] = useState(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);

  // FLOCARD Logo state
  const [flocardLogo, setFlocardLogo] = useState({
    size: existingDesign?.flocardLogo?.size ?? 100,
    position: existingDesign?.flocardLogo?.position || (templateType === 'customer_logo' ? 'bottom-right' : 'top-left')
  });

  // Dynamic user slug / name handling
  const defaultUserSlug = user?.profileSlug || (user?.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'your-name');
  const defaultDisplayName = user?.name || (user ? 'VALUED CLIENT' : 'YOUR NAME');

  // Front side configuration
  const [frontConfig, setFrontConfig] = useState({
    name: existingDesign?.front?.name || defaultDisplayName,
    role: existingDesign?.front?.role || 'CEO & FOUNDER',
    details: existingDesign?.front?.details || '',
    tagline: existingDesign?.front?.tagline || initialTagline || '',
    showTagline: existingDesign?.front?.showTagline ?? Boolean(existingDesign?.front?.tagline || initialTagline),
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
    qrUrl: existingDesign?.back?.qrUrl || `https://flocard.in/p/${defaultUserSlug}`,
    subtext: existingDesign?.back?.subtext || 'SCAN ME',
    showNfcSpecs: existingDesign?.back?.showNfcSpecs ?? true,
    specsText: existingDesign?.back?.specsText || 'NFC | PORTFOLIO | CONTACT | CONNECT',
    brandUrl: existingDesign?.back?.brandUrl || `flocard.in/${defaultUserSlug}`
  });

  const [designTitle, setDesignTitle] = useState(
    existingDesign?.title || getDynamicCardTitle(existingDesign?.front?.name || defaultDisplayName, existingDesign?.edition || initialEdition)
  );
  const [designStatus, setDesignStatus] = useState(existingDesign?.status || 'draft');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync destination link when name changes if not manually detached
  const handleNameChange = (newName) => {
    setFrontConfig(prev => ({ ...prev, name: newName }));
    const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'your-name';
    setBackConfig(prev => {
      const currentUrl = prev.qrUrl || '';
      if (!currentUrl || currentUrl.includes('/your-name') || currentUrl.includes('/p/your-name') || currentUrl.includes('/akhil') || currentUrl.includes('/alex') || currentUrl.startsWith('https://flocard.in')) {
        return {
          ...prev,
          qrUrl: `https://flocard.in/${slug}`,
          brandUrl: `flocard.in/${slug}`
        };
      }
      return prev;
    });
  };

  // Mark changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [frontConfig, backConfig, customColors, customerLogo, flocardLogo, templateType, edition]);

  // Hidden export canvases for 300 DPI exports
  const frontExportCanvasRef = useRef(null);
  const backExportCanvasRef = useRef(null);
  const customerLogoInputRef = useRef(null);

  // Switch edition
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
    notify(`${EDITIONS[newEdition]?.name || 'Edition'} Applied`, 'Palette and signature finish updated');
  };

  // Switch Text / Typography Color (Black, Gold, etc.)
  const handleTextColorChange = (hex, label = '') => {
    const isGold = hex.toLowerCase() === '#e9c766' || hex.toLowerCase() === '#d4af37';
    setCustomColors(prev => ({
      ...prev,
      nameColor: hex,
      roleColor: isGold ? '#B8860B' : (hex === '#000000' ? '#1A1A1A' : hex),
      detailsColor: isGold ? '#B8860B' : (hex === '#000000' ? '#1A1A1A' : hex),
      taglineColor: isGold ? '#996515' : (hex === '#000000' ? '#475569' : hex),
      primaryAccent: hex,
      nfcColor: hex,
      qrColor: edition === 'white' ? (isGold ? '#D4AF37' : '#000000') : prev.qrColor
    }));
    notify('Text Color Updated', `Card typography color set to ${label || hex}`);
  };

  // Switch template
  const handleTemplateChange = (newTemplate) => {
    setTemplateType(newTemplate);
    if (newTemplate === 'customer_logo') {
      setFlocardLogo(prev => ({ ...prev, position: 'bottom-right' }));
    } else {
      setFlocardLogo(prev => ({ ...prev, position: 'top-left' }));
    }
    notify(newTemplate === 'customer_logo' ? 'Custom Logo Design Layout' : 'Standard Design Layout', 'Card layout updated');
  };

  // Upload logo with Automatic AI Background Removal
  const handleCustomerLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|svg|webp|gif|bmp|avif)$/i.test(file.name);
    if (!isImage) {
      alert('Please upload a valid image file (PNG, SVG, JPG, or WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please select a smaller file.');
      return;
    }

    setIsProcessingLogo(true);
    notify('Processing Logo', 'Analyzing image & automatically removing background...');

    const reader = new FileReader();
    reader.onload = async () => {
      const originalDataUrl = reader.result;
      let finalTransparentUrl = originalDataUrl;
      let isAlreadyTrans = false;

      try {
        const bgRes = await removeLogoBackground(originalDataUrl, {
          tolerance: 36,
          feather: 16,
          forceOpaqueRemoval: false
        });
        if (bgRes && bgRes.dataUrl) {
          finalTransparentUrl = bgRes.dataUrl;
          isAlreadyTrans = Boolean(bgRes.alreadyTransparent);
        }
      } catch (err) {
        console.warn('[Designer] Auto background removal error:', err);
      }

      const updatedLogoConfig = {
        url: finalTransparentUrl,
        originalUrl: originalDataUrl,
        transparentUrl: finalTransparentUrl,
        size: 100,
        rotation: 0,
        posX: 0,
        posY: 0,
        showCircleBadge: true
      };

      setCustomerLogo(updatedLogoConfig);
      setFrontConfig(prev => ({ ...prev, customLogo: finalTransparentUrl }));
      setTemplateType('customer_logo');
      setSide('front');
      setIsProcessingLogo(false);

      if (isAlreadyTrans) {
        notify('Transparent Logo Loaded', 'Authentic alpha channel preserved on card');
      } else {
        notify('✓ Background Removed!', 'High-quality transparent PNG placed on card');
      }

      // Background upload to Supabase Storage if user session exists
      if (user?.id) {
        try {
          uploadImage(file, 'logo', user.id).then(publicOrigUrl => {
            if (publicOrigUrl) {
              setCustomerLogo(prev => ({ ...prev, originalUrl: publicOrigUrl }));
            }
          }).catch(console.warn);
        } catch (e) {
          console.warn('[Designer] Storage upload background catch:', e);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [isRemovingLogoBg, setIsRemovingLogoBg] = useState(false);
  const handleRemoveLogoBg = async () => {
    const sourceUrl = customerLogo.originalUrl || customerLogo.url;
    if (!sourceUrl) return;
    setIsRemovingLogoBg(true);
    notify('Processing Logo', 'Removing background and synthesizing transparent PNG...');
    try {
      const res = await removeLogoBackground(sourceUrl, { forceOpaqueRemoval: true, tolerance: 38, feather: 16 });
      if (res && res.dataUrl) {
        setCustomerLogo(prev => ({
          ...prev,
          url: res.dataUrl,
          transparentUrl: res.dataUrl
        }));
        setFrontConfig(prev => ({ ...prev, customLogo: res.dataUrl }));
        notify('Background Removed', 'Transparent logo applied to card');
      }
    } catch (err) {
      notify('Error', err.message || 'Failed to remove background');
    } finally {
      setIsRemovingLogoBg(false);
    }
  };

  // Save design to account or submit for print
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

    if (editingOrder) {
      const updatedDesign = {
        title: designTitle,
        templateType,
        edition,
        customColors,
        customerLogo,
        flocardLogo,
        front: frontConfig,
        back: backConfig,
        status: 'approved'
      };

      if (saveAdminOrderDesign) {
        saveAdminOrderDesign(editingOrder.id, updatedDesign, user, { publishToCustomer: true });
      }
      setHasUnsavedChanges(false);
      notify(
        'Order Design Updated',
        `Artwork revisions saved to ${editingOrder.orderReference} and published to customer.`,
        'Back to Admin',
        () => { window.location.href = '/admin?tab=orders'; }
      );
      return;
    }

    const newStatus = submit ? 'submitted' : designStatus;
    const clientName = user?.name || frontConfig.name || '';
    const clientSlug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
    const designObj = {
      id: existingDesign?.id || `des_${Date.now()}`,
      customerId: user?.id || (user?.email ? `cust_${user.email}` : `cust_${Date.now()}`),
      customerName: clientName || 'Valued Client',
      customerEmail: user?.email || (user?.id ? `${clientSlug}@example.com` : ''),
      customerPhone: user?.phone || '',
      company: user?.company || frontConfig.company || '',
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
    setHasUnsavedChanges(false);

    if (submit) {
      setShowOrderSummaryModal(true);
    } else {
      notify('Draft Saved', 'Card design stored to your account');
    }
  };

  // Handle preview mode change
  const handlePreviewModeSelect = (mode) => {
    setPreviewMode(mode);
    if (mode === 'front') {
      setSide('front');
    } else if (mode === 'back') {
      setSide('back');
    }
  };

  // Download both sides
  const handleDownloadBothSides = () => {
    downloadBothSides({
      frontCanvas: frontExportCanvasRef.current,
      backCanvas: backExportCanvasRef.current,
      designName: designTitle,
      editionName: EDITIONS[edition]?.name
    });
  };

  // Share link
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: designTitle,
          text: `Check out my FLOCARD NFC Business Card design: ${frontConfig.name} - ${frontConfig.role}`,
          url: window.location.href
        });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      notify('Link Copied', 'Share URL copied to clipboard');
    }
  };

  // Combined config for CardCanvas
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

  // Calculate dynamic 3D transform based on selected thumbnail preview mode
  const getPreviewTransform = () => {
    if (viewportWidth < 1024) return 'none';
    if (previewMode === 'angled') {
      return 'perspective(1200px) rotateY(-24deg) rotateX(12deg) scale(0.96)';
    }
    if (previewMode === 'floating') {
      return 'perspective(1000px) translateY(-14px) rotateX(6deg) scale(1.02)';
    }
    if (previewMode === 'close-up') {
      return 'scale(1.28)';
    }
    return 'none';
  };

  return (
    <div
      className="flocard-studio-root"
      style={{
        minHeight: '100vh',
        background: isLight ? '#f3f0ff' : '#07050d',
        color: isLight ? '#1e1040' : '#f8fafc',
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
        overflowX: 'clip',
        paddingBottom: viewportWidth < 1024 ? '100px' : '60px'
      }}
    >
      {/* Admin Order Revision Banner */}
      {editingOrder && (
        <div
          style={{
            backgroundColor: '#7038F8',
            color: '#FFFFFF',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 4px 16px rgba(112, 56, 248, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} />
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                Admin Artwork Revision Mode: Order {editingOrder.orderReference} ({editingOrder.customerName})
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                Original customer submission is permanently preserved in version history.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleSaveDesign(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#7038F8',
                fontWeight: 700,
                fontSize: '0.78rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Save size={14} />
              <span>Save & Publish to Order</span>
            </button>
            <a
              href="/admin?tab=orders"
              style={{
                color: '#FFFFFF',
                fontSize: '0.78rem',
                textDecoration: 'underline',
                fontWeight: 500
              }}
            >
              Back to Orders
            </a>
          </div>
        </div>
      )}

      {/* ======================================================================
          1. TOP NAVIGATION BAR (Refined Floating Dark Glass)
          ====================================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: isLight ? 'rgba(255, 255, 255, 0.97)' : 'rgba(7, 5, 13, 0.97)',
          borderBottom: isLight ? '1px solid rgba(112, 56, 248, 0.18)' : '1px solid rgba(112, 56, 248, 0.16)',
          padding: viewportWidth < 640 ? '10px 16px' : '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}
      >
        {/* Left: FLOCARD Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: '1.25rem',
                letterSpacing: '0.08em',
                color: '#ffffff'
              }}
            >
              FLOCARD
            </span>
          </a>
        </div>

        {/* Center: Stage Nav Tabs — hidden on mobile (replaced by mobile tab bar below) */}
        {viewportWidth >= 768 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: isLight ? 'rgba(112, 56, 248, 0.07)' : 'rgba(18, 14, 28, 0.85)',
              border: isLight ? '1px solid rgba(112, 56, 248, 0.22)' : '1px solid rgba(112, 56, 248, 0.2)',
              borderRadius: '9999px',
              padding: '3px 4px',
              gap: '2px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(112, 56, 248, 0.24)',
                border: '1px solid rgba(139, 92, 246, 0.5)',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Sparkles size={13} color="#cda5ff" />
              <span>Design</span>
            </button>

            <button
              type="button"
              onClick={() => handlePreviewModeSelect(side === 'front' ? 'angled' : 'front')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'transparent',
                border: 'none',
                color: isLight ? '#6b21d8' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <Eye size={13} />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveElementTab('text')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'transparent',
                border: 'none',
                color: isLight ? '#6b21d8' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <FileText size={13} />
              <span>Details</span>
            </button>

            <a
              href="/checkout"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'transparent',
                border: 'none',
                color: isLight ? '#6b21d8' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={13} />
              <span>Checkout</span>
            </a>
          </div>
        )}

        {/* Right: Theme Toggle, Save Draft */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={toggleTheme}
            title="Toggle Theme"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isLight ? 'rgba(112, 56, 248, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              border: isLight ? '1px solid rgba(112, 56, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isLight ? '#6b21d8' : '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {isLight ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          <button
            type="button"
            onClick={() => handleSaveDesign(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: viewportWidth < 640 ? '8px 10px' : '8px 16px',
              borderRadius: '9999px',
              background: isLight ? 'rgba(112, 56, 248, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              border: isLight ? '1px solid rgba(112, 56, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.12)',
              color: isLight ? '#4a1a99' : '#f1f5f9',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Save size={14} />
            {viewportWidth >= 640 && <span>Save Draft</span>}
          </button>
        </div>
      </header>

      {/* Main Studio Container */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: viewportWidth < 640 ? '12px 12px' : '16px 20px' }}>

        {/* ====================================================================
            2. PROJECT INFORMATION BAR
            ==================================================================== */}
        {/* ====================================================================
            2. PROJECT INFORMATION BAR (Mobile Responsive)
            ==================================================================== */}
        <div
          className="studio-project-bar"
          style={{
            display: 'flex',
            flexDirection: viewportWidth < 768 ? 'column' : 'row',
            alignItems: viewportWidth < 768 ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: viewportWidth < 768 ? '10px' : '12px',
            background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(16, 12, 26, 0.7)',
            border: isLight ? '1px solid rgba(112, 56, 248, 0.22)' : '1px solid rgba(112, 56, 248, 0.18)',
            borderRadius: '16px',
            padding: viewportWidth < 768 ? '10px 14px' : '10px 16px',
            marginBottom: '16px',
            backdropFilter: 'blur(16px)',
            boxShadow: isLight ? '0 4px 20px rgba(112, 56, 248, 0.08)' : '0 6px 24px rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* Row 1 on mobile / Left group on desktop */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: viewportWidth < 768 ? '100%' : 'auto', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.history.back()}
                title="Go back"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isLight ? 'rgba(112, 56, 248, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                  border: isLight ? '1px solid rgba(112, 56, 248, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isLight ? '#1e1040' : '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  background: isLight ? 'rgba(112, 56, 248, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                  border: isLight ? '1px solid rgba(112, 56, 248, 0.2)' : '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isLight ? '#1e1040' : '#e2e8f0'
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: EDITIONS[edition]?.accentColor || '#7038f8',
                    boxShadow: `0 0 8px ${EDITIONS[edition]?.accentColor || '#7038f8'}`
                  }}
                />
                <span>{EDITIONS[edition]?.name || 'Purple Edition'}</span>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  background: 'rgba(112, 56, 248, 0.18)',
                  border: '1px solid rgba(112, 56, 248, 0.35)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#cda5ff'
                }}
              >
                {formatCurrencyINR(currentEditionProduct?.price) || '₹1,899'}
              </div>
            </div>

            {/* On mobile: share and save buttons reside on Row 1 right side */}
            {viewportWidth < 768 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleShare}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    fontSize: '0.74rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  <Share2 size={12} />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveDesign(false)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#f8fafc',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Save size={12} />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>

          {/* Row 2 on mobile / Center on desktop: Card Name + Draft badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: viewportWidth < 768 ? 'space-between' : 'center',
              gap: '10px',
              width: viewportWidth < 768 ? '100%' : 'auto',
              borderTop: viewportWidth < 768 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
              paddingTop: viewportWidth < 768 ? '8px' : '0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
              <Sparkles size={15} color="#cda5ff" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={designTitle}
                onChange={(e) => setDesignTitle(e.target.value)}
                title="Click to rename design"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isLight ? '#1e1040' : '#ffffff',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: viewportWidth < 768 ? '0.92rem' : '1rem',
                  letterSpacing: '0.04em',
                  outline: 'none',
                  width: '100%',
                  minWidth: 0,
                  textAlign: viewportWidth < 768 ? 'left' : 'center'
                }}
              />
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: hasUnsavedChanges ? 'rgba(245, 165, 36, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                border: `1px solid ${hasUnsavedChanges ? 'rgba(245, 165, 36, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                fontSize: '0.72rem',
                fontWeight: 600,
                color: hasUnsavedChanges ? '#f5a524' : '#22c55e',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: hasUnsavedChanges ? '#f5a524' : '#22c55e'
                }}
              />
              <span>{hasUnsavedChanges ? (viewportWidth < 480 ? 'Draft' : 'Draft • Unsaved') : 'Saved'}</span>
            </div>
          </div>

          {/* Desktop Right: Share, Save action */}
          {viewportWidth >= 768 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleShare}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <Share2 size={13} />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveDesign(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#f8fafc',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Save size={13} />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        {/* ====================================================================
            MOBILE SEGMENTED TAB BAR (< 1024px)
            ==================================================================== */}
        {viewportWidth < 1024 && (
          <div
            className="studio-mobile-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: isLight ? 'rgba(255, 255, 255, 0.97)' : 'rgba(11, 8, 20, 0.97)',
              border: isLight ? '1px solid rgba(112, 56, 248, 0.22)' : '1px solid rgba(112, 56, 248, 0.28)',
              borderRadius: '14px',
              padding: '4px',
              marginBottom: '16px',
              gap: '4px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              position: 'sticky',
              top: '52px',
              zIndex: 40,
              boxShadow: isLight ? '0 4px 20px rgba(112, 56, 248, 0.15)' : '0 8px 24px rgba(0, 0, 0, 0.55)'
            }}
          >
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              style={{
                flex: 1,
                padding: '9px 4px',
                borderRadius: '10px',
                border: 'none',
                background: mobileTab === 'preview' ? 'linear-gradient(135deg, #7038f8 0%, #905cfc 100%)' : 'transparent',
                color: mobileTab === 'preview' ? '#ffffff' : (isLight ? '#6b21d8' : '#94a3b8'),
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: mobileTab === 'preview' ? '0 2px 10px rgba(112, 56, 248, 0.4)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <Eye size={14} />
              <span>3D Card</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileTab('customise')}
              style={{
                flex: 1,
                padding: '9px 4px',
                borderRadius: '10px',
                border: 'none',
                background: mobileTab === 'customise' ? 'linear-gradient(135deg, #7038f8 0%, #905cfc 100%)' : 'transparent',
                color: mobileTab === 'customise' ? '#ffffff' : (isLight ? '#6b21d8' : '#94a3b8'),
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: mobileTab === 'customise' ? '0 2px 10px rgba(112, 56, 248, 0.4)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <Sparkles size={14} />
              <span>Design (1-4)</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileTab('specs')}
              style={{
                flex: 1,
                padding: '9px 4px',
                borderRadius: '10px',
                border: 'none',
                background: mobileTab === 'specs' ? 'linear-gradient(135deg, #7038f8 0%, #905cfc 100%)' : 'transparent',
                color: mobileTab === 'specs' ? '#ffffff' : (isLight ? '#6b21d8' : '#94a3b8'),
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: mobileTab === 'specs' ? '0 2px 10px rgba(112, 56, 248, 0.4)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <Layers size={14} />
              <span>Specs & Order</span>
            </button>
          </div>
        )}

        {/* ====================================================================
            3. MAIN THREE-COLUMN WORKSPACE (Responsive Stack on Mobile)
            ==================================================================== */}
        <div
          className="studio-workspace-grid"
          style={{
            display: viewportWidth < 1024 ? 'flex' : 'grid',
            flexDirection: viewportWidth < 1024 ? 'column' : undefined,
            gridTemplateColumns: viewportWidth < 1024 ? '1fr' : 'minmax(310px, 1.15fr) minmax(480px, 2.15fr) minmax(280px, 0.95fr)',
            gap: viewportWidth < 1024 ? '16px' : '20px',
            alignItems: 'start',
            width: '100%'
          }}
        >

          {/* ==================================================================
              LEFT SIDEBAR: STEP-BASED WORKFLOW (1, 2, 3, 4)
              ================================================================== */}
          <aside
            style={{
              display: viewportWidth >= 1024 || mobileTab === 'customise' ? 'flex' : 'none',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* STEP 1: Template Layout */}
            <div
              style={{
                background: panelBg,
                border: panelBorder,
                borderRadius: '16px',
                padding: '16px',
                backdropFilter: 'blur(16px)',
                boxShadow: panelShadow
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(112, 56, 248, 0.3)',
                    border: '1px solid #7038f8',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  1
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: headingColor }}>Template Layout</div>
                  <div style={{ fontSize: '0.72rem', color: subtextColor }}>Choose a design style</div>
                </div>
              </div>

              {/* Two Template Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Standard Design */}
                <button
                  type="button"
                  onClick={() => handleTemplateChange('standard')}
                  style={{
                    background: templateType === 'standard' ? (isLight ? 'rgba(112, 56, 248, 0.14)' : 'rgba(112, 56, 248, 0.2)') : (isLight ? 'rgba(112, 56, 248, 0.04)' : 'rgba(255, 255, 255, 0.03)'),
                    border: templateType === 'standard' ? '1.5px solid #7038f8' : (isLight ? '1px solid rgba(112, 56, 248, 0.18)' : '1px solid rgba(255, 255, 255, 0.08)'),
                    borderRadius: '12px',
                    padding: '12px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    boxShadow: templateType === 'standard' ? '0 0 16px rgba(112, 56, 248, 0.25)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '40px',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, #1b0e33, #0a0614)',
                      border: '1px solid rgba(112, 56, 248, 0.3)',
                      marginBottom: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '4px'
                    }}
                  >
                    <div style={{ fontSize: '0.45rem', fontWeight: 800, color: '#fff', textAlign: 'left' }}>FLOCARD</div>
                    <div style={{ height: '2px', width: '24px', background: '#7038f8', borderRadius: '1px' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isLight ? '#1e1040' : '#ffffff' }}>Standard Design</span>
                  <span style={{ fontSize: '0.66rem', color: isLight ? '#64748b' : '#94a3b8' }}>Pages 1–3</span>
                </button>

                {/* Custom Logo Design */}
                <button
                  type="button"
                  onClick={() => handleTemplateChange('customer_logo')}
                  style={{
                    background: templateType === 'customer_logo' ? (isLight ? 'rgba(112, 56, 248, 0.14)' : 'rgba(112, 56, 248, 0.2)') : (isLight ? 'rgba(112, 56, 248, 0.04)' : 'rgba(255, 255, 255, 0.03)'),
                    border: templateType === 'customer_logo' ? '1.5px solid #7038f8' : (isLight ? '1px solid rgba(112, 56, 248, 0.18)' : '1px solid rgba(255, 255, 255, 0.08)'),
                    borderRadius: '12px',
                    padding: '12px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    boxShadow: templateType === 'customer_logo' ? '0 0 16px rgba(112, 56, 248, 0.25)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '40px',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, #1a162b, #090614)',
                      border: '1px solid rgba(205, 165, 255, 0.3)',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(205, 165, 255, 0.4)', border: '1px solid #cda5ff' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isLight ? '#1e1040' : '#ffffff' }}>Custom Logo Design</span>
                  <span style={{ fontSize: '0.66rem', color: isLight ? '#64748b' : '#94a3b8' }}>Pages 4–6</span>
                </button>
              </div>
            </div>

            {/* STEP 2: Signature Finishes */}
            <div
              style={{
                background: panelBg,
                border: panelBorder,
                borderRadius: '16px',
                padding: '16px',
                backdropFilter: 'blur(16px)',
                boxShadow: panelShadow
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(112, 56, 248, 0.3)',
                      border: '1px solid #7038f8',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    2
                  </span>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: headingColor }}>Signature Finishes</div>
                    <div style={{ fontSize: '0.72rem', color: subtextColor }}>Premium colors & materials</div>
                  </div>
                </div>

                <span style={{ fontSize: '0.72rem', color: '#cda5ff', fontWeight: 600, cursor: 'pointer' }}>
                  View All &rarr;
                </span>
              </div>

              {/* Active Finishes Filtered by Admin */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max((activeEditionKeys.length || 5), 1)}, 1fr)`, gap: '8px' }}>
                {[
                  { id: 'platinum', name: 'Platinum', subtitle: 'Mirror Lustre', bg: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)', rim: '#cbd5e1' },
                  { id: 'purple', name: 'Purple', subtitle: 'Signature Matte', bg: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)', rim: '#a855f7' },
                  { id: 'gold', name: 'Gold', subtitle: 'Champagne Foil', bg: 'linear-gradient(135deg, #facc15 0%, #a16207 100%)', rim: '#eab308' },
                  { id: 'metal', name: 'Metal', subtitle: 'Gunmetal Steel', bg: 'linear-gradient(135deg, #64748b 0%, #1e293b 100%)', rim: '#94a3b8' },
                  { id: 'white', name: 'White', subtitle: 'Pearl Ceramic', bg: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)', rim: '#cbd5e1' }
                ].filter(swatch => activeEditionKeys.length === 0 || activeEditionKeys.includes(swatch.id)).map(swatch => {
                  const isSelected = edition === swatch.id;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => handleEditionChange(swatch.id)}
                      style={{
                        background: isSelected
                          ? (isLight ? 'rgba(112, 56, 248, 0.12)' : 'rgba(112, 56, 248, 0.22)')
                          : (isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)'),
                        border: isSelected
                          ? '2px solid #7038f8'
                          : `1px solid ${isLight ? 'rgba(112, 56, 248, 0.14)' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 4px',
                        boxShadow: isSelected ? '0 0 14px rgba(112, 56, 248, 0.35)' : 'none',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: swatch.bg,
                          border: isSelected ? '2px solid #7038f8' : `1.5px solid rgba(255, 255, 255, 0.3)`,
                          boxShadow: isSelected ? '0 0 10px rgba(112, 56, 248, 0.5), inset 0 2px 4px rgba(255,255,255,0.4)' : 'inset 0 2px 4px rgba(255,255,255,0.2)',
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          transition: 'all 0.18s ease'
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? (isLight ? '#7038f8' : '#ffffff') : (isLight ? '#334155' : '#D1D5DB')
                        }}
                      >
                        {swatch.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: Add Elements */}
            <div
              style={{
                background: panelBg,
                border: panelBorder,
                borderRadius: '16px',
                padding: '16px',
                backdropFilter: 'blur(16px)',
                boxShadow: panelShadow
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(112, 56, 248, 0.3)',
                    border: '1px solid #7038f8',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  3
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: headingColor }}>Add Elements</div>
                  <div style={{ fontSize: '0.72rem', color: subtextColor }}>Customize your card</div>
                </div>
              </div>

              {/* 3 Icon Buttons: Text, Logo, QR Code */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'text', label: 'Text', icon: <Type size={18} /> },
                  { id: 'logo', label: 'Logo', icon: <ImageIcon size={18} /> },
                  { id: 'qr', label: 'QR Code', icon: <QrCode size={18} /> }
                ].map(el => {
                  const isActive = activeElementTab === el.id;
                  return (
                    <button
                      key={el.id}
                      type="button"
                      onClick={() => {
                        setActiveElementTab(el.id);
                        if (el.id === 'qr') setSide('back');
                        if (el.id === 'text' || el.id === 'logo') setSide('front');
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '12px 6px',
                        borderRadius: '10px',
                        background: isActive ? (isLight ? 'rgba(112, 56, 248, 0.14)' : 'rgba(112, 56, 248, 0.25)') : (isLight ? 'rgba(112, 56, 248, 0.04)' : 'rgba(255, 255, 255, 0.03)'),
                        border: isActive ? '1.5px solid #7038f8' : (isLight ? '1px solid rgba(112, 56, 248, 0.18)' : '1px solid rgba(255, 255, 255, 0.08)'),
                        color: isActive ? (isLight ? '#7038f8' : '#ffffff') : (isLight ? '#64748b' : '#94a3b8'),
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      {el.icon}
                      <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{el.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-drawer for Logo or QR when active */}
              {activeElementTab === 'logo' && (
                <div style={{ marginTop: '12px', padding: '14px', background: isLight ? 'rgba(112, 56, 248, 0.06)' : 'rgba(255,255,255,0.03)', borderRadius: '12px', border: isLight ? '1px solid rgba(112, 56, 248, 0.15)' : '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <input ref={customerLogoInputRef} type="file" accept="image/*" onChange={handleCustomerLogoUpload} style={{ display: 'none' }} />
                  <button
                    type="button"
                    onClick={() => customerLogoInputRef.current?.click()}
                    disabled={isProcessingLogo}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      background: 'rgba(112, 56, 248, 0.2)',
                      border: '1px dashed #7038f8',
                      borderRadius: '8px',
                      color: isLight ? '#7038f8' : '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: isProcessingLogo ? 'wait' : 'pointer'
                    }}
                  >
                    <Upload size={14} />
                    <span>{isProcessingLogo ? 'Processing & Removing BG...' : (customerLogo.url ? 'Replace Logo' : 'Upload Logo (Auto BG Removal)')}</span>
                  </button>

                  {customerLogo.url && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Logo Preview & Smart Studio Trigger */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: isLight ? '#F8FAFC' : 'rgba(0,0,0,0.3)',
                          border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              backgroundColor: '#1E142B',
                              backgroundImage: `
                                linear-gradient(45deg, #2d1f42 25%, transparent 25%),
                                linear-gradient(-45deg, #2d1f42 25%, transparent 25%),
                                linear-gradient(45deg, transparent 75%, #2d1f42 75%),
                                linear-gradient(-45deg, transparent 75%, #2d1f42 75%)
                              `,
                              backgroundSize: '10px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}
                          >
                            <img src={customerLogo.url} alt="Logo" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600, display: 'block' }}>
                              ✓ Transparent Logo
                            </span>
                            <span style={{ fontSize: '0.64rem', color: '#94A3B8' }}>
                              {customerLogo.size}% scale · {customerLogo.rotation || 0}°
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowSmartLogoModal(true)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#7038F8',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(112, 56, 248, 0.4)'
                          }}
                        >
                          <Sparkles size={12} />
                          <span>Smart Studio</span>
                        </button>
                      </div>

                      {/* Transform Sliders */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: subtextColor, marginBottom: '3px' }}>
                          <span>Size ({customerLogo.size}%)</span>
                          <span>Rot ({customerLogo.rotation || 0}°)</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={customerLogo.size}
                            onChange={(e) => setCustomerLogo(prev => ({ ...prev, size: Number(e.target.value) }))}
                            style={{ width: '100%', accentColor: '#7038f8' }}
                          />
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            value={customerLogo.rotation || 0}
                            onChange={(e) => setCustomerLogo(prev => ({ ...prev, rotation: Number(e.target.value) }))}
                            style={{ width: '100%', accentColor: '#7038f8' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: subtextColor, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={customerLogo.showCircleBadge}
                            onChange={(e) => setCustomerLogo(prev => ({ ...prev, showCircleBadge: e.target.checked }))}
                            style={{ accentColor: '#7038f8' }}
                          />
                          <span>Circular Glass Badge</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setCustomerLogo(prev => ({ ...prev, url: null, originalUrl: null, transparentUrl: null }));
                            setFrontConfig(prev => ({ ...prev, customLogo: null }));
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>

                      {/* Direct 1-Click Downloads */}
                      <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255,255,255,0.06)' }}>
                        <button
                          type="button"
                          onClick={() => downloadArtworkFile(customerLogo.transparentUrl || customerLogo.url, 'FLOCARD_Logo_Transparent_300DPI.png')}
                          style={{
                            flex: 1,
                            background: isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '6px',
                            color: '#10B981',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '4px 6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Download size={11} />
                          <span>Transparent PNG</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadArtworkFile(customerLogo.originalUrl || customerLogo.url, 'FLOCARD_Logo_Original_Upload.png')}
                          style={{
                            flex: 1,
                            background: isLight ? '#F1EEF8' : 'rgba(255,255,255,0.05)',
                            border: isLight ? '1px solid #D8B4FE' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            color: isLight ? '#475569' : '#CBD5E1',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '4px 6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Download size={11} />
                          <span>Original Logo</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Destination Link Box */}
              <div style={{ marginTop: '12px', padding: '12px', background: isLight ? 'rgba(112, 56, 248, 0.06)' : 'rgba(255,255,255,0.03)', borderRadius: '10px', border: isLight ? '1px solid rgba(112, 56, 248, 0.16)' : '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: subtextColor, fontWeight: 600 }}>Destination Link</span>
                  <span style={{ fontSize: '0.66rem', color: isLight ? '#7038f8' : '#cda5ff' }}>NFC & QR Link</span>
                </div>
                <input
                  type="text"
                  value={backConfig.qrUrl}
                  onChange={(e) => setBackConfig({ ...backConfig, qrUrl: e.target.value })}
                  placeholder={user ? `https://flocard.in/p/${defaultUserSlug}` : 'https://flocard.in/p/your-name'}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: inputBg,
                    border: inputBorder,
                    borderRadius: '6px',
                    color: inputColor,
                    fontSize: '0.76rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* STEP 4: Personal Details */}
            <div
              style={{
                background: panelBg,
                border: panelBorder,
                borderRadius: '16px',
                padding: '16px',
                backdropFilter: 'blur(16px)',
                boxShadow: panelShadow
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(112, 56, 248, 0.3)',
                    border: '1px solid #7038f8',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  4
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: headingColor }}>Personal Details</div>
                  <div style={{ fontSize: '0.72rem', color: subtextColor }}>Your information on the card</div>
                </div>
              </div>

              {/* Full Name */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: subtextColor, marginBottom: '4px' }}>
                  <span>Full Name</span>
                  <span>{frontConfig.name?.length || 0}/50</span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  value={frontConfig.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={user?.name ? user.name.toUpperCase() : 'YOUR NAME'}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: inputBg,
                    border: inputBorder,
                    borderRadius: '8px',
                    color: inputColor,
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    outline: 'none',
                    letterSpacing: '0.04em'
                  }}
                />
              </div>

              {/* Title / Role */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: subtextColor, marginBottom: '4px' }}>
                  <span>Title / Role</span>
                  <span>{frontConfig.role?.length || 0}/50</span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  value={frontConfig.role}
                  onChange={(e) => setFrontConfig({ ...frontConfig, role: e.target.value })}
                  placeholder="CEO & FOUNDER"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: inputBg,
                    border: inputBorder,
                    borderRadius: '8px',
                    color: inputColor,
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    outline: 'none',
                    letterSpacing: '0.06em'
                  }}
                />
              </div>

              {/* Font Style & Size in a Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px', alignItems: 'end' }}>
                <InteractiveFontPicker
                  label="Font Style"
                  value={frontConfig.fontFamily}
                  onChange={(fontId) => setFrontConfig({ ...frontConfig, fontFamily: fontId })}
                  fieldName="name"
                  hoveredFont={hoveredFont}
                  setHoveredFont={setHoveredFont}
                  isLight={isLight}
                />

                <div>
                  <span style={{ fontSize: '0.72rem', color: subtextColor, display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                    Font Size
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      background: isLight ? 'rgba(112, 56, 248, 0.06)' : 'rgba(255, 255, 255, 0.04)',
                      border: isLight ? '1px solid rgba(112, 56, 248, 0.18)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '2px'
                    }}
                  >
                    {[
                      { key: 'small', label: 'S' },
                      { key: 'medium', label: 'M' },
                      { key: 'large', label: 'L' }
                    ].map(sz => {
                      const isSel = frontConfig.fontSize === sz.key;
                      return (
                        <button
                          key={sz.key}
                          type="button"
                          onClick={() => setFrontConfig({ ...frontConfig, fontSize: sz.key })}
                          style={{
                            flex: 1,
                            padding: '6px 0',
                            borderRadius: '6px',
                            background: isSel ? '#7038f8' : 'transparent',
                            border: 'none',
                            color: isSel ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {sz.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Typography Text Color Palette (Black, Gold, White, Custom) */}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: isLight ? '1px solid rgba(112, 56, 248, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: subtextColor, fontWeight: 600 }}>
                    Text Color {edition === 'white' && <strong style={{ color: '#cda5ff' }}>(Pure White Finish)</strong>}
                  </span>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: customColors.nameColor || '#ffffff', fontWeight: 700 }}>
                    {customColors.nameColor || 'Default'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Black', color: '#000000', border: '#475569' },
                    { label: 'Gold', color: '#E9C766', border: '#ca8a04' },
                    { label: 'Metallic Gold', color: '#D4AF37', border: '#a16207' },
                    { label: 'Charcoal', color: '#1E293B', border: '#64748b' },
                    { label: 'White', color: '#FFFFFF', border: '#cbd5e1' },
                    { label: 'Purple', color: '#7038F8', border: '#9333ea' }
                  ].map((preset) => {
                    const isSelected = (customColors.nameColor || '').toLowerCase() === preset.color.toLowerCase();
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleTextColorChange(preset.color, preset.label)}
                        title={`Set text color to ${preset.label}`}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: preset.color,
                          border: isSelected ? '2.5px solid #a855f7' : `1.5px solid ${preset.border}`,
                          boxShadow: isSelected ? '0 0 10px rgba(168, 85, 247, 0.7)' : 'inset 0 1px 2px rgba(0,0,0,0.2)',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                          transition: 'all 0.15s ease'
                        }}
                      />
                    );
                  })}
                  <label
                    title="Custom Text Color Picker"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      background: isLight ? 'rgba(112, 56, 248, 0.08)' : 'rgba(255, 255, 255, 0.06)',
                      border: isLight ? '1px solid rgba(112, 56, 248, 0.2)' : '1px solid rgba(255, 255, 255, 0.12)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: isLight ? '#4c1d95' : '#e2e8f0'
                    }}
                  >
                    <span>Custom</span>
                    <input
                      type="color"
                      value={customColors.nameColor || (edition === 'white' ? '#000000' : '#ffffff')}
                      onChange={(e) => handleTextColorChange(e.target.value, 'Custom')}
                      style={{ width: '18px', height: '18px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Mobile Bottom Navigation Action Bar */}
            {viewportWidth < 1024 && (
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '8px',
                  position: 'sticky',
                  bottom: '16px',
                  zIndex: 35,
                  background: isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(13, 9, 22, 0.92)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  padding: '10px 14px',
                  borderRadius: '16px',
                  border: isLight ? '1px solid rgba(112, 56, 248, 0.28)' : '1px solid rgba(112, 56, 248, 0.35)',
                  boxShadow: isLight ? '0 10px 30px rgba(112, 56, 248, 0.16)' : '0 10px 30px rgba(0, 0, 0, 0.75)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setMobileTab('preview')}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    background: isLight ? 'rgba(112, 56, 248, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                    border: isLight ? '1px solid rgba(112, 56, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.16)',
                    color: isLight ? '#6b21d8' : '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={15} />
                  <span>View 3D Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab('specs')}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7038f8 0%, #905cfc 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(112, 56, 248, 0.45)'
                  }}
                >
                  <span>Specs & Print →</span>
                </button>
              </div>
            )}
          </aside>

          {/* ==================================================================
              CENTER STAGE: LIVE NFC CARD PREVIEW (Mobile & Desktop Sticky)
              ================================================================== */}
          <main
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: viewportWidth < 1024 && mobileTab !== 'preview' ? '6px' : '14px',
              width: '100%',
              maxWidth: '100%',
              order: viewportWidth < 1024 ? -1 : undefined,
              position: 'sticky',
              top: viewportWidth < 1024 ? '52px' : '80px',
              alignSelf: 'start',
              zIndex: 35,
              background: viewportWidth < 1024 && mobileTab !== 'preview'
                ? (isLight ? 'rgba(243, 240, 255, 0.98)' : 'rgba(7, 5, 13, 0.98)')
                : 'transparent',
              backdropFilter: viewportWidth < 1024 && mobileTab !== 'preview' ? 'blur(20px)' : 'none',
              WebkitBackdropFilter: viewportWidth < 1024 && mobileTab !== 'preview' ? 'blur(20px)' : 'none',
              padding: viewportWidth < 1024 && mobileTab !== 'preview' ? '6px 8px 8px' : 0,
              borderRadius: viewportWidth < 1024 && mobileTab !== 'preview' ? '0 0 16px 16px' : 0,
              borderBottom: viewportWidth < 1024 && mobileTab !== 'preview'
                ? (isLight ? '1px solid rgba(112, 56, 248, 0.16)' : '1px solid rgba(112, 56, 248, 0.22)')
                : 'none',
              boxShadow: viewportWidth < 1024 && mobileTab !== 'preview'
                ? (isLight ? '0 6px 18px rgba(112, 56, 248, 0.1)' : '0 10px 28px rgba(0, 0, 0, 0.65)')
                : 'none'
            }}
          >
            {/* Top Preview Bar: Front/Back Toggle & Safe Area/Bleed Switches */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              {/* Front Side / Back Side Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(18, 14, 28, 0.8)',
                  border: isLight ? '1px solid rgba(112, 56, 248, 0.25)' : '1px solid rgba(112, 56, 248, 0.22)',
                  borderRadius: '9999px',
                  padding: '3px',
                  gap: '2px',
                  boxShadow: isLight ? '0 2px 10px rgba(112, 56, 248, 0.08)' : 'none'
                }}
              >
                <button
                  type="button"
                  onClick={() => { setSide('front'); setPreviewMode('front'); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: viewportWidth < 640 ? '5px 12px' : '6px 16px',
                    borderRadius: '9999px',
                    background: side === 'front' ? '#7038f8' : 'transparent',
                    border: 'none',
                    color: side === 'front' ? '#ffffff' : (isLight ? '#6b21d8' : '#94a3b8'),
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: side === 'front' ? '0 2px 10px rgba(112, 56, 248, 0.4)' : 'none',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <Eye size={13} />
                  <span>Front Side</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSide('back'); setPreviewMode('back'); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: viewportWidth < 640 ? '5px 12px' : '6px 16px',
                    borderRadius: '9999px',
                    background: side === 'back' ? '#7038f8' : 'transparent',
                    border: 'none',
                    color: side === 'back' ? '#ffffff' : (isLight ? '#6b21d8' : '#94a3b8'),
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: side === 'back' ? '0 2px 10px rgba(112, 56, 248, 0.4)' : 'none',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <Layers size={13} />
                  <span>Back Side</span>
                </button>
              </div>

              {/* On mobile when in customise or specs: show quick Flip and Collapse/Expand */}
              {viewportWidth < 1024 && mobileTab !== 'preview' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSide(s => (s === 'front' ? 'back' : 'front'))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      background: 'rgba(112, 56, 248, 0.16)',
                      border: '1px solid rgba(112, 56, 248, 0.3)',
                      color: isLight ? '#6b21d8' : '#cda5ff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCw size={12} />
                    <span>Flip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobilePreviewCollapsed(c => !c)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 8px',
                      borderRadius: '8px',
                      background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)',
                      border: isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isLight ? '#475569' : '#94a3b8',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {mobilePreviewCollapsed ? (
                      <>
                        <Eye size={12} />
                        <span>Show Preview</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp size={12} />
                        <span>Collapse</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Safe Area & Bleed Inline Switch */
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(18, 14, 28, 0.8)',
                    border: isLight ? '1px solid rgba(112, 56, 248, 0.22)' : '1px solid rgba(112, 56, 248, 0.15)',
                    borderRadius: '9999px',
                    padding: '4px 14px',
                    fontSize: '0.76rem',
                    color: isLight ? '#475569' : '#94a3b8',
                    boxShadow: isLight ? '0 2px 10px rgba(112, 56, 248, 0.08)' : 'none'
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <span>Safe Area</span>
                    <input
                      type="checkbox"
                      checked={showGuides}
                      onChange={(e) => setShowGuides(e.target.checked)}
                      style={{ accentColor: '#7038f8', cursor: 'pointer' }}
                    />
                  </label>

                  <span style={{ color: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)' }}>|</span>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <span>Bleed (3mm)</span>
                    <input
                      type="checkbox"
                      checked={showBleed}
                      onChange={(e) => setShowBleed(e.target.checked)}
                      style={{ accentColor: '#7038f8', cursor: 'pointer' }}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Central Stage Box (Clean Luxury Preview - Pure Card on Mobile) */}
            {(!mobilePreviewCollapsed || mobileTab === 'preview' || viewportWidth >= 1024) && (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  minHeight: viewportWidth < 1024 && mobileTab !== 'preview'
                    ? 'auto'
                    : (viewportWidth < 640 ? '300px' : '440px'),
                  borderRadius: viewportWidth < 1024 ? '12px' : '20px',
                  overflow: viewportWidth < 1024 && mobileTab !== 'preview' ? 'visible' : 'hidden',
                  background: viewportWidth < 1024 && mobileTab !== 'preview'
                    ? 'transparent'
                    : (viewportWidth < 1024
                        ? (isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(16, 12, 26, 0.7)')
                        : (isLight ? '#f4f2fb' : '#0B0814')),
                  border: viewportWidth < 1024 && mobileTab !== 'preview'
                    ? 'none'
                    : (viewportWidth < 1024
                        ? (isLight ? '1px solid rgba(112, 56, 248, 0.12)' : '1px solid rgba(112, 56, 248, 0.15)')
                        : (isLight ? '1px solid rgba(112, 56, 248, 0.2)' : '1px solid rgba(112, 56, 248, 0.22)')),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: viewportWidth < 1024 && mobileTab !== 'preview' ? '2px 0' : (viewportWidth < 1024 ? '12px 6px' : '30px 20px'),
                  boxShadow: viewportWidth < 1024
                    ? 'none'
                    : (isLight
                        ? '0 10px 30px rgba(112, 56, 248, 0.1), inset 0 0 40px rgba(112, 56, 248, 0.03)'
                        : '0 20px 60px rgba(0, 0, 0, 0.65), inset 0 0 60px rgba(112, 56, 248, 0.05)')
                }}
              >
                {/* The Live NFC Card with Perspective & Dynamic Lighting */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 10,
                    transform: getPreviewTransform(),
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    overflow: 'visible'
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round(BASE_CARD_WIDTH * activeCardScale)}px`,
                      height: `${Math.round(BASE_CARD_HEIGHT * activeCardScale)}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        width: `${BASE_CARD_WIDTH}px`,
                        height: `${BASE_CARD_HEIGHT}px`,
                        transform: `scale(${activeCardScale})`,
                        transformOrigin: 'center center',
                        flexShrink: 0,
                        cursor: 'pointer'
                      }}
                      onClick={() => setSide(s => (s === 'front' ? 'back' : 'front'))}
                      title="Tap card to flip"
                    >
                      {is3DPreview ? (
                        <Card3DPreview
                          side={side}
                          onSideChange={setSide}
                          templateType={templateType}
                          edition={edition}
                          config={combinedConfig}
                          showGuides={showGuides}
                          showBleed={showBleed}
                          width={BASE_CARD_WIDTH}
                          enableTilt={viewportWidth < 1024 ? false : dynamicLighting}
                          onLogoWarningChange={setLogoWarning}
                          allowFlip={true}
                        />
                      ) : (
                        <CardCanvas
                          side={side}
                          templateType={templateType}
                          edition={edition}
                          config={combinedConfig}
                          showGuides={showGuides}
                          showBleed={showBleed}
                          width={BASE_CARD_WIDTH}
                          onLogoWarningChange={setLogoWarning}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Single Flip Trigger Pill in the Bottom (Outside the Card - hidden in compact mobile customize mode) */}
                {(viewportWidth >= 1024 || mobileTab === 'preview') && (
                  <button
                    type="button"
                    onClick={() => setSide(side === 'front' ? 'back' : 'front')}
                    style={{
                      position: 'relative',
                      zIndex: 15,
                      marginTop: '22px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 20px',
                      borderRadius: '9999px',
                      background: 'rgba(18, 14, 28, 0.92)',
                      border: '1px solid rgba(112, 56, 248, 0.35)',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = '#7038f8';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(112, 56, 248, 0.35)';
                    }}
                  >
                    <RotateCw size={13} style={{ transform: side === 'back' ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }} />
                    <span>{side === 'front' ? 'Flip to Back' : 'Flip to Front'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Bottom 5 Thumbnails: Front, Back, Angled, Floating, Close Up */}
            {(viewportWidth >= 1024 || mobileTab === 'preview') && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '10px'
                }}
              >
                {[
                  { id: 'front', label: 'Front', side: 'front' },
                  { id: 'back', label: 'Back', side: 'back' },
                  { id: 'angled', label: 'Angled', side: 'front' },
                  { id: 'floating', label: 'Floating', side: 'front' },
                  { id: 'close-up', label: 'Close Up', side: 'front' }
                ].map(thumb => {
                  const isSelected = previewMode === thumb.id;
                  return (
                    <button
                      key={thumb.id}
                      type="button"
                      onClick={() => handlePreviewModeSelect(thumb.id)}
                      style={{
                        background: isSelected ? 'rgba(112, 56, 248, 0.22)' : 'rgba(18, 14, 28, 0.7)',
                        border: isSelected ? '1.5px solid #7038f8' : '1px solid rgba(112, 56, 248, 0.14)',
                        borderRadius: '12px',
                        padding: '8px 4px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isSelected ? '0 0 16px rgba(112, 56, 248, 0.3)' : 'none',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '46px',
                          height: '28px',
                          borderRadius: '4px',
                          background: 'linear-gradient(135deg, #2b154a 0%, #0d0718 100%)',
                          border: '1px solid rgba(205, 165, 255, 0.25)',
                          transform: thumb.id === 'angled' ? 'rotate(-6deg) skewX(-4deg)' : thumb.id === 'floating' ? 'translateY(-3px)' : 'none',
                          transition: 'transform 0.2s ease'
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isSelected && (
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#cda5ff' }} />
                        )}
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? '#ffffff' : '#94a3b8'
                          }}
                        >
                          {thumb.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Mobile Action to continue customizing (preview tab only) */}
            {viewportWidth < 1024 && mobileTab === 'preview' && (
              <button
                type="button"
                onClick={() => setMobileTab('customise')}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #7038f8 0%, #905cfc 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(112, 56, 248, 0.45)',
                  marginTop: '10px'
                }}
              >
                <Sparkles size={16} />
                <span>Customise Card Details (Steps 1–4) →</span>
              </button>
            )}
          </main>

          {/* ==================================================================
              RIGHT SIDEBAR: PREVIEW CONTROLS, SPECS & STATUS (5, 6, 7)
              ================================================================== */}
          <aside
            style={{
              display: viewportWidth >= 1024 || mobileTab === 'specs' ? 'flex' : 'none',
              flexDirection: 'column',
              gap: '16px',
              width: '100%',
              maxWidth: '100%'
            }}
          >
            {/* STEP 5: Live Preview Controls */}
            <div
              style={{
                background: panelBg,
                border: panelBorder,
                borderRadius: '16px',
                padding: '16px',
                backdropFilter: 'blur(16px)',
                boxShadow: panelShadow
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(112, 56, 248, 0.3)',
                    border: '1px solid #7038f8',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  5
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: headingColor }}>Live Preview Controls</div>
                  <div style={{ fontSize: '0.72rem', color: subtextColor }}>Adjust card appearance</div>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Show Safe Area', checked: showGuides, setChecked: setShowGuides },
                  { label: 'Show Bleed (3mm)', checked: showBleed, setChecked: setShowBleed },
                  { label: 'Dynamic Lighting', checked: dynamicLighting, setChecked: setDynamicLighting },
                  { label: '3D Preview', checked: is3DPreview, setChecked: setIs3DPreview }
                ].map((ctrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 0'
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', color: isLight ? '#1e1040' : '#cbd5e1' }}>{ctrl.label}</span>
                    <button
                      type="button"
                      onClick={() => ctrl.setChecked(!ctrl.checked)}
                      style={{
                        width: '36px',
                        height: '20px',
                        borderRadius: '9999px',
                        background: ctrl.checked ? '#7038f8' : (isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)'),
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          position: 'absolute',
                          top: '3px',
                          left: ctrl.checked ? '19px' : '3px',
                          transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 6: Card Specifications */}
            <div
              style={{
                background: panelBg,
                border: panelBorder,
                borderRadius: '16px',
                padding: '16px',
                backdropFilter: 'blur(16px)',
                boxShadow: panelShadow
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(112, 56, 248, 0.3)',
                    border: '1px solid #7038f8',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  6
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: headingColor }}>Card Specifications</div>
                  <div style={{ fontSize: '0.72rem', color: subtextColor }}>Standard FLOCARD Design</div>
                </div>
              </div>

              {/* Spec Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.74rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: subtextColor }}>
                  <span>Size</span>
                  <span style={{ color: headingColor, fontWeight: 600 }}>CR80 (85.60 × 53.98 mm)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: subtextColor }}>
                  <span>Thickness</span>
                  <span style={{ color: headingColor, fontWeight: 600 }}>0.76 mm (Standard)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: subtextColor }}>
                  <span>Corner Radius</span>
                  <span style={{ color: headingColor, fontWeight: 600 }}>3.18 mm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: subtextColor }}>
                  <span>Print</span>
                  <span style={{ color: headingColor, fontWeight: 600 }}>Full Color, Matte/Gloss</span>
                </div>
              </div>
            </div>

            {/* STEP 7: Design Status & Send for Print */}
            <div
              style={{
                background: panelBg,
                border: panelBorder,
                borderRadius: '16px',
                padding: '16px',
                backdropFilter: 'blur(16px)',
                boxShadow: panelShadow
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(112, 56, 248, 0.3)',
                    border: '1px solid #7038f8',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  7
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: headingColor }}>Design Status</div>
                  <div style={{ fontSize: '0.72rem', color: subtextColor }}>Track your progress</div>
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: isLight ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  marginBottom: '16px'
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 8px #22c55e'
                  }}
                />
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#22c55e', letterSpacing: '0.04em' }}>
                    {designStatus.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: subtextColor }}>
                    Last edited just now
                  </div>
                </div>
              </div>

              {/* Sole Primary Action: SlideCommit for Print Submission */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                <SlideCommit
                  label={editingOrder ? "Slide to update order artwork" : "Slide to send for print"}
                  doneLabel={editingOrder ? "Artwork Updated" : "Sent for Print"}
                  errorLabel="Submission failed"
                  onConfirm={() => handleSaveDesign(true)}
                  trackColor={isLight ? '#ede9fe' : '#191226'}
                  handleColor={isLight ? '#7038f8' : '#ffffff'}
                  successColor="#7038f8"
                  width={260}
                  height={50}
                  radius={25}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Hidden Master Renderers for 300 DPI Generation */}
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

      {/* Customer Login Required Modal */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 3, 10, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: isLight ? '#ffffff' : '#130d22',
              border: isLight ? '1px solid rgba(112, 56, 248, 0.25)' : '1px solid rgba(112, 56, 248, 0.3)',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: isLight ? '0 20px 50px rgba(112, 56, 248, 0.18)' : '0 20px 60px rgba(0, 0, 0, 0.8)'
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: headingColor, marginBottom: '8px' }}>
              Create Your FLOCARD Account
            </h3>
            <p style={{ fontSize: '0.84rem', color: subtextColor, lineHeight: 1.5, marginBottom: '22px' }}>
              Sign up to save your custom NFC card designs, sync production orders, and manage live digital profile redirects.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="/signup?redirect=/designer"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7038f8 0%, #905cfc 100%)',
                  color: '#ffffff',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(112, 56, 248, 0.4)'
                }}
              >
                Sign Up for Free
              </a>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="/login?redirect=/designer"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    background: isLight ? 'rgba(112, 56, 248, 0.08)' : 'rgba(255,255,255,0.06)',
                    border: isLight ? '1px solid rgba(112, 56, 248, 0.2)' : '1px solid rgba(255,255,255,0.12)',
                    color: isLight ? '#6b21a8' : '#ffffff',
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  Already have account? Sign In
                </a>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                    border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                    color: subtextColor,
                    cursor: 'pointer',
                    fontSize: '0.82rem'
                  }}
                >
                  Explore as Guest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Submitted Confirmation Modal */}
      {showOrderSubmittedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 3, 10, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#130d22',
              border: '1px solid rgba(112, 56, 248, 0.3)',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '460px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid #22c55e',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <CheckCircle2 size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              Order Placed & Routed to WhatsApp!
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '14px' }}>
              Order Reference: <strong style={{ color: '#cda5ff', fontFamily: 'monospace' }}>{submittedOrder?.orderReference || submittedOrder?.id || 'FLC-ORD'}</strong>
            </p>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
              Your card design <strong style={{ color: '#fff' }}>{designTitle}</strong> details have been queued for print production and transmitted to FLOCARD's official WhatsApp (+91 97782 78552).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={`https://wa.me/919778278552?text=${encodeURIComponent(
                  `Hello FLOCARD Team, I have submitted my card design order ${submittedOrder?.orderReference || ''} for ${frontConfig.name || ''} (${EDITIONS[edition]?.name || edition}). Please confirm production.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#22c55e',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
                }}
              >
                <span>💬 Open Order in WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setShowOrderSubmittedModal(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Back to Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart AI Logo Background Remover & Editor Modal */}
      <SmartLogoEditorModal
        isOpen={showSmartLogoModal}
        onClose={() => setShowSmartLogoModal(false)}
        customerLogo={customerLogo}
        onApplyLogo={(updatedConfig) => {
          setCustomerLogo(updatedConfig);
          setFrontConfig(prev => ({ ...prev, customLogo: updatedConfig.url }));
          notify('Logo Studio Updated', 'Transparent logo & geometry applied to card');
        }}
        onDownloadCardArtwork={handleDownloadBothSides}
        isLight={isLight}
        cardEdition={edition}
      />

      {/* Order Summary & Print Request Modal */}
      <OrderSummaryPrintModal
        isOpen={showOrderSummaryModal}
        onClose={() => setShowOrderSummaryModal(false)}
        design={{
          id: existingDesign?.id || `des_${Date.now()}`,
          title: designTitle,
          edition,
          templateType,
          front: frontConfig,
          back: backConfig,
          customColors,
          customerLogo,
          flocardLogo
        }}
        edition={edition}
        templateType={templateType}
        user={user}
        frontConfig={frontConfig}
        backConfig={backConfig}
        customColors={customColors}
        customerLogo={customerLogo}
        flocardLogo={flocardLogo}
        onSubmitOrder={async (orderPayload) => {
          const ord = submitPrintOrder(orderPayload);
          setSubmittedOrder(ord);
          notify('Submitted for Print!', 'Order details routed to WhatsApp production queue');
          return ord;
        }}
        isLight={isLight}
      />

      {/* SwipeToast Component */}
      <SwipeToast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        title={toastMessage.title || 'Notification'}
        description={toastMessage.desc}
        actionLabel={toastMessage.actionLabel}
        onAction={toastMessage.onAction}
        background="#181126"
        color="#f8fafc"
        fuseColor="#7038f8"
        duration={4000}
      />
    </div>
  );
}
