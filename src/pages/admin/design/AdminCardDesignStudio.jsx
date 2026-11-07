/* ==========================================================================
   FLOCARDS ADMIN CARD DESIGN STUDIO & WHATSAPP ORDER GENERATOR
   Supports:
   - Selecting Curated Themes & Custom Templates (Gold, Platinum, Metal, Purple)
   - Real-Time Two-Way Sync between WhatsApp Customer Info & Card Artwork
   - 1-Click WhatsApp Order Creation with Auto-Queued Milestones
   - Direct "Open WhatsApp Chat" button to dispatch order confirmation & 3D proof
   - Full 2D/3D Card Canvas, Layers, Safe-Area Guides, Undo/Redo
   ========================================================================== */

import React, { useState, useEffect, useRef } from 'react';
import CardCanvas from '../../../components/CardCanvas';
import Card3DPreview from '../../../components/Card3DPreview';
import { EDITIONS, TEMPLATES, BRAND } from '../../../lib/constants';
import { useData } from '../../../context/DataContext';
import { useTheme } from '../../../context/ThemeContext';
import { uploadImage } from '../../../lib/uploadImage';
import { queueWhatsAppNotification } from '../../../lib/whatsapp';
import { removeLogoBackground } from '../../../lib/cardArtworkService';
import SmartLogoEditorModal from '../../../components/designer/SmartLogoEditorModal';
import {
  Layers,
  Type,
  Image as ImageIcon,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Save,
  Copy,
  Share2,
  Download,
  CheckCircle2,
  Sliders,
  Palette,
  Sparkles,
  QrCode,
  Eye,
  EyeOff,
  FolderOpen,
  ArrowRight,
  Plus,
  RefreshCw,
  Check,
  AlertCircle,
  MessageSquare,
  Phone,
  Send,
  ExternalLink,
  ShieldCheck,
  X,
  UserCheck,
  Users,
  Search,
  Package,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Trash2,
  Edit3
} from 'lucide-react';

const FONT_OPTIONS = [
  'Space Grotesk',
  'Inter',
  'Outfit',
  'Syne',
  'Montserrat',
  'Cinzel',
  'Cinzel Decorative',
  'Playfair Display'
];

export const PRESET_THEMES = [
  {
    id: 'executive_gold',
    name: 'Executive 24K Gold',
    badge: 'Luxury',
    edition: 'gold',
    templateType: 'standard',
    fontFamily: 'Cinzel',
    roleFontFamily: 'Inter',
    alignment: 'left',
    accentColor: '#E9C766',
    previewBg: 'linear-gradient(135deg, #1C1914, #0F0E0B)',
    customColors: {
      primaryAccent: '#E9C766',
      secondaryAccent: '#C9972C',
      nameColor: '#E9C766',
      roleColor: '#E9C766',
      detailsColor: '#E9C766',
      taglineColor: '#C5A059',
      nfcColor: '#E9C766',
      qrColor: '#E9C766'
    }
  },
  {
    id: 'royal_ultraviolet',
    name: 'Royal Ultraviolet',
    badge: 'Signature',
    edition: 'purple',
    templateType: 'standard',
    fontFamily: 'Space Grotesk',
    roleFontFamily: 'Inter',
    alignment: 'left',
    accentColor: '#A855F7',
    previewBg: 'linear-gradient(135deg, #1F103A, #0C0717)',
    customColors: {
      primaryAccent: '#A855F7',
      secondaryAccent: '#6B00FF',
      nameColor: '#FFFFFF',
      roleColor: '#D8B4FE',
      detailsColor: '#D8B4FE',
      taglineColor: '#B9AEC9',
      nfcColor: '#FFFFFF',
      qrColor: '#FFFFFF'
    }
  },
  {
    id: 'carbon_platinum',
    name: 'Carbon Platinum',
    badge: 'Modern',
    edition: 'platinum',
    templateType: 'standard',
    fontFamily: 'Sora',
    roleFontFamily: 'Inter',
    alignment: 'left',
    accentColor: '#E2E8F0',
    previewBg: 'linear-gradient(135deg, #1A1F2B, #0B0E14)',
    customColors: {
      primaryAccent: '#E2E8F0',
      secondaryAccent: '#94A3B8',
      nameColor: '#FFFFFF',
      roleColor: '#CBD5E1',
      detailsColor: '#94A3B8',
      taglineColor: '#64748B',
      nfcColor: '#FFFFFF',
      qrColor: '#FFFFFF'
    }
  },
  {
    id: 'stealth_gunmetal',
    name: 'Stealth Gunmetal',
    badge: 'Stealth',
    edition: 'metal',
    templateType: 'standard',
    fontFamily: 'Inter',
    roleFontFamily: 'Inter',
    alignment: 'left',
    accentColor: '#94A3B8',
    previewBg: 'linear-gradient(135deg, #23252B, #121316)',
    customColors: {
      primaryAccent: '#CBD5E1',
      secondaryAccent: '#64748B',
      nameColor: '#FFFFFF',
      roleColor: '#94A3B8',
      detailsColor: '#64748B',
      taglineColor: '#64748B',
      nfcColor: '#CBD5E1',
      qrColor: '#CBD5E1'
    }
  },
  {
    id: 'corporate_logo',
    name: 'Corporate Brand Logo',
    badge: 'Enterprise',
    edition: 'gold',
    templateType: 'customer_logo',
    fontFamily: 'Outfit',
    roleFontFamily: 'Inter',
    alignment: 'left',
    accentColor: '#F59E0B',
    previewBg: 'linear-gradient(135deg, #241A0B, #0E0903)',
    customColors: {
      primaryAccent: '#F59E0B',
      secondaryAccent: '#D97706',
      nameColor: '#FFFFFF',
      roleColor: '#FDE68A',
      detailsColor: '#FDE68A',
      taglineColor: '#D4D4D8',
      nfcColor: '#F59E0B',
      qrColor: '#F59E0B'
    }
  },
  {
    id: 'minimalist_noir',
    name: 'Minimalist Noir',
    badge: 'Minimal',
    edition: 'purple',
    templateType: 'standard',
    fontFamily: 'Syne',
    roleFontFamily: 'Inter',
    alignment: 'center',
    accentColor: '#C084FC',
    previewBg: 'linear-gradient(135deg, #160C26, #090510)',
    customColors: {
      primaryAccent: '#C084FC',
      secondaryAccent: '#9333EA',
      nameColor: '#FFFFFF',
      roleColor: '#E9D5FF',
      detailsColor: '#C084FC',
      taglineColor: '#A855F7',
      nfcColor: '#FFFFFF',
      qrColor: '#FFFFFF'
    }
  }
];

export default function AdminCardDesignStudio({
  onAssignToOrder = null,
  initialDesign = null,
  initialDesignId = null,
  initialDesignRecord = null,
  initialOrderId = null,
  onNavigateToOrders = null
}) {
  const { isDark, isLight } = useTheme();
  const {
    designs = [],
    saveDesign,
    templates = [],
    saveTemplate,
    orders = [],
    saveOrder,
    saveCustomer,
    updateOrderStatus,
    customers = []
  } = useData();

  // Left Panel Sub-tab: 'text' | 'logo' | 'qr' | 'style' | 'order'
  const [leftTab, setLeftTab] = useState('text');
  const [selectedThemeId, setSelectedThemeId] = useState('royal_ultraviolet');

  // Responsive Mobile Viewport State
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const isMobile = viewportWidth < 1024;
  const isSmallMobile = viewportWidth < 640;

  // Mobile View Mode: 'split' (preview + controls) | 'preview' (full card preview) | 'controls' (edit controls only)
  const [mobileViewMode, setMobileViewMode] = useState('split');

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Active Card Side: 'front' | 'back'
  const [activeSide, setActiveSide] = useState('front');
  const [preview3D, setPreview3D] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [showBleed, setShowBleed] = useState(false);

  const [designId, setDesignId] = useState(initialDesign?.id || `dsgn_adm_${Date.now()}`);
  const [designTitle, setDesignTitle] = useState(initialDesign?.title || 'Executive Obsidian NFC Card');
  const [selectedOrderId, setSelectedOrderId] = useState(initialDesign?.orderId || '');

  // Card Configuration
  const [edition, setEdition] = useState(initialDesign?.edition || 'purple');
  const [templateType, setTemplateType] = useState(initialDesign?.templateType || 'standard');

  const [flocardLogo, setFlocardLogo] = useState({
    size: initialDesign?.flocardLogo?.size ?? 100,
    position: initialDesign?.flocardLogo?.position || (templateType === 'customer_logo' ? 'bottom-right' : 'top-left')
  });

  const [frontConfig, setFrontConfig] = useState({
    name: initialDesign?.front?.name || 'FLOCARD ADMIN',
    role: initialDesign?.front?.role || 'CEO & FOUNDER',
    company: initialDesign?.front?.company || 'FLOCARDS',
    details: initialDesign?.front?.details || 'CONNECTED IDENTITY SYSTEMS',
    tagline: initialDesign?.front?.tagline || 'Pioneering connected NFC identity for executives.',
    showTagline: initialDesign?.front?.showTagline ?? true,
    showNfc: initialDesign?.front?.showNfc ?? true,
    nfcPosition: initialDesign?.front?.nfcPosition || 'top-right',
    fontSize: initialDesign?.front?.fontSize || 'medium',
    alignment: initialDesign?.front?.alignment || 'left',
    fontFamily: initialDesign?.front?.fontFamily || 'Space Grotesk',
    roleFontFamily: initialDesign?.front?.roleFontFamily || 'Inter',
    detailsFontFamily: initialDesign?.front?.detailsFontFamily || 'Inter',
    taglineFontFamily: initialDesign?.front?.taglineFontFamily || 'Inter',
    customLogo: initialDesign?.front?.customLogo || null
  });

  const [backConfig, setBackConfig] = useState({
    qrUrl: initialDesign?.back?.qrUrl || 'https://flocard.in/alex',
    subtext: initialDesign?.back?.subtext || 'SCAN ME',
    showNfcSpecs: initialDesign?.back?.showNfcSpecs ?? true,
    specsText: initialDesign?.back?.specsText || 'NFC | PORTFOLIO | CONTACT | CONNECT',
    brandUrl: initialDesign?.back?.brandUrl || 'flocard.in/alex'
  });

  const [customColors, setCustomColors] = useState(initialDesign?.customColors || {
    primaryAccent: '#A855F7',
    secondaryAccent: '#6B00FF',
    nameColor: '#FFFFFF',
    roleColor: '#D8B4FE',
    detailsColor: '#D8B4FE',
    taglineColor: '#B9AEC9',
    nfcColor: '#FFFFFF',
    qrColor: '#FFFFFF'
  });

  const normalizeCustomerLogo = (logo, fallbackUrl = null) => {
    if (!logo && !fallbackUrl) {
      return { url: null, originalUrl: null, transparentUrl: null, size: 100, rotation: 0, posX: 0, posY: 0, showCircleBadge: true };
    }
    if (typeof logo === 'string') {
      return { url: logo, originalUrl: logo, transparentUrl: logo, size: 100, rotation: 0, posX: 0, posY: 0, showCircleBadge: true };
    }
    return {
      url: logo?.url || fallbackUrl || null,
      originalUrl: logo?.originalUrl || logo?.url || fallbackUrl || null,
      transparentUrl: logo?.transparentUrl || logo?.url || fallbackUrl || null,
      size: typeof logo?.size === 'number' ? logo.size : 100,
      rotation: typeof logo?.rotation === 'number' ? logo.rotation : 0,
      posX: typeof logo?.posX === 'number' ? logo.posX : 0,
      posY: typeof logo?.posY === 'number' ? logo.posY : 0,
      showCircleBadge: logo?.showCircleBadge ?? true
    };
  };

  const [customerLogo, setCustomerLogo] = useState(() =>
    normalizeCustomerLogo(initialDesign?.customerLogo, initialDesign?.front?.customLogo)
  );
  const [showSmartLogoModal, setShowSmartLogoModal] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const logoInputRef = useRef(null);

  // Layer visibility & selection
  const [selectedElement, setSelectedElement] = useState('name');
  const [layerVisibility, setLayerVisibility] = useState({
    name: true,
    role: true,
    company: true,
    tagline: true,
    details: true,
    nfcIcon: true,
    logo: true,
    qrCode: true
  });

  // Customer Selection State
  const [selectedWaCustomerId, setSelectedWaCustomerId] = useState(null);
  const [waCustomerSearch, setWaCustomerSearch] = useState('');
  const [isWaCustomerDropdownOpen, setIsWaCustomerDropdownOpen] = useState(false);

  // Order Form State (Two-way synced with card artwork)
  const edCurrent = EDITIONS[edition] || EDITIONS.purple;
  const [waOrderForm, setWaOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    company: '',
    role: '',
    tagline: '',
    shippingAddress: '',
    totalAmount: edCurrent.price || 2499
  });

  // Auto-load existing design or order if initialDesignId, initialOrderId, initialDesignRecord, or URL params are given
  useEffect(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const targetOrderId = initialOrderId || urlParams.get('orderId');
    const targetDesignId = initialDesignId || urlParams.get('designId') || urlParams.get('id');
    const targetAnyId = targetOrderId || targetDesignId;

    if (!targetAnyId && !initialDesignRecord && !initialDesign) return;

    let matchedDesign = initialDesignRecord || initialDesign || null;
    let matchedOrder = null;

    // 1. Search in designs collection
    if (!matchedDesign && designs && designs.length > 0 && targetAnyId) {
      matchedDesign = designs.find(d =>
        d.id === targetAnyId ||
        d.id === targetDesignId ||
        d.id === targetOrderId ||
        d.orderId === targetAnyId ||
        d.orderId === targetOrderId
      );
    }

    // 2. Search in orders collection
    if (orders && orders.length > 0 && targetAnyId) {
      matchedOrder = orders.find(o =>
        o.id === targetAnyId ||
        o.orderReference === targetAnyId ||
        o.id === targetOrderId ||
        o.orderReference === targetOrderId ||
        o.designId === targetAnyId ||
        o.designId === targetDesignId ||
        (matchedDesign && (o.designId === matchedDesign.id || o.id === matchedDesign.orderId))
      );
      if (!matchedDesign && matchedOrder?.design) {
        matchedDesign = matchedOrder.design;
      }
    }

    // 3. Fallback to StorageEngine if not yet in React context state
    if (!matchedDesign && !matchedOrder && targetAnyId) {
      try {
        if (StorageEngine?.getDesignById) {
          matchedDesign = StorageEngine.getDesignById(targetAnyId) || (targetDesignId ? StorageEngine.getDesignById(targetDesignId) : null);
        }
        if (!matchedDesign && StorageEngine?.getDesigns) {
          const list = StorageEngine.getDesigns();
          matchedDesign = list.find(d => d.id === targetAnyId || d.id === targetDesignId || d.orderId === targetAnyId);
        }
        if (StorageEngine?.getOrders) {
          const oList = StorageEngine.getOrders();
          matchedOrder = oList.find(o => o.id === targetAnyId || o.orderReference === targetAnyId || o.designId === targetAnyId);
          if (!matchedDesign && matchedOrder?.design) {
            matchedDesign = matchedOrder.design;
          }
        }
      } catch (err) {
        console.warn('[Studio] Storage fallback lookup error:', err);
      }
    }

    const record = matchedDesign || matchedOrder;
    if (!record) return;

    // A. ID & Title
    if (record.id) setDesignId(record.id);
    const resolvedTitle = record.title || `${record.customerName || matchedOrder?.customerName || 'Customer'}'s Card Artwork`;
    setDesignTitle(resolvedTitle);

    // B. Order link
    const ordRef = matchedOrder ? (matchedOrder.id || matchedOrder.orderReference) : (record.orderId || '');
    if (ordRef) setSelectedOrderId(ordRef);

    // C. Edition
    const ed = record.edition || record.template || matchedOrder?.edition;
    if (ed) setEdition(ed);

    // D. Customer Logo & Template Type (CRITICAL FIX FOR LOGO NOT SHOWING)
    const rawLogo =
      record.customerLogo ||
      record.front?.customLogo ||
      record.frontConfig?.customLogo ||
      matchedOrder?.customerLogo ||
      matchedOrder?.design?.customerLogo ||
      matchedOrder?.frontConfig?.customLogo ||
      record.logoUrl ||
      record.logo;

    const normLogo = normalizeCustomerLogo(rawLogo);
    const hasValidLogo = normLogo && !!normLogo.url;

    if (hasValidLogo) {
      setCustomerLogo(normLogo);
      setTemplateType('customer_logo');
    } else {
      if (record.templateType) setTemplateType(record.templateType);
      else if (matchedOrder?.templateType) setTemplateType(matchedOrder.templateType);
    }

    // E. Front Config (CRITICAL FIX FOR NAME / ROLE / COMPANY)
    const fCfg = record.front || record.frontConfig || matchedOrder?.frontConfig || matchedOrder?.design?.front || {};
    const cName = fCfg.name || record.customerName || record.name || matchedOrder?.customerName || '';
    const cRole = fCfg.role || record.role || matchedOrder?.role || 'CEO & FOUNDER';
    const cCompany = fCfg.company || record.company || matchedOrder?.company || 'FLOCARD';
    const cTagline = fCfg.tagline || record.tagline || matchedOrder?.tagline || '';

    setFrontConfig(prev => ({
      ...prev,
      ...fCfg,
      name: cName || prev.name,
      role: cRole || prev.role,
      company: cCompany || prev.company,
      tagline: cTagline || prev.tagline,
      customLogo: hasValidLogo ? normLogo.url : (fCfg.customLogo || prev.customLogo || null)
    }));

    // F. Back Config
    const bCfg = record.back || record.backConfig || matchedOrder?.backConfig || matchedOrder?.design?.back;
    if (bCfg) {
      setBackConfig(prev => ({
        ...prev,
        ...bCfg,
        qrCode: {
          ...prev.qrCode,
          ...(bCfg.qrCode || {})
        }
      }));
    }

    // G. Custom Colors
    const cColors = record.customColors || matchedOrder?.customColors || matchedOrder?.design?.customColors;
    if (cColors) {
      setCustomColors(prev => ({ ...prev, ...cColors }));
    }

    // H. Flocard Logo Config
    if (record.flocardLogo || matchedOrder?.flocardLogo || matchedOrder?.design?.flocardLogo) {
      setFlocardLogo(record.flocardLogo || matchedOrder?.flocardLogo || matchedOrder?.design?.flocardLogo);
    }

    // I. Order Form Details (waOrderForm)
    setWaOrderForm({
      customerName: cName || '',
      customerPhone: record.customerPhone || record.phone || matchedOrder?.customerPhone || '',
      customerEmail: record.customerEmail || record.email || matchedOrder?.customerEmail || '',
      company: cCompany || '',
      role: cRole || '',
      tagline: cTagline || '',
      shippingAddress: record.shippingAddress || record.address || matchedOrder?.shippingAddress || '',
      totalAmount: record.totalAmount || matchedOrder?.totalAmount || EDITIONS[ed || 'purple']?.price || 2499
    });

    // J. Activate Editing Panel immediately
    setLeftTab(hasValidLogo ? 'logo' : 'text');
    setSelectedElement(hasValidLogo ? 'logo' : 'name');
    showToast(`✓ Loaded design "${cName || resolvedTitle}" into Studio for editing.`);
  }, [initialOrderId, initialDesignId, initialDesignRecord, initialDesign, orders, designs]);

  const handleSelectWaCustomer = (cust) => {
    setSelectedWaCustomerId(cust.id);
    setWaCustomerSearch('');
    setIsWaCustomerDropdownOpen(false);
    setWaOrderForm(prev => ({
      ...prev,
      customerName: cust.name || '',
      customerPhone: cust.phone || '',
      customerEmail: cust.email || '',
      company: cust.company || '',
      role: cust.role || ''
    }));
    setFrontConfig(prev => ({
      ...prev,
      name: (cust.name || prev.name).toUpperCase(),
      role: (cust.role || prev.role).toUpperCase(),
      company: (cust.company || prev.company)
    }));
  };

  const handleClearWaCustomer = () => {
    setSelectedWaCustomerId(null);
    setWaCustomerSearch('');
    setIsWaCustomerDropdownOpen(false);
    setWaOrderForm(prev => ({
      ...prev,
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      company: '',
      role: '',
      shippingAddress: ''
    }));
  };

  // Keep totalAmount synced when edition changes if not explicitly overridden
  useEffect(() => {
    const ed = EDITIONS[edition] || EDITIONS.purple;
    setWaOrderForm(prev => ({
      ...prev,
      totalAmount: ed.price || 2499
    }));
  }, [edition]);

  // Two-way sync: Updating WhatsApp form fields automatically updates card canvas frontConfig
  const handleWaFieldChange = (field, value) => {
    setWaOrderForm(prev => ({ ...prev, [field]: value }));
    if (field === 'customerName') {
      setFrontConfig(prev => ({ ...prev, name: value }));
      setBackConfig(prev => ({
        ...prev,
        brandUrl: `flocard.in/${value.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}`,
        qrUrl: `https://flocard.in/${value.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}`
      }));
    } else if (field === 'role') {
      setFrontConfig(prev => ({ ...prev, role: value }));
    } else if (field === 'company') {
      setFrontConfig(prev => ({ ...prev, company: value }));
    } else if (field === 'tagline') {
      setFrontConfig(prev => ({ ...prev, tagline: value }));
    }
  };

  // Success Modal for Created WhatsApp Order
  const [orderSuccessModal, setOrderSuccessModal] = useState(false);
  const [createdOrderResult, setCreatedOrderResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  // Toast / notification
  const [statusToast, setStatusToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setStatusToast({ message, type });
    setTimeout(() => setStatusToast(null), 3500);
  };

  // Push to history before changing key state
  const pushHistory = (stateSnapshot) => {
    setHistory(prev => [...prev.slice(-20), stateSnapshot]);
    setFuture([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture(prev => [{ frontConfig, backConfig, customColors, customerLogo, edition, templateType }, ...prev]);
    setFrontConfig(previous.frontConfig);
    setBackConfig(previous.backConfig);
    setCustomColors(previous.customColors);
    setCustomerLogo(previous.customerLogo);
    setEdition(previous.edition);
    setTemplateType(previous.templateType || 'standard');
    setHistory(prev => prev.slice(0, prev.length - 1));
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(prev => [...prev, { frontConfig, backConfig, customColors, customerLogo, edition, templateType }]);
    setFrontConfig(next.frontConfig);
    setBackConfig(next.backConfig);
    setCustomColors(next.customColors);
    setCustomerLogo(next.customerLogo);
    setEdition(next.edition);
    setTemplateType(next.templateType || 'standard');
    setFuture(prev => prev.slice(1));
  };

  // Apply a Theme Preset
  const handleApplyTheme = (theme) => {
    pushHistory({ frontConfig, backConfig, customColors, customerLogo, edition, templateType });
    setEdition(theme.edition);
    setTemplateType(theme.templateType);
    setFrontConfig(prev => ({
      ...prev,
      fontFamily: theme.fontFamily || prev.fontFamily,
      roleFontFamily: theme.roleFontFamily || prev.roleFontFamily,
      alignment: theme.alignment || prev.alignment
    }));
    if (theme.customColors) {
      setCustomColors(theme.customColors);
    }
    setSelectedThemeId(theme.id);
    showToast(`Applied "${theme.name}" theme!`);
  };

  // Upload Logo with full validation and robust error recovery
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isUploadingLogo) return;

    // 1. Validation: file format
    const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|svg|webp|gif|bmp|avif)$/i.test(file.name || '');
    if (!isImage) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP).', 'error');
      if (e.target) e.target.value = '';
      return;
    }

    // 2. Validation: file size (10 MB maximum limit)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      showToast(`File size (${sizeMB}MB) exceeds 10MB limit. Please upload a smaller image.`, 'error');
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploadingLogo(true);
    pushHistory({ frontConfig, backConfig, customColors, customerLogo, edition, templateType });
    showToast('Uploading brand artwork to storage...', 'info');

    // Create temporary object URL for local instant visual preview while upload processes
    let tempPreviewUrl = null;
    try {
      if (typeof window !== 'undefined' && window.URL && window.URL.createObjectURL) {
        tempPreviewUrl = window.URL.createObjectURL(file);
        setCustomerLogo(prev => ({ ...prev, url: tempPreviewUrl }));
        setFrontConfig(prev => ({ ...prev, customLogo: tempPreviewUrl }));
        setTemplateType('customer_logo');
      }
    } catch {
      // Local preview fallback gracefully
    }

    try {
      // 3. Dispatch upload to Supabase Storage 'logos' bucket
      const result = await uploadImage(file, 'logo', `admin_${Date.now()}`);
      const uploadedUrl = typeof result === 'string' ? result : (result?.url || '');

      if (uploadedUrl) {
        // Revoke temporary blob object URL once permanent asset URL is received
        if (tempPreviewUrl && tempPreviewUrl.startsWith('blob:') && typeof window !== 'undefined' && window.URL?.revokeObjectURL) {
          try { window.URL.revokeObjectURL(tempPreviewUrl); } catch {}
        }

        let finalTransUrl = uploadedUrl;
        try {
          const bgRes = await removeLogoBackground(uploadedUrl, { forceOpaqueRemoval: false });
          if (bgRes?.dataUrl) {
            finalTransUrl = bgRes.dataUrl;
          }
        } catch (e) {
          console.warn('[AdminStudio] Auto bg removal error:', e);
        }

        setCustomerLogo(prev => ({
          ...prev,
          url: finalTransUrl,
          originalUrl: uploadedUrl,
          transparentUrl: finalTransUrl
        }));
        setFrontConfig(prev => ({ ...prev, customLogo: finalTransUrl }));
        setTemplateType('customer_logo');
        showToast('Logo uploaded and background automatically removed.');
      } else {
        // Revert temporary preview on failed URL generation
        if (tempPreviewUrl && tempPreviewUrl.startsWith('blob:') && typeof window !== 'undefined' && window.URL?.revokeObjectURL) {
          try { window.URL.revokeObjectURL(tempPreviewUrl); } catch {}
        }
        setCustomerLogo(prev => ({ ...prev, url: null }));
        setFrontConfig(prev => ({ ...prev, customLogo: null }));
        showToast('Upload failed: Storage did not return an accessible image URL.', 'error');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      if (tempPreviewUrl && tempPreviewUrl.startsWith('blob:') && typeof window !== 'undefined' && window.URL?.revokeObjectURL) {
        try { window.URL.revokeObjectURL(tempPreviewUrl); } catch {}
      }
      setCustomerLogo(prev => ({ ...prev, url: null }));
      setFrontConfig(prev => ({ ...prev, customLogo: null }));
      showToast(err.message || 'Logo upload encountered an error. Please try again.', 'error');
    } finally {
      setIsUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  // Remove Logo Action
  const handleRemoveLogo = () => {
    pushHistory({ frontConfig, backConfig, customColors, customerLogo, edition, templateType });
    setCustomerLogo(prev => ({ ...prev, url: null }));
    setFrontConfig(prev => ({ ...prev, customLogo: null }));
    setTemplateType('standard');
    showToast('Client logo removed.');
  };

  // Remove Logo Background Action (Generates Transparent PNG)
  const handleRemoveLogoBackground = async () => {
    if (!customerLogo.url) return;
    setIsRemovingBg(true);
    showToast('Analyzing and removing logo background...', 'info');
    try {
      const result = await removeLogoBackground(customerLogo.url, {
        tolerance: 38,
        feather: 16,
        forceOpaqueRemoval: true
      });

      if (result && result.dataUrl) {
        pushHistory({ frontConfig, backConfig, customColors, customerLogo, edition, templateType });
        setCustomerLogo(prev => ({ ...prev, url: result.dataUrl }));
        setFrontConfig(prev => ({ ...prev, customLogo: result.dataUrl }));
        showToast('✓ Logo background removed! Transparent PNG applied.');
      } else {
        showToast('Could not isolate background for this logo.', 'error');
      }
    } catch (err) {
      console.error('Background removal error:', err);
      showToast(err.message || 'Failed to remove logo background.', 'error');
    } finally {
      setIsRemovingBg(false);
    }
  };

  // Create New Order OR Save Changes to Existing Active Order
  const handleCreateOrUpdateOrder = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const clientName = (waOrderForm.customerName || frontConfig.name || '').trim();
    const clientPhone = (waOrderForm.customerPhone || '').trim();

    if (!clientName) {
      showToast('Please enter the customer name.', 'error');
      setLeftTab('order');
      return;
    }

    const edDetails = EDITIONS[edition] || EDITIONS.purple;
    const finalAmount = Number(waOrderForm.totalAmount) || edDetails.price || 2499;

    // A. Updating Existing Order
    if (selectedOrderId) {
      const existingOrder = orders.find(o => o.id === selectedOrderId || o.orderReference === selectedOrderId);
      const customerId = existingOrder?.customerId || `cust_${Date.now()}`;
      const dId = existingOrder?.designId || designId || `dsgn_${Date.now()}`;

      const designRecord = {
        id: dId,
        orderId: selectedOrderId,
        customerId,
        customerName: clientName,
        edition,
        templateType: customerLogo.url ? 'customer_logo' : templateType,
        front: {
          ...frontConfig,
          customLogo: customerLogo.url || frontConfig.customLogo || null
        },
        back: backConfig,
        customColors,
        customerLogo,
        flocardLogo,
        status: 'approved',
        createdAt: existingOrder?.design?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveDesign(designRecord);

      if (saveCustomer && clientName) {
        saveCustomer({
          id: customerId,
          name: clientName,
          phone: clientPhone,
          email: (waOrderForm.customerEmail || '').trim() || existingOrder?.customerEmail || `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@flocard.in`,
          company: (waOrderForm.company || frontConfig.company || '').trim(),
          role: (waOrderForm.role || frontConfig.role || 'Client').trim(),
          status: 'active',
          updatedAt: new Date().toISOString()
        });
      }

      const updatedOrder = {
        ...(existingOrder || {}),
        id: selectedOrderId,
        orderReference: existingOrder?.orderReference || selectedOrderId,
        customerName: clientName,
        customerEmail: (waOrderForm.customerEmail || '').trim() || existingOrder?.customerEmail || `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@flocard.in`,
        customerPhone: clientPhone || existingOrder?.customerPhone || '',
        company: (waOrderForm.company || frontConfig.company || '').trim(),
        role: (waOrderForm.role || frontConfig.role || 'Executive').trim(),
        tagline: (waOrderForm.tagline || frontConfig.tagline || '').trim(),
        customerDetails: {
          fullName: clientName,
          email: (waOrderForm.customerEmail || '').trim() || existingOrder?.customerEmail || `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@flocard.in`,
          phone: clientPhone || existingOrder?.customerPhone || '',
          company: (waOrderForm.company || frontConfig.company || '').trim(),
          role: (waOrderForm.role || frontConfig.role || 'Executive').trim(),
          address: (waOrderForm.shippingAddress || '').trim() || existingOrder?.shippingAddress || 'Direct Dispatch',
          city: (waOrderForm.city || 'Indiranagar, Bengaluru'),
          postalCode: (waOrderForm.pinCode || '560038')
        },
        hasInvoiceAddon: true,
        invoiceEligible: true,
        customerLogo,
        flocardLogo,
        designId: dId,
        design: designRecord,
        frontConfig: designRecord.front,
        backConfig: designRecord.back,
        customColors,
        edition,
        templateType: customerLogo.url ? 'customer_logo' : templateType,
        totalAmount: finalAmount,
        shippingAddress: (waOrderForm.shippingAddress || '').trim() || existingOrder?.shippingAddress || 'Direct Dispatch',
        updatedAt: new Date().toISOString()
      };

      saveOrder(updatedOrder);
      showToast(`✓ Order ${selectedOrderId} updated successfully! Redirecting to orders...`);

      setTimeout(() => {
        if (onNavigateToOrders) {
          onNavigateToOrders();
        } else {
          window.location.href = '/admin?tab=orders';
        }
      }, 500);
      return;
    }

    // B. Creating Brand New Order
    const orderRef = `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingToken = `tok_${Math.random().toString(36).substring(2, 12)}`;
    const customerId = `cust_${Date.now()}`;
    const dId = `dsgn_${Date.now()}`;
    const clientEmail = (waOrderForm.customerEmail || '').trim() || `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@flocard.in`;

    const designRecord = {
      id: dId,
      orderId: orderRef,
      customerId,
      customerName: clientName,
      edition,
      templateType: customerLogo.url ? 'customer_logo' : templateType,
      front: {
        ...frontConfig,
        customLogo: customerLogo.url || frontConfig.customLogo || null
      },
      back: backConfig,
      customColors,
      customerLogo,
      flocardLogo,
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveDesign(designRecord);

    if (saveCustomer) {
      saveCustomer({
        id: customerId,
        name: clientName,
        phone: clientPhone,
        email: clientEmail,
        company: (waOrderForm.company || frontConfig.company || '').trim(),
        role: (waOrderForm.role || frontConfig.role || 'Client').trim(),
        source: 'admin_studio',
        status: 'active',
        createdAt: new Date().toISOString()
      });
    }

    const newOrder = {
      id: orderRef,
      orderReference: orderRef,
      source: 'admin_studio',
      customerId,
      customerName: clientName,
      customerEmail: clientEmail,
      customerPhone: clientPhone,
      company: (waOrderForm.company || frontConfig.company || '').trim(),
      role: (waOrderForm.role || frontConfig.role || 'Executive').trim(),
      tagline: (waOrderForm.tagline || frontConfig.tagline || '').trim(),
      customerDetails: {
        fullName: clientName,
        email: clientEmail,
        phone: clientPhone,
        company: (waOrderForm.company || frontConfig.company || '').trim(),
        role: (waOrderForm.role || frontConfig.role || 'Executive').trim(),
        address: (waOrderForm.shippingAddress || '').trim() || 'Direct Dispatch',
        city: (waOrderForm.city || 'Indiranagar, Bengaluru'),
        postalCode: (waOrderForm.pinCode || '560038')
      },
      hasInvoiceAddon: true,
      invoiceEligible: true,
      customerLogo,
      flocardLogo,
      designId: dId,
      design: designRecord,
      frontConfig: designRecord.front,
      backConfig: designRecord.back,
      customColors,
      edition,
      templateType: customerLogo.url ? 'customer_logo' : templateType,
      totalAmount: finalAmount,
      amountPaid: finalAmount,
      amountOutstanding: 0,
      paymentStatus: 'paid',
      paymentMethod: 'admin_entry',
      status: 'design_submitted',
      shippingAddress: (waOrderForm.shippingAddress || '').trim() || 'Direct Dispatch',
      trackingToken,
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveOrder(newOrder);
    showToast(`✓ Order ${orderRef} created successfully! Redirecting to orders...`);

    setTimeout(() => {
      if (onNavigateToOrders) {
        onNavigateToOrders();
      } else {
        window.location.href = '/admin?tab=orders';
      }
    }, 500);
  };

  const handleCreateWhatsAppOrder = handleCreateOrUpdateOrder;

  // Save Design Draft Action
  const handleSaveDraft = (status = 'draft') => {
    const payload = {
      id: designId,
      title: designTitle,
      edition,
      templateType: customerLogo.url ? 'customer_logo' : templateType,
      front: {
        ...frontConfig,
        customLogo: customerLogo.url || frontConfig.customLogo || null
      },
      back: backConfig,
      customColors,
      customerLogo,
      status,
      customerName: frontConfig.name,
      updatedAt: new Date().toISOString()
    };

    saveDesign(payload);
    showToast(`Card design "${designTitle}" saved as ${status}.`);
  };

  // Publish as Reusable Template
  const handlePublishTemplate = () => {
    const templateId = `tmpl_${Date.now()}`;
    const payload = {
      id: templateId,
      name: designTitle,
      edition,
      templateType: customerLogo.url ? 'customer_logo' : templateType,
      front: {
        ...frontConfig,
        customLogo: customerLogo.url || frontConfig.customLogo || null
      },
      back: backConfig,
      customColors,
      customerLogo,
      publishedAt: new Date().toISOString()
    };

    if (saveTemplate) {
      saveTemplate(payload);
    }
    handleSaveDraft('published');
    showToast(`Published template "${designTitle}" to customer card designer!`);
  };

  // Card canvas normalized config
  const fullConfig = {
    front: {
      ...frontConfig,
      showTagline: layerVisibility.tagline && frontConfig.showTagline,
      showNfc: layerVisibility.nfcIcon && frontConfig.showNfc
    },
    back: backConfig,
    customColors,
    customerLogo,
    flocardLogo
  };

  const effectiveMobileScale = isMobile
    ? Math.min(0.85, Math.max(0.44, (viewportWidth - 28) / 580))
    : 1;
  const computedZoom = isMobile ? effectiveMobileScale * zoomLevel : zoomLevel;

  return (
    <div className="admin-studio-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: isMobile ? 'auto' : 'calc(100vh - 80px)',
      minHeight: isMobile ? 'calc(100vh - 70px)' : 'auto',
      background: isLight ? '#F8FAFC' : '#090514',
      color: isLight ? '#0F172A' : '#FFFFFF',
      fontFamily: 'Inter, sans-serif',
      overflow: isMobile ? 'visible' : 'hidden'
    }}>
      {/* Studio Header Bar */}
      <div style={{
        display: 'flex',
        flexDirection: isSmallMobile ? 'column' : 'row',
        alignItems: isSmallMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '8px 12px' : '12px 24px',
        background: isLight ? '#FFFFFF' : '#130B22',
        borderBottom: isLight ? '1px solid #E2E8F0' : '1px solid rgba(168, 85, 247, 0.2)',
        zIndex: 10,
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
            <span style={{
              background: 'linear-gradient(135deg, #A855F7, #6B00FF)',
              padding: isMobile ? '4px 7px' : '6px 10px',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              color: '#FFFFFF',
              flexShrink: 0
            }}>
              STUDIO
            </span>
            <input
              type="text"
              value={designTitle}
              onChange={(e) => setDesignTitle(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isLight ? '#0F172A' : '#FFFFFF',
                fontSize: isMobile ? '0.9rem' : '1.05rem',
                fontWeight: 700,
                outline: 'none',
                minWidth: 0,
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px', background: isLight ? '#F1F5F9' : '#1F1238', padding: '3px', borderRadius: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setActiveSide('front')}
              style={{
                padding: isMobile ? '4px 10px' : '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: isMobile ? '0.74rem' : '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeSide === 'front' ? '#7C3AED' : 'transparent',
                color: activeSide === 'front' ? '#FFFFFF' : (isLight ? '#475569' : '#94A3B8')
              }}
            >
              {isSmallMobile ? 'Front' : 'Front Side'}
            </button>
            <button
              onClick={() => setActiveSide('back')}
              style={{
                padding: isMobile ? '4px 10px' : '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: isMobile ? '0.74rem' : '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeSide === 'back' ? '#7C3AED' : 'transparent',
                color: activeSide === 'back' ? '#FFFFFF' : (isLight ? '#475569' : '#94A3B8')
              }}
            >
              {isSmallMobile ? 'Back' : 'Back Side'}
            </button>
          </div>
        </div>

        {/* Studio Actions: Prominent WhatsApp Order Creator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, justifyContent: isSmallMobile ? 'space-between' : 'flex-end', width: isSmallMobile ? '100%' : 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={undo}
              disabled={history.length === 0}
              title="Undo (Ctrl+Z)"
              style={{
                background: '#1F1238',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                color: history.length === 0 ? '#6B5E82' : '#FFFFFF',
                padding: isMobile ? '6px 8px' : '8px',
                borderRadius: '7px',
                cursor: history.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <Undo2 size={isMobile ? 14 : 16} />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              title="Redo (Ctrl+Y)"
              style={{
                background: '#1F1238',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                color: future.length === 0 ? '#6B5E82' : '#FFFFFF',
                padding: isMobile ? '6px 8px' : '8px',
                borderRadius: '7px',
                cursor: history.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <Redo2 size={isMobile ? 14 : 16} />
            </button>
          </div>

          {/* Quick Select Theme Button */}
          <button
            onClick={() => setLeftTab('style')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: isMobile ? '6px 10px' : '8px 14px',
              borderRadius: '7px',
              background: leftTab === 'style' ? 'rgba(168, 85, 247, 0.25)' : '#1F1238',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#D8B4FE',
              fontSize: isMobile ? '0.74rem' : '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Palette size={isMobile ? 13 : 15} />
            <span>Themes</span>
          </button>

          {/* Primary Action Button: Save or Create Order */}
          <button
            onClick={handleCreateOrUpdateOrder}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: isMobile ? '6px 12px' : '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: '#FFFFFF',
              fontSize: isMobile ? '0.78rem' : '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(124, 58, 237, 0.35)',
              transition: 'transform 0.15s ease',
              flex: isSmallMobile ? 1 : 'none'
            }}
          >
            <Package size={isMobile ? 14 : 16} />
            <span>{selectedOrderId ? (isSmallMobile ? 'Save Order' : 'Save & Update') : 'Create Order'}</span>
          </button>

          <button
            onClick={() => handleSaveDraft('draft')}
            style={{
              display: isSmallMobile ? 'none' : 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: isMobile ? '6px 10px' : '8px 12px',
              fontSize: isMobile ? '0.74rem' : '0.82rem',
              borderRadius: '7px',
              background: '#1F1238',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              color: '#B9AEC9',
              cursor: 'pointer'
            }}
          >
            <Save size={13} />
            <span>Draft</span>
          </button>
        </div>
      </div>

      {/* Active Order Banner if editing */}
      {selectedOrderId && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.25), rgba(79, 70, 229, 0.25))',
          borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
          padding: isMobile ? '6px 12px' : '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: isMobile ? '0.75rem' : '0.82rem',
          flexWrap: 'wrap',
          gap: '6px',
          zIndex: 9
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
            <Package size={14} color="#C084FC" style={{ flexShrink: 0 }} />
            <span style={{ color: '#E9D5FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Order: <strong style={{ color: '#FFFFFF' }}>{selectedOrderId}</strong>
              {(waOrderForm.customerName || frontConfig.name) && ` · ${(waOrderForm.customerName || frontConfig.name)}`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                setSelectedOrderId('');
                setDesignTitle('New Card Artwork');
                showToast('Cleared active order link. Now creating a new order.');
              }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#CBD5E1',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              New Order
            </button>
            <button
              type="button"
              onClick={handleCreateOrUpdateOrder}
              style={{
                background: '#7C3AED',
                border: 'none',
                color: '#FFFFFF',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Save size={11} />
              <span>Save &amp; Go</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Mode Switcher Bar (< 1024px) */}
      {isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: isLight ? '#F1F5F9' : '#160D26',
          borderBottom: `1px solid ${isLight ? '#E2E8F0' : 'rgba(168, 85, 247, 0.25)'}`,
          padding: '6px 10px',
          gap: '6px',
          zIndex: 8
        }}>
          <button
            type="button"
            onClick={() => setMobileViewMode('split')}
            style={{
              flex: 1,
              padding: '7px 6px',
              borderRadius: '8px',
              border: 'none',
              background: mobileViewMode === 'split' ? '#7C3AED' : 'transparent',
              color: mobileViewMode === 'split' ? '#FFFFFF' : (isLight ? '#475569' : '#B9AEC9'),
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <Sliders size={13} />
            <span>Card + Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode('preview')}
            style={{
              flex: 1,
              padding: '7px 6px',
              borderRadius: '8px',
              border: 'none',
              background: mobileViewMode === 'preview' ? '#7C3AED' : 'transparent',
              color: mobileViewMode === 'preview' ? '#FFFFFF' : (isLight ? '#475569' : '#B9AEC9'),
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <Eye size={13} />
            <span>Full 3D Card</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode('controls')}
            style={{
              flex: 1,
              padding: '7px 6px',
              borderRadius: '8px',
              border: 'none',
              background: mobileViewMode === 'controls' ? '#7C3AED' : 'transparent',
              color: mobileViewMode === 'controls' ? '#FFFFFF' : (isLight ? '#475569' : '#B9AEC9'),
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <Edit3 size={13} />
            <span>Controls Only</span>
          </button>
        </div>
      )}

      {/* Main Workspace (Responsive) */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        flex: 1,
        overflowY: isMobile ? 'auto' : 'hidden',
        overflowX: 'hidden'
      }}>
        
        {/* LEFT PANEL: Intuitive Card Designer & Customer Details */}
        <div style={{
          display: (isMobile && mobileViewMode === 'preview') ? 'none' : 'flex',
          order: (isMobile && mobileViewMode === 'split') ? 2 : 1,
          width: isMobile ? '100%' : '330px',
          background: '#11091F',
          borderRight: isMobile ? 'none' : '1px solid rgba(168, 85, 247, 0.2)',
          flexDirection: 'column',
          overflowY: isMobile ? 'visible' : 'auto',
          flexShrink: 0
        }}>
          {/* Sub-Tab Navigation Header (Matching Customer UI) */}
          <div style={{
            display: 'flex',
            background: '#170D29',
            borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
            padding: '4px',
            gap: '2px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {[
              { id: 'text', label: 'Text', icon: <Type size={14} /> },
              { id: 'logo', label: 'Logo', icon: <ImageIcon size={14} /> },
              { id: 'qr', label: 'QR', icon: <QrCode size={14} /> },
              { id: 'style', label: 'Style', icon: <Palette size={14} /> },
              { id: 'order', label: 'Order', icon: <Package size={14} /> }
            ].map((tab) => {
              const isActive = leftTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setLeftTab(tab.id);
                    if (tab.id === 'qr') setActiveSide('back');
                    if (tab.id === 'text' || tab.id === 'logo') setActiveSide('front');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 2px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: isActive ? '#7C3AED' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#B9AEC9',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: TEXT & TYPOGRAPHY */}
          {leftTab === 'text' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A855F7', textTransform: 'uppercase' }}>
                  Card Typography &amp; Text
                </label>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Front Side</span>
              </div>

              {/* Customer Name */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE' }}>Full Name *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const upper = (frontConfig.name || '').toUpperCase();
                      setFrontConfig(prev => ({ ...prev, name: upper }));
                      setWaOrderForm(prev => ({ ...prev, customerName: upper }));
                    }}
                    style={{ background: 'none', border: 'none', color: '#C084FC', fontSize: '0.68rem', cursor: 'pointer', padding: 0 }}
                  >
                    UPPERCASE
                  </button>
                </div>
                <input
                  type="text"
                  value={frontConfig.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFrontConfig(prev => ({ ...prev, name: val }));
                    setWaOrderForm(prev => ({ ...prev, customerName: val }));
                  }}
                  placeholder="e.g. ALEX MORGAN"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#FFFFFF', fontSize: '0.82rem', outline: 'none' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '6px', marginTop: '6px' }}>
                  <select
                    value={frontConfig.fontFamily}
                    onChange={(e) => setFrontConfig(prev => ({ ...prev, fontFamily: e.target.value }))}
                    style={{ padding: '6px 8px', borderRadius: '6px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.25)', color: '#FFFFFF', fontSize: '0.75rem', outline: 'none' }}
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#1A0F2E', padding: '2px 6px', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                    <input
                      type="color"
                      value={customColors.nameColor || '#FFFFFF'}
                      onChange={(e) => setCustomColors(prev => ({ ...prev, nameColor: e.target.value }))}
                      style={{ width: '22px', height: '22px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>Color</span>
                  </div>
                </div>
              </div>

              {/* Role / Designation */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                  Role / Designation
                </label>
                <input
                  type="text"
                  value={frontConfig.role}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFrontConfig(prev => ({ ...prev, role: val }));
                    setWaOrderForm(prev => ({ ...prev, role: val }));
                  }}
                  placeholder="e.g. FOUNDER & CEO"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#FFFFFF', fontSize: '0.82rem', outline: 'none' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '6px', marginTop: '6px' }}>
                  <select
                    value={frontConfig.roleFontFamily || 'Inter'}
                    onChange={(e) => setFrontConfig(prev => ({ ...prev, roleFontFamily: e.target.value }))}
                    style={{ padding: '6px 8px', borderRadius: '6px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.25)', color: '#FFFFFF', fontSize: '0.75rem', outline: 'none' }}
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#1A0F2E', padding: '2px 6px', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                    <input
                      type="color"
                      value={customColors.roleColor || '#D8B4FE'}
                      onChange={(e) => setCustomColors(prev => ({ ...prev, roleColor: e.target.value }))}
                      style={{ width: '22px', height: '22px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>Color</span>
                  </div>
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={frontConfig.company}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFrontConfig(prev => ({ ...prev, company: val }));
                    setWaOrderForm(prev => ({ ...prev, company: val }));
                  }}
                  placeholder="e.g. FLOCARDS"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#FFFFFF', fontSize: '0.82rem', outline: 'none' }}
                />
              </div>

              {/* Details / Subtitle */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                  Specialty / Details
                </label>
                <input
                  type="text"
                  value={frontConfig.details}
                  onChange={(e) => setFrontConfig(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="e.g. CONNECTED IDENTITY SYSTEMS"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#FFFFFF', fontSize: '0.82rem', outline: 'none' }}
                />
              </div>

              {/* Tagline */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE' }}>Tagline</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#CBD5E1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={frontConfig.showTagline}
                      onChange={(e) => setFrontConfig(prev => ({ ...prev, showTagline: e.target.checked }))}
                      style={{ accentColor: '#7C3AED' }}
                    />
                    <span>Show</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={frontConfig.tagline}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFrontConfig(prev => ({ ...prev, tagline: val }));
                    setWaOrderForm(prev => ({ ...prev, tagline: val }));
                  }}
                  placeholder="e.g. Bespoke Connected Cards"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#FFFFFF', fontSize: '0.82rem', outline: 'none' }}
                />
              </div>

              {/* Text Alignment */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '6px' }}>
                  Text Alignment
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'left', label: 'Left', icon: <AlignLeft size={14} /> },
                    { id: 'center', label: 'Center', icon: <AlignCenter size={14} /> },
                    { id: 'right', label: 'Right', icon: <AlignRight size={14} /> }
                  ].map(align => (
                    <button
                      key={align.id}
                      type="button"
                      onClick={() => setFrontConfig(prev => ({ ...prev, alignment: align.id }))}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: frontConfig.alignment === align.id ? '1.5px solid #7C3AED' : '1px solid rgba(168, 85, 247, 0.2)',
                        background: frontConfig.alignment === align.id ? 'rgba(124, 58, 237, 0.25)' : '#1A0F2E',
                        color: frontConfig.alignment === align.id ? '#FFFFFF' : '#94A3B8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        fontSize: '0.74rem'
                      }}
                    >
                      {align.icon}
                      <span>{align.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contactless NFC Icon Toggle */}
              <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: '#D8B4FE' }}>Contactless NFC Symbol</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#CBD5E1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={frontConfig.showNfc}
                    onChange={(e) => setFrontConfig(prev => ({ ...prev, showNfc: e.target.checked }))}
                    style={{ accentColor: '#7C3AED' }}
                  />
                  <span>Display on Card</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: LOGO CONTROLS */}
          {leftTab === 'logo' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A855F7', textTransform: 'uppercase' }}>
                  Logo &amp; Brand Emblem
                </label>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Front Side</span>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(124, 58, 237, 0.2)',
                  border: '1.5px dashed #7C3AED',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isUploadingLogo ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Upload size={16} />
                <span>{isUploadingLogo ? 'Uploading & Removing Background...' : (customerLogo.url ? 'Replace Logo' : 'Upload Client Logo')}</span>
              </button>

              {customerLogo.url ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Thumbnail & Quick Actions */}
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#1A0F2E',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        background: '#0F091C',
                        backgroundImage: 'linear-gradient(45deg, #24163B 25%, transparent 25%), linear-gradient(-45deg, #24163B 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #24163B 75%), linear-gradient(-45deg, transparent 75%, #24163B 75%)',
                        backgroundSize: '8px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <img src={customerLogo.url} alt="Logo" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700, display: 'block' }}>
                          ✓ Logo Active
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
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
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#7C3AED',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Sparkles size={12} />
                      <span>Smart Studio</span>
                    </button>
                  </div>

                  {/* Sliders: Size & Rotation */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#CBD5E1', marginBottom: '4px' }}>
                      <span>Size ({customerLogo.size}%)</span>
                      <span>Rotation ({customerLogo.rotation || 0}°)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input
                        type="range"
                        min="40"
                        max="200"
                        value={customerLogo.size}
                        onChange={(e) => setCustomerLogo(prev => ({ ...prev, size: Number(e.target.value) }))}
                        style={{ width: '100%', accentColor: '#7C3AED' }}
                      />
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={customerLogo.rotation || 0}
                        onChange={(e) => setCustomerLogo(prev => ({ ...prev, rotation: Number(e.target.value) }))}
                        style={{ width: '100%', accentColor: '#7C3AED' }}
                      />
                    </div>
                  </div>

                  {/* Sliders: Offset X & Y */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#CBD5E1', marginBottom: '4px' }}>
                      <span>Pos X ({customerLogo.posX || 0}px)</span>
                      <span>Pos Y ({customerLogo.posY || 0}px)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={customerLogo.posX || 0}
                        onChange={(e) => setCustomerLogo(prev => ({ ...prev, posX: Number(e.target.value) }))}
                        style={{ width: '100%', accentColor: '#7C3AED' }}
                      />
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={customerLogo.posY || 0}
                        onChange={(e) => setCustomerLogo(prev => ({ ...prev, posY: Number(e.target.value) }))}
                        style={{ width: '100%', accentColor: '#7C3AED' }}
                      />
                    </div>
                  </div>

                  {/* Circular Glass Badge Toggle & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#CBD5E1', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={customerLogo.showCircleBadge}
                        onChange={(e) => setCustomerLogo(prev => ({ ...prev, showCircleBadge: e.target.checked }))}
                        style={{ accentColor: '#7C3AED' }}
                      />
                      <span>Circular Badge</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleRemoveLogoBackground}
                      disabled={isRemovingBg}
                      style={{
                        background: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        color: '#4ADE80',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: isRemovingBg ? 'wait' : 'pointer'
                      }}
                    >
                      {isRemovingBg ? 'Cleaning...' : 'Clean BG'}
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Remove Logo
                    </button>
                  </div>

                  {/* Template Type Toggle */}
                  <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(168, 85, 247, 0.2)' }}>
                    <label style={{ fontSize: '0.74rem', color: '#D8B4FE', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Card Layout Mode
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setTemplateType('standard')}
                        style={{
                          padding: '7px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          border: templateType === 'standard' ? '1.5px solid #7C3AED' : '1px solid rgba(168, 85, 247, 0.2)',
                          background: templateType === 'standard' ? 'rgba(124, 58, 237, 0.25)' : '#1A0F2E',
                          color: templateType === 'standard' ? '#FFFFFF' : '#94A3B8',
                          cursor: 'pointer'
                        }}
                      >
                        Standard Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateType('customer_logo')}
                        style={{
                          padding: '7px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          border: templateType === 'customer_logo' ? '1.5px solid #7C3AED' : '1px solid rgba(168, 85, 247, 0.2)',
                          background: templateType === 'customer_logo' ? 'rgba(124, 58, 237, 0.25)' : '#1A0F2E',
                          color: templateType === 'customer_logo' ? '#FFFFFF' : '#94A3B8',
                          cursor: 'pointer'
                        }}
                      >
                        Logo Centric
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#1A0F2E', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: '#94A3B8' }}>
                    No custom logo uploaded yet. Upload a company emblem, monogram, or brand mark above.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QR CODE & DESTINATION */}
          {leftTab === 'qr' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A855F7', textTransform: 'uppercase' }}>
                  QR Code &amp; Back Details
                </label>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Back Side</span>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                  Destination URL (NFC &amp; QR)
                </label>
                <input
                  type="text"
                  value={backConfig.qrUrl}
                  onChange={(e) => setBackConfig(prev => ({ ...prev, qrUrl: e.target.value }))}
                  placeholder="https://flocard.in/client"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#FFFFFF', fontSize: '0.82rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                  QR Subtext / Call-to-action
                </label>
                <input
                  type="text"
                  value={backConfig.subtext}
                  onChange={(e) => setBackConfig(prev => ({ ...prev, subtext: e.target.value }))}
                  placeholder="SCAN ME"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#FFFFFF', fontSize: '0.82rem', outline: 'none' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE' }}>Specs / Feature Line</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#CBD5E1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={backConfig.showNfcSpecs}
                      onChange={(e) => setBackConfig(prev => ({ ...prev, showNfcSpecs: e.target.checked }))}
                      style={{ accentColor: '#7C3AED' }}
                    />
                    <span>Show</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={backConfig.specsText}
                  onChange={(e) => setBackConfig(prev => ({ ...prev, specsText: e.target.value }))}
                  placeholder="NFC | PORTFOLIO | CONTACT | CONNECT"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#FFFFFF', fontSize: '0.82rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                  Short Brand URL
                </label>
                <input
                  type="text"
                  value={backConfig.brandUrl}
                  onChange={(e) => setBackConfig(prev => ({ ...prev, brandUrl: e.target.value }))}
                  placeholder="flocard.in/client"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#FFFFFF', fontSize: '0.82rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '6px' }}>
                  QR Code Accent Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1A0F2E', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                  <input
                    type="color"
                    value={customColors.qrColor || '#FFFFFF'}
                    onChange={(e) => setCustomColors(prev => ({ ...prev, qrColor: e.target.value }))}
                    style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <span style={{ fontSize: '0.76rem', color: '#CBD5E1' }}>QR &amp; Icon Color</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STYLE & EDITIONS */}
          {leftTab === 'style' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A855F7', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Curated Theme Presets
                </label>
                <p style={{ margin: '0 0 12px', fontSize: '0.72rem', color: '#B9AEC9' }}>
                  1-Click to apply typography, accents, and finish to your current client card.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {PRESET_THEMES.map((theme) => {
                    const isSelected = selectedThemeId === theme.id && edition === theme.edition;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => handleApplyTheme(theme)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          background: theme.previewBg,
                          border: isSelected ? `2px solid ${theme.accentColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                          boxShadow: isSelected ? `0 0 14px ${theme.accentColor}44` : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: theme.accentColor }}>
                            {theme.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#D4D4D8', marginTop: '2px' }}>
                            {theme.fontFamily} · {theme.edition.toUpperCase()} · {theme.templateType === 'customer_logo' ? 'Logo Front' : 'Standard'}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: theme.accentColor,
                            border: `1px solid ${theme.accentColor}55`
                          }}
                        >
                          {theme.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Published Reusable Templates */}
              {templates && templates.length > 0 && (
                <div style={{ paddingTop: '14px', borderTop: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A855F7', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Custom Saved Templates
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {templates.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          pushHistory({ frontConfig, backConfig, customColors, customerLogo, edition, templateType });
                          if (tmpl.edition) setEdition(tmpl.edition);
                          if (tmpl.templateType) setTemplateType(tmpl.templateType);
                          if (tmpl.front) setFrontConfig(prev => ({ ...prev, ...tmpl.front }));
                          if (tmpl.back) setBackConfig(prev => ({ ...prev, ...tmpl.back }));
                          if (tmpl.customColors) setCustomColors(tmpl.customColors);
                          showToast(`Loaded template: ${tmpl.name}`);
                        }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: '#1A0F2E',
                          border: '1px solid rgba(168, 85, 247, 0.2)',
                          fontSize: '0.8rem',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{tmpl.name}</span>
                        <span style={{ fontSize: '0.68rem', color: '#A855F7', textTransform: 'uppercase' }}>{tmpl.edition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Material & Finish Quick Selector */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A855F7', textTransform: 'uppercase' }}>
                    Card Edition &amp; Finish
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{EDITIONS[edition]?.name}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {Object.keys(EDITIONS).map((key) => {
                    const ed = EDITIONS[key];
                    const active = edition === key;
                    const swatchBg = key === 'gold' ? 'linear-gradient(135deg, #FFF0A6 0%, #E9C766 50%, #C9972C 100%)'
                      : key === 'platinum' ? 'linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 50%, #94A3B8 100%)'
                      : key === 'metal' ? 'linear-gradient(135deg, #64748B 0%, #334155 50%, #0F172A 100%)'
                      : key === 'white' ? 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 50%, #E2E8F0 100%)'
                      : 'linear-gradient(135deg, #C084FC 0%, #A855F7 50%, #6B00FF 100%)';
                    const ringColor = key === 'gold' ? '#E9C766' : key === 'platinum' ? '#CBD5E1' : key === 'white' ? '#FFFFFF' : '#A855F7';

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          pushHistory({ frontConfig, backConfig, customColors, customerLogo, edition, templateType });
                          setEdition(key);
                        }}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '12px',
                          background: active
                            ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.22), rgba(107, 0, 255, 0.32))'
                            : 'rgba(255, 255, 255, 0.03)',
                          border: active ? `1.5px solid ${ringColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                          boxShadow: active ? `0 0 16px ${ringColor}33` : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '8px',
                          transition: 'all 0.18s ease',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: swatchBg,
                              border: active ? `2px solid ${ringColor}` : '1.5px solid rgba(255, 255, 255, 0.3)',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                              flexShrink: 0
                            }}
                          />
                          {active && (
                            <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: ringColor, color: key === 'gold' || key === 'white' || key === 'platinum' ? '#000000' : '#FFFFFF' }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: active ? '#FFFFFF' : '#CBD5E1' }}>
                            {ed.name}
                          </div>
                          <div style={{ fontSize: '0.70rem', color: '#94A3B8', marginTop: '2px' }}>
                            ₹{ed.price?.toLocaleString('en-IN') || '2,199'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ORDER & CUSTOMER DETAILS (ADMIN FIELDS) */}
          {leftTab === 'order' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: selectedOrderId ? 'rgba(124, 58, 237, 0.15)' : 'rgba(56, 189, 248, 0.1)',
                border: selectedOrderId ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectedOrderId ? '#C084FC' : '#38BDF8', fontWeight: 700, fontSize: '0.84rem' }}>
                  <Package size={16} />
                  <span>{selectedOrderId ? `Order: ${selectedOrderId}` : 'Customer & Order Details'}</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#B9AEC9', lineHeight: 1.4 }}>
                  {selectedOrderId
                    ? 'Updating details for this order. Changes sync to customer records and card artwork.'
                    : 'Enter customer contact info and delivery details to create a new order directly.'}
                </p>
              </div>

              {/* Form Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Existing Customer Lookup */}
                <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 600, color: '#D8B4FE' }}>
                      <Users size={13} color="#C084FC" />
                      <span>Select Existing Customer</span>
                    </div>
                    {selectedWaCustomerId && (
                      <button
                        type="button"
                        onClick={handleClearWaCustomer}
                        style={{ background: 'none', border: 'none', color: '#F87171', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {selectedWaCustomerId ? (
                    <div style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(112, 56, 248, 0.2)', border: '1px solid #7038F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={14} color="#C084FC" />
                        <span style={{ fontSize: '0.76rem', color: '#FFFFFF', fontWeight: 600 }}>{waOrderForm.customerName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedWaCustomerId(null); setIsWaCustomerDropdownOpen(true); }}
                        style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #905CFC', background: 'transparent', color: '#D8B4FE', fontSize: '0.68rem', cursor: 'pointer' }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <Search size={12} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#A78BFA' }} />
                          <input
                            type="text"
                            autoComplete="off"
                            placeholder="Lookup customer by name or phone..."
                            value={waCustomerSearch}
                            onFocus={() => setIsWaCustomerDropdownOpen(true)}
                            onChange={(e) => {
                              setWaCustomerSearch(e.target.value);
                              setIsWaCustomerDropdownOpen(true);
                            }}
                            style={{
                              width: '100%',
                              padding: '7px 10px 7px 28px',
                              borderRadius: '7px',
                              background: '#1A0F2E',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              color: '#FFFFFF',
                              fontSize: '0.76rem',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        {isWaCustomerDropdownOpen && (
                          <button
                            type="button"
                            onClick={() => setIsWaCustomerDropdownOpen(false)}
                            style={{ padding: '7px 10px', borderRadius: '7px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#CBD5E1', fontSize: '0.72rem', cursor: 'pointer' }}
                          >
                            Close
                          </button>
                        )}
                      </div>

                      {isWaCustomerDropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          maxHeight: '160px',
                          overflowY: 'auto',
                          backgroundColor: '#160D27',
                          border: '1px solid rgba(168, 85, 247, 0.4)',
                          borderRadius: '8px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                          zIndex: 50
                        }}>
                          {customers.filter(c => {
                            if (!waCustomerSearch.trim()) return true;
                            const q = waCustomerSearch.toLowerCase();
                            return (
                              (c.name && c.name.toLowerCase().includes(q)) ||
                              (c.phone && c.phone.includes(q)) ||
                              (c.email && c.email.toLowerCase().includes(q))
                            );
                          }).length === 0 ? (
                            <div style={{ padding: '8px', fontSize: '0.74rem', color: '#94A3B8', textAlign: 'center' }}>
                              No matching customers.
                            </div>
                          ) : (
                            customers.filter(c => {
                              if (!waCustomerSearch.trim()) return true;
                              const q = waCustomerSearch.toLowerCase();
                              return (
                                (c.name && c.name.toLowerCase().includes(q)) ||
                                (c.phone && c.phone.includes(q)) ||
                                (c.email && c.email.toLowerCase().includes(q))
                              );
                            }).slice(0, 6).map(c => (
                              <div
                                key={c.id || c.email}
                                onClick={() => handleSelectWaCustomer(c)}
                                style={{
                                  padding: '7px 10px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(112, 56, 248, 0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <div>
                                  <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#FFFFFF' }}>{c.name}</div>
                                  <div style={{ fontSize: '0.68rem', color: '#A78BFA' }}>{c.phone || c.email}</div>
                                </div>
                                <span style={{ fontSize: '0.68rem', color: '#38BDF8', fontWeight: 600 }}>Select</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                    Customer Name * (Synced with Card)
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={waOrderForm.customerName}
                    onChange={(e) => handleWaFieldChange('customerName', e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#1A0F2E',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={waOrderForm.customerPhone}
                    onChange={(e) => handleWaFieldChange('customerPhone', e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#1A0F2E',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                      Company
                    </label>
                    <input
                      type="text"
                      value={waOrderForm.company}
                      onChange={(e) => handleWaFieldChange('company', e.target.value)}
                      placeholder="e.g. FLOCARDS"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: '#1A0F2E',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                      Role / Title
                    </label>
                    <input
                      type="text"
                      value={waOrderForm.role}
                      onChange={(e) => handleWaFieldChange('role', e.target.value)}
                      placeholder="e.g. Founder & CEO"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: '#1A0F2E',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                    Customer Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={waOrderForm.customerEmail}
                    onChange={(e) => handleWaFieldChange('customerEmail', e.target.value)}
                    placeholder="client@company.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#1A0F2E',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                    Delivery Address / City
                  </label>
                  <textarea
                    rows={2}
                    value={waOrderForm.shippingAddress}
                    onChange={(e) => handleWaFieldChange('shippingAddress', e.target.value)}
                    placeholder="Courier destination address..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#1A0F2E',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '4px' }}>
                    Agreed Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={waOrderForm.totalAmount}
                    onChange={(e) => handleWaFieldChange('totalAmount', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#1A0F2E',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Big Action Button */}
              <button
                type="button"
                onClick={handleCreateOrUpdateOrder}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)',
                  marginTop: '6px'
                }}
              >
                <CheckCircle2 size={18} />
                <span>{selectedOrderId ? 'Save & Update Order' : 'Create Card Order'}</span>
              </button>
            </div>
          )}

        </div>

        {/* CENTER PANEL: Canvas Workspace */}
        <div style={{
          display: (isMobile && mobileViewMode === 'controls') ? 'none' : 'flex',
          order: (isMobile && mobileViewMode === 'split') ? 1 : 2,
          flex: (isMobile && mobileViewMode === 'split') ? 'none' : 1,
          height: (isMobile && mobileViewMode === 'split') ? '240px' : (isMobile ? 'calc(100vh - 180px)' : 'auto'),
          flexDirection: 'column',
          background: '#0B0616',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: (isMobile && mobileViewMode === 'split') ? '1px solid rgba(168, 85, 247, 0.2)' : 'none',
          width: isMobile ? '100%' : 'auto'
        }}>
          {/* Canvas Floating Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '6px 10px' : '12px 20px',
            background: 'rgba(19, 11, 34, 0.85)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
            zIndex: 5,
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                style={{ background: '#1F1238', border: '1px solid rgba(168, 85, 247, 0.2)', color: '#FFFFFF', padding: isMobile ? '4px 6px' : '6px', borderRadius: '6px', cursor: 'pointer' }}
                title="Zoom Out"
              >
                <ZoomOut size={isMobile ? 13 : 15} />
              </button>
              <span style={{ fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#B9AEC9', minWidth: isMobile ? '36px' : '45px', textAlign: 'center' }}>
                {Math.round(computedZoom * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                style={{ background: '#1F1238', border: '1px solid rgba(168, 85, 247, 0.2)', color: '#FFFFFF', padding: isMobile ? '4px 6px' : '6px', borderRadius: '6px', cursor: 'pointer' }}
                title="Zoom In"
              >
                <ZoomIn size={isMobile ? 13 : 15} />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                style={{ background: '#1F1238', border: '1px solid rgba(168, 85, 247, 0.2)', color: '#FFFFFF', padding: isMobile ? '4px 8px' : '6px 10px', borderRadius: '6px', fontSize: isMobile ? '0.7rem' : '0.75rem', cursor: 'pointer' }}
                title="Fit to Screen"
              >
                Reset
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px' }}>
              {!isSmallMobile && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#B9AEC9', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showGuides}
                      onChange={(e) => setShowGuides(e.target.checked)}
                    />
                    Guides
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#B9AEC9', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showBleed}
                      onChange={(e) => setShowBleed(e.target.checked)}
                    />
                    Bleed
                  </label>
                </>
              )}

              <button
                onClick={() => setPreview3D(prev => !prev)}
                style={{
                  background: preview3D ? '#7C3AED' : '#1F1238',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#FFFFFF',
                  padding: isMobile ? '4px 10px' : '6px 12px',
                  borderRadius: '6px',
                  fontSize: isMobile ? '0.74rem' : '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {preview3D ? '2D View' : '3D Orbit'}
              </button>
            </div>
          </div>

          {/* Card Viewport Container */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '6px' : '30px',
            overflow: (isMobile && mobileViewMode === 'split') ? 'hidden' : 'auto'
          }}>
            <div style={{
              transform: `scale(${computedZoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out'
            }}>
              {preview3D ? (
                <Card3DPreview
                  edition={edition}
                  templateType={templateType}
                  frontConfig={frontConfig}
                  backConfig={backConfig}
                  customColors={customColors}
                  customerLogo={customerLogo}
                  flocardLogo={flocardLogo}
                  width={580}
                  allowFlip={true}
                />
              ) : (
                <div style={{ position: 'relative' }}>
                  <CardCanvas
                    side={activeSide}
                    templateType={templateType}
                    edition={edition}
                    config={fullConfig}
                    showGuides={showGuides}
                    showBleed={showBleed}
                    width={580}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Selected Element Properties & Typography Inspector */}
        <div style={{
          display: (isMobile || viewportWidth < 1150) ? 'none' : 'flex',
          order: 3,
          width: '320px',
          background: '#11091F',
          borderLeft: '1px solid rgba(168, 85, 247, 0.2)',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sliders size={16} color="#A855F7" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase' }}>
              Element Inspector
            </span>
          </div>

          {/* Selected: Customer Name */}
          {selectedElement === 'name' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Customer Name Text
                </label>
                <input
                  type="text"
                  value={frontConfig.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    pushHistory({ frontConfig, backConfig, customColors, customerLogo, edition, templateType });
                    setFrontConfig(prev => ({ ...prev, name: newName }));
                    setWaOrderForm(prev => ({ ...prev, customerName: newName }));
                  }}
                  style={{ width: '100%', padding: '8px 12px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Typography Font Family
                </label>
                <select
                  value={frontConfig.fontFamily}
                  onChange={(e) => {
                    pushHistory({ frontConfig, backConfig, customColors, customerLogo, edition, templateType });
                    setFrontConfig(prev => ({ ...prev, fontFamily: e.target.value }));
                  }}
                  style={{ width: '100%', padding: '8px 12px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.85rem' }}
                >
                  {FONT_OPTIONS.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Name Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={customColors.nameColor || '#FFFFFF'}
                    onChange={(e) => setCustomColors(prev => ({ ...prev, nameColor: e.target.value }))}
                    style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                  />
                  <input
                    type="text"
                    value={customColors.nameColor || '#FFFFFF'}
                    onChange={(e) => setCustomColors(prev => ({ ...prev, nameColor: e.target.value }))}
                    style={{ flex: 1, padding: '8px 10px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.82rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selected: Role */}
          {selectedElement === 'role' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Role / Title
                </label>
                <input
                  type="text"
                  value={frontConfig.role}
                  onChange={(e) => {
                    setFrontConfig(prev => ({ ...prev, role: e.target.value }));
                    setWaOrderForm(prev => ({ ...prev, role: e.target.value }));
                  }}
                  style={{ width: '100%', padding: '8px 12px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Role Font
                </label>
                <select
                  value={frontConfig.roleFontFamily}
                  onChange={(e) => setFrontConfig(prev => ({ ...prev, roleFontFamily: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.85rem' }}
                >
                  {FONT_OPTIONS.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Selected: Company */}
          {selectedElement === 'company' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={frontConfig.company}
                  onChange={(e) => {
                    setFrontConfig(prev => ({ ...prev, company: e.target.value }));
                    setWaOrderForm(prev => ({ ...prev, company: e.target.value }));
                  }}
                  style={{ width: '100%', padding: '8px 12px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          )}

          {/* Selected: Logo & Position controls */}
          {selectedElement === 'logo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Artwork Asset
                </label>
                {customerLogo.url ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: '#1A0F2E',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '8px',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <img src={customerLogo.url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#FFFFFF', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Active Logo</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={handleRemoveLogoBackground}
                        disabled={isUploadingLogo || isRemovingBg}
                        title="Remove background from logo"
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.4)',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          color: '#4ADE80',
                          cursor: (isUploadingLogo || isRemovingBg) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600
                        }}
                      >
                        <Sparkles size={11} />
                        <span>{isRemovingBg ? '...' : 'Remove BG'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSmartLogoModal(true)}
                        style={{
                          padding: '4px 8px',
                          background: '#7038F8',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 700
                        }}
                      >
                        <Sparkles size={11} />
                        <span>Studio</span>
                      </button>
                      <label style={{ padding: '4px 8px', background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '6px', fontSize: '0.7rem', color: '#D8B4FE', cursor: isUploadingLogo ? 'not-allowed' : 'pointer' }}>
                        {isUploadingLogo ? '...' : 'Change'}
                        <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoUpload} disabled={isUploadingLogo} style={{ display: 'none' }} />
                      </label>
                      <button type="button" onClick={handleRemoveLogo} disabled={isUploadingLogo} style={{ padding: '4px 6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#F87171', cursor: isUploadingLogo ? 'not-allowed' : 'pointer' }}>
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: '#1A0F2E', border: '1.5px dashed rgba(168, 85, 247, 0.4)', borderRadius: '8px', cursor: isUploadingLogo ? 'not-allowed' : 'pointer' }}>
                    <ImageIcon size={14} color="#A855F7" />
                    <span style={{ fontSize: '0.75rem', color: '#FFFFFF', fontWeight: 600 }}>{isUploadingLogo ? 'Uploading...' : 'Upload Logo Artwork'}</span>
                    <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoUpload} disabled={isUploadingLogo} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Logo Size ({customerLogo.size}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={customerLogo.size}
                  onChange={(e) => setCustomerLogo(prev => ({ ...prev, size: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#A855F7' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Rotation ({customerLogo.rotation || 0}°)
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={customerLogo.rotation || 0}
                  onChange={(e) => setCustomerLogo(prev => ({ ...prev, rotation: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#A855F7' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Horizontal Position Offset ({customerLogo.posX}px)
                </label>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={customerLogo.posX}
                  onChange={(e) => setCustomerLogo(prev => ({ ...prev, posX: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#A855F7' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Vertical Position Offset ({customerLogo.posY}px)
                </label>
                <input
                  type="range"
                  min="-40"
                  max="40"
                  value={customerLogo.posY}
                  onChange={(e) => setCustomerLogo(prev => ({ ...prev, posY: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#A855F7' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#B9AEC9', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={customerLogo.showCircleBadge}
                  onChange={(e) => setCustomerLogo(prev => ({ ...prev, showCircleBadge: e.target.checked }))}
                />
                Show Circular Glass Badge
              </label>
            </div>
          )}

          {/* Selected: QR Code & Back details */}
          {selectedElement === 'qrCode' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Target Destination URL
                </label>
                <input
                  type="text"
                  value={backConfig.qrUrl}
                  onChange={(e) => setBackConfig(prev => ({ ...prev, qrUrl: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#B9AEC9', display: 'block', marginBottom: '6px' }}>
                  Brand Display URL (Printed on Card)
                </label>
                <input
                  type="text"
                  value={backConfig.brandUrl}
                  onChange={(e) => setBackConfig(prev => ({ ...prev, brandUrl: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', background: '#1A0F2E', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          MODAL: WHATSAPP ORDER CREATED SUCCESS DIALOG
          ==================================================================== */}
      {orderSuccessModal && createdOrderResult && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(8, 5, 18, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#130B22',
            borderRadius: '24px',
            border: '1px solid rgba(37, 211, 102, 0.35)',
            width: '100%',
            maxWidth: '560px',
            padding: '28px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            position: 'relative'
          }}>
            <button
              onClick={() => setOrderSuccessModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B9AEC9',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                color: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 0 20px rgba(37, 211, 102, 0.3)'
              }}>
                <CheckCircle2 size={32} />
              </div>

              <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                WhatsApp Order Created!
              </h2>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#B9AEC9' }}>
                Bespoke design locked and queued in manufacturing pipeline.
              </p>
            </div>

            {/* Order Reference Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#1F1238',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              marginBottom: '16px'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#B9AEC9', textTransform: 'uppercase', display: 'block' }}>
                  Order Reference
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#A855F7', fontFamily: 'monospace' }}>
                  {createdOrderResult.order.orderReference}
                </span>
              </div>
              <span style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                color: '#25D366',
                border: '1px solid #25D36644'
              }}>
                WhatsApp Direct
              </span>
            </div>

            {/* Customer & Tracking Link */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.82rem', color: '#D4D4D8' }}>
                Customer: <strong>{createdOrderResult.order.customerName}</strong> ({createdOrderResult.order.customerPhone})
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: '#B9AEC9', display: 'block', marginBottom: '4px' }}>
                  Live 3D Customer Proof & Tracking Link:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={createdOrderResult.trackingUrl}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#170D29',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#60A5FA',
                      fontSize: '0.78rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdOrderResult.trackingUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      background: '#1F1238',
                      color: copiedLink ? '#10B981' : '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* WhatsApp Message Preview Box */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: '#0C0618',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#B9AEC9', fontWeight: 600 }}>Message Preview</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdOrderResult.messageText);
                    setCopiedMsg(true);
                    setTimeout(() => setCopiedMsg(false), 2000);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedMsg ? '#10B981' : '#A855F7',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedMsg ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedMsg ? 'Message Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <p style={{
                margin: 0,
                fontSize: '0.74rem',
                color: '#E4E4E7',
                whiteSpace: 'pre-line',
                lineHeight: 1.45,
                maxHeight: '110px',
                overflowY: 'auto'
              }}>
                {createdOrderResult.messageText}
              </p>
            </div>

            {/* Actions: Direct WhatsApp Chat Launch */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={createdOrderResult.waUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 18px rgba(37, 211, 102, 0.4)'
                }}
              >
                <MessageSquare size={18} />
                <span>Open in WhatsApp Chat Now</span>
                <ExternalLink size={14} />
              </a>

              <button
                type="button"
                onClick={() => setOrderSuccessModal(false)}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'transparent',
                  color: '#B9AEC9',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Done &amp; Return to Studio
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
          pushHistory({ frontConfig, backConfig, customColors, customerLogo, edition, templateType });
          setCustomerLogo(updatedConfig);
          setFrontConfig(prev => ({ ...prev, customLogo: updatedConfig.url }));
          showToast('Smart logo edits applied to card canvas.');
        }}
        isLight={isLight}
        cardEdition={edition}
      />

      {/* Floating Toast Notification */}
      {statusToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: statusToast.type === 'error' ? '#EF4444' : '#7C3AED',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '0.88rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 100
        }}>
          {statusToast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{statusToast.message}</span>
        </div>
      )}
    </div>
  );
}
