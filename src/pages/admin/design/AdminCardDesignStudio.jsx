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
import { uploadImage } from '../../../lib/uploadImage';
import { queueWhatsAppNotification } from '../../../lib/whatsapp';
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
  Search
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

export default function AdminCardDesignStudio({ onAssignToOrder = null, initialDesign = null }) {
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

  // Left Panel Sub-tab: 'whatsapp_order' | 'themes' | 'layers'
  const [leftTab, setLeftTab] = useState('whatsapp_order');
  const [selectedThemeId, setSelectedThemeId] = useState('royal_ultraviolet');

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

  const [frontConfig, setFrontConfig] = useState({
    name: initialDesign?.front?.name || 'ALEX MORGAN',
    role: initialDesign?.front?.role || 'FOUNDER & CEO',
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
      return { url: null, size: 100, posX: 0, posY: 0, showCircleBadge: true };
    }
    if (typeof logo === 'string') {
      return { url: logo, size: 100, posX: 0, posY: 0, showCircleBadge: true };
    }
    return {
      url: logo?.url || fallbackUrl || null,
      size: typeof logo?.size === 'number' ? logo.size : 100,
      posX: typeof logo?.posX === 'number' ? logo.posX : 0,
      posY: typeof logo?.posY === 'number' ? logo.posY : 0,
      showCircleBadge: logo?.showCircleBadge ?? true
    };
  };

  const [customerLogo, setCustomerLogo] = useState(() =>
    normalizeCustomerLogo(initialDesign?.customerLogo, initialDesign?.front?.customLogo)
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
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

  // WhatsApp Customer Selection State
  const [selectedWaCustomerId, setSelectedWaCustomerId] = useState(null);
  const [waCustomerSearch, setWaCustomerSearch] = useState('');
  const [isWaCustomerDropdownOpen, setIsWaCustomerDropdownOpen] = useState(false);

  // WhatsApp Order Creation Form State (Two-way synced with card artwork)
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

        setCustomerLogo(prev => ({ ...prev, url: uploadedUrl }));
        setFrontConfig(prev => ({ ...prev, customLogo: uploadedUrl }));
        setTemplateType('customer_logo');
        showToast('Logo uploaded and applied to card canvas.');
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

  // 1-Click WhatsApp Order Creation Action
  const handleCreateWhatsAppOrder = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const clientName = (waOrderForm.customerName || frontConfig.name || '').trim();
    const clientPhone = (waOrderForm.customerPhone || '').trim();

    if (!clientName) {
      showToast('Please enter the customer name.', 'error');
      setLeftTab('whatsapp_order');
      return;
    }
    if (!clientPhone) {
      showToast('Please enter the customer WhatsApp phone number.', 'error');
      setLeftTab('whatsapp_order');
      return;
    }

    const orderRef = `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingToken = `tok_${Math.random().toString(36).substring(2, 12)}`;
    const customerId = `cust_${Date.now()}`;
    const dId = `dsgn_${Date.now()}`;
    const clientEmail = (waOrderForm.customerEmail || '').trim() || `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@flocard.in`;

    // 1. Save Card Design Record
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
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveDesign(designRecord);

    // 2. Save / Register Customer Record
    if (saveCustomer) {
      saveCustomer({
        id: customerId,
        name: clientName,
        phone: clientPhone,
        email: clientEmail,
        company: (waOrderForm.company || frontConfig.company || '').trim(),
        role: (waOrderForm.role || frontConfig.role || 'Client').trim(),
        source: 'whatsapp',
        status: 'active',
        createdAt: new Date().toISOString()
      });
    }

    // 3. Save Order Record
    const edDetails = EDITIONS[edition] || EDITIONS.gold;
    const finalAmount = Number(waOrderForm.totalAmount) || edDetails.price || 2499;

    const newOrder = {
      id: orderRef,
      orderReference: orderRef,
      source: 'whatsapp',
      customerId,
      customerName: clientName,
      customerEmail: clientEmail,
      customerPhone: clientPhone,
      company: (waOrderForm.company || frontConfig.company || '').trim(),
      role: (waOrderForm.role || frontConfig.role || 'Executive').trim(),
      tagline: (waOrderForm.tagline || frontConfig.tagline || '').trim(),
      customerLogo,
      flocardLogo,
      designId: dId,
      design: designRecord, // Frozen snapshot of submitted artwork
      frontConfig: designRecord.front,
      backConfig: designRecord.back,
      customColors,
      edition,
      templateType: customerLogo.url ? 'customer_logo' : templateType,
      totalAmount: finalAmount,
      amountPaid: finalAmount,
      amountOutstanding: 0,
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      status: 'design_submitted',
      shippingAddress: (waOrderForm.shippingAddress || '').trim() || 'Direct WhatsApp Dispatch',
      trackingToken,
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveOrder(newOrder);

    // 4. Automatically queue WhatsApp notification outbox
    queueWhatsAppNotification(newOrder, 'order_confirmed').catch(err => {
      console.error('WhatsApp auto-queue error:', err);
    });

    // 5. Construct live tracking link & direct WhatsApp click-to-chat URL
    const trackingUrl = `https://flocard.in/track?ref=${encodeURIComponent(orderRef)}&token=${encodeURIComponent(trackingToken)}`;
    const msgText = `Hello ${clientName}! ✨\n\nYour FLOCARDS order *${orderRef}* for the *${edDetails.name}* has been confirmed.\n\nWe have prepared your bespoke smart card design and queued precision laser manufacturing.\n\n🔍 View your live interactive 3D card proof & track fulfillment:\n👉 ${trackingUrl}\n\n— Team FLOCARDS\nhttps://flocard.in`;

    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msgText)}`;

    setCreatedOrderResult({
      order: newOrder,
      trackingUrl,
      waUrl,
      messageText: msgText
    });
    setOrderSuccessModal(true);
    showToast(`WhatsApp Order ${orderRef} created successfully!`);
  };

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
    customerLogo
  };

  return (
    <div className="admin-studio-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 80px)',
      background: '#090514',
      color: '#FFFFFF',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Studio Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: '#130B22',
        borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
        zIndex: 10,
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #A855F7, #6B00FF)',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.05em'
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
                color: '#FFFFFF',
                fontSize: '1.05rem',
                fontWeight: 700,
                outline: 'none',
                minWidth: '220px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', background: '#1F1238', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setActiveSide('front')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeSide === 'front' ? '#7C3AED' : 'transparent',
                color: '#FFFFFF'
              }}
            >
              Front Artwork
            </button>
            <button
              onClick={() => setActiveSide('back')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeSide === 'back' ? '#7C3AED' : 'transparent',
                color: '#FFFFFF'
              }}
            >
              Back Artwork
            </button>
          </div>
        </div>

        {/* Studio Actions: Prominent WhatsApp Order Creator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={undo}
            disabled={history.length === 0}
            title="Undo (Ctrl+Z)"
            style={{
              background: '#1F1238',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              color: history.length === 0 ? '#6B5E82' : '#FFFFFF',
              padding: '8px',
              borderRadius: '8px',
              cursor: history.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            title="Redo (Ctrl+Y)"
            style={{
              background: '#1F1238',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              color: future.length === 0 ? '#6B5E82' : '#FFFFFF',
              padding: '8px',
              borderRadius: '8px',
              cursor: future.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <Redo2 size={16} />
          </button>

          <div style={{ height: '24px', width: '1px', background: 'rgba(168, 85, 247, 0.2)', margin: '0 4px' }} />

          {/* Quick Select Theme Button */}
          <button
            onClick={() => setLeftTab('themes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: leftTab === 'themes' ? 'rgba(168, 85, 247, 0.25)' : '#1F1238',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#D8B4FE',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Palette size={15} />
            <span>Select Themes</span>
          </button>

          {/* Create WhatsApp Order Primary Button */}
          <button
            onClick={handleCreateWhatsAppOrder}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              color: '#FFFFFF',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(37, 211, 102, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <MessageSquare size={16} />
            <span>Create WhatsApp Order</span>
          </button>

          <button
            onClick={() => handleSaveDraft('draft')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              fontSize: '0.82rem',
              borderRadius: '8px',
              background: '#1F1238',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              color: '#B9AEC9',
              cursor: 'pointer'
            }}
          >
            <Save size={14} />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* 3-Panel Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT PANEL: WhatsApp Order Creation & Theme Selector */}
        <div style={{
          width: '320px',
          background: '#11091F',
          borderRight: '1px solid rgba(168, 85, 247, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          {/* Sub-Tab Navigation Header */}
          <div style={{
            display: 'flex',
            background: '#170D29',
            borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
            padding: '4px'
          }}>
            <button
              onClick={() => setLeftTab('whatsapp_order')}
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                background: leftTab === 'whatsapp_order' ? '#25D366' : 'transparent',
                color: leftTab === 'whatsapp_order' ? '#FFFFFF' : '#B9AEC9'
              }}
            >
              <MessageSquare size={13} />
              <span>WhatsApp Order</span>
            </button>

            <button
              onClick={() => setLeftTab('themes')}
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                background: leftTab === 'themes' ? '#7C3AED' : 'transparent',
                color: leftTab === 'themes' ? '#FFFFFF' : '#B9AEC9'
              }}
            >
              <Palette size={13} />
              <span>Themes</span>
            </button>

            <button
              onClick={() => setLeftTab('layers')}
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                background: leftTab === 'layers' ? '#7C3AED' : 'transparent',
                color: leftTab === 'layers' ? '#FFFFFF' : '#B9AEC9'
              }}
            >
              <Layers size={13} />
              <span>Layers</span>
            </button>
          </div>

          {/* LEFT TAB 1: WHATSAPP DIRECT ORDER WORKFLOW */}
          {leftTab === 'whatsapp_order' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(37, 211, 102, 0.1)',
                border: '1px solid rgba(37, 211, 102, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#25D366', fontWeight: 700, fontSize: '0.84rem' }}>
                  <MessageSquare size={16} />
                  <span>Direct WhatsApp Client Booking</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#B9AEC9', lineHeight: 1.4 }}>
                  Enter client information received via WhatsApp. Typing updates the card artwork in real-time.
                </p>
              </div>

              {/* Form Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Existing Customer Lookup */}
                <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 600, color: '#D8B4FE' }}>
                      <Users size={13} color="#C084FC" />
                      <span>Select Existing Customer (Optional)</span>
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
                    Customer WhatsApp Phone *
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

              {/* Upload Logo Shortcut */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '6px' }}>
                  Client Logo Artwork
                </label>

                {customerLogo.url ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#1A0F2E',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: '10px',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        flexShrink: 0
                      }}>
                        <img
                          src={customerLogo.url}
                          alt="Client Logo Preview"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Client Logo</span>
                          <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80', fontWeight: 600 }}>Active</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#B9AEC9' }}>Applied to card canvas</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <label style={{
                        padding: '6px 10px',
                        background: 'rgba(168, 85, 247, 0.2)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        color: '#D8B4FE',
                        fontWeight: 600,
                        cursor: isUploadingLogo ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isUploadingLogo ? (
                          <RotateCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <ImageIcon size={13} />
                        )}
                        <span>{isUploadingLogo ? 'Uploading...' : 'Change'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={isUploadingLogo}
                        title="Remove Client Logo"
                        style={{
                          padding: '6px 8px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          color: '#F87171',
                          cursor: isUploadingLogo ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px',
                    background: '#1A0F2E',
                    border: '1.5px dashed rgba(168, 85, 247, 0.4)',
                    borderRadius: '10px',
                    cursor: isUploadingLogo ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isUploadingLogo ? 0.7 : 1
                  }}>
                    {isUploadingLogo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RotateCw size={16} color="#A855F7" style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '0.78rem', color: '#D8B4FE', fontWeight: 600 }}>
                          Uploading brand artwork to storage...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ImageIcon size={16} color="#A855F7" />
                          <span style={{ fontSize: '0.8rem', color: '#FFFFFF', fontWeight: 600 }}>
                            Upload Client Logo
                          </span>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#B9AEC9' }}>
                          PNG, JPG, SVG, WebP (Transparent PNG recommended, max 10MB)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              {/* Big Create Order Button */}
              <button
                type="button"
                onClick={handleCreateWhatsAppOrder}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)',
                  marginTop: '6px'
                }}
              >
                <MessageSquare size={18} />
                <span>Create & Send via WhatsApp</span>
              </button>
            </div>
          )}

          {/* LEFT TAB 2: SELECT THEMES & PRESETS */}
          {leftTab === 'themes' && (
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
              <div style={{ paddingTop: '14px', borderTop: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A855F7', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Material &amp; Finish
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {Object.keys(EDITIONS).map((key) => {
                    const ed = EDITIONS[key];
                    const active = edition === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          pushHistory({ frontConfig, backConfig, customColors, customerLogo, edition, templateType });
                          setEdition(key);
                        }}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '10px',
                          background: active ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(107, 0, 255, 0.35))' : '#1A0F2E',
                          border: active ? '1.5px solid #A855F7' : '1px solid rgba(168, 85, 247, 0.15)',
                          color: active ? '#FFFFFF' : '#B9AEC9',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        {ed.name.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* LEFT TAB 3: LAYERS & ELEMENTS */}
          {leftTab === 'layers' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A855F7', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Layers &amp; Elements
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { id: 'name', label: 'Customer Full Name', side: 'front' },
                    { id: 'role', label: 'Executive Role', side: 'front' },
                    { id: 'company', label: 'Company / Organization', side: 'front' },
                    { id: 'tagline', label: 'Tagline & Bio', side: 'front' },
                    { id: 'details', label: 'Additional Details', side: 'front' },
                    { id: 'nfcIcon', label: 'Contactless NFC Symbol', side: 'front' },
                    { id: 'logo', label: 'Brand Emblem / Logo', side: 'front' },
                    { id: 'qrCode', label: 'Permanent QR Code', side: 'back' }
                  ].map((layer) => {
                    const isSelected = selectedElement === layer.id;
                    const isVisible = layerVisibility[layer.id] ?? true;

                    return (
                      <div
                        key={layer.id}
                        onClick={() => {
                          setSelectedElement(layer.id);
                          if (layer.side !== activeSide) setActiveSide(layer.side);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: isSelected ? '#261442' : '#170D29',
                          border: isSelected ? '1px solid #A855F7' : '1px solid rgba(168, 85, 247, 0.1)',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', color: isSelected ? '#FFFFFF' : '#C8BDDC', fontWeight: isSelected ? 600 : 400 }}>
                          {layer.label}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLayerVisibility(prev => ({ ...prev, [layer.id]: !isVisible }));
                          }}
                          style={{ background: 'transparent', border: 'none', color: isVisible ? '#A855F7' : '#6B5E82', cursor: 'pointer', padding: 0 }}
                        >
                          {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* CENTER PANEL: Canvas Workspace */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#0B0616',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Canvas Floating Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: 'rgba(19, 11, 34, 0.75)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
            zIndex: 5
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                style={{ background: '#1F1238', border: '1px solid rgba(168, 85, 247, 0.2)', color: '#FFFFFF', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <span style={{ fontSize: '0.8rem', color: '#B9AEC9', minWidth: '45px', textAlign: 'center' }}>
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                style={{ background: '#1F1238', border: '1px solid rgba(168, 85, 247, 0.2)', color: '#FFFFFF', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                style={{ background: '#1F1238', border: '1px solid rgba(168, 85, 247, 0.2)', color: '#FFFFFF', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                title="Fit to Screen"
              >
                Reset
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#B9AEC9', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showGuides}
                  onChange={(e) => setShowGuides(e.target.checked)}
                />
                Safe Area Guides
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#B9AEC9', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showBleed}
                  onChange={(e) => setShowBleed(e.target.checked)}
                />
                Bleed Zones
              </label>

              <button
                onClick={() => setPreview3D(prev => !prev)}
                style={{
                  background: preview3D ? '#7C3AED' : '#1F1238',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#FFFFFF',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {preview3D ? '2D View' : '3D Orbit View'}
              </button>
            </div>
          </div>

          {/* Card Viewport Container */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px',
            overflow: 'auto'
          }}>
            <div style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out'
            }}>
              {preview3D ? (
                <Card3DPreview
                  edition={edition}
                  width={540}
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
                    width={540}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Selected Element Properties & Typography Inspector */}
        <div style={{
          width: '320px',
          background: '#11091F',
          borderLeft: '1px solid rgba(168, 85, 247, 0.2)',
          display: 'flex',
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
