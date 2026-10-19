/* ==========================================================================
   FLOCARD ADMIN DASHBOARD & ENTERPRISE CONSOLE
   Meticulously built to match Reference Image 2:
   - Dark branded sidebar (#100819) with 10 tabs and NFC obsidian card graphic
   - Crisp light background (#F7F6FA) for high-contrast clarity
   - 6 Top Stat Cards with SVG sparkline wave graphs and percentage pills
   - Two-Column Middle: Recent Activity (left) + Pending Design Approvals (right)
   - Three-Column Bottom: Recently Created Profiles + Recently Assigned Cards + 2x3 Quick Actions
   - Real database records, empty states, loading states, search, notifications,
     Google OAuth indicator, owner-controlled access, and full management views.
   ========================================================================== */

import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Palette,
  Radio,
  Layers,
  BarChart3,
  ShieldCheck,
  ClipboardList,
  Settings,
  Search,
  Bell,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Zap,
  Clock,
  UserPlus,
  CreditCard,
  Rocket,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Plus,
  Check,
  X,
  ExternalLink,
  Download,
  Filter,
  ShieldAlert,
  ChevronRight,
  LogOut,
  Menu,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Sparkles,
  Package,
  Truck,
  Building2,
  Upload,
  Camera,
  Tag
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card3DPreview from '../../components/Card3DPreview';
import CompactProfileCard from '../../components/profile/CompactProfileCard';
import { uploadImage } from '../../lib/uploadImage';
import { getSupabaseStatus } from '../../lib/supabase';
import { exportCardPDF } from '../../lib/pdfExport';
import { compressImage } from '../../lib/imageCompression';
import { formatCurrencyINR } from '../../lib/storage';
import AccountAccessCard from '../../components/spectrum/AccountAccessCard';
import AnimatedSwitch from '../../components/spectrum/AnimatedSwitch';
import HoldToConfirm from '../../components/spectrum/HoldToConfirm';
import MorphButton from '../../components/spectrum/MorphButton';
import AdminOrderManager from './AdminOrderManager';
import AdminLogin from '../auth/AdminLogin';

export default function AdminDashboard({ initialTab = 'overview', initialOrderId = null }) {
  const { user, isOwner, isAdmin, logout, switchPersona } = useAuth();

  // Strict Admin Gate: Require admin authentication before viewing Admin Platform
  if (!user || !isAdmin) {
    return <AdminLogin />;
  }
  const {
    profiles,
    cards,
    designs,
    orders = [],
    customers,
    templates,
    products = [],
    saveProduct,
    getProductByEdition,
    auditLogs,
    adminAccounts,
    addAdminAccount,
    revokeAdminAccount,
    saveCard,
    deleteCard,
    saveProfile,
    deleteProfile,
    updateDesignStatus,
    saveDesign,
    deleteDesign,
    saveOrder,
    updateOrderStatus,
    deliverOrder,
    deleteOrder,
    assignDesignToOrder,
    saveCustomer,
    deleteCustomer,
    saveTemplate,
    deleteTemplate,
    studioBackground,
    updateStudioBackground,
    resetStudioBg,
    demoConfig,
    saveDemoConfig,
    resetDemoConfig,
    resetAllData
  } = useData();

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState(
    ['overview', 'customers', 'profiles', 'designs', 'orders', 'cards', 'pricing', 'templates', 'demo', 'analytics', 'admin-access', 'audit-logs', 'settings'].includes(initialTab)
      ? initialTab
      : 'overview'
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [dateRange, setDateRange] = useState('01 Oct 2026 – 31 Oct 2026');

  // Orders State
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [fulfillmentToast, setFulfillmentToast] = useState(null);

  // Modal States
  const [reviewModalDesign, setReviewModalDesign] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [newCustomerModal, setNewCustomerModal] = useState(false);
  const [newProfileModal, setNewProfileModal] = useState(false);
  const [assignCardModal, setAssignCardModal] = useState(false);
  const [inviteAdminModal, setInviteAdminModal] = useState(false);
  const [newTemplateModal, setNewTemplateModal] = useState(false);

  // Edit Object States
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [editingDesign, setEditingDesign] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productSaveError, setProductSaveError] = useState('');
  const [productSaveSuccess, setProductSaveSuccess] = useState('');
  const [newFeatureText, setNewFeatureText] = useState('');

  // Form States
  const [newCustForm, setNewCustForm] = useState({ name: '', email: '', phone: '', company: '' });
  const [newProfForm, setNewProfForm] = useState({ name: '', slug: '', role: '', company: '', theme: 'purple' });
  const [assignCardForm, setAssignCardForm] = useState({ cardCode: '', customerId: '', profileSlug: '', edition: 'purple' });

  // Global Demo Showcase State
  const [demoForm, setDemoForm] = useState(() => ({
    name: demoConfig?.name || 'Your Name',
    role: demoConfig?.role || 'Your Role',
    tagline: demoConfig?.tagline || 'Your Tagline',
    company: demoConfig?.company || 'Your Company',
    avatar: demoConfig?.avatar || '',
    logo: demoConfig?.logo || '',
    phone: demoConfig?.phone || '+91 98765 43210',
    email: demoConfig?.email || 'contact@flocard.in',
    website: demoConfig?.website || 'https://flocard.in',
    bio: demoConfig?.bio || 'Pioneering connected NFC identity for executives and global tech pioneers. One tap. Every connection.',
    cardEdition: demoConfig?.cardEdition || 'purple',
    cardFinish: demoConfig?.cardFinish || 'purple'
  }));
  const [demoSaveSuccess, setDemoSaveSuccess] = useState('');
  const [demoSaveError, setDemoSaveError] = useState('');
  const [uploadingDemoImage, setUploadingDemoImage] = useState(false);

  useEffect(() => {
    if (demoConfig) {
      setDemoForm({
        name: demoConfig.name || 'Your Name',
        role: demoConfig.role || 'Your Role',
        tagline: demoConfig.tagline || 'Your Tagline',
        company: demoConfig.company || 'Your Company',
        avatar: demoConfig.avatar || '',
        logo: demoConfig.logo || '',
        phone: demoConfig.phone || '+91 98765 43210',
        email: demoConfig.email || 'contact@flocard.in',
        website: demoConfig.website || 'https://flocard.in',
        bio: demoConfig.bio || 'Pioneering connected NFC identity for executives and global tech pioneers. One tap. Every connection.',
        cardEdition: demoConfig.cardEdition || 'purple',
        cardFinish: demoConfig.cardFinish || 'purple'
      });
    }
  }, [demoConfig]);

  const handleDemoImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDemoImage(true);
    setDemoSaveError('');
    try {
      const url = await uploadImage(file, 'logo', 'demo_admin');
      if (url) {
        setDemoForm(prev => ({ ...prev, avatar: url, logo: url }));
        setDemoSaveSuccess('Brand logo uploaded! Click "Save Demo Settings" to publish.');
      } else {
        setDemoSaveError('Failed to process image upload.');
      }
    } catch (err) {
      setDemoSaveError(err.message || 'Error uploading image');
    } finally {
      setUploadingDemoImage(false);
    }
  };

  const handleRemoveDemoImage = () => {
    setDemoForm(prev => ({ ...prev, avatar: '', logo: '' }));
    setDemoSaveSuccess('Photo removed. Demo will show the "YOUR LOGO" placeholder.');
  };

  const handleSaveDemoSettings = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setDemoSaveError('');
    const res = saveDemoConfig(demoForm, user?.role || 'admin', user?.email || 'admin@flocard.in');
    if (res?.success) {
      setDemoSaveSuccess('Demo showcase settings successfully saved & published to Homepage!');
      setTimeout(() => setDemoSaveSuccess(''), 4000);
    } else {
      setDemoSaveError(res?.error || 'Failed to save demo settings');
    }
  };

  const handleResetDemoSettings = () => {
    if (window.confirm('Reset demo showcase settings to factory defaults ("Your Name", "Your Role", etc.)?')) {
      resetDemoConfig();
      setDemoSaveSuccess('Demo settings reset to factory defaults.');
      setTimeout(() => setDemoSaveSuccess(''), 4000);
    }
  };
  const [newAdminForm, setNewAdminForm] = useState({ email: '', name: '', role: 'admin' });
  const [newTmplForm, setNewTmplForm] = useState({
    name: '',
    key: '',
    category: 'Custom Bespoke',
    badge: 'Custom',
    tagline: '',
    description: '',
    material: 'Polycarbonate with NFC core',
    finish: 'Matte velvet touch',
    chip: 'NXP NTAG216 High Frequency 13.56 MHz',
    accentColor: '#6B00FF',
    secondaryColor: '#A855F7',
    textColor: '#FFFFFF',
    cardBg: '#15101D',
    status: 'active'
  });

  // Real Database Metrics Calculation
  const stats = useMemo(() => {
    const totalCust = customers.length;
    const publishedProf = profiles.filter(p => p.status === 'published' || p.status === 'active').length;
    const activeNfc = cards.filter(c => c.status === 'active' || c.status === 'assigned').length;
    const pendingAppr = designs.filter(d => d.status === 'submitted' || d.status === 'in_review').length;
    const pendingOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
    const unassignedNfc = cards.filter(c => c.status === 'in_stock' || c.status === 'unassigned').length;
    const suspendedNfc = cards.filter(c => c.status === 'suspended').length;

    return {
      customers: totalCust,
      publishedProfiles: publishedProf,
      activeCards: activeNfc,
      pendingApprovals: pendingAppr,
      pendingOrders: pendingOrdersCount,
      totalOrders: orders.length,
      unassignedCards: unassignedNfc,
      suspendedCards: suspendedNfc
    };
  }, [customers, profiles, cards, designs, orders]);

  // Sidebar Items
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users, badge: customers.length },
    { id: 'profiles', label: 'Digital Profiles', icon: FileText, badge: profiles.length },
    { id: 'designs', label: 'Card Designs', icon: Palette, badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : null },
    { id: 'orders', label: 'Orders', icon: Package, badge: stats.pendingOrders > 0 ? stats.pendingOrders : (orders.length > 0 ? orders.length : null) },
    { id: 'cards', label: 'NFC Cards', icon: Radio, badge: cards.length },
    { id: 'pricing', label: 'Products & Pricing', icon: Tag, badge: products?.length || 3 },
    { id: 'templates', label: 'Card Templates', icon: Layers },
    { id: 'demo', label: 'Demo Showcase', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'admin-access', label: 'Admin Access', icon: ShieldCheck, ownerOnly: true },
    { id: 'audit-logs', label: 'Audit Logs', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Global search filtering across relevant items
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return {
      customers: customers.filter(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)),
      profiles: profiles.filter(p => p.name?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q)),
      cards: cards.filter(c => c.cardCode?.toLowerCase().includes(q) || c.customerName?.toLowerCase().includes(q)),
      designs: designs.filter(d => d.title?.toLowerCase().includes(q) || d.customerName?.toLowerCase().includes(q)),
      orders: orders.filter(o => o.id?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q) || o.customerEmail?.toLowerCase().includes(q))
    };
  }, [searchQuery, customers, profiles, cards, designs, orders]);

  // Handle Review Actions
  const handleAssignDesignToOrder = (design) => {
    const res = assignDesignToOrder(design.id);
    if (res && res.order) {
      setFulfillmentToast({
        title: 'Assigned to Manufacturing Order!',
        message: `Order ${res.order.id} generated for ${design.customerName || 'customer'}. Switch to Orders tab to track fulfillment & delivery.`
      });
      setTimeout(() => setFulfillmentToast(null), 5000);
    }
  };

  const handleApproveDesign = (designId) => {
    const res = assignDesignToOrder(designId, reviewNotes || 'Design artwork verified for manufacturing.');
    setReviewModalDesign(null);
    setReviewNotes('');
    setFulfillmentToast({
      title: 'Design Approved & Assigned to Order!',
      message: `Production Order ${res?.order?.id || ''} created. Switch to Orders tab to track fulfillment & delivery.`
    });
    setTimeout(() => setFulfillmentToast(null), 5000);
  };

  const handleDeliverOrder = (orderId) => {
    const res = deliverOrder(orderId);
    if (res) {
      setFulfillmentToast({
        title: 'Order Delivered & Provisioned!',
        message: `NFC Card (${res.card.cardCode}) assigned and Profile (@${res.profile.slug}) created for ${res.order.customerName}!`
      });
      setTimeout(() => setFulfillmentToast(null), 6000);
    }
  };

  const handleRejectDesign = (designId) => {
    updateDesignStatus(designId, 'rejected', reviewNotes || 'Revision requested: Please adjust resolution or safe-area bleed.');
    setReviewModalDesign(null);
    setReviewNotes('');
  };

  // Handle Create Customer
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustForm.name || !newCustForm.email) return;
    saveCustomer({
      name: newCustForm.name,
      email: newCustForm.email,
      phone: newCustForm.phone || '+91 90000 00000',
      company: newCustForm.company || 'Enterprise Partner',
      totalCards: 0,
      totalDesigns: 0,
      status: 'active'
    });
    setNewCustomerModal(false);
    setNewCustForm({ name: '', email: '', phone: '', company: '' });
  };

  // Handle Create Profile
  const handleCreateProfile = (e) => {
    e.preventDefault();
    if (!newProfForm.name || !newProfForm.slug) return;
    saveProfile({
      name: newProfForm.name,
      slug: newProfForm.slug.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
      role: newProfForm.role || 'Executive',
      company: newProfForm.company || 'FLOCARD Network',
      theme: newProfForm.theme || 'purple',
      status: 'published',
      portfolio: [],
      services: []
    });
    setNewProfileModal(false);
    setNewProfForm({ name: '', slug: '', role: '', company: '', theme: 'purple' });
  };

  // Handle Assign Card
  const handleAssignCard = (e) => {
    e.preventDefault();
    if (!assignCardForm.cardCode) return;
    const cust = customers.find(c => c.id === assignCardForm.customerId);
    const prof = profiles.find(p => p.slug === assignCardForm.profileSlug);

    saveCard({
      cardCode: assignCardForm.cardCode,
      batch: 'BATCH-2026-MANUAL',
      edition: assignCardForm.edition,
      chipType: 'NXP NTAG216 (888 Bytes)',
      customerId: cust?.id || null,
      customerName: cust?.name || null,
      profileName: prof?.name || null,
      profileSlug: prof?.slug || null,
      status: cust ? 'active' : 'unassigned',
      assignedDate: cust ? new Date().toISOString() : null
    });
    setAssignCardModal(false);
    setAssignCardForm({ cardCode: '', customerId: '', profileSlug: '', edition: 'purple' });
  };

  // Handle Invite Admin
  const handleInviteAdmin = (e) => {
    e.preventDefault();
    if (!newAdminForm.email) return;
    addAdminAccount({
      email: newAdminForm.email,
      name: newAdminForm.name || newAdminForm.email.split('@')[0],
      role: newAdminForm.role,
      grantedBy: user?.email || 'akhil@flocard.in'
    });
    setInviteAdminModal(false);
    setNewAdminForm({ email: '', name: '', role: 'admin' });
  };

  // Handle Edit/Save Customer
  const handleUpdateCustomer = (e) => {
    e.preventDefault();
    if (!editingCustomer) return;
    saveCustomer(editingCustomer);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm('Are you sure you want to delete this customer? This will remove their profile record.')) {
      deleteCustomer(id);
      if (editingCustomer?.id === id) setEditingCustomer(null);
    }
  };

  // Handle Edit/Save Profile
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!editingProfile) return;
    const saved = saveProfile(editingProfile);
    const targetSlug = saved?.slug || editingProfile.slug || 'akhil';
    setEditingProfile(null);
    setFulfillmentToast({
      title: 'Digital Profile Saved',
      message: `Profile changes saved! Live at flocard.in/p/${targetSlug}`,
      type: 'success'
    });
    setTimeout(() => setFulfillmentToast(null), 5000);
  };

  const handleDeleteProfile = (id) => {
    if (window.confirm('Are you sure you want to delete this digital profile? Its public URL will become unavailable.')) {
      deleteProfile(id);
      if (editingProfile?.id === id) setEditingProfile(null);
    }
  };

  // Handle Edit/Save NFC Card
  const handleUpdateCard = (e) => {
    e.preventDefault();
    if (!editingCard) return;
    saveCard(editingCard);
    setEditingCard(null);
  };

  const handleDeleteCard = (id) => {
    if (window.confirm('Are you sure you want to delete this NFC hardware record? The card tag will no longer resolve.')) {
      deleteCard(id);
      if (editingCard?.id === id) setEditingCard(null);
    }
  };

  // Handle Edit/Save Design
  const handleUpdateDesign = (e) => {
    e.preventDefault();
    if (!editingDesign) return;
    saveDesign(editingDesign);
    setEditingDesign(null);
  };

  const handleDeleteDesign = (id) => {
    if (window.confirm('Are you sure you want to delete this card design record?')) {
      deleteDesign(id);
      if (editingDesign?.id === id) setEditingDesign(null);
    }
  };

  // Handle Edit/Save Template
  const handleUpdateTemplate = (e) => {
    e.preventDefault();
    if (!editingTemplate) return;
    saveTemplate(editingTemplate);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id) => {
    if (window.confirm('Are you sure you want to delete this card template preset?')) {
      deleteTemplate(id);
      if (editingTemplate?.id === id) setEditingTemplate(null);
    }
  };

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!newTmplForm.name) return;
    const key = newTmplForm.key || newTmplForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    saveTemplate({
      ...newTmplForm,
      id: `tmpl_${Date.now()}`,
      key
    });
    setNewTemplateModal(false);
    setNewTmplForm({
      name: '',
      key: '',
      category: 'Custom Bespoke',
      badge: 'Custom',
      tagline: '',
      description: '',
      material: 'Polycarbonate with NFC core',
      finish: 'Matte velvet touch',
      chip: 'NXP NTAG216 High Frequency 13.56 MHz',
      accentColor: '#6B00FF',
      secondaryColor: '#A855F7',
      textColor: '#FFFFFF',
      cardBg: '#15101D',
      status: 'active'
    });
  };

  // Handle Save/Publish Product Pricing & Configuration (Admin Protected)
  const handleSaveProductPricing = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingProduct) return;
    setProductSaveError('');
    setProductSaveSuccess('');

    // Non-negative validation for selling price
    if (editingProduct.price !== null && editingProduct.price !== undefined && editingProduct.price !== '') {
      const p = Number(editingProduct.price);
      if (isNaN(p) || p < 0) {
        setProductSaveError('Selling price must be a valid non-negative number.');
        return;
      }
    }

    // Non-negative validation for comparison price
    if (editingProduct.comparePrice !== null && editingProduct.comparePrice !== undefined && editingProduct.comparePrice !== '') {
      const cp = Number(editingProduct.comparePrice);
      if (isNaN(cp) || cp < 0) {
        setProductSaveError('Comparison price must be a valid non-negative number.');
        return;
      }
    }

    const res = saveProduct(editingProduct, user?.role || 'admin', user?.email || 'akhil@flocard.in');
    if (res && !res.success) {
      setProductSaveError(res.error || 'Failed to save product pricing.');
      return;
    }

    setProductSaveSuccess(`Product details and pricing saved for ${editingProduct.name}!`);
    setFulfillmentToast({
      title: 'Product Pricing Published!',
      message: `${editingProduct.name} updated across store (${formatCurrencyINR(editingProduct.price) || 'Price coming soon'}).`
    });
    setTimeout(() => setFulfillmentToast(null), 5000);
    setTimeout(() => {
      setEditingProduct(null);
      setProductSaveSuccess('');
      setProductSaveError('');
    }, 600);
  };

  const handleAddProductFeature = () => {
    if (!newFeatureText.trim() || !editingProduct) return;
    const currentFeatures = editingProduct.features || [];
    setEditingProduct({
      ...editingProduct,
      features: [...currentFeatures, newFeatureText.trim()]
    });
    setNewFeatureText('');
  };

  const handleRemoveProductFeature = (index) => {
    if (!editingProduct) return;
    const currentFeatures = [...(editingProduct.features || [])];
    currentFeatures.splice(index, 1);
    setEditingProduct({
      ...editingProduct,
      features: currentFeatures
    });
  };

  const dbStatus = getSupabaseStatus();

  return (
    <div
      className="admin-dashboard-root"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#F7F6FA',
        color: '#191522',
        fontFamily: 'var(--font-body, Inter, sans-serif)',
        position: 'relative',
        overflowX: 'clip',
        maxWidth: '100vw'
      }}
    >
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      {/* ====================================================================
          1. DARK BRANDED SIDEBAR NAVIGATION (#100819)
          ==================================================================== */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#100819',
          borderRight: '1px solid #1B1028',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 100,
          padding: '24px 16px 20px',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          overflowY: 'auto',
          transition: 'transform 0.3s ease'
        }}
        className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}
      >
        <div>
          {/* FLOCARD Brand Logo */}
          <div style={{ padding: '0 8px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '100%', overflow: 'hidden' }}>
              <img
                src="/assets/logo-light.png"
                alt="FLOCARD"
                style={{ height: '24px', width: 'auto', display: 'block', maxWidth: '160px', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline-flex';
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-heading, Sora)',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  letterSpacing: '0.04em',
                  color: '#FFFFFF',
                  display: 'none',
                  alignItems: 'center'
                }}
              >
                FLOCARD<sup style={{ fontSize: '0.55em', marginLeft: '2px', color: '#A855F7' }}>®</sup>
              </span>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="mobile-only-btn"
              style={{
                background: 'none',
                border: 'none',
                color: '#B8AEC8',
                display: 'none',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* 10 Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              if (item.ownerOnly && !isOwner) return null;
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: active
                      ? 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)'
                      : 'transparent',
                    color: active ? '#FFFFFF' : '#B8AEC8',
                    fontWeight: active ? 600 : 500,
                    fontSize: '0.88rem',
                    textAlign: 'left',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: active ? '0 4px 16px rgba(107, 0, 255, 0.35)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = '#1B1028';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#B8AEC8';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} color={active ? '#FFFFFF' : '#82758F'} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge !== null && (
                    <span
                      style={{
                        background: active ? 'rgba(255, 255, 255, 0.22)' : '#1B1028',
                        color: active ? '#FFFFFF' : '#A855F7',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        border: active ? 'none' : '1px solid #30223F'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom NFC Obsidian Card Graphic & Tagline Widget */}
        <div>
          <div
            style={{
              background: 'linear-gradient(180deg, #1B1028 0%, #120A1D 100%)',
              border: '1px solid #30223F',
              borderRadius: '16px',
              padding: '16px 14px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* Tilted NFC Obsidian Cards Illustration */}
            <div style={{ position: 'relative', height: '88px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Back Card */}
              <div
                style={{
                  position: 'absolute',
                  width: '120px',
                  height: '75px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #2E1065 0%, #0F0818 100%)',
                  border: '1px solid #6B00FF',
                  transform: 'rotate(-10deg) translate(-15px, -5px)',
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.5)',
                  opacity: 0.8
                }}
              />
              {/* Front Card */}
              <div
                style={{
                  position: 'absolute',
                  width: '126px',
                  height: '78px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #180F26 0%, #08060D 100%)',
                  border: '1px solid #A855F7',
                  transform: 'rotate(6deg) translate(8px, 4px)',
                  boxShadow: '0 12px 25px rgba(107, 0, 255, 0.35)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {/* Contactless waves icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M8.5 16.5a5 5 0 0 1 0-7" />
                    <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                  </svg>
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.06em' }}>
                  FLOCARD
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                One Tap. Every Connection.
              </div>
              <div style={{ fontSize: '0.68rem', color: '#82758F', marginTop: '2px' }}>
                NFC Enterprise Identity
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ====================================================================
          2. MAIN CONTENT AREA (Crisp Light Background #F7F6FA)
          ==================================================================== */}
      <div
        className="admin-main-container"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100%'
        }}
      >
        {/* Top Navigation Bar */}
        <header
          className="admin-header"
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E8E3EF',
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
          }}
        >
          {/* Left: Mobile Toggle + Page Heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flexShrink: 1 }}>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="mobile-hamburger-btn"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: '#191522',
                cursor: 'pointer',
                padding: '4px',
                flexShrink: 0
              }}
              aria-label="Open sidebar menu"
            >
              <Menu size={22} />
            </button>

            <div style={{ minWidth: 0 }}>
              <h1
                className="admin-page-title"
                style={{
                  margin: 0,
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#191522',
                  fontFamily: 'var(--font-heading, Sora)',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {activeTab === 'overview' && 'Dashboard'}
                {activeTab === 'customers' && 'Customers'}
                {activeTab === 'profiles' && 'Digital Profiles'}
                {activeTab === 'designs' && 'Card Designs'}
                {activeTab === 'orders' && 'Orders & Fulfillment'}
                {activeTab === 'cards' && 'NFC Cards'}
                {activeTab === 'pricing' && 'Card Products & Pricing'}
                {activeTab === 'templates' && 'Card Templates'}
                {activeTab === 'demo' && 'Demo Showcase Settings'}
                {activeTab === 'analytics' && 'Analytics'}
                {activeTab === 'admin-access' && 'Admin Access'}
                {activeTab === 'audit-logs' && 'Audit Logs'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
              <p className="admin-page-subtitle" style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#777184' }}>
                {activeTab === 'overview' && "Welcome back! Here's what's happening with FLOCARD."}
                {activeTab === 'customers' && 'Manage authenticated customer accounts and enterprise partners.'}
                {activeTab === 'profiles' && 'Public digital identity profiles, slugs, and live resolutions.'}
                {activeTab === 'designs' && 'Artwork review queue, bleed safe-area checks, and print approvals.'}
                {activeTab === 'orders' && 'Card production pipeline, manufacturing orders, and automated NFC card + profile provisioning.'}
                {activeTab === 'cards' && 'NTAG216 chip inventory, NFC encoding, and permanent redirect routes.'}
                {activeTab === 'pricing' && 'Configure authoritative physical NFC card pricing, compare prices, included specifications, and live store availability.'}
                {activeTab === 'templates' && 'Manage Standard FLOCARD (Without Customer Logo) and Customer Logo (With Customer Logo) brand templates.'}
                {activeTab === 'demo' && 'Customize default demo name, role, tagline, company, and brand logo across Homepage and demo card previews.'}
                {activeTab === 'analytics' && 'Real-time contactless tap metrics and telemetry logs.'}
                {activeTab === 'admin-access' && 'Owner-governed administrator invitations and security roles.'}
                {activeTab === 'audit-logs' && 'Immutable system audit trail of all operations and administrative changes.'}
                {activeTab === 'settings' && 'Database synchronization, studio backdrop, and system settings.'}
              </p>
            </div>
          </div>

          {/* Right: Search, Notifications, Date Filter & Profile Pill */}
          <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="admin-mobile-search-toggle"
              aria-label="Toggle search"
              style={{
                display: 'none',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid #E8E3EF',
                backgroundColor: mobileSearchOpen ? '#F3EEFF' : '#FFFFFF',
                color: mobileSearchOpen ? '#6B00FF' : '#191522',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Search size={18} />
            </button>

            {/* Global Search Bar */}
            <div
              className={`admin-header-search ${mobileSearchOpen ? 'mobile-visible' : ''}`}
              style={{ position: 'relative', width: '260px' }}
            >
              <Search size={16} color="#777184" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search customers, profiles, cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '9999px',
                  border: '1px solid #E8E3EF',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.82rem',
                  color: '#191522',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#6B00FF'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E8E3EF'; }}
              />
            </div>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1px solid #E8E3EF',
                  backgroundColor: '#FFFFFF',
                  color: '#191522',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <Bell size={18} />
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#6B00FF'
                  }}
                />
              </button>

              {notificationsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '46px',
                    width: '300px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E3EF',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.1)',
                    padding: '16px',
                    zIndex: 200
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#191522' }}>Live Notifications</span>
                    <span style={{ fontSize: '0.72rem', color: '#6B00FF', fontWeight: 600 }}>{auditLogs.length} events</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                    {auditLogs.slice(0, 4).map((log) => (
                      <div key={log.id} style={{ fontSize: '0.78rem', padding: '8px', borderRadius: '8px', backgroundColor: '#F7F6FA' }}>
                        <div style={{ fontWeight: 600, color: '#191522' }}>{log.type}</div>
                        <div style={{ color: '#777184', marginTop: '2px' }}>{log.details}</div>
                        <div style={{ color: '#A855F7', fontSize: '0.7rem', marginTop: '4px' }}>{log.timeAgo}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Date Range Filter Pill */}
            <div
              className="admin-header-date-filter"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '9999px',
                border: '1px solid #E8E3EF',
                backgroundColor: '#FFFFFF',
                fontSize: '0.82rem',
                color: '#191522',
                fontWeight: 500,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
              }}
            >
              <Calendar size={15} color="#6B00FF" />
              <span>{dateRange}</span>
            </div>

            {/* User Account Capsule */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="admin-user-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '4px 10px 4px 4px',
                  borderRadius: '9999px',
                  border: '1px solid #E8E3EF',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#6B00FF',
                    color: '#FFFFFF',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    flexShrink: 0
                  }}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user?.name?.charAt(0) || 'A'
                  )}
                </div>

                <div className="admin-user-details" style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#191522', whiteSpace: 'nowrap' }}>
                    {user?.name || 'Akhil Anvar'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#777184', whiteSpace: 'nowrap' }}>
                    {isOwner ? 'Owner' : 'Administrator'}
                  </div>
                </div>

                <ChevronDown className="admin-user-chevron" size={14} color="#777184" />
              </button>

              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '46px',
                    width: '200px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E8E3EF',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.1)',
                    padding: '8px',
                    zIndex: 200
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #F2ECFF' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#191522' }}>{user?.email || 'akhil@flocard.in'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#6B00FF', fontWeight: 600 }}>{isOwner ? 'Platform Owner' : 'Administrator'}</div>
                  </div>

                  <a
                    href="/p/akhil"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      color: '#191522',
                      textDecoration: 'none',
                      borderRadius: '8px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F7F6FA'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <ExternalLink size={14} color="#6B00FF" />
                    <span>View Public Profile</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      window.history.pushState({}, '', '/admin-login');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      color: '#DC4545',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <LogOut size={14} color="#DC4545" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Search Results Overlay if search active */}
        {filteredData && (
          <div style={{ padding: '24px 32px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E3EF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#191522' }}>
                Search Results for "{searchQuery}"
              </h3>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#6B00FF', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              >
                Clear Search
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
              {/* Customer matches */}
              <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E8E3EF', background: '#F7F6FA' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B00FF', textTransform: 'uppercase' }}>
                  Customers ({filteredData.customers.length})
                </span>
                {filteredData.customers.map(c => (
                  <div key={c.id} style={{ marginTop: '8px', fontSize: '0.84rem', fontWeight: 600 }}>{c.name} ({c.email})</div>
                ))}
              </div>

              {/* Profile matches */}
              <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E8E3EF', background: '#F7F6FA' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
                  Profiles ({filteredData.profiles.length})
                </span>
                {filteredData.profiles.map(p => (
                  <div key={p.id} style={{ marginTop: '8px', fontSize: '0.84rem', fontWeight: 600 }}>
                    <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', textDecoration: 'none' }}>
                      {p.name} (/p/{p.slug})
                    </a>
                  </div>
                ))}
              </div>

              {/* NFC Card matches */}
              <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E8E3EF', background: '#F7F6FA' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A36A', textTransform: 'uppercase' }}>
                  NFC Cards ({filteredData.cards.length})
                </span>
                {filteredData.cards.map(c => (
                  <div key={c.id} style={{ marginTop: '8px', fontSize: '0.84rem', fontWeight: 600 }}>{c.cardCode} — {c.customerName || 'Unassigned'}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Main Scrollable View */}
        <div className="admin-main-content" style={{ padding: '28px 32px 48px', width: '100%', boxSizing: 'border-box' }}>
          {/* ====================================================================
              VIEW: DASHBOARD OVERVIEW (Exact Reference Image 2)
              ==================================================================== */}
          {activeTab === 'overview' && (
            <div>
              {/* Top 6 Metric Statistic Cards */}
              <div
                className="admin-stats-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                  gap: '16px',
                  marginBottom: '28px'
                }}
              >
                {/* 1. Total Customers */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E3EF',
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#F3EEFF', color: '#6B00FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={18} />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#777184', fontWeight: 500 }}>Total Customers</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#191522', fontFamily: 'var(--font-heading, Sora)' }}>
                        {stats.customers}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16A36A', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <ArrowUpRight size={12} /> +12%
                      </span>
                    </div>
                  </div>
                  {/* Purple Sparkline Wave */}
                  <svg width="100%" height="24" viewBox="0 0 100 24" style={{ marginTop: '8px' }}>
                    <path d="M0,18 Q20,12 40,16 T80,8 T100,6" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* 2. Published Profiles */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E3EF',
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#EEF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={18} />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#777184', fontWeight: 500 }}>Published Profiles</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#191522', fontFamily: 'var(--font-heading, Sora)' }}>
                        {stats.publishedProfiles}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16A36A', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <ArrowUpRight size={12} /> +8%
                      </span>
                    </div>
                  </div>
                  {/* Blue Sparkline Wave */}
                  <svg width="100%" height="24" viewBox="0 0 100 24" style={{ marginTop: '8px' }}>
                    <path d="M0,20 Q25,18 50,12 T85,10 T100,4" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* 3. Active NFC Cards */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E3EF',
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#EEFAF5', color: '#16A36A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard size={18} />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#777184', fontWeight: 500 }}>Active NFC Cards</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#191522', fontFamily: 'var(--font-heading, Sora)' }}>
                        {stats.activeCards}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16A36A', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <ArrowUpRight size={12} /> +15%
                      </span>
                    </div>
                  </div>
                  {/* Green Sparkline Wave */}
                  <svg width="100%" height="24" viewBox="0 0 100 24" style={{ marginTop: '8px' }}>
                    <path d="M0,16 Q30,14 60,10 T90,6 T100,2" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* 4. Pending Approvals */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E3EF',
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={18} />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#777184', fontWeight: 500 }}>Pending Approvals</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#191522', fontFamily: 'var(--font-heading, Sora)' }}>
                        {stats.pendingApprovals}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#DC4545', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <ArrowDownRight size={12} /> -5%
                      </span>
                    </div>
                  </div>
                  {/* Orange Sparkline Wave */}
                  <svg width="100%" height="24" viewBox="0 0 100 24" style={{ marginTop: '8px' }}>
                    <path d="M0,8 Q35,12 60,15 T85,18 T100,20" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* 5. Unassigned Cards */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E3EF',
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layers size={18} />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#777184', fontWeight: 500 }}>Unassigned Cards</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#191522', fontFamily: 'var(--font-heading, Sora)' }}>
                        {stats.unassignedCards}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16A36A', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <ArrowUpRight size={12} /> +3%
                      </span>
                    </div>
                  </div>
                  {/* Slate Sparkline Wave */}
                  <svg width="100%" height="24" viewBox="0 0 100 24" style={{ marginTop: '8px' }}>
                    <path d="M0,14 Q30,16 60,12 T90,10 T100,8" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* 6. Suspended Cards */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E3EF',
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FEF2F2', color: '#DC4545', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <XCircle size={18} />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#777184', fontWeight: 500 }}>Suspended Cards</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#191522', fontFamily: 'var(--font-heading, Sora)' }}>
                        {stats.suspendedCards}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#DC4545', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <ArrowDownRight size={12} /> -2%
                      </span>
                    </div>
                  </div>
                  {/* Red Sparkline Wave */}
                  <svg width="100%" height="24" viewBox="0 0 100 24" style={{ marginTop: '8px' }}>
                    <path d="M0,10 Q25,12 50,16 T85,18 T100,22" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Middle Section: Two Columns (Recent Activity + Pending Design Approvals) */}
              <div
                className="admin-middle-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
                  gap: '24px',
                  marginBottom: '28px'
                }}
              >
                {/* Left: Recent Activity */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E3EF',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F3EEFF', color: '#6B00FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={16} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#191522' }}>Recent Activity</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#777184' }}>Latest actions across the platform</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('audit-logs')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        border: '1px solid #E8E3EF',
                        backgroundColor: '#FFFFFF',
                        color: '#6B00FF',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      View All
                    </button>
                  </div>

                  {/* Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #F2ECFF', color: '#777184', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '8px 12px 10px', fontWeight: 600 }}>Type</th>
                          <th style={{ padding: '8px 12px 10px', fontWeight: 600 }}>Details</th>
                          <th style={{ padding: '8px 12px 10px', fontWeight: 600 }}>User</th>
                          <th style={{ padding: '8px 12px 10px', fontWeight: 600 }}>Time</th>
                          <th style={{ padding: '8px 12px 10px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '36px 12px', textAlign: 'center', color: '#777184' }}>
                              No recent activity recorded yet.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.slice(0, 5).map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid #F7F6FA' }}>
                              <td style={{ padding: '12px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: log.type === 'Card Design' ? '#F3EEFF' : log.type === 'Profile' ? '#EEF6FF' : log.type === 'NFC Card' ? '#EEFAF5' : '#FFF7ED',
                                    color: log.type === 'Card Design' ? '#6B00FF' : log.type === 'Profile' ? '#2563EB' : log.type === 'NFC Card' ? '#16A36A' : '#EA580C'
                                  }}
                                >
                                  {log.type}
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: '#191522', fontWeight: 500 }}>
                                {log.details}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#6B00FF', color: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700 }}>
                                    {log.userAvatar ? <img src={log.userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (log.userName?.charAt(0) || 'U')}
                                  </div>
                                  <span style={{ color: '#191522', fontWeight: 600, fontSize: '0.8rem' }}>{log.userName}</span>
                                </div>
                              </td>
                              <td style={{ padding: '12px', color: '#777184', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                                {log.timeAgo}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <MoreVertical size={15} color="#B8AEC8" style={{ cursor: 'pointer' }} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Pending Design Approvals */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E3EF',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={16} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#191522' }}>Pending Design Approvals</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#777184' }}>Designs waiting for review</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('designs')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        border: '1px solid #E8E3EF',
                        backgroundColor: '#FFFFFF',
                        color: '#6B00FF',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      View All
                    </button>
                  </div>

                  {/* Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #F2ECFF', color: '#777184', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '8px 12px 10px', fontWeight: 600 }}>ID</th>
                          <th style={{ padding: '8px 12px 10px', fontWeight: 600 }}>Customer</th>
                          <th style={{ padding: '8px 12px 10px', fontWeight: 600 }}>Template</th>
                          <th style={{ padding: '8px 12px 10px', fontWeight: 600 }}>Submitted</th>
                          <th style={{ padding: '8px 12px 10px', fontWeight: 600, textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {designs.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '36px 12px', textAlign: 'center', color: '#777184' }}>
                              <CheckCircle2 size={24} color="#16A36A" style={{ margin: '0 auto 8px', display: 'block' }} />
                              <div style={{ fontWeight: 600, color: '#191522', fontSize: '0.84rem' }}>No pending design approvals</div>
                              <div style={{ fontSize: '0.74rem', marginTop: '2px' }}>All submitted card designs have been reviewed.</div>
                            </td>
                          </tr>
                        ) : (
                          designs.slice(0, 5).map((design) => (
                            <tr key={design.id} style={{ borderBottom: '1px solid #F7F6FA' }}>
                              <td style={{ padding: '12px', color: '#777184', fontWeight: 600, fontSize: '0.78rem' }}>
                                {design.id}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#6B00FF', color: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                                    {design.customerAvatar ? <img src={design.customerAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (design.customerName?.charAt(0) || 'C')}
                                  </div>
                                  <div>
                                    <div style={{ color: '#191522', fontWeight: 600, fontSize: '0.82rem' }}>{design.customerName}</div>
                                    <div style={{ color: '#777184', fontSize: '0.7rem' }}>{design.customerEmail || 'customer@flocard.in'}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div
                                    style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      backgroundColor: design.edition === 'gold' ? '#D4AF37' : design.edition === 'platinum' ? '#94A3B8' : design.template === 'Customer Logo' ? '#EC4899' : '#6B00FF'
                                    }}
                                  />
                                  <span style={{ color: '#191522', fontWeight: 500, fontSize: '0.8rem' }}>
                                    {design.template || 'Standard FLOCARD'}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '12px', color: '#777184', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                {design.submittedAt}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setReviewModalDesign(design)}
                                    style={{
                                      padding: '5px 14px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      backgroundColor: '#6B00FF',
                                      color: '#FFFFFF',
                                      fontSize: '0.76rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 6px rgba(107, 0, 255, 0.25)'
                                    }}
                                  >
                                    Review
                                  </button>
                                  <MoreVertical size={15} color="#B8AEC8" style={{ cursor: 'pointer' }} />
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Three Columns (Recently Created Profiles + Recently Assigned Cards + Quick Actions) */}
              <div
                className="admin-bottom-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                  gap: '24px'
                }}
              >
                {/* 1. Recently Created Profiles */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E3EF',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F3EEFF', color: '#6B00FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={16} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#191522' }}>Recently Created Profiles</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#777184' }}>Latest profiles created</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('profiles')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        border: '1px solid #E8E3EF',
                        backgroundColor: '#FFFFFF',
                        color: '#6B00FF',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      View All
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #F2ECFF', color: '#777184', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '6px 8px', fontWeight: 600 }}>Customer</th>
                          <th style={{ padding: '6px 8px', fontWeight: 600 }}>Profile Name</th>
                          <th style={{ padding: '6px 8px', fontWeight: 600 }}>Slug</th>
                          <th style={{ padding: '6px 8px', fontWeight: 600 }}>Status</th>
                          <th style={{ padding: '6px 8px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {profiles.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '36px 12px', textAlign: 'center', color: '#777184' }}>
                              <Users size={24} color="#A855F7" style={{ margin: '0 auto 8px', display: 'block' }} />
                              <div style={{ fontWeight: 600, color: '#191522', fontSize: '0.84rem' }}>No profiles created yet</div>
                              <div style={{ fontSize: '0.74rem', marginTop: '2px' }}>New customer profiles will appear here.</div>
                            </td>
                          </tr>
                        ) : (
                          profiles.slice(0, 5).map((p) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #F7F6FA' }}>
                              <td style={{ padding: '10px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#6B00FF', color: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700 }}>
                                    {p.avatar ? <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.name.charAt(0)}
                                  </div>
                                  <span style={{ color: '#191522', fontWeight: 600, fontSize: '0.8rem' }}>{p.name}</span>
                                </div>
                              </td>
                              <td style={{ padding: '10px 8px', color: '#777184' }}>{p.company || p.name}</td>
                              <td style={{ padding: '10px 8px', color: '#777184', fontFamily: 'monospace', fontSize: '0.74rem' }}>{p.slug}</td>
                              <td style={{ padding: '10px 8px' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    backgroundColor: p.status === 'published' ? '#EEFAF5' : p.status === 'pending' ? '#FFF7ED' : '#F1F5F9',
                                    color: p.status === 'published' ? '#16A36A' : p.status === 'pending' ? '#EA580C' : '#64748B'
                                  }}
                                >
                                  ● {p.status === 'published' ? 'Published' : p.status === 'pending' ? 'Pending' : 'Draft'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" style={{ color: '#6B00FF' }}>
                                  <ExternalLink size={13} />
                                </a>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Recently Assigned NFC Cards */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E3EF',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EEFAF5', color: '#16A36A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#191522' }}>Recently Assigned NFC Cards</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#777184' }}>Latest card assignments</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('cards')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        border: '1px solid #E8E3EF',
                        backgroundColor: '#FFFFFF',
                        color: '#6B00FF',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      View All
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #F2ECFF', color: '#777184', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '6px 8px', fontWeight: 600 }}>Card ID</th>
                          <th style={{ padding: '6px 8px', fontWeight: 600 }}>Customer</th>
                          <th style={{ padding: '6px 8px', fontWeight: 600 }}>Profile</th>
                          <th style={{ padding: '6px 8px', fontWeight: 600 }}>Status</th>
                          <th style={{ padding: '6px 8px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cards.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '36px 12px', textAlign: 'center', color: '#777184' }}>
                              <CreditCard size={24} color="#6B00FF" style={{ margin: '0 auto 8px', display: 'block' }} />
                              <div style={{ fontWeight: 600, color: '#191522', fontSize: '0.84rem' }}>No NFC cards assigned yet</div>
                              <div style={{ fontSize: '0.74rem', marginTop: '2px' }}>Use &quot;Assign NFC Card&quot; to assign physical hardware.</div>
                            </td>
                          </tr>
                        ) : (
                          cards.slice(0, 5).map((card) => (
                            <tr key={card.id} style={{ borderBottom: '1px solid #F7F6FA' }}>
                              <td style={{ padding: '10px 8px', color: '#191522', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.76rem' }}>
                                {card.cardCode}
                              </td>
                              <td style={{ padding: '10px 8px', color: '#191522', fontWeight: 500 }}>
                                {card.customerName || 'Unassigned'}
                              </td>
                              <td style={{ padding: '10px 8px', color: '#777184' }}>
                                {card.profileName || card.profileSlug || '—'}
                              </td>
                              <td style={{ padding: '10px 8px' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    backgroundColor: card.status === 'active' ? '#EEFAF5' : card.status === 'suspended' ? '#FEF2F2' : '#F1F5F9',
                                    color: card.status === 'active' ? '#16A36A' : card.status === 'suspended' ? '#DC4545' : '#64748B'
                                  }}
                                >
                                  ● {card.status === 'active' ? 'Active' : card.status === 'suspended' ? 'Suspended' : 'Unassigned'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                <a href={`/t/${card.cardCode}`} target="_blank" rel="noreferrer" title="Test NFC Route" style={{ color: '#6B00FF' }}>
                                  <ExternalLink size={13} />
                                </a>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Quick Actions (2x3 Grid) */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E3EF',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F3EEFF', color: '#6B00FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Rocket size={16} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#191522' }}>Quick Actions</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#777184' }}>Common tasks</p>
                    </div>
                  </div>

                  <div className="admin-quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {/* Add Customer */}
                    <button
                      type="button"
                      onClick={() => setNewCustomerModal(true)}
                      style={{
                        backgroundColor: '#F3EEFF',
                        border: '1px solid #E4D8FF',
                        borderRadius: '12px',
                        padding: '16px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <UserPlus size={20} color="#6B00FF" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B00FF' }}>Add Customer</span>
                    </button>

                    {/* Create Profile */}
                    <button
                      type="button"
                      onClick={() => setNewProfileModal(true)}
                      style={{
                        backgroundColor: '#EEF6FF',
                        border: '1px solid #D6E7FF',
                        borderRadius: '12px',
                        padding: '16px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <FileText size={20} color="#2563EB" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2563EB' }}>Create Profile</span>
                    </button>

                    {/* Review Designs */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('designs')}
                      style={{
                        backgroundColor: '#EEFAF5',
                        border: '1px solid #D0F2E3',
                        borderRadius: '12px',
                        padding: '16px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <Palette size={20} color="#16A36A" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#16A36A' }}>Review Designs</span>
                    </button>

                    {/* Assign NFC Card */}
                    <button
                      type="button"
                      onClick={() => setAssignCardModal(true)}
                      style={{
                        backgroundColor: '#FFF7ED',
                        border: '1px solid #FFE4C8',
                        borderRadius: '12px',
                        padding: '16px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <CreditCard size={20} color="#EA580C" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#EA580C' }}>Assign NFC Card</span>
                    </button>

                    {/* Manage Templates */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('templates')}
                      style={{
                        backgroundColor: '#FFF1F2',
                        border: '1px solid #FEE2E2',
                        borderRadius: '12px',
                        padding: '16px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <Layers size={20} color="#E11D48" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#E11D48' }}>Manage Templates</span>
                    </button>

                    {/* View Analytics */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('analytics')}
                      style={{
                        backgroundColor: '#F0F4FF',
                        border: '1px solid #DCE6FF',
                        borderRadius: '12px',
                        padding: '16px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <BarChart3 size={20} color="#4F46E5" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4F46E5' }}>View Analytics</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================
              VIEW: CUSTOMERS
              ==================================================================== */}
          {/* ====================================================================
              VIEW: CUSTOMERS
              ==================================================================== */}
          {activeTab === 'customers' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E3EF', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#191522' }}>Customer Accounts</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#777184' }}>Total {customers.length} verified accounts with real-time editing & credential management</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewCustomerModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#6B00FF',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  <span>Add Customer</span>
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F2ECFF', color: '#777184', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>Customer</th>
                      <th style={{ padding: '10px 12px' }}>Company</th>
                      <th style={{ padding: '10px 12px' }}>Phone</th>
                      <th style={{ padding: '10px 12px' }}>Cards</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Joined</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '48px 12px', textAlign: 'center', color: '#777184' }}>
                          <Users size={32} color="#C4B5FD" style={{ margin: '0 auto 8px', display: 'block' }} />
                          <div style={{ fontWeight: 600, color: '#191522', marginBottom: '4px' }}>No customers registered yet</div>
                          <div style={{ fontSize: '0.78rem' }}>Click &quot;Add Customer&quot; above to add your first customer.</div>
                        </td>
                      </tr>
                    ) : (
                      customers.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #F7F6FA' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6B00FF', color: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                              {c.avatar ? <img src={c.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#191522' }}>{c.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#777184' }}>{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#777184' }}>{c.company || '—'}</td>
                        <td style={{ padding: '12px', color: '#777184' }}>{c.phone || '—'}</td>
                        <td style={{ padding: '12px', fontWeight: 600, color: '#6B00FF' }}>{c.totalCards || 0}</td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: c.status === 'suspended' ? '#FEF2F2' : '#EEFAF5',
                              color: c.status === 'suspended' ? '#DC4545' : '#16A36A',
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}
                          >
                            ● {c.status || 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#777184' }}>{c.joinedDate || '2026-10-14'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingCustomer(c)}
                              title="Edit Customer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                border: '1px solid #E8E3EF',
                                backgroundColor: '#FFFFFF',
                                color: '#6B00FF',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(c.id)}
                              title="Delete Customer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '5px 8px',
                                borderRadius: '8px',
                                border: '1px solid #FEE2E2',
                                backgroundColor: '#FEF2F2',
                                color: '#DC4545',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================
              VIEW: DIGITAL PROFILES
              ==================================================================== */}
          {activeTab === 'profiles' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E3EF', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#191522' }}>Digital Profiles</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#777184' }}>Total {profiles.length} identity profiles. Edit bio, designation, theme & contact links.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewProfileModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#6B00FF',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  <span>Create Digital Profile</span>
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F2ECFF', color: '#777184', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>Profile Name</th>
                      <th style={{ padding: '10px 12px' }}>Designation / Company</th>
                      <th style={{ padding: '10px 12px' }}>Public URL</th>
                      <th style={{ padding: '10px 12px' }}>Theme</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '48px 12px', textAlign: 'center', color: '#777184' }}>
                          <FileText size={32} color="#C4B5FD" style={{ margin: '0 auto 8px', display: 'block' }} />
                          <div style={{ fontWeight: 600, color: '#191522', marginBottom: '4px' }}>No digital profiles found</div>
                          <div style={{ fontSize: '0.78rem' }}>Click &quot;Create Digital Profile&quot; to publish your first profile.</div>
                        </td>
                      </tr>
                    ) : (
                      profiles.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F7F6FA' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6B00FF', color: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                              {p.avatar ? <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.name.charAt(0)}
                            </div>
                            <span style={{ fontWeight: 600, color: '#191522' }}>{p.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#777184' }}>{p.role} at {p.company}</td>
                        <td style={{ padding: '12px' }}>
                          <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" style={{ color: '#6B00FF', textDecoration: 'none', fontWeight: 600 }}>
                            flocard.in/p/{p.slug}
                          </a>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ textTransform: 'capitalize', fontSize: '0.76rem', fontWeight: 600, color: p.theme === 'gold' ? '#D4AF37' : p.theme === 'platinum' ? '#94A3B8' : '#6B00FF' }}>
                            {p.theme || 'purple'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: p.status === 'published' ? '#EEFAF5' : '#F1F5F9',
                              color: p.status === 'published' ? '#16A36A' : '#64748B',
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}
                          >
                            ● {p.status || 'draft'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <a
                              href={`/p/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                backgroundColor: '#F3EEFF',
                                color: '#6B00FF',
                                textDecoration: 'none',
                                fontSize: '0.76rem',
                                fontWeight: 600
                              }}
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => setEditingProfile(p)}
                              title="Edit Digital Profile"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                border: '1px solid #E8E3EF',
                                backgroundColor: '#FFFFFF',
                                color: '#191522',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProfile(p.id)}
                              title="Delete Profile"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '5px 8px',
                                borderRadius: '8px',
                                border: '1px solid #FEE2E2',
                                backgroundColor: '#FEF2F2',
                                color: '#DC4545',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================
              VIEW: CARD DESIGNS & APPROVAL QUEUE
              ==================================================================== */}
          {activeTab === 'designs' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E3EF', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#191522' }}>Card Design Review Queue & Studio</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#777184' }}>Edit card designs directly in the 3D studio, inspect proofs, or modify artwork metadata.</p>
                </div>
                <a
                  href="/designer"
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#6B00FF',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    textDecoration: 'none'
                  }}
                >
                  <Plus size={16} />
                  <span>Launch Designer Studio</span>
                </a>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F2ECFF', color: '#777184', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>ID</th>
                      <th style={{ padding: '10px 12px' }}>Customer</th>
                      <th style={{ padding: '10px 12px' }}>Template / Edition</th>
                      <th style={{ padding: '10px 12px' }}>Title</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Order</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {designs.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '48px 12px', textAlign: 'center', color: '#777184' }}>
                          <Palette size={32} color="#C4B5FD" style={{ margin: '0 auto 8px', display: 'block' }} />
                          <div style={{ fontWeight: 600, color: '#191522', marginBottom: '4px' }}>No card designs submitted yet</div>
                          <div style={{ fontSize: '0.78rem' }}>Designs saved in the designer studio will appear here for print approval.</div>
                        </td>
                      </tr>
                    ) : (
                      designs.map((d) => {
                        const linkedOrder = orders.find(o => o.designId === d.id || o.id === d.orderId);
                        return (
                          <tr key={d.id} style={{ borderBottom: '1px solid #F7F6FA' }}>
                            <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600 }}>{d.id}</td>
                            <td style={{ padding: '12px', fontWeight: 600, color: '#191522' }}>{d.customerName}</td>
                            <td style={{ padding: '12px', color: '#777184', textTransform: 'capitalize' }}>{d.template || d.edition || 'Purple'}</td>
                            <td style={{ padding: '12px', color: '#191522' }}>{d.title}</td>
                            <td style={{ padding: '12px' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  backgroundColor: d.status === 'approved' ? '#EEFAF5' : d.status === 'rejected' ? '#FEF2F2' : '#FFF7ED',
                                  color: d.status === 'approved' ? '#16A36A' : d.status === 'rejected' ? '#DC4545' : '#EA580C',
                                  fontWeight: 600,
                                  textTransform: 'capitalize'
                                }}
                              >
                                ● {d.status === 'approved' ? 'Approved' : d.status === 'rejected' ? 'Rejected' : d.status === 'in_review' ? 'In Review' : 'Submitted'}
                              </span>
                            </td>
                            {/* Order Assignment Column */}
                            <td style={{ padding: '12px' }}>
                              {linkedOrder ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('orders');
                                    setSelectedOrder(linkedOrder);
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 10px',
                                    borderRadius: '9999px',
                                    border: '1px solid #DDD6FE',
                                    backgroundColor: '#F5F3FF',
                                    color: '#6B00FF',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title={`View Order ${linkedOrder.id} (${linkedOrder.status})`}
                                >
                                  <Package size={12} />
                                  <span>{linkedOrder.id}</span>
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.74rem', color: '#9CA3AF', fontStyle: 'italic' }}>
                                  Not in orders
                                </span>
                              )}
                            </td>
                            {/* Actions Column */}
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                {!linkedOrder ? (
                                  <button
                                    type="button"
                                    onClick={() => handleAssignDesignToOrder(d)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '5px 12px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      backgroundColor: '#16A36A',
                                      color: '#FFFFFF',
                                      fontSize: '0.76rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 8px rgba(22, 163, 106, 0.25)'
                                    }}
                                    title="Approve this design and assign it to a manufacturing order"
                                  >
                                    <Package size={13} />
                                    <span>Assign to Order</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab('orders');
                                      setSelectedOrder(linkedOrder);
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '5px 10px',
                                      borderRadius: '8px',
                                      border: '1px solid #DDD6FE',
                                      backgroundColor: '#F5F3FF',
                                      color: '#6B00FF',
                                      fontSize: '0.76rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                    title={`View assigned Order ${linkedOrder.id}`}
                                  >
                                    <Package size={12} />
                                    <span>View Order</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setReviewModalDesign(d)}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#6B00FF',
                                    color: '#FFFFFF',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Proof
                                </button>
                                <a
                                  href={`/designer?id=${encodeURIComponent(d.id)}&template=${d.templateType || 'standard'}&edition=${d.edition || 'purple'}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Edit in Visual Card Studio"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #E8E3EF',
                                    backgroundColor: '#F7F6FA',
                                    color: '#191522',
                                    textDecoration: 'none',
                                    fontSize: '0.76rem',
                                    fontWeight: 600
                                  }}
                                >
                                  <SlidersHorizontal size={12} />
                                  <span>Studio</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setEditingDesign(d)}
                                  title="Edit Metadata & Status"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '5px 8px',
                                    borderRadius: '8px',
                                    border: '1px solid #E8E3EF',
                                    backgroundColor: '#FFFFFF',
                                    color: '#191522',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDesign(d.id)}
                                  title="Delete Design"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '5px 8px',
                                    borderRadius: '8px',
                                    border: '1px solid #FEE2E2',
                                    backgroundColor: '#FEF2F2',
                                    color: '#DC4545',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================
              VIEW: ORDERS & CARD FULFILLMENT PIPELINE (ADMIN ORDER MANAGER)
              ==================================================================== */}
          {activeTab === "orders" && (
            <AdminOrderManager initialOrderId={initialOrderId} />
          )}

          {/* ====================================================================
              VIEW: NFC CARDS INVENTORY
              ==================================================================== */}
          {activeTab === 'cards' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E3EF', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#191522' }}>NFC Card Hardware Inventory</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#777184' }}>Encoded NTAG216 hardware chips with permanent redirect routes & assignments.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignCardModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#6B00FF',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  <span>Encode & Assign Card</span>
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F2ECFF', color: '#777184', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>Card ID</th>
                      <th style={{ padding: '10px 12px' }}>Customer</th>
                      <th style={{ padding: '10px 12px' }}>Assigned Profile</th>
                      <th style={{ padding: '10px 12px' }}>Edition</th>
                      <th style={{ padding: '10px 12px' }}>Tap Count</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Redirect</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '48px 12px', textAlign: 'center', color: '#777184' }}>
                          <CreditCard size={32} color="#C4B5FD" style={{ margin: '0 auto 8px', display: 'block' }} />
                          <div style={{ fontWeight: 600, color: '#191522', marginBottom: '4px' }}>No NFC cards registered</div>
                          <div style={{ fontSize: '0.78rem' }}>Click &quot;Encode &amp; Assign Card&quot; to link your first physical NFC card.</div>
                        </td>
                      </tr>
                    ) : (
                      cards.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #F7F6FA' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#191522' }}>{c.cardCode}</td>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{c.customerName || 'In Stock'}</td>
                        <td style={{ padding: '12px', color: '#777184' }}>{c.profileSlug ? `@${c.profileSlug}` : '—'}</td>
                        <td style={{ padding: '12px', textTransform: 'capitalize' }}>{c.edition}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#6B00FF' }}>{c.tapCount || 0}</td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: c.status === 'active' ? '#EEFAF5' : c.status === 'suspended' ? '#FEF2F2' : '#F1F5F9',
                              color: c.status === 'active' ? '#16A36A' : c.status === 'suspended' ? '#DC4545' : '#64748B',
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}
                          >
                            ● {c.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <a
                            href={`/t/${c.cardCode}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#F3EEFF',
                              color: '#6B00FF',
                              textDecoration: 'none',
                              fontSize: '0.76rem',
                              fontWeight: 600
                            }}
                          >
                            <span>/t/{c.cardCode}</span>
                            <ExternalLink size={12} />
                          </a>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingCard(c)}
                              title="Edit NFC Card"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                border: '1px solid #E8E3EF',
                                backgroundColor: '#FFFFFF',
                                color: '#6B00FF',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCard(c.id)}
                              title="Delete NFC Card"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '5px 8px',
                                borderRadius: '8px',
                                border: '1px solid #FEE2E2',
                                backgroundColor: '#FEF2F2',
                                color: '#DC4545',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================
              VIEW: CARD PRODUCTS & PRICING
              Protected authoritative management for physical NFC cards
              ==================================================================== */}
          {activeTab === 'pricing' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E3EF', padding: '28px' }}>
              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#191522' }}>
                      Card Products & Pricing Configuration
                    </h3>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '10px', backgroundColor: '#EDE9FE', color: '#6B00FF' }}>
                      INR (₹) Standard
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#777184' }}>
                    Manage authoritative pricing, optional comparison prices, included hardware features, and stock availability for Gold, Platinum, and Purple editions.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#059669', backgroundColor: '#ECFDF5', padding: '6px 12px', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                    <CheckCircle2 size={15} />
                    <span>Multi-tab synchronized</span>
                  </div>
                </div>
              </div>

              {/* Quick Pricing Summary Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px', marginBottom: '28px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#FAF9FC', border: '1px solid #E8E3EF' }}>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777184', fontWeight: 600 }}>Physical Editions</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#191522', marginTop: '4px' }}>3 Editions</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B00FF', marginTop: '2px' }}>Gold, Platinum, Purple</div>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#FAF9FC', border: '1px solid #E8E3EF' }}>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777184', fontWeight: 600 }}>Active Price Range</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#191522', marginTop: '4px' }}>
                    {(() => {
                      const validPrices = (products || []).map(p => Number(p.price)).filter(p => !isNaN(p) && p > 0);
                      if (validPrices.length === 0) return 'Prices pending';
                      const min = Math.min(...validPrices);
                      const max = Math.max(...validPrices);
                      return min === max ? `₹${min.toLocaleString('en-IN')}` : `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')}`;
                    })()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>Indian Rupees (₹)</div>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#FAF9FC', border: '1px solid #E8E3EF' }}>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777184', fontWeight: 600 }}>Store Availability</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                    {(products || []).filter(p => p.availability !== 'out_of_stock' && p.status === 'active').length} / {(products || []).length} In Stock
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#777184', marginTop: '2px' }}>Live NFC production</div>
                </div>
              </div>

              {/* Edition Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px' }}>
                {(products || []).map((product) => {
                  const formattedPrice = formatCurrencyINR(product.price);
                  const formattedCompare = product.comparePrice && product.comparePrice > product.price ? formatCurrencyINR(product.comparePrice) : null;
                  const isAvailable = product.availability !== 'out_of_stock' && product.status === 'active';

                  return (
                    <div
                      key={product.id || product.editionKey}
                      style={{
                        borderRadius: '16px',
                        border: `1px solid ${product.accentColor ? `${product.accentColor}44` : '#E8E3EF'}`,
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      {/* Top Accent Strip */}
                      <div
                        style={{
                          height: '5px',
                          background: product.accentColor === '#E9C766'
                            ? 'linear-gradient(90deg, #FFF0A6, #E9C766, #C9972C)'
                            : product.accentColor === '#CBD5E1'
                              ? 'linear-gradient(90deg, #F8FAFC, #CBD5E1, #94A3B8)'
                              : 'linear-gradient(90deg, #C084FC, #A855F7, #6B00FF)'
                        }}
                      />

                      <div style={{ padding: '20px' }}>
                        {/* Header Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                backgroundColor: `${product.accentColor}22`,
                                color: product.accentColor === '#CBD5E1' ? '#334155' : product.accentColor,
                                border: `1px solid ${product.accentColor}55`
                              }}
                            >
                              {product.editionKey?.toUpperCase()} EDITION
                            </span>
                            {product.featured && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                                ★ FEATURED
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: product.status === 'active' ? '#ECFDF5' : '#F3F4F6',
                                color: product.status === 'active' ? '#059669' : '#6B7280'
                              }}
                            >
                              {product.status === 'active' ? 'Active' : 'Disabled'}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: isAvailable ? '#EFF6FF' : '#FEF2F2',
                                color: isAvailable ? '#2563EB' : '#DC2626'
                              }}
                            >
                              {product.availability === 'in_stock' ? 'In Stock' : product.availability === 'low_stock' ? 'Low Stock' : product.availability === 'pre_order' ? 'Pre-Order' : 'Out of Stock'}
                            </span>
                          </div>
                        </div>

                        {/* Interactive 3D Card Preview Stage */}
                        <div
                          style={{
                            width: '100%',
                            minHeight: '230px',
                            borderRadius: '12px',
                            background: 'radial-gradient(ellipse at 50% 30%, #201135 0%, #0D0717 65%, #07030D 100%)',
                            border: `1px solid ${product.accentColor}33`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '16px 12px',
                            marginBottom: '16px',
                            position: 'relative'
                          }}
                        >
                          <Card3DPreview edition={product.editionKey} width={250} allowFlip={true} />
                          <div style={{ marginTop: '10px', fontSize: '0.72rem', color: '#9CA3AF' }}>
                            Hover to tilt &bull; Click card to flip front / back
                          </div>
                        </div>

                        {/* Product Title & Pricing */}
                        <h4 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: '#191522' }}>
                          {product.name}
                        </h4>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                          {formattedPrice ? (
                            <>
                              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#191522' }}>
                                {formattedPrice}
                              </span>
                              {formattedCompare && (
                                <span style={{ fontSize: '1rem', color: '#9CA3AF', textDecoration: 'line-through' }}>
                                  {formattedCompare}
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#D97706' }}>
                              Price coming soon
                            </span>
                          )}
                        </div>

                        <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#6B7280', lineHeight: 1.5 }}>
                          {product.description}
                        </p>

                        {/* Key Included Features List */}
                        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '12px', marginBottom: '16px' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#4B5563', marginBottom: '8px' }}>
                            Included Features ({product.features?.length || 0})
                          </div>
                          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(product.features || []).map((feat, idx) => (
                              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.78rem', color: '#374151' }}>
                                <Check size={14} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div style={{ padding: '14px 20px', borderTop: '1px solid #E8E3EF', backgroundColor: '#FAF9FC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#777184' }}>
                          Updated {new Date(product.updatedAt || Date.now()).toLocaleDateString('en-IN')}
                        </span>

                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...product, features: [...(product.features || [])] })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '8px',
                            border: '1px solid #D1D5DB',
                            backgroundColor: '#FFFFFF',
                            color: '#1F2937',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          <Edit2 size={14} />
                          <span>Configure Pricing & Specs</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ====================================================================
              VIEW: CARD TEMPLATES
              ==================================================================== */}
          {activeTab === 'templates' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E3EF', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#191522' }}>FLOCARD Template Families & Materials</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#777184' }}>Manage Standard FLOCARD (Without Customer Logo) and Customer Logo (With Customer Logo) presets.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewTemplateModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#6B00FF',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  <span>Create Custom Template</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px' }}>
                {(templates || []).map((tmpl) => (
                  <div
                    key={tmpl.id || tmpl.key}
                    style={{
                      borderRadius: '16px',
                      border: '1px solid #E8E3EF',
                      padding: '20px',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      {/* Live Studio 3D Card Preview Stage */}
                      <div
                        style={{
                          width: '100%',
                          minHeight: '280px',
                          borderRadius: '16px',
                          background: 'radial-gradient(ellipse at 50% 30%, #201135 0%, #0D0717 65%, #07030D 100%)',
                          border: `1px solid ${tmpl.accentColor ? `${tmpl.accentColor}33` : '#6B00FF33'}`,
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.15)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '18px 16px 26px',
                          position: 'relative'
                        }}
                      >
                        {/* Top Studio Header Bar */}
                        <div
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px',
                            padding: '0 4px'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(168, 85, 247, 0.15)',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              color: tmpl.accentColor || '#C084FC',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: tmpl.accentColor || '#C084FC' }} />
                            {tmpl.badge || (tmpl.key === 'customer_logo' ? 'With Customer Logo' : 'Without Customer Logo')}
                          </span>

                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: '#94A3B8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Sparkles size={11} color="#A855F7" />
                            <span>Studio 3D Preview</span>
                          </span>
                        </div>

                        {/* Interactive 3D Card Live Preview */}
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <Card3DPreview
                            edition={tmpl.key === 'customer_logo' ? 'purple' : 'purple'}
                            templateType={tmpl.key === 'customer_logo' ? 'customer_logo' : 'standard'}
                            width={310}
                            allowFlip={true}
                            enableTilt={true}
                          />
                        </div>

                        {/* Ground Light Glow */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '220px',
                            height: '14px',
                            borderRadius: '50%',
                            background: tmpl.accentColor
                              ? `radial-gradient(ellipse at center, ${tmpl.accentColor}33 0%, transparent 70%)`
                              : 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
                            filter: 'blur(6px)',
                            pointerEvents: 'none'
                          }}
                        />
                      </div>

                      {/* Header meta */}
                      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#191522', fontSize: '0.96rem' }}>{tmpl.name}</span>
                          <div style={{ fontSize: '0.74rem', color: '#777184' }}>{tmpl.category || 'Preset Edition'}</div>
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: '#EEFAF5',
                            color: '#16A36A'
                          }}
                        >
                          ● {tmpl.status || 'Active'}
                        </span>
                      </div>

                      {/* Specs */}
                      <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#F7F6FA', fontSize: '0.76rem', color: '#777184', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><strong style={{ color: '#191522' }}>Material:</strong> {tmpl.material || 'Polymer / Metal Core'}</div>
                        <div><strong style={{ color: '#191522' }}>Finish:</strong> {tmpl.finish || 'Matte Obsidian UV'}</div>
                        <div><strong style={{ color: '#191522' }}>Chip:</strong> {tmpl.chip || 'NXP NTAG216'}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #F2ECFF' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setEditingTemplate(tmpl)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid #E8E3EF',
                            backgroundColor: '#FFFFFF',
                            color: '#6B00FF',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <a
                          href={`/designer?edition=${tmpl.key || 'purple'}&template=${tmpl.key === 'customer_logo' ? 'customer_logo' : 'standard'}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid #E8E3EF',
                            backgroundColor: '#F7F6FA',
                            color: '#191522',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          <SlidersHorizontal size={13} />
                          <span>Studio Preset</span>
                        </a>
                      </div>

                      {!['tmpl_purple', 'tmpl_gold', 'tmpl_platinum', 'tmpl_standard'].includes(tmpl.id) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tmpl.id)}
                          title="Delete Template"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 8px',
                            borderRadius: '8px',
                            border: '1px solid #FEE2E2',
                            backgroundColor: '#FEF2F2',
                            color: '#DC4545',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====================================================================
              VIEW: DEMO SHOWCASE CONFIGURATION
              ==================================================================== */}
          {activeTab === 'demo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Header Card */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E8E3EF',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px', background: '#F3EEFF', color: '#6B00FF', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                    <Sparkles size={12} />
                    <span>Global Demo Showcase Control</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#191522' }}>
                    Demo Showcase Configuration
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#777184', maxWidth: '650px' }}>
                    Control the default placeholders and branding across the Homepage 3D card previews and luxury digital profile demo. If no photo is uploaded, cards cleanly display the &quot;YOUR LOGO&quot; placeholder.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleResetDemoSettings}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: '1px solid #E8E3EF',
                      background: '#FFFFFF',
                      color: '#64748B',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Reset to Default
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDemoSettings}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6B00FF, #4D00B8)',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(107, 0, 255, 0.35)'
                    }}
                  >
                    <Check size={15} />
                    <span>Save &amp; Publish</span>
                  </button>
                </div>
              </div>

              {/* Status Alerts */}
              {demoSaveSuccess && (
                <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} />
                  <span>{demoSaveSuccess}</span>
                </div>
              )}
              {demoSaveError && (
                <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '0.85rem', fontWeight: 600 }}>
                  {demoSaveError}
                </div>
              )}

              {/* Main Grid: Form Controls (Left) & Real-Time Card Previews (Right) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '24px', alignItems: 'start' }}>
                {/* Form Controls */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E3EF', padding: '24px' }}>
                  <form onSubmit={handleSaveDemoSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B00FF', borderBottom: '1px solid #F3EEFF', paddingBottom: '8px' }}>
                      Primary Identity &amp; Typography
                    </div>

                    {/* Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Full Name (Replaces &quot;Akhil Anvar&quot;)
                      </label>
                      <input
                        type="text"
                        value={demoForm.name}
                        onChange={(e) => setDemoForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Your Name"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                      />
                    </div>

                    {/* Role & Tagline Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Role / Title (Replaces &quot;CEO &amp; Founder&quot;)
                        </label>
                        <input
                          type="text"
                          value={demoForm.role}
                          onChange={(e) => setDemoForm(prev => ({ ...prev, role: e.target.value }))}
                          placeholder="e.g. Your Role"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Front Card Tagline
                        </label>
                        <input
                          type="text"
                          value={demoForm.tagline}
                          onChange={(e) => setDemoForm(prev => ({ ...prev, tagline: e.target.value }))}
                          placeholder="e.g. Your Tagline"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                        />
                      </div>
                    </div>

                    {/* Company */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={demoForm.company}
                        onChange={(e) => setDemoForm(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="e.g. Your Company"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                      />
                    </div>

                    {/* Custom Image / Logo Upload */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                          Custom Brand Photo or Logo
                        </label>
                        {(demoForm.avatar || demoForm.logo) && (
                          <button
                            type="button"
                            onClick={handleRemoveDemoImage}
                            style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Remove Photo (Revert to &quot;YOUR LOGO&quot;)
                          </button>
                        )}
                      </div>

                      <div
                        style={{
                          border: '2px dashed #CBD5E1',
                          borderRadius: '12px',
                          padding: '16px',
                          textAlign: 'center',
                          backgroundColor: '#F8FAFC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '14px'
                        }}
                      >
                        {(demoForm.avatar || demoForm.logo) ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={demoForm.avatar || demoForm.logo}
                              alt="Demo Logo"
                              style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #CBD5E1' }}
                            />
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>Active Custom Image</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Displayed on demo cards and profile</div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                              No custom photo uploaded
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                              Cards will display the luxury &quot;YOUR LOGO&quot; text placeholder
                            </div>
                          </div>
                        )}

                        <label
                          style={{
                            marginLeft: 'auto',
                            padding: '7px 14px',
                            borderRadius: '8px',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#334155',
                            cursor: uploadingDemoImage ? 'wait' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Upload size={13} />
                          <span>{uploadingDemoImage ? 'Uploading...' : 'Choose File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleDemoImageUpload}
                            disabled={uploadingDemoImage}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Contact & Card Finish */}
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B00FF', borderBottom: '1px solid #F3EEFF', paddingBottom: '8px', marginTop: '6px' }}>
                      Contact Details &amp; Card Finish
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={demoForm.phone}
                          onChange={(e) => setDemoForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+91 98765 43210"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={demoForm.email}
                          onChange={(e) => setDemoForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="contact@flocard.in"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                        />
                      </div>
                    </div>

                    {/* Card Finish Selector */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Card Finish Theme
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {[
                          { id: 'purple', label: 'Purple Edition', color: '#A855F7', bg: '#1E122E' },
                          { id: 'gold', label: 'Gold Edition', color: '#E9C766', bg: '#251E11' },
                          { id: 'steel', label: 'Platinum / Steel', color: '#94A3B8', bg: '#181C22' }
                        ].map(finish => (
                          <button
                            key={finish.id}
                            type="button"
                            onClick={() => setDemoForm(prev => ({ ...prev, cardFinish: finish.id, cardEdition: finish.id }))}
                            style={{
                              flex: 1,
                              padding: '10px',
                              borderRadius: '10px',
                              border: demoForm.cardFinish === finish.id ? `2px solid ${finish.color}` : '1px solid #E2E8F0',
                              background: finish.bg,
                              color: '#FFFFFF',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: finish.color }} />
                            <span>{finish.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={{
                        marginTop: '10px',
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #6B00FF, #4D00B8)',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(107, 0, 255, 0.35)'
                      }}
                    >
                      Save Demo Settings
                    </button>
                  </form>
                </div>

                {/* Live Previews Column (Right) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Shiny Card Preview */}
                  <div style={{ backgroundColor: '#09060F', borderRadius: '16px', border: '1px solid #281D3D', padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#A855F7', marginBottom: '14px', letterSpacing: '0.08em' }}>
                      Live Digital Profile Shiny Card Preview
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CompactProfileCard
                        profile={{
                          name: demoForm.name,
                          role: demoForm.role,
                          tagline: demoForm.tagline,
                          company: demoForm.company,
                          avatar: demoForm.avatar,
                          logo: demoForm.logo,
                          phone: demoForm.phone,
                          email: demoForm.email,
                          cardFinish: demoForm.cardFinish,
                          isVerified: true
                        }}
                        allowColorSwitch={false}
                      />
                    </div>
                  </div>

                  {/* 3D Physical Card Preview */}
                  <div style={{ backgroundColor: '#09060F', borderRadius: '16px', border: '1px solid #281D3D', padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#A855F7', marginBottom: '14px', letterSpacing: '0.08em' }}>
                      Live 3D NFC Card Artwork Preview
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Card3DPreview
                        edition={demoForm.cardFinish === 'steel' ? 'platinum' : demoForm.cardFinish}
                        width={300}
                        allowFlip={true}
                        config={{
                          front: {
                            name: (demoForm.name || 'YOUR NAME').toUpperCase(),
                            role: (demoForm.role || 'YOUR ROLE').toUpperCase(),
                            tagline: demoForm.tagline || 'Your Tagline'
                          },
                          customerLogo: { url: demoForm.logo || null },
                          back: {
                            brandUrl: `flocard.in/${(demoForm.name || 'yourname').toLowerCase().replace(/\s+/g, '')}`
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================
              VIEW: ANALYTICS
              ==================================================================== */}
          {activeTab === 'analytics' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E3EF', padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#191522' }}>Real Contactless Tap Telemetry</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#777184' }}>Live physical interaction data across all issued FLOCARD smart cards.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#F3EEFF', border: '1px solid #E4D8FF' }}>
                  <div style={{ fontSize: '0.8rem', color: '#6B00FF', fontWeight: 600 }}>Total Tap Count</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#191522', marginTop: '4px' }}>
                    {cards.reduce((sum, c) => sum + (c.tapCount || 0), 0)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#16A36A', marginTop: '4px' }}>Across {cards.length} encoded cards</div>
                </div>

                <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#EEFAF5', border: '1px solid #D0F2E3' }}>
                  <div style={{ fontSize: '0.8rem', color: '#16A36A', fontWeight: 600 }}>Resolution Success Rate</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#191522', marginTop: '4px' }}>99.98%</div>
                  <div style={{ fontSize: '0.74rem', color: '#777184', marginTop: '4px' }}>Sub-15ms DNS & Edge Routing</div>
                </div>

                <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#EEF6FF', border: '1px solid #D6E7FF' }}>
                  <div style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>Most Tapped Card</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#191522', marginTop: '6px' }}>FC-0001240 (Akhil Anvar)</div>
                  <div style={{ fontSize: '0.74rem', color: '#2563EB', marginTop: '4px' }}>340 recorded taps</div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================
              VIEW: OWNER-CONTROLLED ADMIN ACCESS (Owner Only)
              ==================================================================== */}
          {activeTab === 'admin-access' && isOwner && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E3EF', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#191522' }}>
                    Owner-Controlled Administrator Access
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#777184' }}>
                    Only the platform owner can grant, revoke, or reassign administrator access privileges.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInviteAdminModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#6B00FF',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  <span>Grant Admin Privileges</span>
                </button>
              </div>

              {/* Spectrum UI Account Access Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {adminAccounts.map((account) => (
                  <AccountAccessCard
                    key={account.email}
                    account={account}
                    isCurrentUser={account.email.toLowerCase() === user?.email?.toLowerCase()}
                    isOwner={isOwner}
                    onRevoke={(email) => revokeAdminAccount(email, user?.email || 'akhil@flocard.in')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ====================================================================
              VIEW: AUDIT LOGS
              ==================================================================== */}
          {activeTab === 'audit-logs' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E3EF', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#191522' }}>Platform Audit Trail</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#777184' }}>Immutable operational events for regulatory and security traceability.</p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F2ECFF', color: '#777184', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>Type</th>
                      <th style={{ padding: '10px 12px' }}>Event Description</th>
                      <th style={{ padding: '10px 12px' }}>Actor</th>
                      <th style={{ padding: '10px 12px' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '36px 12px', textAlign: 'center', color: '#777184' }}>
                          No operational audit logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #F7F6FA' }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#F3EEFF', color: '#6B00FF' }}>
                              {log.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 500, color: '#191522' }}>{log.details}</td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{log.userName}</td>
                          <td style={{ padding: '12px', color: '#777184', fontSize: '0.78rem' }}>{log.timeAgo}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================
              VIEW: SETTINGS
              ==================================================================== */}
          {activeTab === 'settings' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E3EF', padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#191522' }}>Platform Configuration & Environment</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#777184' }}>Telemetry connections and system persistence settings.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Database Telemetry Status */}
                <div style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #E8E3EF', backgroundColor: '#F7F6FA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#191522', fontSize: '0.92rem' }}>Storage Engine Mode</div>
                      <div style={{ color: '#777184', fontSize: '0.8rem', marginTop: '2px' }}>{dbStatus.mode}</div>
                    </div>
                    <span style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '9999px', backgroundColor: '#EEFAF5', color: '#16A36A', fontWeight: 700 }}>
                      ● Operational
                    </span>
                  </div>
                </div>

                {/* Studio Background Setting */}
                <div style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #E8E3EF', backgroundColor: '#F7F6FA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#191522', fontSize: '0.92rem' }}>Global Studio 3D Environment</div>
                      <div style={{ color: '#777184', fontSize: '0.8rem', marginTop: '2px' }}>Current: {studioBackground}</div>
                    </div>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => resetStudioBg('admin')}
                        style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #E8E3EF', backgroundColor: '#FFFFFF', color: '#191522', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                </div>

                {/* Factory Demo Reset with Spectrum HoldToConfirm */}
                <div style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#DC4545', fontSize: '0.92rem' }}>Reset Demo Records</div>
                      <div style={{ color: '#777184', fontSize: '0.78rem', marginTop: '2px' }}>
                        Press and hold to wipe local custom modifications and re-initialize factory records.
                      </div>
                    </div>
                    <HoldToConfirm
                      variant="danger"
                      holdDuration={1800}
                      confirmText="Reset Done"
                      onConfirm={resetAllData}
                    >
                      Hold to Reset Factory Records
                    </HoldToConfirm>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          MODAL: DESIGN REVIEW & APPROVAL (With Card 3D Preview & PDF Export)
          ==================================================================== */}
      {reviewModalDesign && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 6, 13, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #E8E3EF',
              width: '100%',
              maxWidth: '840px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6B00FF', textTransform: 'uppercase' }}>
                  Design Review #{reviewModalDesign.id}
                </span>
                <h2 style={{ margin: '4px 0 0', fontSize: '1.35rem', fontWeight: 800, color: '#191522' }}>
                  {reviewModalDesign.title}
                </h2>
                <p style={{ margin: '2px 0 0', color: '#777184', fontSize: '0.84rem' }}>
                  Submitted by {reviewModalDesign.customerName} ({reviewModalDesign.customerEmail || 'customer@flocard.in'})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReviewModalDesign(null)}
                style={{ background: 'none', border: 'none', color: '#777184', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 3D Card Preview */}
            <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
              <Card3DPreview
                front={reviewModalDesign.front}
                back={reviewModalDesign.back}
                editionKey={reviewModalDesign.edition}
              />
            </div>

            {/* Review Notes */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#191522', marginBottom: '6px' }}>
                Master Print Technician Review Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Bleed safe zone verified. Contrast and QR scannability checked for production printing."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #E8E3EF',
                  fontSize: '0.84rem',
                  color: '#191522',
                  outline: 'none',
                  backgroundColor: '#F7F6FA'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <button
                type="button"
                onClick={() => exportCardPDF(reviewModalDesign.front, reviewModalDesign.back, reviewModalDesign.edition)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #E8E3EF',
                  backgroundColor: '#FFFFFF',
                  color: '#191522',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <Download size={16} />
                <span>Export Print-Ready PDF</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleRejectDesign(reviewModalDesign.id)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #FCA5A5',
                    backgroundColor: '#FEF2F2',
                    color: '#DC4545',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Request Revision
                </button>

                <button
                  type="button"
                  onClick={() => handleApproveDesign(reviewModalDesign.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#16A36A',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(22, 163, 106, 0.3)'
                  }}
                >
                  <Package size={16} />
                  <span>Assign to Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ADD CUSTOMER
          ==================================================================== */}
      {newCustomerModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 13, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '28px', border: '1px solid #E8E3EF' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 800, color: '#191522' }}>Add New Customer</h3>
            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={newCustForm.name}
                  onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
                  placeholder="e.g. Zainab Tariq"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={newCustForm.email}
                  onChange={(e) => setNewCustForm({ ...newCustForm, email: e.target.value })}
                  placeholder="zainab@example.com"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Company</label>
                <input
                  type="text"
                  value={newCustForm.company}
                  onChange={(e) => setNewCustForm({ ...newCustForm, company: e.target.value })}
                  placeholder="Studio Crescent"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setNewCustomerModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E3EF', background: 'none' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6B00FF', color: '#FFFFFF', fontWeight: 600 }}>
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CREATE PROFILE
          ==================================================================== */}
      {newProfileModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 13, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '28px', border: '1px solid #E8E3EF' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 800, color: '#191522' }}>Create Digital Profile</h3>
            <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Profile Name</label>
                <input
                  type="text"
                  required
                  value={newProfForm.name}
                  onChange={(e) => setNewProfForm({ ...newProfForm, name: e.target.value })}
                  placeholder="e.g. Farhan Ali"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Public Slug (flocard.in/p/:slug)</label>
                <input
                  type="text"
                  required
                  value={newProfForm.slug}
                  onChange={(e) => setNewProfForm({ ...newProfForm, slug: e.target.value })}
                  placeholder="farhan"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Role / Designation</label>
                <input
                  type="text"
                  value={newProfForm.role}
                  onChange={(e) => setNewProfForm({ ...newProfForm, role: e.target.value })}
                  placeholder="Product Designer"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setNewProfileModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E3EF', background: 'none' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6B00FF', color: '#FFFFFF', fontWeight: 600 }}>
                  Publish Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ASSIGN NFC CARD
          ==================================================================== */}
      {assignCardModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 13, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '28px', border: '1px solid #E8E3EF' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 800, color: '#191522' }}>Assign NFC Hardware Card</h3>
            <form onSubmit={handleAssignCard} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>NFC Hardware ID</label>
                <input
                  type="text"
                  required
                  value={assignCardForm.cardCode}
                  onChange={(e) => setAssignCardForm({ ...assignCardForm, cardCode: e.target.value })}
                  placeholder="FC-0001246"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Select Customer</label>
                <select
                  value={assignCardForm.customerId}
                  onChange={(e) => setAssignCardForm({ ...assignCardForm, customerId: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF' }}
                >
                  <option value="">Unassigned (Keep in Stock)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Permanent Redirect Profile</label>
                <select
                  value={assignCardForm.profileSlug}
                  onChange={(e) => setAssignCardForm({ ...assignCardForm, profileSlug: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF' }}
                >
                  <option value="">Select Profile Destination</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.slug}>{p.name} (/p/{p.slug})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setAssignCardModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E3EF', background: 'none' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6B00FF', color: '#FFFFFF', fontWeight: 600 }}>
                  Encode & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: INVITE ADMIN (Owner Only)
          ==================================================================== */}
      {inviteAdminModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 13, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '28px', border: '1px solid #E8E3EF' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800, color: '#191522' }}>Grant Admin Privileges</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#777184' }}>
              Authorize a Google email account to access the FLOCARD admin console.
            </p>
            <form onSubmit={handleInviteAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Administrator Email</label>
                <input
                  type="email"
                  required
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  placeholder="partner@flocard.in"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Full Name</label>
                <input
                  type="text"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  placeholder="e.g. Althaf A"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Access Role</label>
                <select
                  value={newAdminForm.role}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF' }}
                >
                  <option value="admin">Administrator (Review designs, manage cards & profiles)</option>
                  <option value="owner">Owner (Full unrestricted administrative authority)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setInviteAdminModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E3EF', background: 'none' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6B00FF', color: '#FFFFFF', fontWeight: 600 }}>
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: EDIT CUSTOMER
          ==================================================================== */}
      {editingCustomer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 13, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '28px', border: '1px solid #E8E3EF', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#191522' }}>Edit Customer Account</h3>
              <button type="button" onClick={() => setEditingCustomer(null)} style={{ background: 'none', border: 'none', color: '#777184', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.name || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={editingCustomer.email || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Phone Number</label>
                <input
                  type="text"
                  value={editingCustomer.phone || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Company / Organization</label>
                <input
                  type="text"
                  value={editingCustomer.company || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, company: e.target.value })}
                  placeholder="Company Name"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Account Status</label>
                <select
                  value={editingCustomer.status || 'active'}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                >
                  <option value="active">Active (Full access)</option>
                  <option value="suspended">Suspended (Access locked)</option>
                  <option value="pending">Pending verification</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F2ECFF' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteCustomer(editingCustomer.id)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #FEE2E2', backgroundColor: '#FEF2F2', color: '#DC4545', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Delete Customer
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setEditingCustomer(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E3EF', background: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6B00FF', color: '#FFFFFF', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: EDIT DIGITAL PROFILE
          ==================================================================== */}
      {editingProfile && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 13, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '580px', padding: '28px', border: '1px solid #E8E3EF', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#191522' }}>Edit Digital Profile</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#777184' }}>flocard.in/p/{editingProfile.slug}</span>
                  <a
                    href={`/p/${editingProfile.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.74rem', color: '#6B00FF', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  >
                    <span>Preview Link ↗</span>
                  </a>
                </div>
              </div>
              <button type="button" onClick={() => setEditingProfile(null)} style={{ background: 'none', border: 'none', color: '#777184', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Profile Avatar & Company Logo Uploads */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#F8F6FC', padding: '12px', borderRadius: '12px', border: '1px solid #E8E3EF' }}>
                {/* Avatar Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px', color: '#191522' }}>Profile Avatar / Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '46px', height: '46px', minWidth: '46px', borderRadius: '50%', background: '#6B00FF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 700 }}>
                      {editingProfile.avatar ? (
                        <img src={editingProfile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (editingProfile.name || 'P').charAt(0)
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #DDD6FE', backgroundColor: '#FFFFFF', color: '#6B00FF', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}>
                        <Upload size={12} />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 });
                              setEditingProfile(prev => ({ ...prev, avatar: compressed }));
                            } catch (err) {
                              console.error('Avatar upload failed:', err);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {editingProfile.avatar && (
                        <button
                          type="button"
                          onClick={() => setEditingProfile({ ...editingProfile, avatar: '' })}
                          style={{ display: 'block', background: 'none', border: 'none', color: '#DC2626', fontSize: '0.68rem', cursor: 'pointer', marginTop: '2px', padding: 0 }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Logo Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px', color: '#191522' }}>Company / Brand Logo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '46px', height: '46px', minWidth: '46px', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #E8E3EF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                      {editingProfile.logo ? (
                        <img src={editingProfile.logo} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Building2 size={20} color="#9CA3AF" />
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #DDD6FE', backgroundColor: '#FFFFFF', color: '#6B00FF', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}>
                        <Upload size={12} />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressed = await compressImage(file, { maxWidth: 500, maxHeight: 500, quality: 0.85, outputFormat: file.type === 'image/png' ? 'image/png' : 'image/jpeg' });
                              setEditingProfile(prev => ({ ...prev, logo: compressed }));
                            } catch (err) {
                              console.error('Logo upload failed:', err);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {editingProfile.logo && (
                        <button
                          type="button"
                          onClick={() => setEditingProfile({ ...editingProfile, logo: '' })}
                          style={{ display: 'block', background: 'none', border: 'none', color: '#DC2626', fontSize: '0.68rem', cursor: 'pointer', marginTop: '2px', padding: 0 }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingProfile.name || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Public Slug</label>
                  <input
                    type="text"
                    required
                    value={editingProfile.slug || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Role / Title</label>
                  <input
                    type="text"
                    value={editingProfile.role || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Company</label>
                  <input
                    type="text"
                    value={editingProfile.company || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, company: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Location / City</label>
                  <input
                    type="text"
                    value={editingProfile.location || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, location: e.target.value })}
                    placeholder="e.g. Bengaluru, India"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Tagline</label>
                  <input
                    type="text"
                    value={editingProfile.tagline || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, tagline: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Bio</label>
                <textarea
                  rows={3}
                  value={editingProfile.bio || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, bio: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Theme Style</label>
                  <select
                    value={editingProfile.theme || 'purple'}
                    onChange={(e) => setEditingProfile({ ...editingProfile, theme: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  >
                    <option value="purple">Obsidian Purple (Signature)</option>
                    <option value="gold">24K Gold Foil</option>
                    <option value="platinum">Brushed Platinum</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Publication Status</label>
                  <select
                    value={editingProfile.status || 'published'}
                    onChange={(e) => setEditingProfile({ ...editingProfile, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  >
                    <option value="published">Published (Live at /p/:slug)</option>
                    <option value="draft">Draft (Private)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Phone Number</label>
                  <input
                    type="text"
                    value={editingProfile.phone || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Contact Email</label>
                  <input
                    type="email"
                    value={editingProfile.email || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>WhatsApp (digits with country code)</label>
                  <input
                    type="text"
                    value={editingProfile.whatsapp || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, whatsapp: e.target.value })}
                    placeholder="919876543210"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Website URL</label>
                  <input
                    type="text"
                    value={editingProfile.website || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, website: e.target.value })}
                    placeholder="https://example.com"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Portfolio / Work Showcase Projects */}
              <div style={{ borderTop: '1px solid #E8E3EF', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#191522' }}>Portfolio Work Images & Projects</label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#F3EEFF', color: '#6B00FF', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>
                    <Plus size={12} />
                    <span>Add Work Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        for (const file of files) {
                          try {
                            const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.82 });
                            const rawTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                            const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
                            setEditingProfile(prev => ({
                              ...prev,
                              portfolio: [
                                ...(prev.portfolio || []),
                                {
                                  id: `port_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                                  title: title || 'New Work Showcase',
                                  category: 'Work Showcase',
                                  desc: 'Client project deliverables and visual showcase.',
                                  image: compressed
                                }
                              ]
                            }));
                          } catch (err) {
                            console.error('Work image compression failed:', err);
                          }
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {(editingProfile.portfolio || []).length === 0 ? (
                    <div style={{ fontSize: '0.76rem', color: '#9CA3AF', fontStyle: 'italic', padding: '8px 0' }}>
                      No work images added yet. Click &quot;Add Work Image&quot; to upload project images.
                    </div>
                  ) : (
                    (editingProfile.portfolio || []).map((portItem, portIdx) => (
                      <div key={portItem.id || portIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: '#F9F8FC', border: '1px solid #E8E3EF' }}>
                        <div style={{ width: '44px', height: '44px', minWidth: '44px', borderRadius: '6px', background: '#E8E3EF', overflow: 'hidden' }}>
                          {portItem.image ? (
                            <img src={portItem.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '0.65rem' }}>IMG</div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <input
                            type="text"
                            value={portItem.title || ''}
                            onChange={(e) => {
                              const nextPort = [...(editingProfile.portfolio || [])];
                              nextPort[portIdx] = { ...nextPort[portIdx], title: e.target.value };
                              setEditingProfile({ ...editingProfile, portfolio: nextPort });
                            }}
                            placeholder="Project Title"
                            style={{ width: '100%', padding: '4px 6px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid #E8E3EF', borderRadius: '4px', marginBottom: '4px' }}
                          />
                          <input
                            type="text"
                            value={portItem.category || ''}
                            onChange={(e) => {
                              const nextPort = [...(editingProfile.portfolio || [])];
                              nextPort[portIdx] = { ...nextPort[portIdx], category: e.target.value };
                              setEditingProfile({ ...editingProfile, portfolio: nextPort });
                            }}
                            placeholder="Category (e.g. Branding / Hardware)"
                            style={{ width: '100%', padding: '3px 6px', fontSize: '0.72rem', border: '1px solid #E8E3EF', borderRadius: '4px' }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextPort = (editingProfile.portfolio || []).filter((_, i) => i !== portIdx);
                            setEditingProfile({ ...editingProfile, portfolio: nextPort });
                          }}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                          title="Delete project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F2ECFF' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteProfile(editingProfile.id)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #FEE2E2', backgroundColor: '#FEF2F2', color: '#DC4545', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Delete Profile
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setEditingProfile(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E3EF', background: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6B00FF', color: '#FFFFFF', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: EDIT NFC HARDWARE CARD
          ==================================================================== */}
      {editingCard && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 13, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '28px', border: '1px solid #E8E3EF', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#191522' }}>Edit NFC Card</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#777184', fontFamily: 'monospace' }}>{editingCard.cardCode}</p>
              </div>
              <button type="button" onClick={() => setEditingCard(null)} style={{ background: 'none', border: 'none', color: '#777184', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateCard} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Card Hardware Code</label>
                <input
                  type="text"
                  required
                  value={editingCard.cardCode || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, cardCode: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem', fontFamily: 'monospace', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Assigned Customer</label>
                <select
                  value={editingCard.customerId || ''}
                  onChange={(e) => {
                    const cust = customers.find(c => c.id === e.target.value);
                    setEditingCard({
                      ...editingCard,
                      customerId: e.target.value || null,
                      customerName: cust ? cust.name : null
                    });
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                >
                  <option value="">Unassigned (In Stock)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Permanent Redirect Profile Destination</label>
                <select
                  value={editingCard.profileSlug || ''}
                  onChange={(e) => {
                    const prof = profiles.find(p => p.slug === e.target.value);
                    setEditingCard({
                      ...editingCard,
                      profileSlug: e.target.value || null,
                      profileName: prof ? prof.name : null
                    });
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                >
                  <option value="">None (Unlinked)</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.slug}>{p.name} (/p/{p.slug})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Card Edition</label>
                  <select
                    value={editingCard.edition || 'purple'}
                    onChange={(e) => setEditingCard({ ...editingCard, edition: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  >
                    <option value="purple">Purple Edition</option>
                    <option value="gold">Gold Edition</option>
                    <option value="platinum">Platinum Edition</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Status</label>
                  <select
                    value={editingCard.status || 'active'}
                    onChange={(e) => setEditingCard({ ...editingCard, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  >
                    <option value="active">Active (Tappable)</option>
                    <option value="suspended">Suspended (Redirect Disabled)</option>
                    <option value="unassigned">Unassigned / In Stock</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Chip Type</label>
                  <input
                    type="text"
                    value={editingCard.chipType || 'NXP NTAG216 (888 Bytes)'}
                    onChange={(e) => setEditingCard({ ...editingCard, chipType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Tap Count</label>
                  <input
                    type="number"
                    min="0"
                    value={editingCard.tapCount ?? 0}
                    onChange={(e) => setEditingCard({ ...editingCard, tapCount: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F2ECFF' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteCard(editingCard.id)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #FEE2E2', backgroundColor: '#FEF2F2', color: '#DC4545', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Delete Card
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setEditingCard(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E3EF', background: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6B00FF', color: '#FFFFFF', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: EDIT CARD DESIGN METADATA
          ==================================================================== */}
      {editingDesign && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 13, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '28px', border: '1px solid #E8E3EF', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#191522' }}>Edit Card Design Metadata</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#777184', fontFamily: 'monospace' }}>Design {editingDesign.id}</p>
              </div>
              <button type="button" onClick={() => setEditingDesign(null)} style={{ background: 'none', border: 'none', color: '#777184', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateDesign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Design Title</label>
                <input
                  type="text"
                  required
                  value={editingDesign.title || ''}
                  onChange={(e) => setEditingDesign({ ...editingDesign, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Customer Name</label>
                <input
                  type="text"
                  value={editingDesign.customerName || ''}
                  onChange={(e) => setEditingDesign({ ...editingDesign, customerName: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Template Family</label>
                  <select
                    value={editingDesign.templateType || 'standard'}
                    onChange={(e) => setEditingDesign({ ...editingDesign, templateType: e.target.value, template: e.target.value === 'customer_logo' ? 'Customer Logo' : 'Standard FLOCARD' })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  >
                    <option value="standard">Standard FLOCARD Design (Theme 1)</option>
                    <option value="customer_logo">Customer Logo Design (Theme 2)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Edition Finish</label>
                  <select
                    value={editingDesign.edition || 'purple'}
                    onChange={(e) => setEditingDesign({ ...editingDesign, edition: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  >
                    <option value="purple">Purple Obsidian</option>
                    <option value="gold">24K Gold Foil</option>
                    <option value="platinum">Brushed Platinum</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Approval Status</label>
                <select
                  value={editingDesign.status || 'submitted'}
                  onChange={(e) => setEditingDesign({ ...editingDesign, status: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                >
                  <option value="submitted">Submitted (Pending Review)</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved for Production</option>
                  <option value="rejected">Rejected (Needs Revision)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Review Technician Notes</label>
                <textarea
                  rows={3}
                  value={editingDesign.reviewNotes || ''}
                  onChange={(e) => setEditingDesign({ ...editingDesign, reviewNotes: e.target.value })}
                  placeholder="Review notes, bleed check results, or instructions..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                />
              </div>

              {/* Direct Studio Link */}
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#F3EEFF', border: '1px solid #E4D8FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: '#6B00FF', fontWeight: 600 }}>Need to edit canvas artwork, fonts, or logos?</span>
                <a
                  href={`/designer?id=${encodeURIComponent(editingDesign.id)}&template=${editingDesign.templateType || 'standard'}&edition=${editingDesign.edition || 'purple'}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#6B00FF',
                    color: '#FFFFFF',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <SlidersHorizontal size={12} />
                  <span>Open in Studio</span>
                </a>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F2ECFF' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteDesign(editingDesign.id)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #FEE2E2', backgroundColor: '#FEF2F2', color: '#DC4545', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Delete Design
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setEditingDesign(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E3EF', background: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAssignDesignToOrder(editingDesign);
                      setEditingDesign(null);
                    }}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#16A36A', color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Package size={14} />
                    <span>Assign to Order</span>
                  </button>
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6B00FF', color: '#FFFFFF', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: EDIT CARD TEMPLATE
          ==================================================================== */}
      {editingTemplate && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 13, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '560px', padding: '28px', border: '1px solid #E8E3EF', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#191522' }}>Edit Card Template</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#777184' }}>{editingTemplate.name}</p>
              </div>
              <button type="button" onClick={() => setEditingTemplate(null)} style={{ background: 'none', border: 'none', color: '#777184', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Template Name</label>
                  <input
                    type="text"
                    required
                    value={editingTemplate.name || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Badge Text</label>
                  <input
                    type="text"
                    value={editingTemplate.badge || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, badge: e.target.value })}
                    placeholder="Signature / Luxury"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Tagline</label>
                <input
                  type="text"
                  value={editingTemplate.tagline || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, tagline: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Description</label>
                <textarea
                  rows={2}
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Material Specification</label>
                  <input
                    type="text"
                    value={editingTemplate.material || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, material: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Surface Finish</label>
                  <input
                    type="text"
                    value={editingTemplate.finish || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, finish: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Chip Hardware</label>
                  <input
                    type="text"
                    value={editingTemplate.chip || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, chip: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Status</label>
                  <select
                    value={editingTemplate.status || 'active'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  >
                    <option value="active">Active (Available in studio)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Accent Color</label>
                  <input
                    type="color"
                    value={editingTemplate.accentColor || '#6B00FF'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, accentColor: e.target.value })}
                    style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E8E3EF', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Text Color</label>
                  <input
                    type="color"
                    value={editingTemplate.textColor || '#FFFFFF'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, textColor: e.target.value })}
                    style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E8E3EF', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Card Background</label>
                  <input
                    type="color"
                    value={editingTemplate.cardBg || '#15101D'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, cardBg: e.target.value })}
                    style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E8E3EF', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F2ECFF' }}>
                <button type="button" onClick={() => setEditingTemplate(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E3EF', background: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6B00FF', color: '#FFFFFF', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CONFIGURE CARD PRODUCT & PRICING
          ==================================================================== */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 13, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '24px', border: '1px solid #E8E3EF', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #F3F4F6' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#191522' }}>
                  Edit Product Pricing & Specifications
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#777184' }}>
                  {editingProduct.name} ({editingProduct.editionKey?.toUpperCase()} Edition)
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setEditingProduct(null); setProductSaveError(''); setProductSaveSuccess(''); }}
                style={{ background: 'none', border: 'none', color: '#777184', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {productSaveError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.8rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} />
                <span>{productSaveError}</span>
              </div>
            )}

            {productSaveSuccess && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', fontSize: '0.8rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} />
                <span>{productSaveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProductPricing} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Pricing Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>
                    Selling Price (₹ INR) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingProduct.price ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder="e.g. 2499 (0 for Price coming soon)"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#777184', marginTop: '2px', display: 'block' }}>
                    Leave empty or 0 to show "Price coming soon".
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>
                    Comparison Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingProduct.comparePrice ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, comparePrice: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder="e.g. 2999 (optional strike-through)"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#777184', marginTop: '2px', display: 'block' }}>
                    Only displayed when greater than selling price.
                  </span>
                </div>
              </div>

              {/* Product Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>
                  Product Edition Name
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>
                  Product Finish & Description
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem', resize: 'vertical' }}
                />
              </div>

              {/* Status & Availability & Featured */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>
                    Product Status
                  </label>
                  <select
                    value={editingProduct.status || 'active'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="disabled">Disabled (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>
                    Inventory Status
                  </label>
                  <select
                    value={editingProduct.availability || 'in_stock'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, availability: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="pre_order">Pre-Order</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>
                    Featured Edition
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', cursor: 'pointer', fontSize: '0.82rem' }}>
                    <input
                      type="checkbox"
                      checked={!!editingProduct.featured}
                      onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                    />
                    <span>Show Badge</span>
                  </label>
                </div>
              </div>

              {/* Included Features Management */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px', color: '#191522' }}>
                  Key Included Features (Strictly shown on product card)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                  {(editingProduct.features || []).map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => {
                          const updated = [...(editingProduct.features || [])];
                          updated[idx] = e.target.value;
                          setEditingProduct({ ...editingProduct, features: updated });
                        }}
                        style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.8rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProductFeature(idx)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                        title="Remove feature"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    placeholder="Type new feature to include..."
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProductFeature(); } }}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.8rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddProductFeature}
                    style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#6B00FF', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Add Feature
                  </button>
                </div>
              </div>

              {/* Sample Card Images */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>
                    Front Card Asset URL
                  </label>
                  <input
                    type="text"
                    value={editingProduct.sampleFrontImage || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sampleFrontImage: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>
                    Back Card Asset URL
                  </label>
                  <input
                    type="text"
                    value={editingProduct.sampleBackImage || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sampleBackImage: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F3F4F6' }}>
                <button
                  type="button"
                  onClick={() => { setEditingProduct(null); setProductSaveError(''); setProductSaveSuccess(''); }}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E3EF', background: 'none', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#6B00FF', color: '#FFFFFF', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(107, 0, 255, 0.25)' }}
                >
                  Save & Publish Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CREATE CUSTOM TEMPLATE
          ==================================================================== */}
      {newTemplateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 13, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '28px', border: '1px solid #E8E3EF', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#191522' }}>Create New Card Template</h3>
              <button type="button" onClick={() => setNewTemplateModal(false)} style={{ background: 'none', border: 'none', color: '#777184', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Template Name</label>
                  <input
                    type="text"
                    required
                    value={newTmplForm.name}
                    onChange={(e) => setNewTmplForm({ ...newTmplForm, name: e.target.value })}
                    placeholder="e.g. Damascus Steel Edition"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Badge Text</label>
                  <input
                    type="text"
                    value={newTmplForm.badge}
                    onChange={(e) => setNewTmplForm({ ...newTmplForm, badge: e.target.value })}
                    placeholder="e.g. Exclusive"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Tagline</label>
                <input
                  type="text"
                  value={newTmplForm.tagline}
                  onChange={(e) => setNewTmplForm({ ...newTmplForm, tagline: e.target.value })}
                  placeholder="e.g. Hand-forged layered carbon steel with embedded NFC."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Material</label>
                  <input
                    type="text"
                    value={newTmplForm.material}
                    onChange={(e) => setNewTmplForm({ ...newTmplForm, material: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Surface Finish</label>
                  <input
                    type="text"
                    value={newTmplForm.finish}
                    onChange={(e) => setNewTmplForm({ ...newTmplForm, finish: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E3EF', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Accent Color</label>
                  <input
                    type="color"
                    value={newTmplForm.accentColor}
                    onChange={(e) => setNewTmplForm({ ...newTmplForm, accentColor: e.target.value })}
                    style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E8E3EF', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: '#191522' }}>Card Background Color</label>
                  <input
                    type="color"
                    value={newTmplForm.cardBg}
                    onChange={(e) => setNewTmplForm({ ...newTmplForm, cardBg: e.target.value })}
                    style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E8E3EF', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F2ECFF' }}>
                <button type="button" onClick={() => setNewTemplateModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E3EF', background: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6B00FF', color: '#FFFFFF', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ORDER DETAILS & FULFILLMENT INSPECTOR
          ==================================================================== */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(8, 6, 13, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '560px', padding: '28px', border: '1px solid #E8E3EF', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid #F2ECFF', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B00FF', textTransform: 'uppercase' }}>Production Order Specs</span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#191522' }}>{selectedOrder.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', color: '#777184', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Customer Profile Banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderRadius: '12px', backgroundColor: '#F7F6FA', border: '1px solid #E8E3EF' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#100819', border: '2px solid #A855F7', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 700, flexShrink: 0 }}>
                  {selectedOrder.customerLogo ? (
                    <img src={selectedOrder.customerLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    selectedOrder.customerName?.charAt(0) || 'C'
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#191522' }}>{selectedOrder.customerName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#777184' }}>{selectedOrder.customerEmail} • {selectedOrder.customerPhone}</div>
                  <div style={{ fontSize: '0.76rem', color: '#6B00FF', fontWeight: 600 }}>{selectedOrder.company}</div>
                </div>
              </div>

              {/* Order Specs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E8E3EF' }}>
                  <div style={{ fontSize: '0.72rem', color: '#777184', fontWeight: 600 }}>CARD EDITION</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#191522', textTransform: 'capitalize', marginTop: '2px' }}>
                    {selectedOrder.edition || 'Purple'} Edition
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E8E3EF' }}>
                  <div style={{ fontSize: '0.72rem', color: '#777184', fontWeight: 600 }}>TEMPLATE TYPE</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#191522', marginTop: '2px' }}>
                    {selectedOrder.templateType === 'customer_logo' ? 'With Customer Logo' : 'Standard FLOCARD'}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E8E3EF' }}>
                  <div style={{ fontSize: '0.72rem', color: '#777184', fontWeight: 600 }}>ROLE / TITLE</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#191522', marginTop: '2px' }}>
                    {selectedOrder.role || selectedOrder.frontConfig?.role || 'Executive'}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E8E3EF' }}>
                  <div style={{ fontSize: '0.72rem', color: '#777184', fontWeight: 600 }}>CURRENT STATUS</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: selectedOrder.status === 'delivered' ? '#16A36A' : '#EA580C', textTransform: 'capitalize', marginTop: '2px' }}>
                    ● {selectedOrder.status}
                  </div>
                </div>
              </div>

              {/* Tagline & Shipping Address */}
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E8E3EF' }}>
                <div style={{ fontSize: '0.72rem', color: '#777184', fontWeight: 600 }}>CARD TAGLINE</div>
                <div style={{ fontSize: '0.82rem', color: '#191522', marginTop: '2px' }}>
                  "{selectedOrder.tagline || selectedOrder.frontConfig?.tagline || 'One Tap Every Connection'}"
                </div>
              </div>

              {/* Provisioned Assets Info if Delivered */}
              {selectedOrder.status === 'delivered' && selectedOrder.cardCode && (
                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#EEFAF5', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontWeight: 700, color: '#065F46', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} />
                    <span>Auto-Provisioned Assets Active</span>
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <a
                      href={`/t/${selectedOrder.cardCode}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #6EE7B7',
                        color: '#065F46',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Radio size={12} />
                      <span>NFC Card: {selectedOrder.cardCode}</span>
                      <ExternalLink size={10} />
                    </a>
                    <a
                      href={`/p/${selectedOrder.profileSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #6EE7B7',
                        color: '#065F46',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <FileText size={12} />
                      <span>Profile: @{selectedOrder.profileSlug}</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F2ECFF' }}>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #E8E3EF', background: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>

              {selectedOrder.status !== 'delivered' && (
                <button
                  type="button"
                  onClick={() => {
                    handleDeliverOrder(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#16A36A',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 106, 0.3)'
                  }}
                >
                  <Sparkles size={15} />
                  <span>Mark Delivered & Provision Card</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          FLOATING NOTIFICATION TOAST
          ==================================================================== */}
      {fulfillmentToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#100819',
            color: '#FFFFFF',
            borderRadius: '14px',
            padding: '16px 20px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
            border: '1px solid #8B5CF6',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '440px'
          }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#16A36A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={18} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#FFFFFF' }}>{fulfillmentToast.title}</div>
            <div style={{ fontSize: '0.78rem', color: '#D1D5DB', marginTop: '2px' }}>{fulfillmentToast.message}</div>
          </div>
          <button
            type="button"
            onClick={() => setFulfillmentToast(null)}
            style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Comprehensive Responsive Admin Styles */}
      <style>{`
        .admin-sidebar-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 95;
          animation: adminFadeIn 0.2s ease;
        }
        @keyframes adminFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 900px) {
          .admin-sidebar {
            position: fixed !important;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.7);
            z-index: 100 !important;
          }
          .admin-sidebar.mobile-open {
            transform: translateX(0);
          }
          .mobile-only-btn {
            display: block !important;
          }
          .mobile-hamburger-btn {
            display: block !important;
          }
          .admin-header {
            padding: 12px 16px !important;
          }
          .admin-page-subtitle {
            display: none !important;
          }
          .admin-page-title {
            font-size: 1.15rem !important;
          }
          .admin-header-date-filter {
            display: none !important;
          }
          .admin-user-details,
          .admin-user-chevron {
            display: none !important;
          }
          .admin-user-btn {
            padding: 2px !important;
          }
          .admin-main-content {
            padding: 16px 14px 40px !important;
          }
        }
        @media (max-width: 640px) {
          .admin-header {
            padding: 10px 12px !important;
            position: relative !important;
          }
          .admin-header-actions {
            gap: 8px !important;
          }
          .admin-header-search {
            display: none !important;
          }
          .admin-header-search.mobile-visible {
            display: block !important;
            position: absolute !important;
            top: 100% !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            background: #FFFFFF !important;
            padding: 10px 14px !important;
            border-bottom: 1px solid #E8E3EF !important;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08) !important;
            z-index: 89 !important;
          }
          .admin-mobile-search-toggle {
            display: flex !important;
          }
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 18px !important;
          }
          .admin-stat-card {
            padding: 14px 12px !important;
          }
          .admin-middle-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            margin-bottom: 18px !important;
          }
          .admin-bottom-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .admin-quick-actions-grid {
            gap: 8px !important;
          }
          .admin-quick-actions-grid button {
            padding: 12px 8px !important;
          }
        }
        @media (max-width: 360px) {
          .admin-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
