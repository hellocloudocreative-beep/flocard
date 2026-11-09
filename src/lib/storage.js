/* ==========================================================================
   FLOCARD PERSISTENT DATA LAYER & SEED ENGINE
   Automatically persists state to localStorage and synchronizes with Supabase.
   ========================================================================== */

function safeDispatchEvent(name, detail) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } catch {
      // Ignore in headless / test environment
    }
  }
}

const STORAGE_KEY_PREFIX = 'flocard_data_v3_';

/**
 * Environment detection:
 * Identifies whether code is executing in a local development/testing sandbox (localhost, 127.0.0.1, dev preview)
 * vs the authoritative live production platform on flocard.in.
 * 
 * In Localhost Sandbox:
 * - Reads/pulls existing live customers, profiles, orders, and cards from Supabase so local testing has full real context.
 * - Any write/creation/update (creating test cards, editing orders, changing status) is saved ONLY in browser localStorage.
 * - Zero writes are transmitted to production Supabase cloud, keeping flocard.in 100% clean and isolated.
 */
export const isLocalEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const h = (window.location.hostname || '').toLowerCase();
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '0.0.0.0' ||
    h.endsWith('.local') ||
    h.startsWith('192.168.') ||
    h.startsWith('10.') ||
    h.includes('webcontainer')
  );
};

export const isProductionEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const h = (window.location.hostname || '').toLowerCase();
  return (h === 'flocard.in' || h === 'www.flocard.in' || (h.endsWith('.flocard.in') && !isLocalEnvironment()));
};

import { calculateOrderPricing, getInvoiceConfig, saveInvoiceConfig } from './orderPricing.js';


// Automatically purge legacy demo caches from localStorage so previous demo records never reload
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const legacyPrefixes = ['flocard_data_v1_', 'flocard_data_v2_'];
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && legacyPrefixes.some(p => k.startsWith(p))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Clear demo orders from current storage
    const currentOrdersRaw = localStorage.getItem('flocard_data_v3_orders');
    if (currentOrdersRaw) {
      try {
        const parsed = JSON.parse(currentOrdersRaw);
        const filtered = Array.isArray(parsed) ? parsed.filter(o => 
          !String(o.id || '').startsWith('FLC-ORD-908') &&
          !String(o.id || '').startsWith('FLC-ORD-907') &&
          !String(o.id || '').startsWith('FLC-ORD-905') &&
          !String(o.id || '').startsWith('FLC-ORD-903') &&
          !String(o.id || '').startsWith('FLC-ORD-89') &&
          !String(o.id || '').startsWith('FLC-ORD-88') &&
          !String(o.orderReference || '').startsWith('FLC-ORD-908') &&
          !String(o.orderReference || '').startsWith('FLC-ORD-907') &&
          !String(o.orderReference || '').startsWith('FLC-ORD-905') &&
          !String(o.orderReference || '').startsWith('FLC-ORD-903') &&
          !String(o.orderReference || '').startsWith('FLC-ORD-89') &&
          !String(o.orderReference || '').startsWith('FLC-ORD-88') &&
          o.customerEmail !== 'alex.morgan@flocard.in' &&
          o.customerEmail !== 'priya@innovatetech.in' &&
          o.customerEmail !== 'marcus@vanguardcapital.com' &&
          o.customerEmail !== 'arjun.varma@varmaholdings.com'
        ) : [];
        if (filtered.length !== parsed.length) {
          localStorage.setItem('flocard_data_v3_orders', JSON.stringify(filtered));
        }
      } catch (_) {}
    }

    // Clear demo invoices
    const currentInvoicesRaw = localStorage.getItem('flocard_data_v3_invoices');
    if (currentInvoicesRaw) {
      try {
        const parsedInv = JSON.parse(currentInvoicesRaw);
        const filteredInv = Array.isArray(parsedInv) ? parsedInv.filter(inv =>
          !String(inv.invoiceNumber || '').startsWith('INV-2026-908') &&
          !String(inv.invoiceNumber || '').startsWith('INV-2026-88') &&
          !String(inv.orderReference || '').startsWith('FLC-ORD-908') &&
          !String(inv.orderReference || '').startsWith('FLC-ORD-88')
        ) : [];
        if (filteredInv.length !== parsedInv.length) {
          localStorage.setItem('flocard_data_v3_invoices', JSON.stringify(filteredInv));
        }
      } catch (_) {}
    }

    // Clear demo cards
    const currentCardsRaw = localStorage.getItem('flocard_data_v3_cards');
    if (currentCardsRaw) {
      try {
        const parsedCards = JSON.parse(currentCardsRaw);
        const filteredCards = Array.isArray(parsedCards) ? parsedCards.filter(c =>
          c.id !== 'card_alex_001' && c.id !== 'card_white_002' && c.id !== 'card_pending_003'
        ) : [];
        if (filteredCards.length !== parsedCards.length) {
          localStorage.setItem('flocard_data_v3_cards', JSON.stringify(filteredCards));
        }
      } catch (_) {}
    }
  }
} catch (e) {
  // Ignore in SSR / private browsing
}

export const SIMPLE_REQUEST_STAGES = [
  { key: 'new_order', label: 'New Request', step: 1, color: '#3B82F6', badgeBg: 'rgba(59, 130, 246, 0.12)', badgeText: '#60A5FA', description: 'Customer request received and awaiting admin review.' },
  { key: 'reviewing', label: 'Reviewing', step: 2, color: '#F59E0B', badgeBg: 'rgba(245, 158, 11, 0.12)', badgeText: '#FBBF24', description: 'Admin is reviewing design, contact, and fulfillment details.' },
  { key: 'approved', label: 'Approved', step: 3, color: '#10B981', badgeBg: 'rgba(16, 185, 129, 0.12)', badgeText: '#34D399', description: 'Request approved. Ready for customer card fulfillment.' },
  { key: 'completed', label: 'Completed', step: 4, color: '#8B5CF6', badgeBg: 'rgba(139, 92, 246, 0.12)', badgeText: '#A78BFA', description: 'Card request completed and delivered to customer.' },
  { key: 'cancelled', label: 'Cancelled', step: 0, color: '#EF4444', badgeBg: 'rgba(239, 68, 68, 0.12)', badgeText: '#F87171', description: 'Card request has been cancelled.' }
];

export const ORDER_STAGES = [
  { key: 'new_order', label: 'New Request', step: 1, description: 'Order received and digital design submitted for print review.' },
  { key: 'reviewing', label: 'In Review', step: 2, description: 'Print-ready vector assets, typography, and bleed margins under pre-press verification.' },
  { key: 'approved', label: 'Approved', step: 3, description: 'Card design verified and approved for fulfillment.' },
  { key: 'manufacturing', label: 'Manufacturing', step: 4, description: 'Card base CNC cut, custom foil/color applied, and NXP NTAG216 high-frequency chip embedded.' },
  { key: 'quality_check', label: 'Quality Check', step: 5, description: 'Dual-frequency NFC transmission tested and surface finish inspected.' },
  { key: 'dispatched', label: 'Dispatched', step: 6, description: 'Card packaged in presentation box and handed over to express courier.' },
  { key: 'delivered', label: 'Completed', step: 7, description: 'Card delivered to recipient and NFC redirect routing activated.' }
];

export const EXCEPTION_STAGES = [
  { key: 'cancelled', label: 'Cancelled', description: 'Order cancelled and production halted.' },
  { key: 'revision_required', label: 'Revision Required', description: 'Design adjustments requested before manufacturing can proceed.' },
  { key: 'on_hold', label: 'On Hold', description: 'Production paused per customer request or operational hold.' },
  { key: 'manufacturing_issue', label: 'Manufacturing Issue', description: 'Recalibrating tooling to ensure flawless card surface finish.' },
  { key: 'delivery_issue', label: 'Delivery Issue', description: 'Courier transit address re-attempt or verification needed.' }
];

export function normalizeOrderStatus(status) {
  if (!status) return 'new_order';
  const s = String(status).toLowerCase().trim();
  if (s === 'design_submitted' || s === 'new_request' || s === 'new_order' || s === 'pending' || s === 'draft' || s === 'submitted' || s === 'new') return 'new_order';
  if (s === 'reviewing' || s === 'design_review' || s === 'in_review' || s === 'processing' || s === 'awaiting_confirmation') return 'reviewing';
  if (s === 'approved' || s === 'artwork_verified' || s === 'artwork_approved' || s === 'payment_confirmed' || s === 'awaiting_payment') return 'approved';
  if (s === 'manufacturing' || s === 'manufacturing_started' || s === 'production') return 'manufacturing';
  if (s === 'quality_check' || s === 'quality_inspection') return 'quality_check';
  if (s === 'dispatched' || s === 'shipped') return 'dispatched';
  if (s === 'completed' || s === 'delivered') return 'delivered';
  if (s === 'cancelled' || s === 'rejected') return 'cancelled';
  return s;
}

export function getOrderStageInfo(status) {
  const norm = normalizeOrderStatus(status);
  const found = ORDER_STAGES.find(s => s.key === norm) || EXCEPTION_STAGES.find(s => s.key === norm);
  if (found) return found;
  return { key: norm, label: norm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), step: 1, description: '' };
}

export function getDefaultPublicMessage(status) {
  const norm = normalizeOrderStatus(status);
  const stage = ORDER_STAGES.find(s => s.key === norm) || EXCEPTION_STAGES.find(s => s.key === norm);
  return stage ? stage.description : `Order status has transitioned to ${status}.`;
}

export const DEFAULT_DEMO_CONFIG = {
  name: 'Alex Morgan',
  role: 'Founder & CEO',
  tagline: 'Connected Identity Systems',
  company: 'FLOCARDS',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  logo: '',
  phone: '+91 97782 78552',
  email: 'contact@flocard.in',
  whatsapp: '919778278552',
  website: 'https://flocard.in',
  bio: 'Pioneering connected NFC identity for executives and global tech pioneers.',
  cardEdition: 'purple',
  cardFinish: 'purple',
  socialLinks: {
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com'
  }
};

export const INITIAL_PROFILES = [
  {
    id: 'prof_alex_001',
    userId: 'usr_alex_founder',
    slug: 'alex',
    name: 'Alex Morgan',
    role: 'Founder & CEO',
    company: 'FLOCARDS',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    location: 'Bengaluru, India',
    bio: 'Pioneering connected NFC identity for executives and global tech pioneers.',
    phone: '+91 97782 78552',
    email: 'contact@flocard.in',
    whatsapp: '919778278552',
    website: 'https://flocard.in',
    socialLinks: {
      linkedin: 'https://linkedin.com',
      instagram: 'https://instagram.com',
      twitter: 'https://twitter.com'
    },
    // Morphing Profile & Appearance Customization Settings
    openingPreference: 'full', // 'full' (Continuous full-screen website)
    gradientPreset: 'cosmic_violet',
    gradientStart: '#130B22',
    gradientMid: '#240F3E',
    gradientEnd: '#0B0813',
    cardFinish: 'purple', // 'purple' | 'gold' | 'steel'
    cardColor: '#A855F7',
    glowColor: '#6B00FF',
    accentColor: '#A855F7',
    borderGlowIntensity: 'medium', // 'subtle' | 'medium' | 'high'
    photoShape: 'circle', // 'circle' | 'rounded_rect'
    photoLayout: 'center',
    cardTypography: 'Space Grotesk',
    backgroundTypography: 'FLOCARD',
    visibleCompactFields: {
      bio: true,
      role: true,
      company: true,
      contactBtn: true,
      verifiedBadge: true
    },
    // Banner Configuration (Discord / Facebook style cover)
    banner: {
      enabled: true,
      type: 'image', // 'image' | 'gradient' | 'color' | 'video'
      url: '/assets/hero-bg.jpg',
      height: 280, // Responsive height in px
      zoom: 100, // Percentage 80 to 150
      positionX: 50, // 0 - 100%
      positionY: 45, // 0 - 100%
      gradientStart: '#2e1065',
      gradientEnd: '#090514',
      solidColor: '#1a0b2e',
      overlayOpacity: 0.38,
      overlayColor: '#08060D'
    },
    // Business Hours Configuration
    businessHours: {
      enabled: true,
      timezone: 'Asia/Kolkata',
      schedule: {
        monday: { isOpen: true, slots: [{ open: '09:30', close: '18:30' }] },
        tuesday: { isOpen: true, slots: [{ open: '09:30', close: '18:30' }] },
        wednesday: { isOpen: true, slots: [{ open: '09:30', close: '18:30' }] },
        thursday: { isOpen: true, slots: [{ open: '09:30', close: '18:30' }] },
        friday: { isOpen: true, slots: [{ open: '09:30', close: '18:30' }] },
        saturday: { isOpen: true, slots: [{ open: '10:00', close: '16:00' }] },
        sunday: { isOpen: false, slots: [] }
      },
      specialClosures: [],
      notes: 'Appointments recommended for executive card consultations.'
    },
    // Appointment Booking Configuration
    bookingConfig: {
      enabled: true,
      slotDurationMinutes: 30,
      bufferMinutes: 10,
      minNoticeHours: 2,
      maxAdvanceDays: 30,
      autoConfirm: true,
      blockedDates: [],
      blockedTimes: []
    },
    // Payment Options (UPI & QR)
    paymentConfig: {
      enabled: true,
      upiId: 'flocards@icici',
      recipientName: 'FLOCARDS Digital Systems',
      qrUrl: '',
      instructions: 'Scan with any UPI app (Google Pay, PhonePe, Paytm, BHIM) to pay securely.'
    },
    // Bank Account Details (Private by default, requires explicit consent to publish)
    bankDetails: {
      enabled: false,
      isPublic: false,
      accountHolder: 'FLOCARDS DIGITAL SYSTEMS PRIVATE LIMITED',
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
      }
    },
    // Videos Section (YouTube / Shorts)
    videos: [
      {
        id: 'vid_1',
        title: 'FLOCARDS Contactless NFC Demo',
        description: 'Experience one-tap networking across iOS and Android.',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        isShort: false,
        visible: true
      }
    ],
    // Section Visibility Toggles
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
      qrCompanion: true
    },
    storageQuotas: {
      maxGalleryImages: 20,
      maxServiceImages: 10,
      maxVideos: 5,
      maxBannerSizeMb: 5,
      maxBannerVideoSizeMb: 15,
      maxUploadSizeMb: 5,
      maxTotalStorageMb: 50
    },
    galleryLayout: 'grid', // 'grid' | 'masonry' | 'carousel' | 'featured'
    portfolio: [
      {
        id: 'port_1',
        title: 'FLOCARD Core Platform',
        category: 'Hardware & Web',
        description: 'Next-generation contactless NFC business cards combined with dynamic digital identity.',
        image: '/assets/true_front_card.png',
        link: 'https://flocard.in'
      },
      {
        id: 'port_2',
        title: 'Obsidian NFC Architecture',
        category: 'Industrial Design',
        description: 'Aerospace-grade matte composite with precision-machined edges and embedded NTAG216 high-frequency chip.',
        image: '/assets/cardbg-purple.png',
        link: 'https://flocard.in/cards'
      },
      {
        id: 'port_3',
        title: 'Universal Digital Profile Suite',
        category: 'SaaS & UI/UX',
        description: 'Morphing digital profile and vCard distribution system for modern professionals.',
        image: '/assets/hero-bg.jpg',
        link: 'https://flocard.in/digital-profiles'
      }
    ],
    services: [
      {
        id: 'srv_1',
        title: 'Executive NFC Card Consultation',
        description: 'Bespoke corporate identity and hardware NFC chip programming for founders and leadership teams.',
        price: '₹1,999',
        priceType: 'fixed',
        duration: '30 mins',
        actionType: 'book',
        image: '/assets/cardbg-purple.png',
        visible: true,
        displayOrder: 1
      },
      {
        id: 'srv_2',
        title: 'Custom Metal Card Engraving',
        description: 'Laser-etched 24K Gold or Matte Black Stainless Steel luxury card editions with dual RFID/NFC chips.',
        price: '₹3,499',
        priceType: 'fixed',
        duration: '45 mins',
        actionType: 'book',
        image: '/assets/cardbg-gold.png',
        visible: true,
        displayOrder: 2
      },
      {
        id: 'srv_3',
        title: 'Enterprise Digital Ecosystem Integration',
        description: 'End-to-end custom staff directories, CRM lead routing, and dynamic vCard synchronization.',
        price: 'Contact for price',
        priceType: 'contact',
        duration: '60 mins',
        actionType: 'contact',
        image: '/assets/cardbg-platinum.png',
        visible: true,
        displayOrder: 3
      }
    ],
    experience: [
      { id: 'exp_1', role: 'Founder & CEO', company: 'FLOCARDS', period: '2024 – Present', description: 'Leading product vision, NFC hardware engineering, and digital identity software.' }
    ],
    isVerified: true,
    status: 'published'
  }
];


const INITIAL_CARDS = [
  {
    id: 'card_alex_001',
    cardCode: 'flc-alex-001',
    cardName: 'Alex Rivera — Platinum Matte',
    chipType: 'NXP NTAG216 (888 Bytes)',
    batch: 'Batch-2026-A',
    edition: 'platinum',
    customerId: 'usr_cust_01',
    customerName: 'Alex Rivera',
    customerEmail: 'alex@flocard.in',
    profileSlug: 'alex',
    status: 'active',
    tapCount: 142,
    registeredAt: '2026-03-15T10:00:00Z',
    statusChangedAt: '2026-03-15T10:00:00Z',
    statusReason: 'Initial card deployment & profile link',
    activationHistory: [
      {
        id: 'act_init_01',
        timestamp: '2026-03-15T10:00:00Z',
        previousStatus: 'in_stock',
        newStatus: 'active',
        actorId: 'usr_owner_01',
        actorName: 'FLOCARDS Administrator',
        reason: 'Initial card deployment & profile link'
      }
    ]
  }
];
const INITIAL_DESIGNS = [];
const INITIAL_CUSTOMERS = [];
const INITIAL_ORDER_HISTORY = [];
const INITIAL_ORDER_NOTES = [];
const INITIAL_NOTIFICATIONS = [];
const INITIAL_ANALYTICS_EVENTS = [];
const INITIAL_AUDIT_LOGS = [
  {
    id: 'evt_sys_init',
    timestamp: '2026-10-23T11:45:00Z',
    actorId: 'usr_owner_01',
    actorName: 'FLOCARDS Administrator',
    actorEmail: 'admin@flocard.in',
    actorRole: 'owner',
    action: 'system.initialized',
    entityType: 'System',
    entityId: 'flocard-core',
    description: 'FLOCARDS enterprise platform initialized with secure audit logging.',
    type: 'System',
    details: 'FLOCARDS enterprise platform initialized with secure audit logging.',
    userName: 'FLOCARDS Administrator',
    status: 'success',
    severity: 'info',
    correlationId: 'req_init_sys',
    timeAgo: 'Just now'
  }
];

export const DEFAULT_INVOICE_SETTINGS = {
  companyName: 'FLOCARD Technologies Pvt. Ltd.',
  tradeName: 'FLOCARD Connected Identity Systems',
  gstin: '32AAAAF1234A1Z5',
  pan: 'AAAAF1234A',
  taxRatePercent: 18,
  invoicePrefix: 'INV',
  supportEmail: 'billing@flocard.in',
  supportPhone: '+91 97782 78552',
  website: 'https://flocard.in',
  addressLine1: 'FLOCARD Innovation Hub, 4th Floor',
  addressLine2: 'Infopark Expressway, Kakkanad',
  cityStatePin: 'Kochi, Kerala 682042, India',
  bankName: 'HDFC Bank Ltd',
  accountName: 'FLOCARD TECHNOLOGIES PRIVATE LIMITED',
  accountNumber: '50200084920194',
  ifsc: 'HDFC0001234',
  upiId: 'flocard@hdfcbank',
  notesTerms: '1. Computer generated tax invoice under Rule 46 of CGST Rules, 2017.\n2. All NFC hardware products carry 1-Year manufacturing replacement warranty.\n3. Digital profile lifetime routing is included with card activation.\n4. Subject to Kochi jurisdiction only.'
};

export function normalizeOrderFinancials(order) {
  if (!order) return order;
  const ed = order.edition || 'purple';
  const unitPrice = Number(order.unitPrice || order.totalAmount || 1899);
  const qty = Number(order.quantity || 1);
  const discount = Number(order.discount || 0);
  const tax = Number(order.tax || 0);
  const shippingCharge = Number(order.shippingCharge || 0);
  const totalAmount = Number(order.totalAmount || (unitPrice * qty - discount + tax + shippingCharge));

  const paymentStatus = order.paymentStatus ||
    (order.status === 'cancelled' ? 'refunded' :
     (order.status === 'delivered' || order.status === 'shipped' || order.status === 'in_production' ? 'paid' : 'paid'));

  const refundAmount = Number(order.refundAmount !== undefined ? order.refundAmount : (paymentStatus === 'refunded' ? totalAmount : 0));
  const amountPaid = Number(order.amountPaid !== undefined ? order.amountPaid : (paymentStatus === 'paid' ? totalAmount : (paymentStatus === 'partially_paid' ? Math.round(totalAmount / 2) : 0)));
  const amountOutstanding = Number(order.amountOutstanding !== undefined ? order.amountOutstanding : Math.max(0, totalAmount - amountPaid - refundAmount));

  const invoiceId = order.invoiceId || `INV-${new Date(order.orderDate || Date.now()).getFullYear()}-${(order.id || '1000').replace(/[^0-9]/g, '').slice(-4).padStart(4, '0')}`;

  const productSkus = {
    gold: { sku: 'FLC-CRD-GLD-01', name: 'Gold Edition NFC Card', variant: '24K Metallic Champagne Gold', image: '/assets/cardbg-gold.png' },
    platinum: { sku: 'FLC-CRD-PLT-02', name: 'Platinum Edition NFC Card', variant: 'Brushed Platinum & Silver', image: '/assets/cardbg-platinum.png' },
    purple: { sku: 'FLC-CRD-PRP-03', name: 'Purple Edition NFC Card', variant: 'Ultraviolet Signature Obsidian', image: '/assets/cardbg-purple.png' },
    metal: { sku: 'FLC-CRD-MTL-04', name: 'Metal Edition NFC Card', variant: 'Brushed Gunmetal & Laser White', image: '/assets/cardbg-metal.png' }
  };

  const prodMeta = productSkus[ed] || productSkus.purple;
  const items = (order.items && order.items.length > 0) ? order.items : [
    {
      id: `item_${order.id || '1'}`,
      productId: `prod_${ed}`,
      productName: prodMeta.name,
      sku: prodMeta.sku,
      edition: ed,
      variant: prodMeta.variant,
      templateType: order.templateType || 'standard',
      quantity: qty,
      unitPrice,
      discount,
      tax,
      total: totalAmount,
      image: prodMeta.image
    }
  ];

  return {
    ...order,
    invoiceId,
    invoiceDate: order.invoiceDate || order.orderDate || new Date().toISOString(),
    items,
    unitPrice,
    quantity: qty,
    discount,
    tax,
    shippingCharge,
    totalAmount,
    amountPaid,
    amountOutstanding,
    refundAmount,
    paymentMethod: order.paymentMethod || 'upi',
    paymentStatus,
    transactionReference: order.transactionReference || `TXN-${(order.id || '1000').replace(/[^0-9]/g, '').slice(-6).padStart(6, '1')}`,
    paymentTransactions: order.paymentTransactions || [
      {
        id: `txn_${order.id || '1'}`,
        type: paymentStatus === 'refunded' ? 'refund' : 'payment',
        amount: paymentStatus === 'refunded' ? refundAmount : amountPaid,
        method: order.paymentMethod || 'upi',
        reference: order.transactionReference || `TXN-${(order.id || '1000').replace(/[^0-9]/g, '').slice(-6).padStart(6, '1')}`,
        date: order.orderDate || new Date().toISOString(),
        note: paymentStatus === 'refunded' ? 'Refund processed for order' : 'Payment confirmed at order placement',
        recordedBy: 'System'
      }
    ],
    cardCode: order.cardCode || `FLC-${String(ed || 'PUR').slice(0, 3).toUpperCase()}-${String(order.id || '1000').replace(/[^0-9]/g, '').slice(-4).padStart(4, '0')}`,
    nfcUid: order.nfcUid || `04:${((parseInt(String(order.id || '1000').replace(/\D/g, '') || '1000', 10) * 17) % 255).toString(16).padStart(2, '0').toUpperCase()}:${((parseInt(String(order.id || '1000').replace(/\D/g, '') || '1000', 10) * 31) % 255).toString(16).padStart(2, '0').toUpperCase()}:1F:90:3C:80`,
    cardStatus: order.cardStatus || (order.status === 'delivered' ? 'activated' : (order.status === 'dispatched' ? 'shipped' : (order.status === 'quality_checked' ? 'ready_to_dispatch' : (order.status === 'in_production' ? 'processing' : 'designing'))))
  };
}

// All demo orders and demo bills removed - clean production state
const INITIAL_ORDERS = [];

const INITIAL_ADMIN_ACCOUNTS = [
  {
    id: 'usr_owner_01',
    email: 'admin@flocard.in',
    name: 'FLOCARDS Administrator',
    role: 'owner',
    avatar: '',
    status: 'active',
    grantedAt: '2026-01-01T00:00:00Z',
    grantedBy: 'Root',
    lastActive: '2026-10-23T11:45:00Z'
  },
  {
    id: 'usr_owner_02',
    email: 'hello.flocard@gmail.com',
    name: 'FLOCARDS Master Ops',
    role: 'owner',
    avatar: '',
    status: 'active',
    grantedAt: '2026-01-01T00:00:00Z',
    grantedBy: 'Root',
    lastActive: '2026-10-23T10:00:00Z'
  },
  {
    id: 'usr_sales_01',
    email: 'sales@flocard.in',
    name: 'Priya Nair',
    role: 'sales',
    avatar: '',
    status: 'active',
    grantedAt: '2026-02-15T09:00:00Z',
    grantedBy: 'admin@flocard.in',
    lastActive: '2026-10-23T10:30:00Z'
  },
  {
    id: 'usr_des_01',
    email: 'designer@flocard.in',
    name: 'Vikram Malhotra',
    role: 'designer',
    avatar: '',
    status: 'active',
    grantedAt: '2026-02-20T11:30:00Z',
    grantedBy: 'admin@flocard.in',
    lastActive: '2026-10-23T09:30:00Z'
  },
  {
    id: 'usr_prod_01',
    email: 'production@flocard.in',
    name: 'Rajesh Kumar',
    role: 'production',
    avatar: '',
    status: 'active',
    grantedAt: '2026-03-01T08:15:00Z',
    grantedBy: 'admin@flocard.in',
    lastActive: '2026-10-23T10:12:00Z'
  },
  {
    id: 'usr_acc_01',
    email: 'accounts@flocard.in',
    name: 'Anjali Sharma',
    role: 'accounts',
    avatar: '',
    status: 'active',
    grantedAt: '2026-03-10T14:00:00Z',
    grantedBy: 'admin@flocard.in',
    lastActive: '2026-10-22T16:20:00Z'
  }
];

const isElevatedUser = (user) => {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  return user.role === 'admin' || user.role === 'owner' || email === 'admin@flocard.in' || email === 'hello.flocard@gmail.com' || email.endsWith('@flocard.in');
};

const INITIAL_TEMPLATES = [
  {
    id: 'tmpl_standard',
    key: 'standard',
    name: 'Standard FLOCARD Design (Without Customer Logo)',
    category: 'Core Collection',
    badge: 'Without Customer Logo',
    popular: true,
    tagline: 'Classic front-to-back layout with prominent name, role & QR.',
    description: 'Name, Role, Tagline, and NFC icon on the front. Official FLOCARD logo and QR code on the back. Clean layout without customer logo.',
    material: 'Premium Matte Polycarbonate',
    finish: 'Silky Matte Anti-Fingerprint Coating',
    chip: 'NXP NTAG216 High Frequency 13.56 MHz',
    status: 'active',
    accentColor: '#6B00FF',
    secondaryColor: '#A855F7',
    textColor: '#FFFFFF',
    cardBg: '#15101D',
    sampleImage: '/assets/true_front_card.png'
  },
  {
    id: 'tmpl_customer_logo',
    key: 'customer_logo',
    name: 'Customer Logo Design (With Customer Logo)',
    category: 'Brand Custom',
    badge: 'With Customer Logo',
    popular: false,
    tagline: 'Prominent custom company emblem on front with full bio on back.',
    description: 'Prominent Customer Logo badge, NFC icon, and Tagline on the front. Name, Role, FLOCARD logo, and QR code on the back with custom customer branding.',
    material: 'Hybrid Metal/Polymer Composite',
    finish: 'Custom Spot UV & Laser Relief',
    chip: 'NXP NTAG216 High Frequency 13.56 MHz',
    status: 'active',
    accentColor: '#EC4899',
    secondaryColor: '#BE185D',
    textColor: '#FFFFFF',
    cardBg: '#180B22',
    sampleImage: '/assets/ref_page_4.png_front.png'
  }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod_platinum',
    editionKey: 'platinum',
    name: 'Platinum Edition',
    sku: 'FLC-CRD-PLT-02',
    stock: 32,
    subtitle: 'Black with Metallic Silver & Brushed Platinum Accents',
    tagline: 'A sleek and modern look for forward-thinking professionals.',
    description: 'Engineered brushed platinum and chrome precision lines against pure carbon black.',
    price: 2199,
    comparePrice: 2999,
    currency: 'INR',
    displayOrder: 1,
    status: 'active',
    isActive: true,
    isAvailable: true,
    isFeatured: false,
    featuredBadge: '',
    theme: 'platinum',
    accentColor: '#CBD5E1',
    secondaryColor: '#94A3B8',
    spotlightColor: '#CBD5E1',
    finishHighlight: 'Precision laser-etched stainless alloy with frosted luster against carbon black.',
    features: [
      'NFC-enabled physical card (NXP NTAG216 high frequency chip)',
      'Personalized name & professional role with brushed silver finish',
      'Customizable dual-sided card artwork (Standard or Logo Badge)',
      'Digital profile connection with one-tap instant NFC routing',
      'High-resolution laser-etched QR code on the reverse',
      'Bend-proof reinforced stainless steel & polymer hybrid'
    ],
    sampleFrontImage: '/assets/cardbg-platinum.png',
    sampleBackImage: '/assets/flocard-logo-platinum.png',
    ctaText: 'Customize Platinum Card',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_purple',
    editionKey: 'purple',
    name: 'Purple Edition',
    sku: 'FLC-CRD-PRP-03',
    stock: 68,
    subtitle: 'Black with Premium Ultraviolet & Neon Purple Accents',
    tagline: 'The signature FLOCARD identity. Engineered for innovators.',
    description: 'Deep ultraviolet neon glow against obsidian matte black with signature FLOCARD identity.',
    price: 1899,
    comparePrice: 2499,
    currency: 'INR',
    displayOrder: 2,
    status: 'active',
    isActive: true,
    isAvailable: true,
    isFeatured: true,
    featuredBadge: 'Signature & Most Popular',
    theme: 'purple',
    accentColor: '#A855F7',
    secondaryColor: '#6B00FF',
    spotlightColor: '#A855F7',
    finishHighlight: 'Matte obsidian surface with ultraviolet UV gloss accent and vibrant edge glow.',
    features: [
      'NFC-enabled physical card (NXP NTAG216 high frequency chip)',
      'Personalized name & professional role with crisp typography',
      'Customizable dual-sided card artwork (Standard or Logo Badge)',
      'Digital profile connection with one-tap instant NFC routing',
      'High-resolution laser-etched QR code on the reverse',
      'Waterproof IP68 rating, 100,000 contactless tap cycles'
    ],
    sampleFrontImage: '/assets/cardbg-purple.png',
    sampleBackImage: '/assets/flocard-logo-white.png',
    ctaText: 'Customize Purple Card',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_gold',
    editionKey: 'gold',
    name: 'Gold Edition',
    sku: 'FLC-CRD-GLD-01',
    stock: 45,
    subtitle: 'Black with Premium Metallic Champagne Gold Accents',
    tagline: 'A bold and luxurious design for professionals who stand out.',
    description: 'Near-black charcoal surface adorned with refined metallic champagne gold typography and subtle brushed reflections.',
    price: 2499,
    comparePrice: 3499,
    currency: 'INR',
    displayOrder: 3,
    status: 'active',
    isActive: true,
    isAvailable: true,
    isFeatured: false,
    featuredBadge: '',
    theme: 'gold',
    accentColor: '#E9C766',
    secondaryColor: '#C9972C',
    spotlightColor: '#E9C766',
    finishHighlight: 'Near-black matte polymer with metallic champagne gold typography and dual-tone velvet touch.',
    features: [
      'NFC-enabled physical card (NXP NTAG216 high frequency chip)',
      'Personalized name & professional role with metallic gold finish',
      'Customizable dual-sided card artwork (Standard or Logo Badge)',
      'Digital profile connection with one-tap instant NFC routing',
      'High-resolution laser-etched QR code on the reverse',
      'Waterproof IP68 & scratch-resistant protective coating'
    ],
    sampleFrontImage: '/assets/cardbg-gold.png',
    sampleBackImage: '/assets/flocard-logo-gold.png',
    ctaText: 'Customize Gold Card',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_metal',
    editionKey: 'metal',
    name: 'Metal Edition',
    sku: 'FLC-CRD-MTL-04',
    stock: 18,
    subtitle: 'Brushed Gunmetal with Ultra-Crisp Laser White Typography',
    tagline: 'Precision-engineered brushed gunmetal for modern leaders.',
    description: 'Dark brushed gunmetal finish with ultra-crisp laser-white typography and executive minimalism.',
    price: 2799,
    comparePrice: 3799,
    currency: 'INR',
    displayOrder: 4,
    status: 'active',
    isActive: true,
    isAvailable: true,
    isFeatured: false,
    featuredBadge: '',
    theme: 'metal',
    accentColor: '#CBD5E1',
    secondaryColor: '#64748B',
    spotlightColor: '#CBD5E1',
    finishHighlight: 'Dark brushed gunmetal finish with scratch-resistant PVD coating and executive minimalist typography.',
    features: [
      'NFC-enabled physical card (NXP NTAG216 high frequency chip)',
      'Brushed gunmetal metallic finish with laser-precision etching',
      'Minimalist executive typography with clean dual-sided artwork',
      'Digital profile connection with one-tap instant NFC routing',
      'High-contrast scannable QR code on the reverse',
      'Waterproof IP68 rating & scratch-resistant PVD surface'
    ],
    sampleFrontImage: '/assets/cardbg-metal.png',
    sampleBackImage: '/assets/flocard-logo-white.png',
    ctaText: 'Customize Metal Card',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_white',
    editionKey: 'white',
    name: 'Pure White Edition',
    sku: 'FLC-CRD-WHT-05',
    stock: 25,
    subtitle: 'Porcelain White with High-Contrast Pure Black or Gold Typography',
    tagline: 'Pristine architectural porcelain white with pure black or metallic gold typography.',
    description: 'Engineered ultra-dense porcelain white composite with high-contrast obsidian black or metallic gold typography and laser-etched precision.',
    price: 2199,
    comparePrice: 2899,
    currency: 'INR',
    displayOrder: 5,
    status: 'active',
    isActive: true,
    isAvailable: true,
    isFeatured: false,
    featuredBadge: '',
    theme: 'white',
    accentColor: '#000000',
    secondaryColor: '#E9C766',
    spotlightColor: '#000000',
    finishHighlight: 'Pristine silk-touch porcelain white finish with high-contrast obsidian black or metallic gold typography.',
    features: [
      'NFC-enabled physical card (NXP NTAG216 high frequency chip)',
      'Porcelain white surface with laser precision black or gold typography',
      'Customizable dual-sided card artwork (Standard or Logo Badge)',
      'Digital profile connection with one-tap instant NFC routing',
      'High-contrast laser-etched QR code on the reverse',
      'Oleophobic stain-resistant coating & Waterproof IP68 rating'
    ],
    sampleFrontImage: '/assets/flocard-logo-dark.png',
    sampleBackImage: '/assets/flocard-logo-dark.png',
    ctaText: 'Customize Pure White Card',
    updatedAt: new Date().toISOString()
  }
];

export function formatCurrencyINR(amount) {
  if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount)) || Number(amount) <= 0) {
    return null;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount));
}

// In-memory fallback cache for SSR and Node test environments
const memoryCache = new Map();

// Helper to communicate with server-side cloud sync API (runs with full administrative privileges without browser Origin restrictions)
async function callCloudSyncApi(action, payload = {}) {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/cloud-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[CloudSync API] ${action} request note:`, err.message);
  }
  return null;
}

// Helper to read and write from localStorage with in-memory & sessionStorage fallback
function getLocal(key, initial) {
  const fullKey = STORAGE_KEY_PREFIX + key;
  try {
    if (typeof localStorage === 'undefined') {
      if (!memoryCache.has(fullKey)) {
        memoryCache.set(fullKey, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(memoryCache.get(fullKey));
    }
    const raw = localStorage.getItem(fullKey);
    if (!raw) {
      if (typeof sessionStorage !== 'undefined') {
        const sessRaw = sessionStorage.getItem(fullKey);
        if (sessRaw) {
          try {
            const parsed = JSON.parse(sessRaw);
            memoryCache.set(fullKey, sessRaw);
            return parsed;
          } catch (_) {}
        }
      }
      if (memoryCache.has(fullKey)) {
        return JSON.parse(memoryCache.get(fullKey));
      }
      localStorage.setItem(fullKey, JSON.stringify(initial));
      memoryCache.set(fullKey, JSON.stringify(initial));
      return JSON.parse(JSON.stringify(initial));
    }
    const parsed = JSON.parse(raw);
    memoryCache.set(fullKey, raw);
    return parsed;
  } catch (err) {
    if (memoryCache.has(fullKey)) {
      try { return JSON.parse(memoryCache.get(fullKey)); } catch (_) {}
    }
    return JSON.parse(JSON.stringify(initial));
  }
}

function setLocal(key, value) {
  const fullKey = STORAGE_KEY_PREFIX + key;
  const serialized = JSON.stringify(value);
  // Always update in-memory cache
  memoryCache.set(fullKey, serialized);

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(fullKey, serialized);
    } catch (err) {
      console.warn(`[FLOCARD Storage] Quota or private browsing issue for ${key}, attempting storage cleanup...`, err);
      // Clean up excess audit logs or temporary keys if quota exceeded
      try {
        const auditKey = STORAGE_KEY_PREFIX + 'audit_logs';
        localStorage.removeItem(auditKey);
        localStorage.setItem(fullKey, serialized);
      } catch (err2) {
        // Fallback to sessionStorage
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(fullKey, serialized);
          }
        } catch (_) {}
      }
    }
  }
}

export const StorageEngine = {
  // Profiles
  getProfiles: () => {
    const rawList = getLocal('profiles', INITIAL_PROFILES);
    const list = rawList.map(p => {
      const init = INITIAL_PROFILES.find(ip => ip.id === p.id || ip.slug === p.slug) || {};
      return {
        ...init,
        ...p,
        banner: p.banner !== undefined ? p.banner : (init.banner || null),
        businessHours: p.businessHours || init.businessHours || null,
        bookingConfig: p.bookingConfig || init.bookingConfig || null,
        paymentConfig: p.paymentConfig || init.paymentConfig || null,
        bankDetails: p.bankDetails || init.bankDetails || null,
        videos: Array.isArray(p.videos) ? p.videos : (init.videos || []),
        storageQuotas: p.storageQuotas || init.storageQuotas || {
          maxGalleryImages: 20,
          maxServiceImages: 10,
          maxVideos: 5,
          maxBannerSizeMb: 5,
          maxBannerVideoSizeMb: 15,
          maxUploadSizeMb: 5,
          maxTotalStorageMb: 50
        },
        sectionVisibility: {
          ...(init.sectionVisibility || {}),
          ...(p.sectionVisibility || {})
        }
      };
    });

    const primary = list.find(p => p.id === 'prof_alex_001' || p.slug === 'alex' || p.id === 'prof_akhil_001' || p.slug === 'akhil');
    if (primary && (primary.name === 'Your Name' || !primary.avatar || primary.name === 'Akhil Anvar')) {
      primary.name = 'Alex Morgan';
      primary.role = primary.role === 'Your Role' ? 'Founder & CEO' : primary.role;
      primary.company = primary.company === 'Your Company' ? 'FLOCARDS' : primary.company;
      primary.avatar = primary.avatar && !primary.avatar.includes('akhil') ? primary.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
      setLocal('profiles', list);
    }
    return list;
  },
  getProfileBySlug: (slug) => {
    if (!slug) return null;
    const cleanSlug = String(slug).trim().toLowerCase();
    const list = StorageEngine.getProfiles();
    const found = list.find(p => p.slug && p.slug.trim().toLowerCase() === cleanSlug);
    if (found) return found;

    // Fallbacks for primary admin/demo profile (handles legacy 'akhil' redirect gracefully)
    if (cleanSlug === 'alex' || cleanSlug === 'akhil' || cleanSlug === 'default' || cleanSlug === 'demo') {
      const matchPrimary = list.find(p => p.id === 'prof_alex_001' || p.slug === 'alex') || list[0] || INITIAL_PROFILES[0];
      if (matchPrimary && cleanSlug === 'akhil') {
        return { ...matchPrimary, slug: 'akhil' };
      }
      return matchPrimary;
    }
    return null;
  },
  saveLocalProfiles: (profiles) => {
    setLocal('profiles', profiles);
  },
  syncProfileToCloud: async (profile) => {
    if (!profile) return;
    try {
      const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('./supabase.js');
      if (!isSupabaseConfigured) return;
      const client = supabaseAdmin || supabase;
      if (!client) return;

      const cleanSlug = (profile.slug || '').trim().toLowerCase();
      if (!cleanSlug) return;

      const cleanPortfolio = Array.isArray(profile.portfolio)
        ? [...profile.portfolio.filter(p => p && !p._isBannerConfig)]
        : [];

      if (profile.banner || profile.avatarZoom || profile.avatarPosX || profile.avatarPosY || profile.photoShape) {
        cleanPortfolio.unshift({
          id: '_flocard_banner_config',
          _isBannerConfig: true,
          banner: profile.banner || null,
          avatarZoom: profile.avatarZoom,
          avatarPosX: profile.avatarPosX,
          avatarPosY: profile.avatarPosY,
          photoShape: profile.photoShape
        });
      }

      const payload = {
        slug: cleanSlug,
        name: profile.name || cleanSlug,
        role: profile.role || '',
        company: profile.company || '',
        tagline: profile.tagline || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar || profile.avatar_url || '',
        theme: profile.theme || 'purple',
        phone: profile.phone || '',
        email: profile.email || '',
        whatsapp: profile.whatsapp || '',
        website: profile.website || '',
        linkedin: profile.linkedin || '',
        instagram: profile.instagram || '',
        twitter: profile.twitter || '',
        github: profile.github || '',
        location: profile.location || '',
        services: Array.isArray(profile.services) ? profile.services : [],
        portfolio: cleanPortfolio,
        vcard_enabled: profile.vcard_enabled !== false,
        status: profile.status || 'active',
        updated_at: new Date().toISOString()
      };

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (profile.id && uuidRegex.test(profile.id)) {
        payload.id = profile.id;
      }
      if (profile.user_id && uuidRegex.test(profile.user_id)) {
        payload.user_id = profile.user_id;
      }

      // Try serverless sync endpoint first (runs on backend without browser Origin restrictions)
      try {
        const apiRes = await callCloudSyncApi('syncProfile', { profile: payload });
        if (apiRes && apiRes.success) return;
      } catch (_) {}

      let { error } = await client.from('profiles').upsert(payload, { onConflict: 'slug' });
      if (error && error.code === '23503' && payload.user_id) {
        delete payload.user_id;
        const retry = await client.from('profiles').upsert(payload, { onConflict: 'slug' });
        error = retry.error;
      }
      if (error) {
        console.warn('[StorageSync] Supabase profiles upsert note:', error.message);
      }
    } catch (err) {
      console.warn('[StorageSync] Supabase profile sync error:', err.message);
    }
  },
  saveProfile: (profile) => {
    if (!profile) return null;
    const list = getLocal('profiles', INITIAL_PROFILES);
    const index = list.findIndex(p => p.id === profile.id || (p.slug && profile.slug && p.slug.trim().toLowerCase() === profile.slug.trim().toLowerCase()));
    let saved;
    if (index >= 0) {
      list[index] = { ...list[index], ...profile, updatedAt: new Date().toISOString() };
      saved = list[index];
    } else {
      saved = { ...profile, id: profile.id || `prof_${Date.now()}`, createdAt: new Date().toISOString() };
      list.unshift(saved);
    }
    setLocal('profiles', list);
    StorageEngine.addAuditLog('Profile', `Profile updated for ${profile.name}`, 'You');

    // Asynchronously synchronize with Supabase cloud
    StorageEngine.syncProfileToCloud(saved);

    // Broadcast update across windows & reactive hooks
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_profile_updated', { detail: { profile: saved, list } }));
    }
    return saved;
  },
  deleteProfile: (id) => {
    const list = getLocal('profiles', INITIAL_PROFILES).filter(p => p.id !== id);
    setLocal('profiles', list);
    StorageEngine.addAuditLog('Profile', `Profile deleted: ${id}`, 'You');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_profile_updated', { detail: { deletedId: id, list } }));
    }
  },

  // Appointments
  getAppointments: (profileSlug = null) => {
    const list = getLocal('appointments', [
      {
        id: 'apt_demo_001',
        profileSlug: 'alex',
        profileId: 'prof_alex_001',
        serviceId: 'srv_1',
        serviceName: 'Executive NFC Card Consultation',
        customerName: 'Sarah Jenkins',
        customerEmail: 'sarah.jenkins@acme.com',
        customerPhone: '+91 98765 43210',
        bookingDate: '2026-10-28',
        startTime: '10:30',
        endTime: '11:00',
        notes: 'Consultation for 25 leadership metal NFC cards.',
        status: 'confirmed',
        referenceCode: 'FLC-BK-2610-7B2K',
        createdAt: '2026-10-25T14:20:00Z',
        updatedAt: '2026-10-25T14:20:00Z'
      }
    ]);
    if (!profileSlug) return list;
    return list.filter(a => a.profileSlug && a.profileSlug.toLowerCase() === profileSlug.toLowerCase());
  },
  saveAppointment: (appointment) => {
    if (!appointment) return null;
    const list = getLocal('appointments', []);
    const index = list.findIndex(a => a.id === appointment.id || (appointment.referenceCode && a.referenceCode === appointment.referenceCode));
    let saved;
    if (index >= 0) {
      saved = { ...list[index], ...appointment, updatedAt: new Date().toISOString() };
      list[index] = saved;
    } else {
      saved = {
        ...appointment,
        id: appointment.id || `apt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: appointment.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list.unshift(saved);
    }
    setLocal('appointments', list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_appointment_updated', { detail: { appointment: saved, list } }));
    }
    return saved;
  },
  updateAppointmentStatus: (id, status, meta = {}) => {
    const list = getLocal('appointments', []);
    const index = list.findIndex(a => a.id === id);
    if (index >= 0) {
      list[index] = {
        ...list[index],
        status,
        ...(meta.rescheduleDate ? { bookingDate: meta.rescheduleDate } : {}),
        ...(meta.rescheduleTime ? { startTime: meta.rescheduleTime } : {}),
        updatedAt: new Date().toISOString()
      };
      const updated = list[index];
      setLocal('appointments', list);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('flocard_appointment_updated', { detail: { appointment: updated, list } }));
      }
      return updated;
    }
    return null;
  },
  deleteAppointment: (id) => {
    const list = getLocal('appointments', []).filter(a => a.id !== id);
    setLocal('appointments', list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_appointment_updated', { detail: { deletedId: id, list } }));
    }
  },

  // Cards
  getCards: () => getLocal('cards', INITIAL_CARDS),
  saveLocalCards: (cards) => {
    setLocal('cards', cards);
  },
  syncCardToCloud: async (card) => {
    if (!card || !card.cardCode) return;
    try {
      const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('./supabase.js');
      if (!isSupabaseConfigured) return;
      const client = supabaseAdmin || supabase;
      if (!client) return;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const rawStatus = (card.status || 'in_stock').toLowerCase();
      // Supabase nfc_cards check constraint strictly requires: 'in_stock', 'active', or 'revoked'
      let dbStatus = 'in_stock';
      if (rawStatus === 'active') {
        dbStatus = 'active';
      } else if (rawStatus === 'revoked' || rawStatus === 'disabled' || rawStatus === 'suspended') {
        dbStatus = 'revoked';
      } else {
        // 'unassigned', 'in_stock', 'pending', etc. map to 'in_stock'
        dbStatus = 'in_stock';
      }

      // Supabase nfc_cards check constraint strictly allows: 'purple', 'gold', 'platinum', 'custom'
      const rawEdition = (card.edition || 'purple').toLowerCase();
      const dbEdition = ['purple', 'gold', 'platinum', 'custom'].includes(rawEdition) ? rawEdition : 'custom';

      const payload = {
        card_code: card.cardCode.trim(),
        chip_type: card.chipType || 'NXP NTAG216 (888 Bytes)',
        batch: card.batch || 'Batch-A',
        edition: dbEdition,
        profile_slug: card.profileSlug ? card.profileSlug.trim() : null,
        status: dbStatus,
        tap_count: typeof card.tapCount === 'number' ? card.tapCount : 0,
        updated_at: new Date().toISOString()
      };

      if (card.customerId && uuidRegex.test(card.customerId)) {
        payload.customer_id = card.customerId;
      }
      if (card.id && uuidRegex.test(card.id)) {
        payload.id = card.id;
      }

      // Try serverless sync endpoint first (runs on backend without browser Origin restrictions)
      try {
        const apiRes = await callCloudSyncApi('syncCard', { card: payload });
        if (apiRes && apiRes.success) return;
      } catch (_) {}

      const { error: upsertErr } = await client.from('nfc_cards').upsert(payload, { onConflict: 'card_code' });
      if (upsertErr) {
        console.warn('[StorageSync] Supabase nfc_cards upsert warning:', upsertErr.message);
      } else {
        console.info(`[StorageSync] NFC Card "${card.cardCode}" synced to Supabase successfully (${dbStatus}).`);
      }
    } catch (err) {
      console.warn('[StorageSync] Supabase nfc_cards sync note:', err.message);
    }
  },
  getCardByCode: (code) => {
    const list = getLocal('cards', INITIAL_CARDS);
    return list.find(c => c.cardCode.toLowerCase() === code.toLowerCase()) || null;
  },
  saveCard: (card) => {
    const list = getLocal('cards', INITIAL_CARDS);
    const index = list.findIndex(c => c.id === card.id || c.cardCode === card.cardCode);
    let saved;
    if (index >= 0) {
      list[index] = { ...list[index], ...card, updatedAt: new Date().toISOString() };
      saved = list[index];
    } else {
      saved = { ...card, id: card.id || `card_${Date.now()}` };
      list.unshift(saved);
    }
    setLocal('cards', list);
    StorageEngine.addAuditLog('NFC Card', `Card updated: ${card.cardCode} (${card.status})`, 'You');

    // Asynchronously synchronize with Supabase cloud
    StorageEngine.syncCardToCloud(saved);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_card_updated', { detail: { card: saved, list } }));
    }
    return saved;
  },
  getDeletedCardIds: () => getLocal('flocard_deleted_card_ids', []),
  deleteCard: async (id) => {
    const list = getLocal('cards', INITIAL_CARDS).filter(c => c.id !== id && c.cardCode !== id);
    setLocal('cards', list);
    
    // Save tombstone
    const tombstoneIds = getLocal('flocard_deleted_card_ids', []);
    if (id && !tombstoneIds.includes(id)) {
      tombstoneIds.push(id);
      setLocal('flocard_deleted_card_ids', tombstoneIds);
    }

    StorageEngine.addAuditLog('NFC Card', `Card deleted: ${id}`, 'You');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_card_updated', { detail: { deletedId: id, list } }));
    }

    // Call serverless cloud sync
    callCloudSyncApi('deleteCard', { id, cardCode: id }).catch(() => {});

    // Direct delete from Supabase if client is accessible
    try {
      const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('./supabase.js');
      if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
        const client = supabaseAdmin || supabase;
        await client.from('nfc_cards').delete().or(`id.eq.${id},card_code.eq.${id}`).catch(() => {});
      }
    } catch (_) {}
    return true;
  },
  recordCardTap: (cardCode, clientMeta = {}) => {
    const list = getLocal('cards', INITIAL_CARDS);
    const card = list.find(c => c.cardCode.toLowerCase() === cardCode.toLowerCase());
    if (card) {
      card.tapCount = (card.tapCount || 0) + 1;
      card.lastTapped = new Date().toISOString();
      setLocal('cards', list);
      StorageEngine.addAuditLog(
        'NFC Card',
        `Tap recorded for card ${card.cardCode} -> @${card.profileSlug}`,
        clientMeta.os || 'Visitor'
      );
    }
    return card;
  },

  // Designs
  getDesigns: () => getLocal('designs', INITIAL_DESIGNS),
  saveLocalDesigns: (designs) => {
    setLocal('designs', designs);
  },
  saveLocalOrders: (orders) => {
    setLocal('orders', orders);
  },
  syncDesignToCloud: async (design) => {
    if (!design) return null;
    try {
      const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('./supabase.js');
      if (!isSupabaseConfigured) return null;
      const client = supabaseAdmin || supabase;
      if (!client) return null;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let cloudId = design.supabaseId;
      if (!cloudId || !uuidRegex.test(cloudId)) {
        if (design.id && uuidRegex.test(design.id)) {
          cloudId = design.id;
        } else if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          cloudId = crypto.randomUUID();
        } else {
          cloudId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        }
      }

      // Supabase check constraint strictly requires: 'purple', 'gold', 'platinum', 'custom'
      const rawEdition = (design.edition || 'purple').toLowerCase();
      const validEdition = ['purple', 'gold', 'platinum', 'custom'].includes(rawEdition)
        ? rawEdition
        : 'custom';

      // Supabase check constraint strictly requires: 'draft', 'submitted', 'in_review', 'approved', 'rejected', 'printed'
      const rawStatus = (design.status || 'submitted').toLowerCase();
      const validStatus = ['draft', 'submitted', 'in_review', 'approved', 'rejected', 'printed'].includes(rawStatus)
        ? rawStatus
        : (rawStatus === 'completed' ? 'printed' : 'submitted');

      const payload = {
        id: cloudId,
        title: design.title || `${design.customerName || 'Customer'}'s Card Design`,
        edition: validEdition,
        status: validStatus,
        front_config: {
          ...(design.front || {}),
          _localId: design.id,
          edition: design.edition || validEdition,
          title: design.title || '',
          customerName: design.customerName || design.front?.name || '',
          customerEmail: design.customerEmail || '',
          customerPhone: design.customerPhone || '',
          company: design.company || design.front?.company || '',
          templateType: design.templateType || 'standard',
          customColors: design.customColors || {},
          customerLogo: design.customerLogo || null,
          flocardLogo: design.flocardLogo || null,
          orderId: design.orderId || null,
          printOrder: design.printOrder || null
        },
        back_config: design.back || {},
        updated_at: new Date().toISOString()
      };

      if (design.customerId && uuidRegex.test(design.customerId)) {
        payload.user_id = design.customerId;
      }

      // Try serverless sync endpoint first (runs on backend without browser Origin restrictions)
      try {
        const apiRes = await callCloudSyncApi('syncDesign', { design: payload });
        if (apiRes && apiRes.success) return cloudId;
      } catch (_) {}

      let { error: upsertErr } = await client.from('card_designs').upsert(payload, { onConflict: 'id' });
      if (upsertErr && upsertErr.code === '23503' && payload.user_id) {
        delete payload.user_id;
        const retry = await client.from('card_designs').upsert(payload, { onConflict: 'id' });
        upsertErr = retry.error;
      }
      if (upsertErr) {
        console.warn('[StorageSync] Supabase card_designs upsert warning:', upsertErr.message);
      } else {
        console.info(`[StorageSync] Card Design "${design.title || design.id}" synced to Supabase successfully (${validStatus}).`);
      }

      // Update local design with supabaseId if generated
      if (design.supabaseId !== cloudId) {
        design.supabaseId = cloudId;
        const list = getLocal('designs', INITIAL_DESIGNS);
        const idx = list.findIndex(d => d.id === design.id);
        if (idx >= 0) {
          list[idx].supabaseId = cloudId;
          setLocal('designs', list);
        }
      }
      return cloudId;
    } catch (err) {
      console.warn('[StorageSync] Supabase card_designs sync note:', err.message);
      return null;
    }
  },
  getDesignById: (id) => {
    const list = getLocal('designs', INITIAL_DESIGNS);
    return list.find(d => d.id === id) || null;
  },
  saveDesign: (design) => {
    const list = getLocal('designs', INITIAL_DESIGNS);
    const index = list.findIndex(d => d.id === design.id);
    let saved;
    if (index >= 0) {
      saved = { ...list[index], ...design, updatedAt: new Date().toISOString() };
      list[index] = saved;
    } else {
      saved = {
        ...design,
        id: design.id || `#D${Math.floor(1000 + Math.random() * 9000)}`,
        submittedAt: 'Just now',
        status: design.status || 'submitted'
      };
      list.unshift(saved);
    }
    setLocal('designs', list);
    StorageEngine.addAuditLog('Card Design', `Design saved: ${saved.title || saved.id}`, 'You');
    // Asynchronously synchronize with Supabase cloud
    StorageEngine.syncDesignToCloud(saved);
    return saved;
  },
  updateDesignStatus: (id, status, notes = '') => {
    const list = getLocal('designs', INITIAL_DESIGNS);
    const item = list.find(d => d.id === id);
    if (item) {
      item.status = status;
      item.reviewNotes = notes;
      item.reviewedAt = new Date().toISOString();
      setLocal('designs', list);
      StorageEngine.syncDesignToCloud(item);
      StorageEngine.addAuditLog(
        'Card Design',
        `Design ${item.id} ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'status changed'} for ${item.customerName}`,
        'FLOCARDS Design Team'
      );

      // When design is approved, automatically create an Order in orders queue!
      if (status === 'approved') {
        StorageEngine.createOrderFromDesign(item, notes);
      }
    }
    return item;
  },
  getDeletedDesignIds: () => getLocal('flocard_deleted_design_ids', []),
  deleteDesign: async (id) => {
    const list = getLocal('designs', INITIAL_DESIGNS).filter(d => d.id !== id);
    setLocal('designs', list);
    const altList = getLocal('card_designs', INITIAL_DESIGNS).filter(d => d.id !== id);
    setLocal('card_designs', altList);

    // Save tombstone
    const tombstoneIds = getLocal('flocard_deleted_design_ids', []);
    if (id && !tombstoneIds.includes(id)) {
      tombstoneIds.push(id);
      setLocal('flocard_deleted_design_ids', tombstoneIds);
    }

    StorageEngine.addAuditLog('Card Design', `Design deleted: ${id}`, 'You');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_design_updated', { detail: { deletedId: id, list } }));
    }

    // Call serverless cloud sync
    callCloudSyncApi('deleteDesign', { id }).catch(() => {});

    // Direct delete from Supabase if client is accessible
    try {
      const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('./supabase.js');
      if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
        const client = supabaseAdmin || supabase;
        await client.from('card_designs').delete().eq('id', id).catch(() => {});
      }
    } catch (_) {}
    return true;
  },

  // Orders & Fulfillment Pipeline
  getOrders: (currentUser = null) => {
    const rawList = getLocal('orders', INITIAL_ORDERS);
    const list = rawList.map(o => normalizeOrderFinancials(o));
    if (!currentUser) return list;
    const isElevated = isElevatedUser(currentUser);
    if (isElevated) return list;
    const cId = currentUser.id;
    const cEmail = (currentUser.email || '').toLowerCase().trim();
    const cName = (currentUser.name || '').toLowerCase().trim();
    return list.filter(o => 
      (cId && o.customerId === cId) ||
      (cEmail && o.customerEmail?.toLowerCase().trim() === cEmail) ||
      (cName && o.customerName?.toLowerCase().trim() === cName)
    );
  },

  getOrderById: (id, currentUser = null) => {
    const list = getLocal('orders', INITIAL_ORDERS).map(o => normalizeOrderFinancials(o));
    const order = list.find(o => o.id === id || o.orderReference === id);
    if (!order) return null;

    const isElevated = isElevatedUser(currentUser);
    const cId = currentUser?.id;
    const cEmail = (currentUser?.email || '').toLowerCase().trim();
    const cName = (currentUser?.name || '').toLowerCase().trim();
    const isOwner = (cId && order.customerId === cId) ||
      (cEmail && order.customerEmail?.toLowerCase().trim() === cEmail) ||
      (cName && order.customerName?.toLowerCase().trim() === cName);

    if (currentUser && !isElevated && !isOwner) {
      return null; // Customer data isolation: unauthorized
    }

    const history = StorageEngine.getOrderHistory(order.id);
    const result = normalizeOrderFinancials({
      ...order,
      status: normalizeOrderStatus(order.status),
      history
    });

    // Attach internal notes ONLY to administrators
    if (isElevated) {
      result.internalNotes = StorageEngine.getOrderInternalNotes(order.id, currentUser);
    }

    return result;
  },

  saveOrder: (order) => {
    const list = getLocal('orders', INITIAL_ORDERS);
    const index = list.findIndex(o => o.id === order.id);
    let saved;
    if (index >= 0) {
      const existing = list[index];
      saved = normalizeOrderFinancials({
        ...existing,
        ...order,
        originalDesign: existing.originalDesign || order.originalDesign || existing.design || order.design,
        editedDesign: order.editedDesign !== undefined ? order.editedDesign : existing.editedDesign,
        approvedVersion: order.approvedVersion || existing.approvedVersion || 'original',
        editedAt: order.editedAt || existing.editedAt,
        editedBy: order.editedBy || existing.editedBy,
        updatedAt: new Date().toISOString()
      });
      list[index] = saved;
    } else {
      const orderRef = order.orderReference || `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      saved = normalizeOrderFinancials({
        ...order,
        id: order.id || orderRef,
        orderReference: orderRef,
        originalDesign: order.originalDesign || order.design,
        editedDesign: order.editedDesign || null,
        approvedVersion: order.approvedVersion || 'original',
        editedAt: order.editedAt || null,
        editedBy: order.editedBy || null,
        orderDate: order.orderDate || new Date().toISOString(),
        status: normalizeOrderStatus(order.status || 'design_submitted'),
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      list.unshift(saved);
    }
    setLocal('orders', list);
    try {
      const designsList = getLocal('designs', INITIAL_DESIGNS);
      const linkedD = designsList.find(d => d.id === saved.designId || d.orderId === saved.id || d.orderId === saved.orderReference);
      if (linkedD) {
        linkedD.printOrder = { ...saved };
        setLocal('designs', designsList);
        StorageEngine.syncDesignToCloud(linkedD);
      }
    } catch (_) {}
    safeDispatchEvent('flocard_order_updated', saved);
    return saved;
  },

  /**
   * Saves administrator modifications to a customer's card design artwork.
   * Crucially retains the customer's original design in version history (originalDesign)
   * while storing the modified artwork in editedDesign and updating the order in place
   * without creating duplicate order records.
   */
  saveAdminOrderDesign: (orderId, updatedDesignConfig, adminUser = null, options = { publishToCustomer: true }) => {
    const list = getLocal('orders', INITIAL_ORDERS);
    const index = list.findIndex(o => o.id === orderId || o.orderReference === orderId);
    if (index === -1) {
      throw new Error(`Order with ID ${orderId} not found.`);
    }

    const order = list[index];
    const originalDesign = order.originalDesign || JSON.parse(JSON.stringify(order.design || {
      front: order.frontConfig || {},
      back: order.backConfig || {},
      customColors: order.customColors || {},
      customerLogo: order.customerLogo,
      flocardLogo: order.flocardLogo,
      templateType: order.templateType,
      edition: order.edition,
      title: order.designTitle
    }));

    const editedDesign = JSON.parse(JSON.stringify(updatedDesignConfig));
    const nowIso = new Date().toISOString();
    const adminIdentifier = adminUser?.email || adminUser?.name || 'FLOCARDS Design Team';
    const publish = options.publishToCustomer !== false;

    const updatedOrder = normalizeOrderFinancials({
      ...order,
      originalDesign,
      editedDesign,
      approvedVersion: publish ? 'admin_edited' : (order.approvedVersion || 'original'),
      editedAt: nowIso,
      editedBy: adminIdentifier,
      updatedAt: nowIso
    });

    if (publish) {
      updatedOrder.design = JSON.parse(JSON.stringify(editedDesign));
      if (editedDesign.edition) updatedOrder.edition = editedDesign.edition;
      if (editedDesign.templateType) updatedOrder.templateType = editedDesign.templateType;
      if (editedDesign.front) {
        updatedOrder.frontConfig = editedDesign.front;
        if (editedDesign.front.role) updatedOrder.role = editedDesign.front.role;
        if (editedDesign.front.tagline) updatedOrder.tagline = editedDesign.front.tagline;
        if (editedDesign.front.name) updatedOrder.customerName = editedDesign.front.name;
      }
      if (editedDesign.back) updatedOrder.backConfig = editedDesign.back;
      if (editedDesign.customColors) updatedOrder.customColors = editedDesign.customColors;
      if (editedDesign.customerLogo) updatedOrder.customerLogo = editedDesign.customerLogo;
      if (editedDesign.flocardLogo) updatedOrder.flocardLogo = editedDesign.flocardLogo;
      if (editedDesign.title) updatedOrder.designTitle = editedDesign.title;
    }

    list[index] = updatedOrder;
    setLocal('orders', list);

    // If order has a linked design in the designs library, keep its history in sync
    if (order.designId) {
      const designsList = getLocal('designs', INITIAL_DESIGNS);
      const dIndex = designsList.findIndex(d => d.id === order.designId || d.orderId === order.id);
      if (dIndex >= 0) {
        const curD = designsList[dIndex];
        const updatedD = {
          ...curD,
          originalDesign: curD.originalDesign || JSON.parse(JSON.stringify(curD)),
          editedDesign,
          approvedVersion: publish ? 'admin_edited' : (curD.approvedVersion || 'original'),
          editedAt: nowIso,
          editedBy: adminIdentifier,
          ...(publish ? editedDesign : {}),
          id: curD.id,
          printOrder: updatedOrder,
          updatedAt: nowIso
        };
        designsList[dIndex] = updatedD;
        setLocal('designs', designsList);
        StorageEngine.syncDesignToCloud(updatedD);
      }
    }

    safeDispatchEvent('flocard_order_updated', updatedOrder);
    return updatedOrder;
  },

  createOrderFromDesign: (design, notes = '', customerUser = null) => {
    const orders = getLocal('orders', INITIAL_ORDERS);
    const existing = orders.find(o => o.designId === design.id);
    if (existing) {
      const customerName = (design.customerName || customerUser?.name || design.front?.name || existing.customerName || '').trim();
      const email = (design.customerEmail || customerUser?.email || existing.customerEmail || '').trim();
      const phone = (design.customerPhone || customerUser?.phone || existing.customerPhone || '').trim();
      const company = (design.company || customerUser?.company || design.front?.company || existing.company || '').trim();
      const logoUrl = design.customerLogo?.url || (typeof design.customerLogo === 'string' ? design.customerLogo : null) || design.front?.customLogo || existing.customerLogo;

      existing.originalDesign = existing.originalDesign || JSON.parse(JSON.stringify(existing.design || design));
      existing.design = JSON.parse(JSON.stringify(design)); // Frozen snapshot of submitted design
      existing.approvedVersion = existing.approvedVersion || 'original';
      existing.customerName = customerName;
      existing.customerEmail = email;
      existing.customerPhone = phone;
      existing.company = company;
      existing.customerLogo = design.customerLogo || logoUrl;
      existing.flocardLogo = design.flocardLogo || existing.flocardLogo || { size: 100, position: 'top-left' };
      existing.templateType = design.templateType || existing.templateType;
      existing.edition = design.edition || existing.edition;
      existing.frontConfig = design.front || existing.frontConfig;
      existing.backConfig = design.back || existing.backConfig;
      existing.customColors = design.customColors || existing.customColors;
      existing.role = design.front?.role || existing.role || '';
      existing.tagline = design.front?.tagline || existing.tagline || '';
      existing.updatedAt = new Date().toISOString();
      setLocal('orders', orders);
      return existing;
    }

    const customerName = (design.customerName || customerUser?.name || design.front?.name || '').trim();
    const email = (design.customerEmail || customerUser?.email || '').trim();
    const phone = (design.customerPhone || customerUser?.phone || '').trim();
    const company = (design.company || customerUser?.company || design.front?.company || '').trim();
    const logoUrl = design.customerLogo?.url || (typeof design.customerLogo === 'string' ? design.customerLogo : null) || design.front?.customLogo || null;
    const orderRef = `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: orderRef,
      orderReference: orderRef,
      designId: design.id,
      design: JSON.parse(JSON.stringify(design)), // Frozen snapshot of submitted design
      originalDesign: JSON.parse(JSON.stringify(design)), // Retained original customer submission
      editedDesign: null,
      approvedVersion: 'original',
      editedAt: null,
      editedBy: null,
      designTitle: design.title || (customerName ? `${customerName}'s Card Design` : 'Custom Card Design'),
      templateType: design.templateType || 'standard',
      edition: design.edition || 'purple',
      customerId: design.customerId || customerUser?.id || `cust_${Date.now()}`,
      customerName: customerName || '',
      customerEmail: email,
      customerPhone: phone,
      company,
      customerLogo: design.customerLogo || logoUrl,
      flocardLogo: design.flocardLogo || { size: 100, position: 'top-left' },
      role: design.front?.role || '',
      tagline: design.front?.tagline || '',
      frontConfig: design.front || {},
      backConfig: design.back || {},
      customColors: design.customColors || {},
      status: 'new_order',
      paymentStatus: 'payment_pending',
      paymentReference: null,
      pricing: calculateOrderPricing({ edition: design.edition || 'purple', quantity: 1, hasInvoiceAddon: false }),
      hasInvoiceAddon: false,
      invoiceEligible: false,
      billingDetails: {},
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalAmount: 1899,
      quantity: 1,
      shippingAddress: design.shippingAddress || '',
      trackingNumber: null,
      carrierName: null,
      trackingUrl: null,
      estimatedDeliveryAt: null,
      approvalNotes: notes || design.reviewNotes || 'Design artwork submitted for print review',
      cardCode: null,
      profileSlug: null
    };

    orders.unshift(newOrder);
    setLocal('orders', orders);

    // Initial immutable status history entry
    StorageEngine.addOrderStatusHistoryEntry({
      orderId: newOrder.id,
      previousStatus: null,
      newStatus: 'new_order',
      publicMessage: 'Order received and digital design submitted for print review.',
      actorUserId: customerUser?.id || 'customer',
      actorName: customerName
    });

    // Customer in-app notification
    StorageEngine.createNotification({
      recipientUserId: newOrder.customerId,
      orderId: newOrder.id,
      title: 'Order Received',
      message: `Your FLOCARD order ${newOrder.orderReference} has been received and submitted for verification.`
    });

    // Ensure customer exists in customers list
    const customers = getLocal('customers', INITIAL_CUSTOMERS);
    let cust = customers.find(c => c.id === newOrder.customerId || c.email.toLowerCase() === newOrder.customerEmail.toLowerCase());
    if (cust) {
      cust.totalDesigns = (cust.totalDesigns || 0) + 1;
      setLocal('customers', customers);
    } else {
      customers.unshift({
        id: newOrder.customerId,
        name: customerName,
        email: newOrder.customerEmail,
        phone: newOrder.customerPhone,
        company,
        avatar: logoUrl,
        totalCards: 0,
        totalDesigns: 1,
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0]
      });
      setLocal('customers', customers);
    }

    // Link design back to order
    const designs = getLocal('designs', INITIAL_DESIGNS);
    const dItem = designs.find(d => d.id === design.id);
    if (dItem) {
      dItem.orderId = newOrder.id;
      dItem.status = 'submitted';
      setLocal('designs', designs);
    }

    StorageEngine.addAuditLog(
      'Order Placement',
      `Production order ${newOrder.id} created for design ${design.id} (${customerName})`,
      customerName
    );

    // Dispatch realtime update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_order_updated', { detail: { orderId: newOrder.id, status: newOrder.status } }));
      window.dispatchEvent(new CustomEvent('flocard_notification_created', { detail: { customerId: newOrder.customerId } }));
    }

    return newOrder;
  },

  // Authoritative Print Order Submission with validation, duplicate prevention, and server-side pricing
  submitPrintOrder: (payload = {}) => {
    const design = payload.design || payload.cardConfig || payload.cardDesign;
    const customerDetails = payload.customerDetails || {
      name: payload.customerName,
      email: payload.customerEmail,
      phone: payload.customerPhone,
      shippingAddress: payload.shippingAddress || payload.shipping_address,
      company: payload.company
    };
    const billingDetails = payload.billingDetails || payload.billing_details || {};
    const hasInvoiceAddon = Boolean(payload.hasInvoiceAddon ?? payload.has_invoice_addon ?? false);
    const quantity = payload.quantity || 1;
    const notes = payload.notes || '';
    const customerUser = payload.customerUser || null;
    const idempotencyKey = payload.idempotencyKey || null;

    if (!design) {
      throw new Error('Card design configuration is required to submit a print order.');
    }

    const orders = getLocal('orders', INITIAL_ORDERS);
    const now = Date.now();
    const customerEmail = (customerDetails.email || customerUser?.email || design.customerEmail || '').toLowerCase().trim();
    const customerPhone = (customerDetails.phone || customerUser?.phone || design.customerPhone || '').trim();
    const customerName = (design.front?.name || design.customerName || customerDetails.name || customerUser?.name || '').trim();
    const shippingAddress = (customerDetails.shippingAddress || customerDetails.address || design.shippingAddress || '').trim();

    // 1. Validate required customer and order fields
    if (!customerName || customerName.length < 2) {
      throw new Error('Please enter customer full name.');
    }
    // Phone number is optional: only validate length if provided
    if (customerPhone && customerPhone.replace(/[^0-9]/g, '').length < 8) {
      throw new Error('Please enter a valid contact number (at least 8 digits) or leave it empty.');
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!shippingAddress || shippingAddress.length < 5) {
      throw new Error('Please provide a complete shipping / delivery address.');
    }

    // 2. Prevent duplicate order creation if customer double-clicks or retries
    const recentDuplicate = orders.find(o => {
      if (idempotencyKey && o.idempotencyKey === idempotencyKey) return true;
      const isSameDesign = o.designId === design.id;
      const isSameEmail = (o.customerEmail || '').toLowerCase().trim() === customerEmail;
      const timeDiff = now - new Date(o.createdAt).getTime();
      return isSameDesign && isSameEmail && timeDiff < 30000 && o.status === 'new_order';
    });

    if (recentDuplicate) {
      return recentDuplicate;
    }

    // 3. Calculate authoritative pricing
    const safeQty = Math.max(1, parseInt(quantity, 10) || 1);
    const edition = design.edition || 'purple';
    const pricing = calculateOrderPricing({
      edition,
      quantity: safeQty,
      hasInvoiceAddon: Boolean(hasInvoiceAddon)
    });

    // 4. Generate unique order reference
    const orderRef = `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const clientSlug = customerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
    const logoUrl = design.customerLogo?.url || (typeof design.customerLogo === 'string' ? design.customerLogo : null) || design.front?.customLogo || null;

    const newOrder = {
      id: orderRef,
      orderReference: orderRef,
      idempotencyKey: idempotencyKey || `idem_${now}_${Math.random().toString(36).substring(2, 9)}`,
      designId: design.id,
      design: JSON.parse(JSON.stringify(design)), // Frozen permanent snapshot of submitted design
      designTitle: design.title || `${customerName}'s Card Design`,
      templateType: design.templateType || 'standard',
      edition: edition,
      productName: pricing.productName,
      customerId: customerUser?.id || design.customerId || `cust_${now}`,
      customerName,
      customerEmail,
      customerPhone,
      company: customerDetails.company || design.company || customerUser?.company || design.front?.company || '',
      role: design.front?.role || '',
      tagline: design.front?.tagline || '',
      frontConfig: design.front || {},
      backConfig: design.back || {},
      customColors: design.customColors || {},
      customerLogo: design.customerLogo || logoUrl,
      flocardLogo: design.flocardLogo || { size: 100, position: 'top-left' },
      shippingAddress,
      billingDetails: {
        company: billingDetails.company || customerDetails.company || '',
        gstin: (billingDetails.gstin || '').toUpperCase().trim(),
        address: billingDetails.address || shippingAddress,
        city: billingDetails.city || '',
        state: billingDetails.state || '',
        postalCode: billingDetails.postalCode || ''
      },
      hasInvoiceAddon: Boolean(hasInvoiceAddon),
      invoiceEligible: Boolean(hasInvoiceAddon),
      pricing,
      pricingBreakdown: pricing,
      pricing_breakdown: pricing,
      totalAmount: pricing.totalAmount,
      quantity: safeQty,
      status: 'new_order',
      paymentStatus: 'payment_pending',
      paymentReference: null,
      source: 'web_studio',
      approvalNotes: notes || 'Submitted via Card Designer for Print Production & WhatsApp Confirmation',
      profileSlug: design.profileSlug || clientSlug,
      trackingNumber: null,
      carrierName: null,
      trackingUrl: null,
      estimatedDeliveryAt: null,
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    orders.unshift(newOrder);
    setLocal('orders', orders);

    // Initial immutable audit trail
    StorageEngine.addOrderStatusHistoryEntry({
      orderId: newOrder.id,
      previousStatus: null,
      newStatus: 'new_order',
      publicMessage: 'Order received and digital design submitted for print review. Team will coordinate payment via WhatsApp.',
      actorUserId: customerUser?.id || 'customer',
      actorName: customerName
    });

    // Customer in-app notification
    StorageEngine.createNotification({
      recipientUserId: newOrder.customerId,
      orderId: newOrder.id,
      title: 'Print Order Placed',
      message: `Your FLOCARDS print order ${newOrder.orderReference} has been placed. Our team will contact you on WhatsApp to confirm details.`
    });

    // Ensure customer account record exists
    const customers = getLocal('customers', INITIAL_CUSTOMERS);
    let cust = customers.find(c => c.id === newOrder.customerId || c.email?.toLowerCase() === customerEmail);
    if (cust) {
      cust.totalDesigns = (cust.totalDesigns || 0) + 1;
      cust.phone = customerPhone || cust.phone;
      setLocal('customers', customers);
    } else {
      customers.unshift({
        id: newOrder.customerId,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        company: newOrder.company,
        avatar: logoUrl,
        totalCards: 0,
        totalDesigns: 1,
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0]
      });
      setLocal('customers', customers);
    }

    // Link design status back to order and attach authoritative print order snapshot
    const designs = getLocal('designs', INITIAL_DESIGNS);
    const dItem = designs.find(d => d.id === design.id);
    if (dItem) {
      dItem.orderId = newOrder.id;
      dItem.status = 'submitted';
      dItem.printOrder = newOrder;
      setLocal('designs', designs);
      StorageEngine.syncDesignToCloud(dItem);
    } else {
      const orphanDesign = {
        id: design.id || `des_${Date.now()}`,
        title: design.title || `${customerName}'s Card Design`,
        customerName,
        customerEmail,
        customerPhone,
        company: newOrder.company,
        edition,
        templateType: design.templateType || 'standard',
        front: design.front || {},
        back: design.back || {},
        status: 'submitted',
        orderId: newOrder.id,
        printOrder: newOrder
      };
      designs.unshift(orphanDesign);
      setLocal('designs', designs);
      StorageEngine.syncDesignToCloud(orphanDesign);
    }

    // 5. Automatic NFC Card Details to Digital Profile (Requirement 4)
    const profiles = getLocal('profiles', INITIAL_PROFILES);
    const existingProfile = profiles.find(p => 
      (newOrder.customerId && p.userId === newOrder.customerId) ||
      (customerEmail && p.email?.toLowerCase() === customerEmail) ||
      (p.slug && p.slug.toLowerCase() === clientSlug)
    );

    if (!existingProfile) {
      const prefilledProfile = {
        id: `prof_${now}`,
        userId: newOrder.customerId,
        name: customerName,
        slug: clientSlug,
        role: design.front?.role || '',
        company: newOrder.company || '',
        tagline: design.front?.tagline || '',
        bio: design.front?.tagline || '',
        avatar: '', // Logo is NOT personal avatar; keep avatar empty until user uploads a photo
        logo: logoUrl || '', // Only set if customer explicitly uploaded a logo
        phone: customerPhone || '',
        email: customerEmail || '',
        whatsapp: customerPhone ? customerPhone.replace(/[^0-9]/g, '') : '',
        location: shippingAddress || '',
        website: design.front?.website || design.back?.website || '',
        linkedin: design.back?.linkedin || '',
        instagram: design.back?.instagram || '',
        theme: edition || 'purple',
        status: 'active',
        viewsCount: 0,
        saveCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      profiles.unshift(prefilledProfile);
      setLocal('profiles', profiles);
      StorageEngine.syncProfileToCloud(prefilledProfile);
    } else {
      // Profile already exists: Only prefill missing/blank fields so customized edits are preserved!
      let updated = false;
      if (!existingProfile.phone && customerPhone) {
        existingProfile.phone = customerPhone;
        updated = true;
      }
      if (!existingProfile.whatsapp && customerPhone) {
        existingProfile.whatsapp = customerPhone.replace(/[^0-9]/g, '');
        updated = true;
      }
      if (!existingProfile.company && newOrder.company) {
        existingProfile.company = newOrder.company;
        updated = true;
      }
      if (!existingProfile.role && design.front?.role) {
        existingProfile.role = design.front.role;
        updated = true;
      }
      if (!existingProfile.logo && logoUrl) {
        existingProfile.logo = logoUrl;
        updated = true;
      }
      if (updated) {
        existingProfile.updatedAt = new Date().toISOString();
        setLocal('profiles', profiles);
        StorageEngine.syncProfileToCloud(existingProfile);
      }
    }

    StorageEngine.addAuditLog(
      'Print Order Submission',
      `Print order ${newOrder.orderReference} (${newOrder.id}) submitted by ${customerName} (Payment Pending, Total: ₹${newOrder.totalAmount})`,
      customerName
    );

    // Asynchronously synchronize with Supabase orders table if available
    (async () => {
      try {
        const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('./supabase.js');
        if (!isSupabaseConfigured) return;
        const client = supabaseAdmin || supabase;
        if (!client) return;

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const orderRow = {
          order_reference: newOrder.orderReference,
          customer_name: newOrder.customerName,
          customer_email: newOrder.customerEmail,
          customer_phone: newOrder.customerPhone,
          company: newOrder.company,
          status: newOrder.status,
          shipping_address: newOrder.shippingAddress,
          total_amount: newOrder.totalAmount,
          created_at: newOrder.createdAt,
          updated_at: newOrder.updatedAt
        };
        if (uuidRegex.test(newOrder.id)) {
          orderRow.id = newOrder.id;
        }
        await client.from('orders').upsert(orderRow, { onConflict: 'order_reference' });
      } catch (err) {
        // Silently handled: print order already persisted and broadcast via card_designs
      }
    })();

    safeDispatchEvent('flocard_order_updated', { orderId: newOrder.id, status: newOrder.status });
    safeDispatchEvent('flocard_notification_created', { customerId: newOrder.customerId });

    return newOrder;
  },

  assignDesignToOrder: (designId, notes = '', adminUser = null) => {
    const list = getLocal('designs', INITIAL_DESIGNS);
    const item = list.find(d => d.id === designId);
    if (!item) return null;

    item.status = 'approved';
    item.reviewNotes = notes || item.reviewNotes || 'Design approved and assigned to manufacturing order.';
    item.reviewedAt = new Date().toISOString();

    const order = StorageEngine.createOrderFromDesign(item, item.reviewNotes, null);
    item.orderId = order.id;
    setLocal('designs', list);

    // Advance order to artwork_approved
    StorageEngine.updateOrderStatus({
      orderId: order.id,
      newStatus: 'artwork_approved',
      publicMessage: 'Design artwork approved by pre-press engineering. Print queues scheduled.',
      internalNote: notes || 'Design artwork checked and approved for production.',
      actorUser: adminUser || { id: 'admin', name: 'FLOCARDS Administrator', role: 'admin' }
    });

    return { design: item, order };
  },

  // Controlled, authorized status update with validation, history, and customer notifications
  updateOrderStatus: (params, legacyStatus = null, legacyMeta = {}) => {
    let opts = {};
    if (typeof params === 'string') {
      opts = {
        orderId: params,
        newStatus: legacyStatus,
        ...(typeof legacyMeta === 'object' ? legacyMeta : {})
      };
    } else {
      opts = params || {};
    }

    const {
      orderId,
      newStatus,
      publicMessage = '',
      internalNote = '',
      carrierName = null,
      trackingNumber = null,
      trackingUrl = null,
      estimatedDeliveryAt = null,
      actorUser = null,
      actor = null
    } = opts;

    const actualActor = actorUser || actor;

    // Authorization verification
    const isElevated = isElevatedUser(actualActor);
    if (actualActor && !isElevated) {
      throw new Error('Access Denied: Only administrators can update order status.');
    }

    const orders = getLocal('orders', INITIAL_ORDERS);
    const orderIndex = orders.findIndex(o => o.id === orderId || o.orderReference === orderId);
    if (orderIndex < 0) {
      throw new Error(`Order ${orderId} not found.`);
    }

    const order = orders[orderIndex];
    const prevStatus = normalizeOrderStatus(order.status);
    const targetStatus = normalizeOrderStatus(newStatus);

    // Validate status value against recognized fulfillment and exception stages
    const validStages = [...ORDER_STAGES.map(s => s.key), ...EXCEPTION_STAGES.map(s => s.key)];
    if (!validStages.includes(targetStatus)) {
      throw new Error(`Invalid status transition: "${newStatus}" is not a recognized fulfillment stage.`);
    }

    // Update order fields
    order.status = targetStatus;
    order.updatedAt = new Date().toISOString();

    if (carrierName !== undefined && carrierName !== null) order.carrierName = carrierName || null;
    if (trackingNumber !== undefined && trackingNumber !== null) order.trackingNumber = trackingNumber || null;
    if (trackingUrl !== undefined && trackingUrl !== null) order.trackingUrl = trackingUrl || null;
    if (estimatedDeliveryAt !== undefined) order.estimatedDeliveryAt = estimatedDeliveryAt || null;

    // Handle delivery completion & auto-provisioning
    if (targetStatus === 'delivered') {
      order.deliveredAt = order.deliveredAt || new Date().toISOString();
      const provisioned = StorageEngine.deliverOrder(order.id, actualActor);
      if (provisioned?.order) {
        order.cardCode = provisioned.card?.cardCode || order.cardCode;
        order.profileSlug = provisioned.profile?.slug || order.profileSlug;
        order.status = 'delivered';
      }
    }

    // Refresh orders from store in case deliverOrder updated it
    const refreshedOrders = getLocal('orders', INITIAL_ORDERS);
    const refreshedIdx = refreshedOrders.findIndex(o => o.id === orderId || o.orderReference === orderId);
    if (refreshedIdx >= 0) {
      refreshedOrders[refreshedIdx] = { ...refreshedOrders[refreshedIdx], ...order };
      setLocal('orders', refreshedOrders);
    } else {
      orders[orderIndex] = order;
      setLocal('orders', orders);
    }

    // 1. Record immutable status history entry (if not already recorded by deliverOrder)
    const finalPublicMessage = (publicMessage || '').trim() || getDefaultPublicMessage(targetStatus);
    if (targetStatus !== 'delivered') {
      StorageEngine.addOrderStatusHistoryEntry({
        orderId: order.id,
        previousStatus: prevStatus,
        newStatus: targetStatus,
        publicMessage: finalPublicMessage,
        actorUserId: actualActor?.id || 'admin',
        actorName: actualActor?.name || 'Operations Lead'
      });
    }

    // 2. Record internal administrative note if provided (NEVER exposed to customer)
    if (internalNote && internalNote.trim()) {
      StorageEngine.addOrderInternalNote({
        orderId: order.id,
        note: internalNote.trim(),
        authorUser: actualActor
      });
    }

    // 3. Create customer in-app notification (if not already recorded by deliverOrder)
    if (targetStatus !== 'delivered') {
      const stageInfo = getOrderStageInfo(targetStatus);
      StorageEngine.createNotification({
        recipientUserId: order.customerId,
        orderId: order.id,
        orderReference: order.orderReference,
        status: targetStatus,
        title: `Order Status: ${stageInfo.label}`,
        message: finalPublicMessage
      });
    }

    // 4. Log audit log
    StorageEngine.addAuditLog(
      'Order Fulfillment',
      `Order ${order.orderReference || order.id} status updated from "${prevStatus}" to "${targetStatus}" for ${order.customerName}`,
      actualActor?.name || 'Administrator'
    );

    // Sync updated order status back to linked design in cloud (production only)
    try {
      const designs = getLocal('designs', INITIAL_DESIGNS);
      const linkedDesign = designs.find(d => d.orderId === order.id || d.id === order.designId);
      if (linkedDesign) {
        linkedDesign.printOrder = { ...order };
        setLocal('designs', designs);
        StorageEngine.syncDesignToCloud(linkedDesign);
      }
    } catch (_) {}

    // Sync status directly to native Supabase orders table
    (async () => {
      try {
        const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('./supabase.js');
        if (isSupabaseConfigured) {
          const client = supabaseAdmin || supabase;
          if (client) {
            await client.from('orders').update({
              status: targetStatus,
              carrier_name: order.carrierName || null,
              tracking_number: order.trackingNumber || null,
              tracking_url: order.trackingUrl || null,
              estimated_delivery_at: order.estimatedDeliveryAt || null,
              updated_at: new Date().toISOString()
            }).eq('order_reference', order.orderReference || order.id);
          }
        }
      } catch (_) {}
    })();

    // 5. Emit browser event for immediate realtime timeline updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_order_updated', {
        detail: {
          orderId: order.id,
          orderReference: order.orderReference,
          status: targetStatus,
          cardCode: order.cardCode,
          profileSlug: order.profileSlug,
          timestamp: new Date().toISOString()
        }
      }));
      window.dispatchEvent(new CustomEvent('flocard_notification_created', {
        detail: { recipientUserId: order.customerId }
      }));
    }

    return { success: true, order, ...order };
  },

  getDeletedOrderIds: () => getLocal('flocard_deleted_order_ids', []),
  deleteOrder: async (orderId, actorUser = null) => {
    const isElevated = !actorUser || isElevatedUser(actorUser);
    if (!isElevated) {
      throw new Error('Unauthorized: Only administrators can delete orders.');
    }
    const orders = getLocal('orders', INITIAL_ORDERS).filter(o => o.id !== orderId && o.orderReference !== orderId);
    setLocal('orders', orders);

    // Also purge associated invoices
    const invoices = getLocal('invoices', []).filter(inv => inv.orderId !== orderId && inv.orderReference !== orderId);
    setLocal('invoices', invoices);

    // Save tombstone
    const tombstoneIds = getLocal('flocard_deleted_order_ids', []);
    if (orderId && !tombstoneIds.includes(orderId)) {
      tombstoneIds.push(orderId);
      setLocal('flocard_deleted_order_ids', tombstoneIds);
    }

    StorageEngine.addAuditLog('Order Fulfillment', `Order deleted: ${orderId}`, actorUser?.name || 'Administrator');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_order_updated', { detail: { deletedId: orderId, orders } }));
    }

    // Call serverless cloud sync
    callCloudSyncApi('deleteOrder', { id: orderId }).catch(() => {});

    // Direct delete from Supabase if client is accessible
    try {
      const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('./supabase.js');
      if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
        const client = supabaseAdmin || supabase;
        await client.from('orders').delete().or(`id.eq.${orderId},order_reference.eq.${orderId}`).catch(() => {});
      }
    } catch (_) {}
    return true;
  },

  deliverOrder: (orderId, actorUser = null) => {
    const orders = getLocal('orders', INITIAL_ORDERS);
    const orderIndex = orders.findIndex(o => o.id === orderId || o.orderReference === orderId);
    if (orderIndex < 0) return null;

    const order = orders[orderIndex];
    const prevStatus = normalizeOrderStatus(order.status);

    // Determine unique slug for customer profile
    const rawSlug = (order.customerName || 'customer')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'client';

    const profiles = getLocal('profiles', INITIAL_PROFILES);
    let finalSlug = rawSlug;
    let collisionCounter = 1;
    while (profiles.some(p => p.slug.toLowerCase() === finalSlug.toLowerCase() && p.id !== order.profileId)) {
      finalSlug = `${rawSlug}-${Math.floor(100 + Math.random() * 900)}`;
      collisionCounter++;
      if (collisionCounter > 10) break;
    }

    // Generate unique NFC Card Code
    const cardCode = order.cardCode || `flc-${rawSlug.slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`;
    const newCard = {
      id: `card_${Date.now()}`,
      cardCode,
      edition: order.edition || 'purple',
      chipType: 'NXP NTAG216 (888 Bytes)',
      status: 'active',
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      profileSlug: finalSlug,
      tapCount: 0,
      registeredAt: new Date().toISOString(),
      orderId: order.id,
      notes: `Auto-provisioned upon delivery of order ${order.orderReference || order.id}`
    };

    // Generate new Digital Profile with customer name, logo, role, and details
    const newProfile = {
      id: `prof_${Date.now()}`,
      userId: order.customerId,
      name: order.frontConfig?.name || order.customerName,
      slug: finalSlug,
      role: order.role || order.frontConfig?.role || '',
      company: order.company || '',
      tagline: order.tagline || order.frontConfig?.tagline || '',
      bio: order.tagline || order.frontConfig?.tagline || '',
      avatar: '',
      logo: order.customerLogo || null,
      phone: order.customerPhone || '',
      email: order.customerEmail || '',
      whatsapp: order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : '',
      location: order.shippingAddress || '',
      website: order.frontConfig?.website || order.backConfig?.website || '',
      theme: order.edition || 'purple',
      status: 'active',
      viewsCount: 0,
      socialLinks: {
        website: order.frontConfig?.website || '',
        linkedin: order.backConfig?.linkedin || '',
        instagram: order.backConfig?.instagram || '',
        whatsapp: order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : ''
      },
      services: [],
      portfolio: [],
      stats: { views: 0, saves: 0, shares: 0 },
      createdAt: new Date().toISOString()
    };

    // Save Card and Profile to storage
    const cards = getLocal('cards', INITIAL_CARDS);
    if (!cards.some(c => c.cardCode === newCard.cardCode)) {
      cards.unshift(newCard);
      setLocal('cards', cards);
    }

    if (!profiles.some(p => p.slug === newProfile.slug)) {
      profiles.unshift(newProfile);
      setLocal('profiles', profiles);
    }

    // Update Customer in customers list
    const customers = getLocal('customers', INITIAL_CUSTOMERS);
    let cust = customers.find(c => c.id === order.customerId || c.email === order.customerEmail || c.name.toLowerCase() === order.customerName.toLowerCase());
    if (cust) {
      cust.totalCards = (cust.totalCards || 0) + 1;
      cust.status = 'active';
      if (!cust.avatar && order.customerLogo) {
        cust.avatar = order.customerLogo;
      }
    }
    setLocal('customers', customers);

    // Update order status & fields
    order.status = 'delivered';
    order.deliveredAt = order.deliveredAt || new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    order.cardCode = newCard.cardCode;
    order.profileSlug = finalSlug;
    orders[orderIndex] = order;
    setLocal('orders', orders);

    // 1. Record immutable status history entry for delivery
    StorageEngine.addOrderStatusHistoryEntry({
      orderId: order.id,
      previousStatus: prevStatus,
      newStatus: 'delivered',
      publicMessage: 'Card delivered to recipient and NFC redirect routing activated.',
      actorUserId: actorUser?.id || 'admin',
      actorName: actorUser?.name || 'Operations Lead'
    });

    // 2. Create customer in-app notification
    StorageEngine.createNotification({
      recipientUserId: order.customerId,
      orderId: order.id,
      orderReference: order.orderReference,
      status: 'delivered',
      title: 'Order Delivered & Card Active!',
      message: `Your FLOCARD (${order.orderReference || order.id}) has been delivered! Your NFC card (${newCard.cardCode}) and digital profile (@${finalSlug}) are now live.`
    });

    // 3. Log audit log
    StorageEngine.addAuditLog(
      'Order Fulfillment',
      `Order ${order.orderReference || order.id} delivered for ${order.customerName}. NFC card ${newCard.cardCode} & Profile @${finalSlug} provisioned.`,
      actorUser?.name || 'Operations Team'
    );

    // 4. Dispatch browser events for immediate realtime reactive updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_order_updated', {
        detail: {
          orderId: order.id,
          orderReference: order.orderReference,
          status: 'delivered',
          cardCode: newCard.cardCode,
          profileSlug: finalSlug,
          timestamp: new Date().toISOString()
        }
      }));
      window.dispatchEvent(new CustomEvent('flocard_notification_created', {
        detail: { recipientUserId: order.customerId }
      }));
      window.dispatchEvent(new CustomEvent('flocard_profile_updated', {
        detail: { profile: newProfile }
      }));
      window.dispatchEvent(new CustomEvent('flocard_card_updated', {
        detail: { card: newCard }
      }));
    }

    return { order, card: newCard, profile: newProfile };
  },

  // Order Status History (Immutable fulfillment audit trail)
  getOrderHistory: (orderId) => {
    const history = getLocal('order_history', INITIAL_ORDER_HISTORY);
    return history
      .filter(h => h.orderId === orderId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  addOrderStatusHistoryEntry: ({ orderId, previousStatus, newStatus, publicMessage, actorUserId, actorName }) => {
    const history = getLocal('order_history', INITIAL_ORDER_HISTORY);
    const entry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      orderId,
      previousStatus: previousStatus ? normalizeOrderStatus(previousStatus) : null,
      newStatus: normalizeOrderStatus(newStatus),
      publicMessage: publicMessage || getDefaultPublicMessage(newStatus),
      actorUserId: actorUserId || 'system',
      actorName: actorName || 'Operations Team',
      createdAt: new Date().toISOString()
    };
    history.push(entry);
    setLocal('order_history', history);
    return entry;
  },

  // Order Internal Notes (Admin-only private notes - NEVER returned to customers)
  getOrderInternalNotes: (orderId, currentUser = null) => {
    const isElevated = isElevatedUser(currentUser);
    if (!isElevated) return [];
    const notes = getLocal('order_internal_notes', INITIAL_ORDER_NOTES);
    return notes
      .filter(n => n.orderId === orderId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  addOrderInternalNote: ({ orderId, note, authorUser = null }) => {
    const isElevated = isElevatedUser(authorUser);
    if (!isElevated) {
      throw new Error('Unauthorized: Only administrators can add internal notes.');
    }
    const notes = getLocal('order_internal_notes', INITIAL_ORDER_NOTES);
    const entry = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      orderId,
      authorUserId: authorUser?.id || 'admin',
      authorName: authorUser?.name || 'Administrator',
      note: note.trim(),
      createdAt: new Date().toISOString()
    };
    notes.unshift(entry);
    setLocal('order_internal_notes', notes);
    return entry;
  },

  // Financial & Ledger Operations
  recordOrderPayment: ({ orderId, amount, method = 'upi', reference = '', note = '', recordedBy = 'Administrator' }) => {
    const orders = getLocal('orders', INITIAL_ORDERS);
    const index = orders.findIndex(o => o.id === orderId || o.orderReference === orderId);
    if (index < 0) throw new Error(`Order ${orderId} not found.`);

    const order = normalizeOrderFinancials(orders[index]);
    const numAmount = Math.max(0, Number(amount) || 0);
    if (numAmount <= 0) throw new Error('Payment amount must be greater than zero.');

    const newAmountPaid = (order.amountPaid || 0) + numAmount;
    const newRefund = order.refundAmount || 0;
    const newOutstanding = Math.max(0, order.totalAmount - newAmountPaid - newRefund);
    const newPaymentStatus = newAmountPaid >= order.totalAmount ? 'paid' : 'partially_paid';

    const txn = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'payment',
      amount: numAmount,
      method: method || 'upi',
      reference: reference || `MAN-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      note: note || 'Offline/manual payment received',
      recordedBy: recordedBy || 'Administrator'
    };

    const updatedOrder = normalizeOrderFinancials({
      ...order,
      amountPaid: newAmountPaid,
      amountOutstanding: newOutstanding,
      paymentStatus: newPaymentStatus,
      paymentMethod: method || order.paymentMethod,
      transactionReference: reference || order.transactionReference,
      paymentTransactions: [txn, ...(order.paymentTransactions || [])],
      updatedAt: new Date().toISOString()
    });

    orders[index] = updatedOrder;
    setLocal('orders', orders);

    StorageEngine.addAuditLog(
      'Sales Ledger',
      `Payment of ₹${numAmount.toLocaleString('en-IN')} recorded for ${order.id} (${order.customerName}) via ${method.toUpperCase()}${reference ? ' Ref: ' + reference : ''}`,
      recordedBy
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_order_updated', { detail: updatedOrder }));
      window.dispatchEvent(new CustomEvent('flocard_sales_updated', { detail: { type: 'payment', orderId } }));
    }

    return updatedOrder;
  },

  recordOrderRefund: ({ orderId, amount, reason, recordedBy = 'Administrator' }) => {
    if (!reason || !reason.trim()) {
      throw new Error('A valid reason is strictly required to issue a financial refund.');
    }
    const orders = getLocal('orders', INITIAL_ORDERS);
    const index = orders.findIndex(o => o.id === orderId || o.orderReference === orderId);
    if (index < 0) throw new Error(`Order ${orderId} not found.`);

    const order = normalizeOrderFinancials(orders[index]);
    const numAmount = Math.max(0, Number(amount) || 0);
    if (numAmount <= 0) throw new Error('Refund amount must be greater than zero.');

    const currentRefund = order.refundAmount || 0;
    const maxRefundable = Math.max(0, (order.amountPaid || 0) - currentRefund);
    if (numAmount > maxRefundable && maxRefundable > 0) {
      throw new Error(`Refund amount (₹${numAmount}) exceeds refundable balance (₹${maxRefundable}).`);
    }

    const newRefundAmount = currentRefund + numAmount;
    const newOutstanding = Math.max(0, order.totalAmount - (order.amountPaid || 0) - newRefundAmount);
    const newPaymentStatus = newRefundAmount >= (order.amountPaid || order.totalAmount) ? 'refunded' : order.paymentStatus;

    const txn = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'refund',
      amount: numAmount,
      method: order.paymentMethod || 'upi',
      reference: `REF-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      reason: reason.trim(),
      note: `Refund: ${reason.trim()}`,
      recordedBy: recordedBy || 'Administrator'
    };

    const updatedOrder = normalizeOrderFinancials({
      ...order,
      refundAmount: newRefundAmount,
      amountOutstanding: newOutstanding,
      paymentStatus: newPaymentStatus,
      paymentTransactions: [txn, ...(order.paymentTransactions || [])],
      updatedAt: new Date().toISOString()
    });

    orders[index] = updatedOrder;
    setLocal('orders', orders);

    StorageEngine.addAuditLog(
      'Sales Ledger',
      `Refund of ₹${numAmount.toLocaleString('en-IN')} issued for ${order.id} (${order.customerName}). Reason: ${reason.trim()}`,
      recordedBy
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_order_updated', { detail: updatedOrder }));
      window.dispatchEvent(new CustomEvent('flocard_sales_updated', { detail: { type: 'refund', orderId } }));
    }

    return updatedOrder;
  },

  recordFinancialAdjustment: ({ orderId, type, amount, reason, recordedBy = 'Administrator' }) => {
    if (!reason || !reason.trim()) {
      throw new Error('A reason is required to record a manual financial adjustment.');
    }
    const orders = getLocal('orders', INITIAL_ORDERS);
    const index = orders.findIndex(o => o.id === orderId || o.orderReference === orderId);
    if (index < 0) throw new Error(`Order ${orderId} not found.`);

    const order = normalizeOrderFinancials(orders[index]);
    const numAmount = Number(amount) || 0;

    let newDiscount = order.discount || 0;
    let newTax = order.tax || 0;
    let newShipping = order.shippingCharge || 0;

    if (type === 'discount') {
      newDiscount = Math.max(0, (order.discount || 0) + numAmount);
    } else if (type === 'tax') {
      newTax = Math.max(0, (order.tax || 0) + numAmount);
    } else if (type === 'shipping') {
      newShipping = Math.max(0, (order.shippingCharge || 0) + numAmount);
    }

    const unitPrice = order.unitPrice || 0;
    const qty = order.quantity || 1;
    const newTotal = Math.max(0, (unitPrice * qty) - newDiscount + newTax + newShipping);
    const newOutstanding = Math.max(0, newTotal - (order.amountPaid || 0) - (order.refundAmount || 0));

    const adj = {
      id: `adj_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'adjustment',
      adjustmentType: type,
      amount: numAmount,
      reason: reason.trim(),
      date: new Date().toISOString(),
      recordedBy: recordedBy || 'Administrator'
    };

    const updatedOrder = normalizeOrderFinancials({
      ...order,
      discount: newDiscount,
      tax: newTax,
      shippingCharge: newShipping,
      totalAmount: newTotal,
      amountOutstanding: newOutstanding,
      paymentTransactions: [adj, ...(order.paymentTransactions || [])],
      updatedAt: new Date().toISOString()
    });

    orders[index] = updatedOrder;
    setLocal('orders', orders);

    StorageEngine.addAuditLog(
      'Sales Ledger',
      `Financial adjustment (${type}: ₹${numAmount}) applied to ${order.id}. Reason: ${reason.trim()}`,
      recordedBy
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_order_updated', { detail: updatedOrder }));
      window.dispatchEvent(new CustomEvent('flocard_sales_updated', { detail: { type: 'adjustment', orderId } }));
    }

    return updatedOrder;
  },

  getInvoiceSettings: () => getLocal('invoice_settings', DEFAULT_INVOICE_SETTINGS),
  saveInvoiceSettings: (settings, adminEmail = 'admin@flocard.in') => {
    const current = StorageEngine.getInvoiceSettings();
    const updated = { ...current, ...settings };
    setLocal('invoice_settings', updated);
    StorageEngine.addAuditLog('Invoice Settings', 'Tax invoice billing and GST configuration updated', adminEmail);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_invoice_settings_updated', { detail: updated }));
    }
    return { success: true, settings: updated };
  },

  // In-App Customer Notifications
  getNotifications: (currentUser = null) => {
    if (!currentUser) return [];
    const list = getLocal('customer_notifications', INITIAL_NOTIFICATIONS);
    const cId = currentUser.id;
    const cEmail = (currentUser.email || '').toLowerCase();
    return list
      .filter(n => n.recipientUserId === cId || (cEmail && n.recipientEmail?.toLowerCase() === cEmail))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  markNotificationRead: (notificationId, currentUser = null) => {
    const list = getLocal('customer_notifications', INITIAL_NOTIFICATIONS);
    const item = list.find(n => n.id === notificationId);
    if (item) {
      const isOwner = !currentUser || item.recipientUserId === currentUser.id;
      if (isOwner) {
        item.readAt = new Date().toISOString();
        setLocal('customer_notifications', list);
      }
    }
    return item;
  },

  markAllNotificationsRead: (currentUser = null) => {
    if (!currentUser) return;
    const list = getLocal('customer_notifications', INITIAL_NOTIFICATIONS);
    const cId = currentUser.id;
    list.forEach(n => {
      if (n.recipientUserId === cId && !n.readAt) {
        n.readAt = new Date().toISOString();
      }
    });
    setLocal('customer_notifications', list);
  },

  createNotification: ({ recipientUserId, recipientEmail = null, orderId = null, orderReference = null, status = null, title, message }) => {
    if (!recipientUserId && !recipientEmail) return null;
    const list = getLocal('customer_notifications', INITIAL_NOTIFICATIONS);
    const notif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      recipientUserId,
      recipientEmail,
      orderId,
      orderReference,
      status,
      title: title || 'Order Update',
      message: message || 'Your order has been updated.',
      readAt: null,
      createdAt: new Date().toISOString()
    };
    list.unshift(notif);
    setLocal('customer_notifications', list);
    return notif;
  },

  // Privacy-Conscious Real Analytics Engine (Calculated strictly from real events)
  getRealAnalytics: (currentUser = null) => {
    if (!currentUser) {
      return { totalViews: 0, totalTaps: 0, totalScans: 0, totalDownloads: 0, totalShares: 0, recentEvents: [] };
    }
    const profiles = StorageEngine.getProfiles().filter(p => p.userId === currentUser.id || p.email?.toLowerCase() === currentUser.email?.toLowerCase());
    const cards = StorageEngine.getCards().filter(c => c.customerId === currentUser.id || c.customerEmail?.toLowerCase() === currentUser.email?.toLowerCase());

    const userSlugs = new Set(profiles.map(p => p.slug.toLowerCase()));
    const userCodes = new Set(cards.map(c => c.cardCode.toLowerCase()));

    const allEvents = getLocal('analytics_events', INITIAL_ANALYTICS_EVENTS);
    const matchingEvents = allEvents.filter(e =>
      (e.profileSlug && userSlugs.has(e.profileSlug.toLowerCase())) ||
      (e.cardCode && userCodes.has(e.cardCode.toLowerCase()))
    );

    return {
      totalViews: matchingEvents.filter(e => e.eventType === 'profile_view').length,
      totalTaps: matchingEvents.filter(e => e.eventType === 'nfc_tap').length,
      totalScans: matchingEvents.filter(e => e.eventType === 'qr_scan').length,
      totalDownloads: matchingEvents.filter(e => e.eventType === 'vcard_download').length,
      totalShares: matchingEvents.filter(e => e.eventType === 'share_click').length,
      recentEvents: matchingEvents.slice(0, 50)
    };
  },

  logAnalyticsEvent: ({ cardCode = null, profileSlug = null, eventType = 'profile_view', clientMeta = {} }) => {
    const events = getLocal('analytics_events', INITIAL_ANALYTICS_EVENTS);
    const newEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      cardCode,
      profileSlug,
      eventType,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      createdAt: new Date().toISOString(),
      ...clientMeta
    };
    events.unshift(newEvent);
    setLocal('analytics_events', events.slice(0, 1000));
    return newEvent;
  },

  // Customers
  getCustomers: () => getLocal('customers', INITIAL_CUSTOMERS),
  saveLocalCustomers: (customers) => {
    setLocal('customers', customers);
  },
  syncCustomerToCloud: async (cust) => {
    if (!cust) return null;
    // 1. Primary: Serverless cloud sync API (runs on backend with full privileges, zero browser Origin/secret restrictions)
    try {
      const serverResult = await callCloudSyncApi('syncCustomer', { customer: cust });
      if (serverResult && serverResult.success && serverResult.customer) {
        const syncedCust = serverResult.customer;
        const list = getLocal('customers', INITIAL_CUSTOMERS);
        const idx = list.findIndex(c => c.id === syncedCust.id || (c.email && syncedCust.email && c.email.toLowerCase().trim() === syncedCust.email.toLowerCase().trim()));
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...syncedCust };
          setLocal('customers', list);
        }
        return syncedCust;
      }
    } catch (apiErr) {
      console.warn('[StorageSync] Cloud sync API note:', apiErr.message);
    }

    // 2. Fallback: Direct client sync
    try {
      const { supabase, isSupabaseConfigured } = await import('./supabase.js');
      if (!isSupabaseConfigured || !supabase) return cust;
      const client = supabase;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const cleanEmail = cust.email ? String(cust.email).toLowerCase().trim() : '';
      let userId = (cust.id && uuidRegex.test(cust.id)) ? cust.id : null;

      if (!userId) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          userId = crypto.randomUUID();
        } else {
          userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        }
      }

      cust.id = userId;

      // Update localStorage customer with authoritative UUID
      const list = getLocal('customers', INITIAL_CUSTOMERS);
      const idx = list.findIndex(c => (userId && c.id === userId) || (cleanEmail && c.email && c.email.toLowerCase().trim() === cleanEmail));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...cust, id: userId };
        setLocal('customers', list);
      }

      const rawSlug = (cust.slug || cust.name || (cleanEmail ? cleanEmail.split('@')[0] : 'cust'))
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'cust';

      let userSlug = cust.slug || rawSlug;
      cust.slug = userSlug;

      const profilePayload = {
        id: userId,
        user_id: null,
        slug: userSlug,
        name: cust.name || 'Valued Customer',
        email: cleanEmail || `${userSlug}@client.flocard.in`,
        phone: cust.phone || '',
        company: cust.company || '',
        role: 'customer',
        status: cust.status || 'active',
        theme: 'purple',
        updated_at: new Date().toISOString()
      };

      await client.from('profiles').upsert(profilePayload, { onConflict: 'id' }).catch(() => {});
      return cust;
    } catch (err) {
      console.warn('[StorageSync] Supabase customer fallback note:', err.message);
      return cust;
    }
  },
  saveCustomer: (cust) => {
    const list = getLocal('customers', INITIAL_CUSTOMERS);
    const cleanEmail = cust.email ? String(cust.email).toLowerCase().trim() : '';
    const cleanId = cust.id ? String(cust.id).trim() : '';
    const index = list.findIndex(c => {
      if (cleanId && String(c.id).trim() === cleanId) return true;
      if (cleanEmail && c.email && String(c.email).toLowerCase().trim() === cleanEmail) return true;
      return false;
    });
    let saved;
    if (index >= 0) {
      list[index] = { ...list[index], ...cust, updatedAt: new Date().toISOString() };
      saved = list[index];
    } else {
      saved = {
        ...cust,
        id: cust.id || `cust_${Date.now()}`,
        status: cust.status || 'active',
        joinedDate: cust.joinedDate || new Date().toISOString().split('T')[0]
      };
      list.unshift(saved);
    }
    setLocal('customers', list);
    StorageEngine.addAuditLog('Customer', `Customer record saved: ${cust.name || 'New Customer'}`, 'You');
    // Asynchronously synchronize with Supabase cloud
    StorageEngine.syncCustomerToCloud(saved).catch(e => {
      console.warn('[StorageSync] Background customer sync note:', e.message);
    });
    return saved;
  },
  getDeletedCustomerIds: () => getLocal('flocard_deleted_cust_ids', []),
  getDeletedCustomerEmails: () => getLocal('flocard_deleted_cust_emails', []),
  deleteCustomer: async (id) => {
    const allCusts = getLocal('customers', INITIAL_CUSTOMERS);
    const existing = allCusts.find(c => c.id === id || c.email === id);
    const targetId = existing?.id || id;
    const targetEmail = (existing?.email || (typeof id === 'string' && id.includes('@') ? id : '')).toLowerCase().trim();
    const targetSlug = existing?.slug || (existing?.name ? existing.name.toLowerCase().replace(/[^a-z0-9]/g, '') : '');

    // 1. Purge from local customers
    const list = allCusts.filter(c => {
      const matchId = c.id === targetId || (targetId && c.id === targetId);
      const matchEmail = targetEmail && c.email && c.email.toLowerCase().trim() === targetEmail;
      return !matchId && !matchEmail;
    });
    setLocal('customers', list);

    // 2. Purge from local profiles so deleted customers don't resurrect from profile cache
    const profiles = getLocal('profiles', INITIAL_PROFILES).filter(p => {
      const matchId = p.id === targetId || p.userId === targetId;
      const matchEmail = targetEmail && p.email && p.email.toLowerCase().trim() === targetEmail;
      const matchSlug = targetSlug && p.slug && p.slug.toLowerCase().trim() === targetSlug;
      return !matchId && !matchEmail && !matchSlug;
    });
    setLocal('profiles', profiles);

    // 3. Purge from local card designs
    const designs = getLocal('card_designs', INITIAL_DESIGNS).filter(d => {
      const matchId = d.customerId === targetId || d.userId === targetId;
      const matchEmail = targetEmail && (
        (d.customerEmail && d.customerEmail.toLowerCase().trim() === targetEmail) ||
        (d.front?.customerEmail && d.front.customerEmail.toLowerCase().trim() === targetEmail)
      );
      return !matchId && !matchEmail;
    });
    setLocal('card_designs', designs);

    // 4. Also purge all associated orders so deleted customers don't leave zombie orders
    const orders = getLocal('orders', INITIAL_ORDERS).filter(o => {
      const matchId = o.customerId === targetId || o.customer_id === targetId;
      const matchEmail = targetEmail && (
        (o.customerEmail && o.customerEmail.toLowerCase() === targetEmail) ||
        (o.customerDetails?.email && o.customerDetails.email.toLowerCase() === targetEmail)
      );
      return !matchId && !matchEmail;
    });
    setLocal('orders', orders);

    // 5. Also purge associated invoices
    const invoices = getLocal('invoices', []).filter(inv => {
      const matchCust = inv.customerId === targetId || 
                        (targetEmail && inv.customerEmail && inv.customerEmail.toLowerCase() === targetEmail) ||
                        (targetEmail && inv.billedTo?.email && inv.billedTo.email.toLowerCase() === targetEmail);
      return !matchCust;
    });
    setLocal('invoices', invoices);

    // 6. Record tombstones so background polling never re-adds them
    const tombstoneIds = getLocal('flocard_deleted_cust_ids', []);
    if (targetId && !tombstoneIds.includes(targetId)) {
      tombstoneIds.push(targetId);
      setLocal('flocard_deleted_cust_ids', tombstoneIds);
    }
    const tombstoneEmails = getLocal('flocard_deleted_cust_emails', []);
    if (targetEmail && !tombstoneEmails.includes(targetEmail)) {
      tombstoneEmails.push(targetEmail);
      setLocal('flocard_deleted_cust_emails', tombstoneEmails);
    }

    StorageEngine.addAuditLog('Customer', `Customer record and associated profiles deleted: ${targetId}`, 'You');

    // 7. Call serverless endpoint to purge from Supabase Auth and Profiles table
    callCloudSyncApi('deleteCustomer', { id: targetId, email: targetEmail, slug: targetSlug }).catch(() => {});

    // 8. Delete directly from Supabase if client is accessible
    try {
      const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('./supabase.js');
      if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
        const client = supabaseAdmin || supabase;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (targetId && uuidRegex.test(targetId)) {
          if (supabaseAdmin && supabaseAdmin.auth && supabaseAdmin.auth.admin) {
            await supabaseAdmin.auth.admin.deleteUser(targetId).catch(() => {});
          }
          await client.from('profiles').delete().eq('id', targetId).catch(() => {});
        }
        if (targetEmail) {
          await client.from('profiles').delete().ilike('email', targetEmail).catch(() => {});
        }
        if (targetSlug) {
          await client.from('profiles').delete().eq('slug', targetSlug).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[StorageSync] Delete customer cloud error:', e.message);
    }
  },

  // Card Templates
  getTemplates: () => getLocal('templates', INITIAL_TEMPLATES),
  saveTemplate: (template) => {
    const list = getLocal('templates', INITIAL_TEMPLATES);
    const index = list.findIndex(t => t.id === template.id || t.key === template.key);
    let saved;
    if (index >= 0) {
      saved = { ...list[index], ...template, updatedAt: new Date().toISOString() };
      list[index] = saved;
    } else {
      saved = {
        ...template,
        id: template.id || `tmpl_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      list.push(saved);
    }
    setLocal('templates', list);
    StorageEngine.addAuditLog('Card Template', `Template updated: ${saved.name}`, 'You');
    return saved;
  },
  deleteTemplate: (id) => {
    const list = getLocal('templates', INITIAL_TEMPLATES).filter(t => t.id !== id && t.key !== id);
    setLocal('templates', list);
    StorageEngine.addAuditLog('Card Template', `Template deleted: ${id}`, 'You');
  },

  // Audit Logs
  // Audit Logs (Strict Owner-Only Access Enforcement)
  getAuditLogs: (requestingUser = null) => {
    if (requestingUser) {
      const email = (requestingUser.email || '').toLowerCase().trim();
      const isOwner = requestingUser.role === 'owner' ||
        ['flocard', 'flocard@flocard.in', 'hello.flocard@gmail.com', 'admin@flocard.in'].includes(email);
      if (!isOwner) {
        return [];
      }
    }
    return getLocal('audit_logs', INITIAL_AUDIT_LOGS);
  },

  addAuditLog: (typeOrPayload, details, userName = 'FLOCARDS Administrator', userAvatar = null, extra = {}) => {
    const logs = getLocal('audit_logs', INITIAL_AUDIT_LOGS);
    let record;

    if (typeof typeOrPayload === 'object' && typeOrPayload !== null) {
      record = {
        id: typeOrPayload.id || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        timestamp: typeOrPayload.timestamp || new Date().toISOString(),
        actorId: typeOrPayload.actorId || 'usr_owner_01',
        actorName: typeOrPayload.actorName || typeOrPayload.userName || 'FLOCARDS Administrator',
        actorEmail: typeOrPayload.actorEmail || 'admin@flocard.in',
        actorRole: typeOrPayload.actorRole || 'owner',
        action: typeOrPayload.action || 'system.event',
        entityType: typeOrPayload.entityType || typeOrPayload.type || 'System',
        entityId: typeOrPayload.entityId || null,
        description: typeOrPayload.description || typeOrPayload.details || 'System event recorded',
        details: typeOrPayload.description || typeOrPayload.details || 'System event recorded',
        type: typeOrPayload.type || typeOrPayload.entityType || 'General',
        userName: typeOrPayload.actorName || typeOrPayload.userName || 'FLOCARDS Administrator',
        userAvatar: typeOrPayload.userAvatar || null,
        beforeValues: typeOrPayload.beforeValues || null,
        afterValues: typeOrPayload.afterValues || null,
        status: typeOrPayload.status || 'success',
        severity: typeOrPayload.severity || 'info',
        correlationId: typeOrPayload.correlationId || `req_${Math.random().toString(36).substring(7)}`,
        timeAgo: 'Just now'
      };
    } else {
      record = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        timestamp: new Date().toISOString(),
        actorId: extra.actorId || 'usr_owner_01',
        actorName: userName,
        actorEmail: extra.actorEmail || (userName.includes('@') ? userName : 'admin@flocard.in'),
        actorRole: extra.actorRole || 'owner',
        action: extra.action || `${String(typeOrPayload || 'system').toLowerCase().replace(/\s+/g, '_')}.execute`,
        entityType: typeOrPayload || 'System',
        entityId: extra.entityId || null,
        description: details || 'Operational task performed',
        details: details || 'Operational task performed',
        type: typeOrPayload || 'General',
        userName,
        userAvatar: userAvatar || null,
        beforeValues: extra.beforeValues || null,
        afterValues: extra.afterValues || null,
        status: extra.status || 'success',
        severity: extra.severity || 'info',
        correlationId: extra.correlationId || `req_${Math.random().toString(36).substring(7)}`,
        timeAgo: 'Just now'
      };
    }

    logs.unshift(record);
    setLocal('audit_logs', logs.slice(0, 300));
    return record;
  },

  // Admin & Staff Access Management (Owner Controlled)
  getAdminAccounts: () => {
    const accounts = getLocal('admin_accounts', INITIAL_ADMIN_ACCOUNTS);
    if (!accounts.some(a => a.email.toLowerCase() === 'admin@flocard.in' || a.email.toLowerCase() === 'hello.flocard@gmail.com')) {
      accounts.unshift({
        id: 'usr_owner_01',
        email: 'admin@flocard.in',
        name: 'FLOCARDS Administrator',
        role: 'owner',
        status: 'active',
        avatar: null,
        grantedAt: '2026-01-01T00:00:00Z',
        grantedBy: 'Root',
        lastActive: new Date().toISOString()
      });
      setLocal('admin_accounts', accounts);
    }
    return accounts;
  },

  addAdminAccount: ({ email, name, role = 'sales', customPermissions = [], grantedBy = 'admin@flocard.in' }) => {
    const accounts = StorageEngine.getAdminAccounts();
    const cleanEmail = email.trim().toLowerCase();
    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      const beforeRole = existing.role;
      existing.role = role;
      existing.customPermissions = customPermissions;
      existing.status = 'active';
      if (name) existing.name = name;
      StorageEngine.addAuditLog({
        actorName: grantedBy,
        actorEmail: grantedBy,
        actorRole: 'owner',
        action: 'staff.role_change',
        entityType: 'Staff',
        entityId: existing.id || cleanEmail,
        description: `Updated role for ${cleanEmail} from ${beforeRole} to ${role}`,
        beforeValues: { role: beforeRole },
        afterValues: { role, customPermissions },
        status: 'success',
        severity: 'warning'
      });
    } else {
      const newStaff = {
        id: `staff_${Date.now()}`,
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        role,
        status: 'active',
        customPermissions: Array.isArray(customPermissions) ? customPermissions : [],
        avatar: null,
        grantedAt: new Date().toISOString(),
        grantedBy,
        lastActive: new Date().toISOString()
      };
      accounts.push(newStaff);
      StorageEngine.addAuditLog({
        actorName: grantedBy,
        actorEmail: grantedBy,
        actorRole: 'owner',
        action: 'staff.invite',
        entityType: 'Staff',
        entityId: newStaff.id,
        description: `Invited new staff member ${newStaff.name} (${cleanEmail}) with role ${role}`,
        beforeValues: null,
        afterValues: { email: cleanEmail, role, status: 'active' },
        status: 'success',
        severity: 'info'
      });
    }
    setLocal('admin_accounts', accounts);
    return accounts;
  },

  updateAdminAccount: (email, updates = {}, actorUser = null) => {
    const accounts = StorageEngine.getAdminAccounts();
    const cleanEmail = email.trim().toLowerCase();
    const target = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (!target) return { success: false, error: 'Staff account not found' };

    // Prevent changing root owner
    if ((cleanEmail === 'admin@flocard.in' || cleanEmail === 'hello.flocard@gmail.com') && updates.role && updates.role !== 'owner') {
      return { success: false, error: 'Cannot demote the root platform owner' };
    }

    const beforeValues = {
      role: target.role,
      status: target.status,
      customPermissions: target.customPermissions || []
    };

    if (updates.role) target.role = updates.role;
    if (updates.status) target.status = updates.status;
    if (updates.name) target.name = updates.name;
    if (updates.customPermissions !== undefined) target.customPermissions = updates.customPermissions;

    setLocal('admin_accounts', accounts);

    StorageEngine.addAuditLog({
      actorId: actorUser?.id || 'usr_owner_01',
      actorName: actorUser?.name || 'FLOCARDS Administrator',
      actorEmail: actorUser?.email || 'admin@flocard.in',
      actorRole: 'owner',
      action: 'staff.permission_update',
      entityType: 'Staff',
      entityId: target.id || cleanEmail,
      description: `Updated access permissions & role for staff member ${target.name} (${cleanEmail})`,
      beforeValues,
      afterValues: {
        role: target.role,
        status: target.status,
        customPermissions: target.customPermissions || []
      },
      status: 'success',
      severity: 'warning'
    });

    return { success: true, account: target };
  },

  toggleAdminStatus: (email, actorUser = null) => {
    const accounts = StorageEngine.getAdminAccounts();
    const cleanEmail = email.trim().toLowerCase();
    const target = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (!target) return { success: false, error: 'Staff account not found' };

    if (cleanEmail === 'admin@flocard.in' || cleanEmail === 'hello.flocard@gmail.com') {
      return { success: false, error: 'Cannot deactivate root platform owner' };
    }

    const nextStatus = target.status === 'deactivated' ? 'active' : 'deactivated';
    const prevStatus = target.status || 'active';
    target.status = nextStatus;
    setLocal('admin_accounts', accounts);

    StorageEngine.addAuditLog({
      actorId: actorUser?.id || 'usr_owner_01',
      actorName: actorUser?.name || 'FLOCARDS Administrator',
      actorEmail: actorUser?.email || 'admin@flocard.in',
      actorRole: 'owner',
      action: nextStatus === 'active' ? 'staff.activate' : 'staff.deactivate',
      entityType: 'Staff',
      entityId: target.id || cleanEmail,
      description: `Staff account ${target.name} (${cleanEmail}) marked as ${nextStatus}`,
      beforeValues: { status: prevStatus },
      afterValues: { status: nextStatus },
      status: 'success',
      severity: nextStatus === 'deactivated' ? 'warning' : 'info'
    });

    return { success: true, status: nextStatus };
  },

  revokeAdminAccount: (email, revokedBy = 'admin@flocard.in') => {
    const accounts = StorageEngine.getAdminAccounts();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin@flocard.in' || cleanEmail === 'hello.flocard@gmail.com') {
      return { success: false, error: 'Cannot revoke root platform owner.' };
    }
    const target = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    const filtered = accounts.filter(a => a.email.toLowerCase() !== cleanEmail);
    setLocal('admin_accounts', filtered);
    StorageEngine.addAuditLog({
      actorName: typeof revokedBy === 'object' ? revokedBy.name : revokedBy,
      actorEmail: typeof revokedBy === 'object' ? revokedBy.email : (revokedBy.includes('@') ? revokedBy : 'admin@flocard.in'),
      actorRole: 'owner',
      action: 'staff.revoke',
      entityType: 'Staff',
      entityId: target?.id || cleanEmail,
      description: `Revoked all staff access for ${cleanEmail}`,
      beforeValues: target ? { role: target.role, status: target.status } : null,
      afterValues: null,
      status: 'success',
      severity: 'critical'
    });
    return { success: true };
  },

  isEmailAuthorizedAdmin: (email) => {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    if (clean === 'flocard' || clean === 'admin@flocard.in' || clean === 'hello.flocard@gmail.com' || clean.endsWith('@flocard.in')) return true;
    const accounts = StorageEngine.getAdminAccounts();
    const match = accounts.find(a => a.email.toLowerCase() === clean);
    return match ? match.status !== 'deactivated' : false;
  },

  // Slug Availability & Allocation (Module 8)
  checkSlugAvailability: async (rawSlug, excludeProfileId = null) => {
    if (!rawSlug) return { available: false, reason: 'Slug cannot be empty' };
    const clean = String(rawSlug).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!clean || clean.length < 2) return { available: false, reason: 'Must be at least 2 characters' };
    
    // Check reserved routes
    const RESERVED_SLUGS = new Set([
      'admin', 'admin-login', 't', 'p', 'profile', 'cards', 'designer',
      'how-it-works', 'digital-profiles', 'examples', 'about', 'contact',
      'faq', 'privacy', 'terms', 'legal', 'login', 'signup', 'register',
      'forgot-password', 'reset-password', 'dashboard', 'account', 'checkout',
      'orders', 'track', 'assets', 'api', 'favicon.ico', 'favicon.png', 'flocard', 'flocards'
    ]);
    if (RESERVED_SLUGS.has(clean)) {
      return { available: false, reason: 'This username is reserved for system routes', cleanSlug: clean };
    }

    // Check local profiles
    const localProfiles = StorageEngine.getProfiles();
    const isTakenLocally = localProfiles.some(p => 
      p && p.slug && p.slug.toLowerCase().trim() === clean && p.id !== excludeProfileId
    );
    if (isTakenLocally) {
      return { available: false, reason: 'Username is already claimed', cleanSlug: clean };
    }

    // Also check Supabase profiles table if available
    try {
      const { supabase } = await import('./supabase');
      if (supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, slug')
          .ilike('slug', clean)
          .limit(1);
        if (!error && data && data.length > 0) {
          if (!excludeProfileId || data[0].id !== excludeProfileId) {
            return { available: false, reason: 'Username is already claimed', cleanSlug: clean };
          }
        }
      }
    } catch {
      // Offline fallback already validated locally
    }

    return { available: true, cleanSlug: clean };
  },

  generateSlugSuggestions: async (fullName = '', preferredSlug = '') => {
    const base = (preferredSlug || fullName || 'user')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'card';

    const candidates = [
      base,
      `${base}-1`,
      `${base}-flocard`,
      `${base}-pro`,
      `${base}-nfc`,
      `${base}-${Math.floor(100 + Math.random() * 900)}`
    ];

    const availableSuggestions = [];
    for (const cand of candidates) {
      const res = await StorageEngine.checkSlugAvailability(cand);
      if (res.available && !availableSuggestions.includes(cand)) {
        availableSuggestions.push(cand);
        if (availableSuggestions.length >= 3) break;
      }
    }
    return availableSuggestions;
  },

  // Card Products & Pricing
  getProducts: () => {
    const list = getLocal('products', INITIAL_PRODUCTS);
    let changed = false;
    INITIAL_PRODUCTS.forEach(initP => {
      const idx = list.findIndex(p => p.editionKey === initP.editionKey || p.id === initP.id);
      if (idx === -1) {
        list.push(initP);
        changed = true;
      }
    });

    // Ensure every product has displayOrder and status
    list.forEach((p, idx) => {
      if (typeof p.displayOrder !== 'number') {
        const init = INITIAL_PRODUCTS.find(ip => ip.editionKey === p.editionKey);
        p.displayOrder = init?.displayOrder || idx + 1;
        changed = true;
      }
      if (!p.status) {
        p.status = p.isActive !== false ? 'active' : 'disabled';
        changed = true;
      }
      if (p.isActive === undefined) {
        p.isActive = p.status === 'active';
        changed = true;
      }
    });

    // Sort by displayOrder ascending
    list.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

    if (changed) {
      setLocal('products', list);
    }
    return list;
  },
  getProductByEdition: (editionKey) => {
    const list = StorageEngine.getProducts();
    return list.find(p => p.editionKey === editionKey) || null;
  },
  reorderProducts: (orderedKeysOrIds, adminRole, adminEmail = 'admin@flocard.in') => {
    if (adminRole !== 'admin' && adminRole !== 'owner') {
      return { success: false, error: 'Unauthorized: Only platform administrators can arrange cards.' };
    }
    if (!Array.isArray(orderedKeysOrIds)) {
      return { success: false, error: 'Invalid reorder array' };
    }
    const list = StorageEngine.getProducts();
    orderedKeysOrIds.forEach((keyOrId, index) => {
      const prod = list.find(p => p.id === keyOrId || p.editionKey === keyOrId);
      if (prod) {
        prod.displayOrder = index + 1;
        prod.updatedAt = new Date().toISOString();
      }
    });
    list.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
    setLocal('products', list);
    StorageEngine.addAuditLog(
      'Card Products & Pricing',
      `Rearranged homepage card sequence: ${list.map(p => `#${p.displayOrder} ${p.name}`).join(', ')}`,
      adminEmail
    );
    return { success: true, products: list };
  },
  toggleProductStatus: (editionKeyOrId, newStatus, adminRole, adminEmail = 'admin@flocard.in') => {
    if (adminRole !== 'admin' && adminRole !== 'owner') {
      return { success: false, error: 'Unauthorized: Only platform administrators can change card visibility.' };
    }
    const list = StorageEngine.getProducts();
    const prod = list.find(p => p.id === editionKeyOrId || p.editionKey === editionKeyOrId);
    if (!prod) {
      return { success: false, error: 'Product not found.' };
    }
    const targetStatus = newStatus || (prod.status === 'active' ? 'disabled' : 'active');
    prod.status = targetStatus;
    prod.isActive = targetStatus === 'active';
    prod.updatedAt = new Date().toISOString();
    setLocal('products', list);
    StorageEngine.addAuditLog(
      'Card Products & Pricing',
      `Card ${prod.name} status updated to ${targetStatus} (${targetStatus === 'active' ? 'Visible on Home' : 'Hidden from Home'})`,
      adminEmail
    );
    return { success: true, product: prod, products: list };
  },
  saveProduct: (product, adminRole, adminEmail = 'admin@flocard.in') => {
    if (adminRole !== 'admin' && adminRole !== 'owner') {
      return { success: false, error: 'Unauthorized: Only platform administrators can change product prices and configurations.' };
    }

    if (!product || !product.editionKey) {
      return { success: false, error: 'Invalid product data: edition key required.' };
    }

    // Validate price non-negative
    let validPrice = null;
    if (product.price !== null && product.price !== undefined && product.price !== '') {
      const num = Number(product.price);
      if (isNaN(num) || num < 0) {
        return { success: false, error: 'Price must be a valid non-negative number.' };
      }
      validPrice = Math.round(num);
    }

    // Validate comparison price non-negative
    let validCompare = null;
    if (product.comparePrice !== null && product.comparePrice !== undefined && product.comparePrice !== '') {
      const num = Number(product.comparePrice);
      if (isNaN(num) || num < 0) {
        return { success: false, error: 'Comparison price must be a valid non-negative number.' };
      }
      validCompare = Math.round(num);
    }

    const list = StorageEngine.getProducts();
    const index = list.findIndex(p => p.id === product.id || p.editionKey === product.editionKey);
    const newStatus = product.status || (product.isActive === false ? 'disabled' : 'active');
    const newIsActive = newStatus === 'active';
    const displayOrder = product.displayOrder !== undefined && product.displayOrder !== '' && product.displayOrder !== null
      ? Number(product.displayOrder)
      : undefined;

    let updated;
    if (index >= 0) {
      updated = {
        ...list[index],
        ...product,
        status: newStatus,
        isActive: newIsActive,
        displayOrder: displayOrder !== undefined ? displayOrder : list[index].displayOrder,
        price: validPrice,
        comparePrice: validCompare,
        updatedAt: new Date().toISOString()
      };
      list[index] = updated;
    } else {
      updated = {
        ...product,
        id: product.id || `prod_${product.editionKey || Date.now()}`,
        status: newStatus,
        isActive: newIsActive,
        displayOrder: displayOrder !== undefined ? displayOrder : list.length + 1,
        price: validPrice,
        comparePrice: validCompare,
        updatedAt: new Date().toISOString()
      };
      list.push(updated);
    }

    list.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
    setLocal('products', list);
    const priceFormatted = validPrice !== null ? `₹${validPrice}` : 'Unset (Coming Soon)';
    StorageEngine.addAuditLog('Card Products & Pricing', `Updated specs/pricing for ${updated.name}: ${priceFormatted} (${updated.status})`, adminEmail);
    return { success: true, product: updated };
  },

  // Studio Background
  getStudioBackground: () => getLocal('studio_bg', '/assets/hero-bg.jpg'),
  saveStudioBackground: (bgUrl, role) => {
    if (role !== 'admin' && role !== 'owner') {
      return { success: false, error: 'Unauthorized: Only platform administrators can change the global studio background.' };
    }
    setLocal('studio_bg', bgUrl);
    StorageEngine.addAuditLog('Studio Background', 'Global studio background updated', 'Admin');
    return { success: true, bgUrl };
  },

  // Global Demo Showcase Configuration
  getDemoConfig: () => getLocal('demo_config', DEFAULT_DEMO_CONFIG),
  saveDemoConfig: (config, adminRole = 'admin', adminEmail = 'admin@flocard.in') => {
    const current = StorageEngine.getDemoConfig();
    const updated = { ...current, ...config };
    setLocal('demo_config', updated);
    safeDispatchEvent('flocard_demo_updated', updated);
    StorageEngine.addAuditLog('Demo Showcase', `Updated global demo showcase settings (Name: ${updated.name || 'Your Name'})`, adminEmail);
    return { success: true, demoConfig: updated };
  },
  resetDemoConfig: () => {
    setLocal('demo_config', DEFAULT_DEMO_CONFIG);
    safeDispatchEvent('flocard_demo_updated', DEFAULT_DEMO_CONFIG);
    return { success: true, demoConfig: DEFAULT_DEMO_CONFIG };
  },

  // Invoices Management
  getInvoices: () => getLocal('invoices', []),
  getDeletedInvoiceIds: () => getLocal('flocard_deleted_invoice_ids', []),
  deleteInvoice: (id) => {
    if (!id) return;
    const list = getLocal('invoices', []).filter(i => i.id !== id && i.invoiceNumber !== id);
    setLocal('invoices', list);
    const tombstoneIds = getLocal('flocard_deleted_invoice_ids', []);
    if (!tombstoneIds.includes(id)) {
      tombstoneIds.push(id);
      setLocal('flocard_deleted_invoice_ids', tombstoneIds);
    }
    StorageEngine.addAuditLog('Invoice', `Invoice deleted: ${id}`, 'You');
    safeDispatchEvent('flocard_invoice_updated', { deletedId: id });
    return true;
  },
  saveInvoice: (invoice) => {
    if (!invoice || (!invoice.id && !invoice.invoiceNumber)) {
      throw new Error('Invoice object with ID or invoiceNumber is required.');
    }
    const list = getLocal('invoices', []);
    const invId = invoice.id || `inv_${Date.now()}`;
    const idx = list.findIndex(i => i.id === invId || (invoice.invoiceNumber && i.invoiceNumber === invoice.invoiceNumber));
    const now = new Date().toISOString();
    let saved;
    if (idx >= 0) {
      saved = { ...list[idx], ...invoice, updatedAt: now };
      list[idx] = saved;
    } else {
      saved = {
        ...invoice,
        id: invId,
        createdAt: invoice.createdAt || now,
        updatedAt: now
      };
      list.unshift(saved);
    }
    setLocal('invoices', list);
    safeDispatchEvent('flocard_invoice_updated', saved);
    return saved;
  },
  getInvoicesByOrder: (orderId) => {
    if (!orderId) return [];
    const list = getLocal('invoices', []);
    return list.filter(i => i.orderId === orderId || i.orderReference === orderId);
  },
  getInvoicesByCustomer: (emailOrId) => {
    if (!emailOrId) return [];
    const norm = String(emailOrId).toLowerCase().trim();
    const list = getLocal('invoices', []);
    return list.filter(i =>
      (i.customerId && String(i.customerId).toLowerCase() === norm) ||
      (i.customerEmail && i.customerEmail.toLowerCase().trim() === norm)
    );
  },

  // Controlled Payment Status Transition (Admin Only)
  // Controlled Payment Status Transition (Admin Only)
  updateOrderPaymentStatus: (arg1, arg2, arg3, arg4) => {
    let orderId, paymentStatus, paymentReference, notes, actorUser;
    if (typeof arg1 === 'object' && arg1 !== null && !arg2) {
      orderId = arg1.orderId;
      paymentStatus = arg1.paymentStatus;
      paymentReference = arg1.paymentReference ?? null;
      notes = arg1.notes ?? '';
      actorUser = arg1.actorUser ?? null;
    } else {
      orderId = arg1;
      paymentStatus = arg2;
      paymentReference = arg3 ?? null;
      actorUser = arg4 ?? null;
      notes = '';
    }

    const orders = getLocal('orders', INITIAL_ORDERS);
    const order = orders.find(o => o.id === orderId || o.orderReference === orderId);
    if (!order) throw new Error(`Order ${orderId} not found.`);

    const isElevated = !actorUser || isElevatedUser(actorUser);
    if (!isElevated) {
      throw new Error('Access Denied: Only administrators can update or confirm payment status.');
    }

    const prevPayment = order.paymentStatus || 'payment_pending';
    order.paymentStatus = paymentStatus;
    if (paymentReference) order.paymentReference = paymentReference;
    order.updatedAt = new Date().toISOString();

    if (paymentStatus === 'payment_confirmed') {
      order.paidAt = new Date().toISOString();
      StorageEngine.addOrderStatusHistoryEntry({
        orderId: order.id,
        previousStatus: order.status,
        newStatus: order.status,
        publicMessage: `Payment confirmed (${paymentReference ? `Ref: ${paymentReference}` : 'Verified via Bank / UPI settlement'}).`,
        actorUserId: actorUser?.id || 'admin',
        actorName: actorUser?.name || 'Finance Administrator'
      });
      StorageEngine.createNotification({
        recipientUserId: order.customerId,
        orderId: order.id,
        title: 'Payment Confirmed',
        message: `Payment for order ${order.orderReference} has been verified and confirmed. Card manufacturing is scheduled.`
      });
    }

    setLocal('orders', orders);
    StorageEngine.addAuditLog(
      'Payment Status Update',
      `Order ${order.orderReference} payment updated from ${prevPayment} to ${paymentStatus} by ${actorUser?.name || 'Administrator'}`,
      actorUser?.email || 'admin@flocard.in'
    );
    safeDispatchEvent('flocard_order_updated', { orderId: order.id, status: order.status, paymentStatus });
    return order;
  },

  // Invoice Eligibility Control (Owner / Admin)
  // Invoice Eligibility Control (Owner / Admin)
  setOrderInvoiceEligibility: (arg1, arg2, arg3, arg4) => {
    let orderId, isEligible, actorUser, reason, status;
    if (typeof arg1 === 'object' && arg1 !== null && typeof arg2 === 'undefined') {
      orderId = arg1.orderId;
      isEligible = arg1.isEligible;
      status = arg1.status;
      reason = arg1.reason ?? '';
      actorUser = arg1.actorUser ?? null;
    } else {
      orderId = arg1;
      isEligible = arg2;
      actorUser = arg3 ?? null;
      reason = arg4 ?? '';
    }

    const orders = getLocal('orders', INITIAL_ORDERS);
    const order = orders.find(o => o.id === orderId || o.orderReference === orderId);
    if (!order) throw new Error(`Order ${orderId} not found.`);

    const isElevated = !actorUser || isElevatedUser(actorUser);
    if (!isElevated) {
      throw new Error('Access Denied: Only administrators can modify invoice eligibility.');
    }

    order.invoiceEligible = Boolean(isEligible);
    order.hasInvoiceAddon = Boolean(isEligible);
    order.invoiceStatus = status || (isEligible ? 'assigned' : 'declined');
    order.invoiceStatusReason = reason || (isEligible ? 'Approved and assigned by administrator' : 'Declined / Access revoked by administrator');
    order.invoiceStatusUpdatedAt = new Date().toISOString();
    order.invoiceStatusUpdatedBy = actorUser?.name || 'Administrator';
    order.updatedAt = new Date().toISOString();

    // Create in-app notification for the customer
    StorageEngine.createNotification({
      recipientUserId: order.customerId,
      orderId: order.id,
      title: isEligible ? 'Tax Invoice Generator Enabled' : 'Tax Invoice Access Updated',
      message: isEligible
        ? `Invoice generator access for order ${order.orderReference} has been approved. You can now customize themes and download official tax invoices in your dashboard.`
        : `Invoice generator access for order ${order.orderReference} was updated: ${order.invoiceStatusReason}`
    });

    // Add immutable audit log
    StorageEngine.addAuditLog(
      isEligible ? 'Invoice Access Assigned' : 'Invoice Access Declined',
      `Order ${order.orderReference} invoice generator access was ${isEligible ? 'ASSIGNED' : 'DECLINED'} by ${actorUser?.name || 'Administrator'}. Reason: ${order.invoiceStatusReason}`,
      actorUser?.email || 'admin@flocard.in'
    );

    setLocal('orders', orders);
    safeDispatchEvent('flocard_order_updated', {
      orderId: order.id,
      invoiceEligible: order.invoiceEligible,
      invoiceStatus: order.invoiceStatus
    });
    return order;
  },

  // Assign (Approve / Grant) Invoice Generator Access
  assignOrderInvoice: (orderId, actorUser = null, reason = 'Admin verified payment & approved') => {
    return StorageEngine.setOrderInvoiceEligibility({
      orderId,
      isEligible: true,
      status: 'assigned',
      reason,
      actorUser
    });
  },

  // Decline (Reject / Revoke) Invoice Generator Access
  declineOrderInvoice: (orderId, actorUser = null, reason = 'Declined by administrator') => {
    return StorageEngine.setOrderInvoiceEligibility({
      orderId,
      isEligible: false,
      status: 'declined',
      reason,
      actorUser
    });
  },

  // Assign Invoice Generator Access to Customer & All Their Orders
  assignCustomerInvoice: (customerId, actorUser = null, reason = 'Admin verified payment & approved') => {
    const isElevated = !actorUser || isElevatedUser(actorUser);
    if (!isElevated) {
      throw new Error('Access Denied: Only administrators can modify invoice eligibility.');
    }

    const customers = getLocal('customers', INITIAL_CUSTOMERS);
    const custIndex = customers.findIndex(c => c.id === customerId || c.email === customerId);
    let targetCustomer = null;
    if (custIndex >= 0) {
      customers[custIndex].invoiceEligible = true;
      customers[custIndex].invoiceStatus = 'assigned';
      customers[custIndex].invoiceStatusReason = reason;
      customers[custIndex].invoiceStatusUpdatedAt = new Date().toISOString();
      customers[custIndex].invoiceStatusUpdatedBy = actorUser?.name || 'Administrator';
      targetCustomer = customers[custIndex];
      setLocal('customers', customers);
    }

    // Also assign to any orders belonging to this customer
    const orders = getLocal('orders', INITIAL_ORDERS);
    let ordersUpdated = 0;
    orders.forEach(order => {
      const matchId = order.customerId === customerId || order.customer_id === customerId;
      const matchEmail = (order.customerEmail && order.customerEmail.toLowerCase() === String(customerId).toLowerCase()) ||
                         (order.customerDetails?.email && order.customerDetails.email.toLowerCase() === String(customerId).toLowerCase()) ||
                         (targetCustomer?.email && order.customerEmail?.toLowerCase() === targetCustomer.email.toLowerCase());
      if (matchId || matchEmail) {
        order.invoiceEligible = true;
        order.hasInvoiceAddon = true;
        order.invoiceStatus = 'assigned';
        order.invoiceStatusReason = reason;
        order.invoiceStatusUpdatedAt = new Date().toISOString();
        order.invoiceStatusUpdatedBy = actorUser?.name || 'Administrator';
        ordersUpdated++;
      }
    });
    if (ordersUpdated > 0) {
      setLocal('orders', orders);
    }

    StorageEngine.createNotification({
      recipientUserId: customerId,
      title: 'Tax Invoice Generator Enabled',
      message: `Tax invoice generator access has been approved for your account: ${reason}`
    });

    StorageEngine.addAuditLog(
      'Invoice Access Assigned',
      `Customer ${targetCustomer?.name || customerId} invoice generator access was ASSIGNED by ${actorUser?.name || 'Administrator'}. Reason: ${reason}`,
      actorUser?.email || 'admin@flocard.in'
    );

    safeDispatchEvent('flocard_customer_updated', { customerId, invoiceEligible: true });
    return { customer: targetCustomer, ordersUpdated };
  },

  // Decline / Revoke Invoice Generator Access from Customer & Their Orders
  declineCustomerInvoice: (customerId, actorUser = null, reason = 'Declined by administrator') => {
    const isElevated = !actorUser || isElevatedUser(actorUser);
    if (!isElevated) {
      throw new Error('Access Denied: Only administrators can modify invoice eligibility.');
    }

    const customers = getLocal('customers', INITIAL_CUSTOMERS);
    const custIndex = customers.findIndex(c => c.id === customerId || c.email === customerId);
    let targetCustomer = null;
    if (custIndex >= 0) {
      customers[custIndex].invoiceEligible = false;
      customers[custIndex].invoiceStatus = 'declined';
      customers[custIndex].invoiceStatusReason = reason;
      customers[custIndex].invoiceStatusUpdatedAt = new Date().toISOString();
      customers[custIndex].invoiceStatusUpdatedBy = actorUser?.name || 'Administrator';
      targetCustomer = customers[custIndex];
      setLocal('customers', customers);
    }

    const orders = getLocal('orders', INITIAL_ORDERS);
    let ordersUpdated = 0;
    orders.forEach(order => {
      const matchId = order.customerId === customerId || order.customer_id === customerId;
      const matchEmail = (order.customerEmail && order.customerEmail.toLowerCase() === String(customerId).toLowerCase()) ||
                         (order.customerDetails?.email && order.customerDetails.email.toLowerCase() === String(customerId).toLowerCase()) ||
                         (targetCustomer?.email && order.customerEmail?.toLowerCase() === targetCustomer.email.toLowerCase());
      if (matchId || matchEmail) {
        order.invoiceEligible = false;
        order.invoiceStatus = 'declined';
        order.invoiceStatusReason = reason;
        order.invoiceStatusUpdatedAt = new Date().toISOString();
        order.invoiceStatusUpdatedBy = actorUser?.name || 'Administrator';
        ordersUpdated++;
      }
    });
    if (ordersUpdated > 0) {
      setLocal('orders', orders);
    }

    StorageEngine.createNotification({
      recipientUserId: customerId,
      title: 'Tax Invoice Access Declined',
      message: `Tax invoice generator access was declined: ${reason}`
    });

    StorageEngine.addAuditLog(
      'Invoice Access Declined',
      `Customer ${targetCustomer?.name || customerId} invoice generator access was DECLINED by ${actorUser?.name || 'Administrator'}. Reason: ${reason}`,
      actorUser?.email || 'admin@flocard.in'
    );

    safeDispatchEvent('flocard_customer_updated', { customerId, invoiceEligible: false });
    return { customer: targetCustomer, ordersUpdated };
  },

  getInvoiceConfig: () => getInvoiceConfig(),
  saveInvoiceConfig: (cfg) => saveInvoiceConfig(cfg),

  // ==========================================================================
  // FULL DEVELOPER BACKUP & RESTORE ARCHIVE SYSTEM (.ZIP)
  // Backs up Customers, Sales (Orders & Invoices), Customer Designs, and NFC Cards
  // Includes atomic validation, detailed diff preview, and approval gates.
  // ==========================================================================
  generateFullBackup: () => {
    const customers = StorageEngine.getCustomers();
    const profiles = StorageEngine.getProfiles();
    const orders = StorageEngine.getOrders();
    const invoices = StorageEngine.getInvoices();
    const designs = StorageEngine.getDesigns();
    const cards = StorageEngine.getCards();
    const products = StorageEngine.getProducts ? StorageEngine.getProducts() : [];
    const templates = StorageEngine.getTemplates ? StorageEngine.getTemplates() : [];
    const invoiceSettings = StorageEngine.getInvoiceSettings ? StorageEngine.getInvoiceSettings() : null;
    const demoConfig = StorageEngine.getDemoConfig ? StorageEngine.getDemoConfig() : null;

    const totalSalesRevenue = orders.reduce((sum, o) => {
      const amt = Number(o.totalAmount || o.pricingBreakdown?.total || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const manifest = {
      appName: 'FLOCARD Enterprise',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      environment: isProductionEnvironment() ? 'production' : 'development',
      summary: {
        customersCount: customers.length,
        profilesCount: profiles.length,
        ordersCount: orders.length,
        invoicesCount: invoices.length,
        designsCount: designs.length,
        cardsCount: cards.length,
        totalSalesRevenue
      }
    };

    return {
      manifest,
      customers,
      profiles,
      orders,
      invoices,
      designs,
      cards,
      products,
      templates,
      invoiceSettings,
      demoConfig
    };
  },

  createBackupZip: async () => {
    const JSZipModule = await import('jszip');
    const JSZip = JSZipModule.default || JSZipModule;
    const zip = new JSZip();

    const fullData = StorageEngine.generateFullBackup();
    const { manifest, customers, profiles, orders, invoices, designs, cards, ...rest } = fullData;

    // 1. Manifest / Checksums
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // 2. Customers & Profiles
    zip.file('customers.json', JSON.stringify({ customers, profiles }, null, 2));

    // 3. Sales (Orders, Invoices, Financials)
    zip.file('sales.json', JSON.stringify({
      orders,
      invoices,
      summary: {
        totalOrders: orders.length,
        totalInvoices: invoices.length,
        totalRevenue: manifest.summary.totalSalesRevenue
      }
    }, null, 2));

    // 4. Customer Designs & Custom Artwork
    zip.file('designs.json', JSON.stringify({ designs }, null, 2));

    // 5. Hardware NFC Inventory & Catalog
    zip.file('cards.json', JSON.stringify({ cards, products: rest.products, templates: rest.templates }, null, 2));

    // 6. Consolidated backup for rapid atomic restore
    zip.file('flocard_full_backup.json', JSON.stringify(fullData, null, 2));

    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '-');
    const fileName = `flocard_backup_${dateStr}_${timeStr}.zip`;

    return { blob, fileName, manifest, fullData };
  },

  parseBackupZip: async (file) => {
    if (!file) throw new Error('No backup file provided.');
    const JSZipModule = await import('jszip');
    const JSZip = JSZipModule.default || JSZipModule;

    let zip;
    try {
      zip = await JSZip.loadAsync(file);
    } catch (err) {
      throw new Error('Invalid or corrupted ZIP file. Please provide a valid FLOCARD backup archive (.zip).');
    }

    let fullBackup = null;
    let manifest = null;
    let customers = [];
    let profiles = [];
    let orders = [];
    let invoices = [];
    let designs = [];
    let cards = [];
    let products = [];
    let templates = [];
    let invoiceSettings = null;
    let demoConfig = null;

    // Check flocard_full_backup.json first
    const fullJsonFile = zip.file('flocard_full_backup.json');
    if (fullJsonFile) {
      try {
        const fullJsonText = await fullJsonFile.async('string');
        fullBackup = JSON.parse(fullJsonText);
        manifest = fullBackup.manifest;
        customers = fullBackup.customers || [];
        profiles = fullBackup.profiles || [];
        orders = fullBackup.orders || [];
        invoices = fullBackup.invoices || [];
        designs = fullBackup.designs || [];
        cards = fullBackup.cards || [];
        products = fullBackup.products || [];
        templates = fullBackup.templates || [];
        invoiceSettings = fullBackup.invoiceSettings || null;
        demoConfig = fullBackup.demoConfig || null;
      } catch (e) {
        console.warn('Error reading flocard_full_backup.json:', e);
      }
    }

    // Fallback: modular files if full file was missing
    if (!fullBackup) {
      const manifestFile = zip.file('manifest.json');
      if (manifestFile) {
        try { manifest = JSON.parse(await manifestFile.async('string')); } catch (_) {}
      }
      const custFile = zip.file('customers.json');
      if (custFile) {
        try {
          const cData = JSON.parse(await custFile.async('string'));
          customers = cData.customers || (Array.isArray(cData) ? cData : []);
          profiles = cData.profiles || [];
        } catch (_) {}
      }
      const salesFile = zip.file('sales.json');
      if (salesFile) {
        try {
          const sData = JSON.parse(await salesFile.async('string'));
          orders = sData.orders || (Array.isArray(sData) ? sData : []);
          invoices = sData.invoices || [];
        } catch (_) {}
      }
      const designsFile = zip.file('designs.json');
      if (designsFile) {
        try {
          const dData = JSON.parse(await designsFile.async('string'));
          designs = dData.designs || (Array.isArray(dData) ? dData : []);
        } catch (_) {}
      }
      const cardsFile = zip.file('cards.json');
      if (cardsFile) {
        try {
          const cdData = JSON.parse(await cardsFile.async('string'));
          cards = cdData.cards || (Array.isArray(cdData) ? cdData : []);
          products = cdData.products || [];
          templates = cdData.templates || [];
        } catch (_) {}
      }
    }

    customers = Array.isArray(customers) ? customers : [];
    profiles = Array.isArray(profiles) ? profiles : [];
    orders = Array.isArray(orders) ? orders : [];
    invoices = Array.isArray(invoices) ? invoices : [];
    designs = Array.isArray(designs) ? designs : [];
    cards = Array.isArray(cards) ? cards : [];

    const totalSalesRevenue = orders.reduce((sum, o) => {
      const amt = Number(o.totalAmount || o.pricingBreakdown?.total || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const currentCusts = StorageEngine.getCustomers();
    const currentOrders = StorageEngine.getOrders();
    const currentInvoices = StorageEngine.getInvoices();
    const currentDesigns = StorageEngine.getDesigns();
    const currentCards = StorageEngine.getCards();
    const currentProfiles = StorageEngine.getProfiles();

    return {
      valid: true,
      fileName: file.name,
      fileSize: file.size,
      exportedAt: manifest?.exportedAt || fullBackup?.exportedAt || new Date().toISOString(),
      appName: manifest?.appName || 'FLOCARD Backup Archive',
      version: manifest?.version || '1.0',
      summary: {
        customersCount: customers.length,
        profilesCount: profiles.length,
        ordersCount: orders.length,
        invoicesCount: invoices.length,
        designsCount: designs.length,
        cardsCount: cards.length,
        totalSalesRevenue
      },
      currentCounts: {
        customersCount: currentCusts.length,
        profilesCount: currentProfiles.length,
        ordersCount: currentOrders.length,
        invoicesCount: currentInvoices.length,
        designsCount: currentDesigns.length,
        cardsCount: currentCards.length
      },
      preview: {
        sampleCustomers: customers.slice(0, 15),
        sampleOrders: orders.slice(0, 15),
        sampleDesigns: designs.slice(0, 15),
        sampleInvoices: invoices.slice(0, 15),
        sampleCards: cards.slice(0, 15)
      },
      rawBackup: {
        customers,
        profiles,
        orders,
        invoices,
        designs,
        cards,
        products,
        templates,
        invoiceSettings,
        demoConfig
      }
    };
  },

  restoreBackup: async (backupPayload, options = { mode: 'merge', actorName: 'Developer' }) => {
    const raw = backupPayload.rawBackup || backupPayload;
    const mode = options.mode || 'merge'; // 'merge' | 'replace'

    // Clean up tombstones for items being restored so background sync loops don't drop them
    const tombstoneCustIds = getLocal('flocard_deleted_cust_ids', []);
    const tombstoneCustEmails = getLocal('flocard_deleted_cust_emails', []);
    const tombstoneCardIds = getLocal('flocard_deleted_card_ids', []);
    const tombstoneDesignIds = getLocal('flocard_deleted_design_ids', []);
    const tombstoneOrderIds = getLocal('flocard_deleted_order_ids', []);
    const tombstoneInvoiceIds = getLocal('flocard_deleted_invoice_ids', []);

    const newTombCustIds = tombstoneCustIds.filter(id => !(raw.customers || []).some(c => c.id === id));
    const newTombCustEmails = tombstoneCustEmails.filter(email => !(raw.customers || []).some(c => c.email?.toLowerCase().trim() === email.toLowerCase().trim()));
    const newTombCardIds = tombstoneCardIds.filter(id => !(raw.cards || []).some(c => c.id === id || c.cardCode === id));
    const newTombDesignIds = tombstoneDesignIds.filter(id => !(raw.designs || []).some(d => d.id === id || d.supabaseId === id));
    const newTombOrderIds = tombstoneOrderIds.filter(id => !(raw.orders || []).some(o => o.id === id || o.orderReference === id));
    const newTombInvoiceIds = tombstoneInvoiceIds.filter(id => !(raw.invoices || []).some(i => i.id === id || i.invoiceNumber === id));

    setLocal('flocard_deleted_cust_ids', newTombCustIds);
    setLocal('flocard_deleted_cust_emails', newTombCustEmails);
    setLocal('flocard_deleted_card_ids', newTombCardIds);
    setLocal('flocard_deleted_design_ids', newTombDesignIds);
    setLocal('flocard_deleted_order_ids', newTombOrderIds);
    setLocal('flocard_deleted_invoice_ids', newTombInvoiceIds);

    let finalCustomers, finalProfiles, finalOrders, finalInvoices, finalDesigns, finalCards;

    if (mode === 'replace') {
      finalCustomers = raw.customers || [];
      finalProfiles = raw.profiles || [];
      finalOrders = raw.orders || [];
      finalInvoices = raw.invoices || [];
      finalDesigns = raw.designs || [];
      finalCards = raw.cards || [];
    } else {
      // Merge mode
      const currCusts = StorageEngine.getCustomers();
      const custMap = new Map(currCusts.map(c => [c.id || c.email, c]));
      (raw.customers || []).forEach(c => custMap.set(c.id || c.email, c));
      finalCustomers = Array.from(custMap.values());

      const currProfiles = StorageEngine.getProfiles();
      const profMap = new Map(currProfiles.map(p => [p.slug || p.id, p]));
      (raw.profiles || []).forEach(p => profMap.set(p.slug || p.id, p));
      finalProfiles = Array.from(profMap.values());

      const currOrders = StorageEngine.getOrders();
      const orderMap = new Map(currOrders.map(o => [o.orderReference || o.id, o]));
      (raw.orders || []).forEach(o => orderMap.set(o.orderReference || o.id, o));
      finalOrders = Array.from(orderMap.values());

      const currInvoices = StorageEngine.getInvoices();
      const invMap = new Map(currInvoices.map(i => [i.invoiceNumber || i.id, i]));
      (raw.invoices || []).forEach(i => invMap.set(i.invoiceNumber || i.id, i));
      finalInvoices = Array.from(invMap.values());

      const currDesigns = StorageEngine.getDesigns();
      const desMap = new Map(currDesigns.map(d => [d.id, d]));
      (raw.designs || []).forEach(d => desMap.set(d.id, d));
      finalDesigns = Array.from(desMap.values());

      const currCards = StorageEngine.getCards();
      const cardMap = new Map(currCards.map(c => [c.cardCode || c.id, c]));
      (raw.cards || []).forEach(c => cardMap.set(c.cardCode || c.id, c));
      finalCards = Array.from(cardMap.values());
    }

    // Write to local persistence
    setLocal('customers', finalCustomers);
    setLocal('profiles', finalProfiles);
    setLocal('orders', finalOrders);
    setLocal('invoices', finalInvoices);
    setLocal('designs', finalDesigns);
    setLocal('card_designs', finalDesigns);
    setLocal('cards', finalCards);

    if (raw.products && raw.products.length > 0) setLocal('products', raw.products);
    if (raw.templates && raw.templates.length > 0) setLocal('templates', raw.templates);
    if (raw.invoiceSettings) setLocal('invoice_settings', raw.invoiceSettings);
    if (raw.demoConfig) setLocal('demo_config', raw.demoConfig);

    StorageEngine.addAuditLog(
      'Backup & Restore',
      `Restored backup archive: ${finalCustomers.length} customers, ${finalOrders.length} orders, ${finalDesigns.length} designs, ${finalCards.length} cards (Mode: ${mode})`,
      options.actorName || 'Developer'
    );

    // Dispatch real-time cross-tab & window notification events
    safeDispatchEvent('flocard_customers_updated', finalCustomers);
    safeDispatchEvent('flocard_orders_updated', finalOrders);
    safeDispatchEvent('flocard_designs_updated', finalDesigns);
    safeDispatchEvent('flocard_cards_updated', finalCards);
    safeDispatchEvent('flocard_invoices_updated', finalInvoices);
    safeDispatchEvent('flocard_profiles_updated', finalProfiles);

    // Asynchronously synchronize with Supabase cloud
    (async () => {
      try {
        for (const cust of (raw.customers || [])) {
          StorageEngine.syncCustomerToCloud(cust).catch(() => {});
        }
        for (const prof of (raw.profiles || [])) {
          StorageEngine.syncProfileToCloud(prof).catch(() => {});
        }
        for (const des of (raw.designs || [])) {
          StorageEngine.syncDesignToCloud(des).catch(() => {});
        }
        for (const card of (raw.cards || [])) {
          StorageEngine.syncCardToCloud(card).catch(() => {});
        }
      } catch (_) {}
    })();

    return {
      success: true,
      restoredCounts: {
        customers: finalCustomers.length,
        profiles: finalProfiles.length,
        orders: finalOrders.length,
        invoices: finalInvoices.length,
        designs: finalDesigns.length,
        cards: finalCards.length
      }
    };
  },

  // System Reset
  resetAll: () => {
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'profiles');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'cards');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'designs');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'orders');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'customers');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'audit_logs');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'templates');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'products');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'admin_accounts');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'studio_bg');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'demo_config');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'invoices');
    return true;
  }
};
