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
  }
} catch (e) {
  // Ignore in SSR / private browsing
}

export const ORDER_STAGES = [
  { key: 'design_submitted', label: 'Design Submitted', step: 1, description: 'Order received and digital design submitted for pre-press verification.' },
  { key: 'artwork_approved', label: 'Artwork Approved', step: 2, description: 'Print-ready vector assets, typography, and bleed margins approved by production.' },
  { key: 'manufacturing_started', label: 'Manufacturing Started', step: 3, description: 'Card base CNC cut and NXP NTAG216 high-frequency chip embedded.' },
  { key: 'quality_inspection', label: 'Quality Inspection', step: 4, description: 'Dual-frequency NFC transmission tested and surface finish inspected.' },
  { key: 'dispatched', label: 'Dispatched', step: 5, description: 'Card packaged in luxury presentation box and handed over to courier.' },
  { key: 'delivered', label: 'Delivered', step: 6, description: 'Card delivered to recipient and NFC redirect routing activated.' }
];

export const EXCEPTION_STAGES = [
  { key: 'revision_required', label: 'Revision Required', description: 'Design adjustments requested before manufacturing can proceed.' },
  { key: 'on_hold', label: 'On Hold', description: 'Production paused per customer request or operational hold.' },
  { key: 'manufacturing_issue', label: 'Manufacturing Issue', description: 'Recalibrating tooling to ensure flawless card surface finish.' },
  { key: 'delivery_issue', label: 'Delivery Issue', description: 'Courier transit address re-attempt or verification needed.' },
  { key: 'cancelled', label: 'Cancelled', description: 'Order cancelled and production halted.' }
];

export function normalizeOrderStatus(status) {
  if (!status) return 'design_submitted';
  const s = String(status).toLowerCase();
  if (s === 'pending' || s === 'draft' || s === 'submitted') return 'design_submitted';
  if (s === 'processing') return 'artwork_approved';
  if (s === 'printing') return 'manufacturing_started';
  if (s === 'shipped') return 'dispatched';
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
  bio: 'Pioneering connected NFC identity for executives and global tech pioneers. One tap. Every connection.',
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
    bio: 'Pioneering connected NFC identity for executives and global tech pioneers. One tap. Every connection.',
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
    openingPreference: 'expandable', // 'expandable' | 'full' | 'compact_only'
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
    sectionVisibility: {
      about: true,
      portfolio: true,
      services: true,
      experience: true,
      contact: true
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
      { id: 'srv_1', title: 'Enterprise Smart Cards', description: 'Custom metal & hybrid NFC rollouts for corporate teams.' },
      { id: 'srv_2', title: 'Executive Networking', description: 'Contactless identity infrastructure and lead tracking.' }
    ],
    experience: [
      { id: 'exp_1', role: 'Founder & CEO', company: 'FLOCARD', period: '2024 – Present', description: 'Leading product vision, NFC hardware engineering, and digital identity software.' }
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
  },
  {
    id: 'card_white_002',
    cardCode: 'flc-pure-white-001',
    cardName: 'Pure White Edition Demo',
    chipType: 'NXP NTAG216 (888 Bytes)',
    batch: 'Batch-2026-B',
    edition: 'white',
    customerId: 'usr_cust_02',
    customerName: 'Akhil Sharma',
    customerEmail: 'akhil@flocard.in',
    profileSlug: 'alex',
    status: 'active',
    tapCount: 38,
    registeredAt: '2026-04-01T12:00:00Z',
    statusChangedAt: '2026-04-01T12:00:00Z',
    statusReason: 'Pure White card activation',
    activationHistory: []
  },
  {
    id: 'card_pending_003',
    cardCode: 'flc-sample-pending',
    cardName: 'Unassigned Test Card',
    chipType: 'NXP NTAG216 (888 Bytes)',
    batch: 'Batch-2026-C',
    edition: 'purple',
    customerId: null,
    customerName: null,
    customerEmail: null,
    profileSlug: null,
    status: 'pending',
    tapCount: 0,
    registeredAt: '2026-04-10T09:00:00Z',
    statusChangedAt: '2026-04-10T09:00:00Z',
    statusReason: 'Inventory intake',
    activationHistory: []
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
    id: 'evt_init_01',
    timestamp: '2026-10-23T11:45:00Z',
    actorId: 'usr_owner_01',
    actorName: 'FLOCARDS Administrator',
    actorEmail: 'admin@flocard.in',
    actorRole: 'owner',
    action: 'order.status_update',
    entityType: 'Order',
    entityId: 'ORD-9842',
    description: 'Order status advanced to Dispatched with DTDC Air tracking DTDC-984210',
    type: 'Order',
    details: 'Order status advanced to Dispatched with DTDC Air tracking DTDC-984210',
    userName: 'FLOCARDS Administrator',
    beforeValues: { status: 'production_ready', carrier: null, trackingNumber: null },
    afterValues: { status: 'dispatched', carrier: 'DTDC Air Express', trackingNumber: 'DTDC-984210' },
    status: 'success',
    severity: 'info',
    correlationId: 'req_ord_9842_dsp',
    timeAgo: '1 hour ago'
  },
  {
    id: 'evt_init_02',
    timestamp: '2026-10-23T10:12:00Z',
    actorId: 'usr_prod_01',
    actorName: 'Rajesh Kumar',
    actorEmail: 'production@flocard.in',
    actorRole: 'production',
    action: 'nfc.activate',
    entityType: 'Card',
    entityId: 'FC-882194',
    description: 'NXP NTAG216 chip encoded & bound to digital profile @alex',
    type: 'NFC Card',
    details: 'NXP NTAG216 chip encoded & bound to digital profile @alex',
    userName: 'Rajesh Kumar',
    beforeValues: { chipStatus: 'unprogrammed', assignedSlug: null },
    afterValues: { chipStatus: 'active', assignedSlug: 'alex', nfcUrl: 'https://flocard.in/alex' },
    status: 'success',
    severity: 'info',
    correlationId: 'req_nfc_882194',
    timeAgo: '2 hours ago'
  },
  {
    id: 'evt_init_03',
    timestamp: '2026-10-23T09:30:00Z',
    actorId: 'usr_des_01',
    actorName: 'Vikram Malhotra',
    actorEmail: 'designer@flocard.in',
    actorRole: 'designer',
    action: 'design.approve',
    entityType: 'Design',
    entityId: 'des_alex_gold',
    description: 'Artwork verified: 24K Gold Matte finish approved for UV laser engraving',
    type: 'Card Design',
    details: 'Artwork verified: 24K Gold Matte finish approved for UV laser engraving',
    userName: 'Vikram Malhotra',
    beforeValues: { approvalStatus: 'pending_review' },
    afterValues: { approvalStatus: 'approved', notes: 'Artwork vectors verified with 3mm bleed margin.' },
    status: 'success',
    severity: 'info',
    correlationId: 'req_des_approve_01',
    timeAgo: '3 hours ago'
  },
  {
    id: 'evt_init_04',
    timestamp: '2026-10-23T08:50:00Z',
    actorId: 'usr_owner_01',
    actorName: 'FLOCARDS Administrator',
    actorEmail: 'admin@flocard.in',
    actorRole: 'owner',
    action: 'staff.role_change',
    entityType: 'Staff',
    entityId: 'usr_sales_01',
    description: 'Updated staff role for Priya Nair to Sales with permissions [orders.create, orders.read, customers.read]',
    type: 'Admin Access',
    details: 'Updated staff role for Priya Nair to Sales with permissions [orders.create, orders.read, customers.read]',
    userName: 'FLOCARDS Administrator',
    beforeValues: { role: 'pending', status: 'invited' },
    afterValues: { role: 'sales', status: 'active' },
    status: 'success',
    severity: 'warning',
    correlationId: 'req_perm_sales_01',
    timeAgo: '4 hours ago'
  },
  {
    id: 'evt_init_05',
    timestamp: '2026-10-23T07:15:00Z',
    actorId: 'usr_sys_01',
    actorName: 'System / Auth Gateway',
    actorEmail: 'system@flocard.in',
    actorRole: 'system',
    action: 'login.failed',
    entityType: 'Auth',
    entityId: 'auth_attempt_391',
    description: 'Failed administrator login attempt with invalid credentials',
    type: 'Security',
    details: 'Failed administrator login attempt with invalid credentials',
    userName: 'Auth Gateway',
    beforeValues: null,
    afterValues: { identifier: 'unknown_operator@external.org', failureReason: 'Invalid administrator password' },
    status: 'failure',
    severity: 'critical',
    correlationId: 'req_sec_audit_391',
    timeAgo: '5 hours ago'
  },
  {
    id: 'evt_init_06',
    timestamp: '2026-10-22T16:20:00Z',
    actorId: 'usr_acc_01',
    actorName: 'Anjali Sharma',
    actorEmail: 'accounts@flocard.in',
    actorRole: 'accounts',
    action: 'payment.status_change',
    entityType: 'Payment',
    entityId: 'INV-2026-081',
    description: 'Verified Razorpay settlement for Order ORD-9842 (₹2,240.82 with 18% GST)',
    type: 'Finance',
    details: 'Verified Razorpay settlement for Order ORD-9842 (₹2,240.82 with 18% GST)',
    userName: 'Anjali Sharma',
    beforeValues: { paymentStatus: 'pending_gateway' },
    afterValues: { paymentStatus: 'paid', gstInvoiceNumber: 'INV-2026-081' },
    status: 'success',
    severity: 'info',
    correlationId: 'req_pay_inv_081',
    timeAgo: 'Yesterday'
  },
  {
    id: 'evt_init_07',
    timestamp: '2026-10-22T14:05:00Z',
    actorId: 'usr_owner_01',
    actorName: 'FLOCARDS Administrator',
    actorEmail: 'admin@flocard.in',
    actorRole: 'owner',
    action: 'qr.config_update',
    entityType: 'Smart QR',
    entityId: 'cfg_smart_qr_global',
    description: 'Updated Smart QR canonical redirect host to https://flocard.in with high-contrast quiet zone',
    type: 'Smart QR',
    details: 'Updated Smart QR canonical redirect host to https://flocard.in with high-contrast quiet zone',
    userName: 'FLOCARDS Administrator',
    beforeValues: { baseUrl: 'https://flocard.in', quietZone: 4 },
    afterValues: { baseUrl: 'https://flocard.in', quietZone: 4, errorCorrectionLevel: 'H' },
    status: 'success',
    severity: 'info',
    correlationId: 'req_qr_cfg_01',
    timeAgo: 'Yesterday'
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

// Generate high-fidelity seed orders dynamically calculated relative to current date
const _now = Date.now();
const _d = (daysAgo, hoursAgo = 0) => new Date(_now - daysAgo * 86400000 - hoursAgo * 3600000).toISOString();

const INITIAL_ORDERS = [
  {
    id: 'FLC-ORD-9081',
    orderReference: 'FLC-ORD-9081',
    invoiceId: 'INV-2026-9081',
    invoiceDate: _d(0, 3),
    orderDate: _d(0, 3),
    customerName: 'Alex Morgan',
    customerEmail: 'alex.morgan@flocard.in',
    customerPhone: '+91 97782 78552',
    company: 'FLOCARDS Technologies',
    role: 'Founder & CEO',
    tagline: 'Pioneering connected NFC identity systems.',
    edition: 'gold',
    templateType: 'customer_logo',
    status: 'in_production',
    quantity: 1,
    unitPrice: 2499,
    discount: 0,
    tax: 381.20,
    shippingCharge: 0,
    totalAmount: 2499,
    amountPaid: 2499,
    amountOutstanding: 0,
    refundAmount: 0,
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    transactionReference: 'UPI/202610208491',
    shippingAddress: 'Plot 42, Infopark Phase II, Kochi, Kerala 682042',
    cardCode: 'FLC-GLD-0104',
    nfcUid: '04:7B:A2:1F:90:3C:80',
    cardStatus: 'processing',
    profileSlug: 'alex',
    source: 'website',
    items: [
      {
        id: 'item_9081_1',
        productId: 'prod_gold',
        productName: 'Gold Edition NFC Card',
        sku: 'FLC-CRD-GLD-01',
        edition: 'gold',
        variant: '24K Metallic Champagne Gold',
        templateType: 'customer_logo',
        quantity: 1,
        unitPrice: 2499,
        discount: 0,
        tax: 381.20,
        total: 2499,
        image: '/assets/cardbg-gold.png'
      }
    ],
    paymentTransactions: [
      {
        id: 'txn_9081_1',
        type: 'payment',
        amount: 2499,
        method: 'upi',
        reference: 'UPI/202610208491',
        date: _d(0, 3),
        note: 'UPI Payment verified via QR scan',
        recordedBy: 'Razorpay Webhook'
      }
    ]
  },
  {
    id: 'FLC-ORD-9080',
    orderReference: 'FLC-ORD-9080',
    invoiceId: 'INV-2026-9080',
    invoiceDate: _d(0, 6),
    orderDate: _d(0, 6),
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@nexusfintech.com',
    customerPhone: '+91 98450 12893',
    company: 'Nexus Fintech Ventures',
    role: 'Managing Partner',
    tagline: 'Empowering digital capital.',
    edition: 'purple',
    templateType: 'standard',
    status: 'design_submitted',
    quantity: 1,
    unitPrice: 1899,
    discount: 0,
    tax: 289.68,
    shippingCharge: 0,
    totalAmount: 1899,
    amountPaid: 0,
    amountOutstanding: 1899,
    refundAmount: 0,
    paymentMethod: 'upi',
    paymentStatus: 'pending',
    transactionReference: 'PENDING-INV-9080',
    shippingAddress: 'Tower B, 14th Floor, UB City, Bengaluru, Karnataka 560001',
    cardCode: 'FLC-PRP-0211',
    nfcUid: '04:8A:2F:3C:44:91:80',
    cardStatus: 'designing',
    profileSlug: 'priyasharma',
    source: 'whatsapp',
    items: [
      {
        id: 'item_9080_1',
        productId: 'prod_purple',
        productName: 'Purple Edition NFC Card',
        sku: 'FLC-CRD-PRP-03',
        edition: 'purple',
        variant: 'Ultraviolet Signature Obsidian',
        templateType: 'standard',
        quantity: 1,
        unitPrice: 1899,
        discount: 0,
        tax: 289.68,
        total: 1899,
        image: '/assets/cardbg-purple.png'
      }
    ],
    paymentTransactions: []
  },
  {
    id: 'FLC-ORD-9074',
    orderReference: 'FLC-ORD-9074',
    invoiceId: 'INV-2026-9074',
    invoiceDate: _d(1, 4),
    orderDate: _d(1, 4),
    customerName: 'Rohan Mehta',
    customerEmail: 'rohan@mehtacapital.in',
    customerPhone: '+91 98200 44812',
    company: 'Mehta Capital Partners',
    role: 'Principal Investor',
    tagline: 'Long term strategic value creation.',
    edition: 'metal',
    templateType: 'customer_logo',
    status: 'ready_to_dispatch',
    quantity: 1,
    unitPrice: 2799,
    discount: 0,
    tax: 426.97,
    shippingCharge: 0,
    totalAmount: 2799,
    amountPaid: 2799,
    amountOutstanding: 0,
    refundAmount: 0,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    transactionReference: 'CARD-VISA-9821',
    shippingAddress: '402 Regency Heights, Bandra West, Mumbai 400050',
    cardCode: 'FLC-MTL-0056',
    nfcUid: '04:B1:68:5D:82:1A:80',
    cardStatus: 'ready_to_dispatch',
    profileSlug: 'rohan',
    source: 'website',
    items: [
      {
        id: 'item_9074_1',
        productId: 'prod_metal',
        productName: 'Metal Edition NFC Card',
        sku: 'FLC-CRD-MTL-04',
        edition: 'metal',
        variant: 'Brushed Gunmetal & Laser White',
        templateType: 'customer_logo',
        quantity: 1,
        unitPrice: 2799,
        discount: 0,
        tax: 426.97,
        total: 2799,
        image: '/assets/cardbg-metal.png'
      }
    ],
    paymentTransactions: [
      {
        id: 'txn_9074_1',
        type: 'payment',
        amount: 2799,
        method: 'card',
        reference: 'CARD-VISA-9821',
        date: _d(1, 4),
        note: 'Visa Business Card verified online',
        recordedBy: 'Payment Gateway'
      }
    ]
  },
  {
    id: 'FLC-ORD-9071',
    orderReference: 'FLC-ORD-9071',
    invoiceId: 'INV-2026-9071',
    invoiceDate: _d(1, 8),
    orderDate: _d(1, 8),
    customerName: 'Ananya Nair',
    customerEmail: 'ananya.nair@aerodesign.io',
    customerPhone: '+91 97455 33019',
    company: 'Aero Design Labs',
    role: 'Chief Creative Officer',
    tagline: 'Designing tomorrow’s interfaces.',
    edition: 'platinum',
    templateType: 'standard',
    status: 'processing',
    quantity: 1,
    unitPrice: 2199,
    discount: 0,
    tax: 335.44,
    shippingCharge: 0,
    totalAmount: 2199,
    amountPaid: 1100,
    amountOutstanding: 1099,
    refundAmount: 0,
    paymentMethod: 'bank_transfer',
    paymentStatus: 'partially_paid',
    transactionReference: 'NEFT-HDFC-99124',
    shippingAddress: 'Studio 12, Panampilly Nagar, Kochi, Kerala 682036',
    cardCode: 'FLC-PLT-0089',
    nfcUid: '04:5C:3D:7A:12:8E:80',
    cardStatus: 'processing',
    profileSlug: 'ananya',
    source: 'whatsapp',
    items: [
      {
        id: 'item_9071_1',
        productId: 'prod_platinum',
        productName: 'Platinum Edition NFC Card',
        sku: 'FLC-CRD-PLT-02',
        edition: 'platinum',
        variant: 'Brushed Platinum & Silver',
        templateType: 'standard',
        quantity: 1,
        unitPrice: 2199,
        discount: 0,
        tax: 335.44,
        total: 2199,
        image: '/assets/cardbg-platinum.png'
      }
    ],
    paymentTransactions: [
      {
        id: 'txn_9071_1',
        type: 'payment',
        amount: 1100,
        method: 'bank_transfer',
        reference: 'NEFT-HDFC-99124',
        date: _d(1, 8),
        note: '50% Advance via Bank NEFT received',
        recordedBy: 'Administrator'
      }
    ]
  },
  {
    id: 'FLC-ORD-9055',
    orderReference: 'FLC-ORD-9055',
    invoiceId: 'INV-2026-9055',
    invoiceDate: _d(3, 2),
    orderDate: _d(3, 2),
    customerName: 'Vikram Patel',
    customerEmail: 'vikram@patellaw.com',
    customerPhone: '+91 98791 22300',
    company: 'Patel & Associates Law Firm',
    role: 'Senior Advocate',
    tagline: 'Corporate law & IP advisory.',
    edition: 'gold',
    templateType: 'standard',
    status: 'shipped',
    quantity: 2,
    unitPrice: 2499,
    discount: 200,
    tax: 732.05,
    shippingCharge: 0,
    totalAmount: 4798,
    amountPaid: 4798,
    amountOutstanding: 0,
    refundAmount: 0,
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    transactionReference: 'pay_P108420489',
    shippingAddress: '701 Law Chambers, Ashram Road, Ahmedabad, Gujarat 380009',
    trackingNumber: 'DTDC-77401294',
    carrierName: 'DTDC Express Air',
    cardCode: 'FLC-GLD-0105',
    nfcUid: '04:91:AA:22:3B:5F:80',
    cardStatus: 'shipped',
    profileSlug: 'vikrampatel',
    source: 'website',
    items: [
      {
        id: 'item_9055_1',
        productId: 'prod_gold',
        productName: 'Gold Edition NFC Card',
        sku: 'FLC-CRD-GLD-01',
        edition: 'gold',
        variant: '24K Metallic Champagne Gold',
        templateType: 'standard',
        quantity: 2,
        unitPrice: 2499,
        discount: 200,
        tax: 732.05,
        total: 4798,
        image: '/assets/cardbg-gold.png'
      }
    ],
    paymentTransactions: [
      {
        id: 'txn_9055_1',
        type: 'payment',
        amount: 4798,
        method: 'razorpay',
        reference: 'pay_P108420489',
        date: _d(3, 2),
        note: 'Razorpay Auto-settlement (Discount ₹200 applied)',
        recordedBy: 'Payment Gateway'
      }
    ]
  },
  {
    id: 'FLC-ORD-9032',
    orderReference: 'FLC-ORD-9032',
    invoiceId: 'INV-2026-9032',
    invoiceDate: _d(6, 5),
    orderDate: _d(6, 5),
    customerName: 'Neha Gupta',
    customerEmail: 'neha@glowbeauty.in',
    customerPhone: '+91 99100 88214',
    company: 'Glow Botanicals',
    role: 'Founder & Formulator',
    tagline: 'Clean clinical botanicals.',
    edition: 'purple',
    templateType: 'customer_logo',
    status: 'delivered',
    quantity: 1,
    unitPrice: 1899,
    discount: 0,
    tax: 289.68,
    shippingCharge: 0,
    totalAmount: 1899,
    amountPaid: 1899,
    amountOutstanding: 0,
    refundAmount: 0,
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    transactionReference: 'UPI/202610148920',
    shippingAddress: 'Villa 45, DLF Phase 5, Gurugram, Haryana 122009',
    trackingNumber: 'BLUEDART-8891024',
    carrierName: 'BlueDart Apex',
    cardCode: 'FLC-PRP-0212',
    nfcUid: '04:77:E1:9C:55:0B:80',
    cardStatus: 'activated',
    profileSlug: 'nehagupta',
    source: 'website',
    items: [
      {
        id: 'item_9032_1',
        productId: 'prod_purple',
        productName: 'Purple Edition NFC Card',
        sku: 'FLC-CRD-PRP-03',
        edition: 'purple',
        variant: 'Ultraviolet Signature Obsidian',
        templateType: 'customer_logo',
        quantity: 1,
        unitPrice: 1899,
        discount: 0,
        tax: 289.68,
        total: 1899,
        image: '/assets/cardbg-purple.png'
      }
    ],
    paymentTransactions: [
      {
        id: 'txn_9032_1',
        type: 'payment',
        amount: 1899,
        method: 'upi',
        reference: 'UPI/202610148920',
        date: _d(6, 5),
        note: 'UPI Payment captured via Google Pay',
        recordedBy: 'Razorpay'
      }
    ]
  },
  {
    id: 'FLC-ORD-8994',
    orderReference: 'FLC-ORD-8994',
    invoiceId: 'INV-2026-8994',
    invoiceDate: _d(12, 1),
    orderDate: _d(12, 1),
    customerName: 'Siddharth Sen',
    customerEmail: 'siddharth@senai.tech',
    customerPhone: '+91 98300 77123',
    company: 'Sen Robotics AI',
    role: 'Chief AI Officer',
    tagline: 'Perception engineering at scale.',
    edition: 'metal',
    templateType: 'standard',
    status: 'cancelled',
    quantity: 1,
    unitPrice: 2799,
    discount: 0,
    tax: 426.97,
    shippingCharge: 0,
    totalAmount: 2799,
    amountPaid: 0,
    amountOutstanding: 0,
    refundAmount: 2799,
    paymentMethod: 'card',
    paymentStatus: 'refunded',
    transactionReference: 'RFD-2026100801',
    shippingAddress: 'Sector V, Salt Lake Electronic Complex, Kolkata 700091',
    cardCode: 'FLC-MTL-0057',
    nfcUid: '04:19:64:8B:E3:71:80',
    cardStatus: 'cancelled',
    profileSlug: 'siddharth',
    source: 'website',
    items: [
      {
        id: 'item_8994_1',
        productId: 'prod_metal',
        productName: 'Metal Edition NFC Card',
        sku: 'FLC-CRD-MTL-04',
        edition: 'metal',
        variant: 'Brushed Gunmetal & Laser White',
        templateType: 'standard',
        quantity: 1,
        unitPrice: 2799,
        discount: 0,
        tax: 426.97,
        total: 2799,
        image: '/assets/cardbg-metal.png'
      }
    ],
    paymentTransactions: [
      {
        id: 'txn_8994_1',
        type: 'payment',
        amount: 2799,
        method: 'card',
        reference: 'CARD-MC-7712',
        date: _d(12, 1),
        note: 'Initial Mastercard payment received',
        recordedBy: 'Payment Gateway'
      },
      {
        id: 'txn_8994_2',
        type: 'refund',
        amount: 2799,
        method: 'card',
        reference: 'RFD-2026100801',
        date: _d(11, 2),
        note: '[Refund] Client relocated overseas before card print run; full refund issued.',
        recordedBy: 'Administrator'
      }
    ]
  },
  {
    id: 'FLC-ORD-8950',
    orderReference: 'FLC-ORD-8950',
    invoiceId: 'INV-2026-8950',
    invoiceDate: _d(18, 7),
    orderDate: _d(18, 7),
    customerName: 'Kabir Joshi',
    customerEmail: 'kabir@joshistudio.design',
    customerPhone: '+91 98211 66345',
    company: 'Joshi Design Studio',
    role: 'Design Director',
    tagline: 'Architecture & spatial brand identity.',
    edition: 'platinum',
    templateType: 'customer_logo',
    status: 'delivered',
    quantity: 2,
    unitPrice: 2199,
    discount: 198,
    tax: 640.68,
    shippingCharge: 0,
    totalAmount: 4200,
    amountPaid: 4200,
    amountOutstanding: 0,
    refundAmount: 0,
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    transactionReference: 'UPI/202610023340',
    shippingAddress: '19 Koregaon Park, Lane 7, Pune, Maharashtra 411001',
    cardCode: 'FLC-PLT-0090',
    nfcUid: '04:88:99:AA:BB:CC:80',
    cardStatus: 'activated',
    profileSlug: 'kabir',
    source: 'website',
    items: [
      {
        id: 'item_8950_1',
        productId: 'prod_platinum',
        productName: 'Platinum Edition NFC Card',
        sku: 'FLC-CRD-PLT-02',
        edition: 'platinum',
        variant: 'Brushed Platinum & Silver',
        templateType: 'customer_logo',
        quantity: 2,
        unitPrice: 2199,
        discount: 198,
        tax: 640.68,
        total: 4200,
        image: '/assets/cardbg-platinum.png'
      }
    ],
    paymentTransactions: [
      {
        id: 'txn_8950_1',
        type: 'payment',
        amount: 4200,
        method: 'upi',
        reference: 'UPI/202610023340',
        date: _d(18, 7),
        note: 'UPI Payment received via Paytm Business',
        recordedBy: 'Payment Gateway'
      }
    ]
  },
  {
    id: 'FLC-ORD-8870',
    orderReference: 'FLC-ORD-8870',
    invoiceId: 'INV-2026-8870',
    invoiceDate: _d(38, 4),
    orderDate: _d(38, 4),
    customerName: 'Deepa Rao',
    customerEmail: 'deepa@raoconsulting.com',
    customerPhone: '+91 98490 55123',
    company: 'Rao Strategy Consultants',
    role: 'Principal Partner',
    tagline: 'Healthcare strategy & M&A advisory.',
    edition: 'gold',
    templateType: 'standard',
    status: 'delivered',
    quantity: 1,
    unitPrice: 2499,
    discount: 0,
    tax: 381.20,
    shippingCharge: 0,
    totalAmount: 2499,
    amountPaid: 2499,
    amountOutstanding: 0,
    refundAmount: 0,
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    transactionReference: 'UPI/202609129031',
    shippingAddress: 'Plot 104, Jubilee Hills Road 36, Hyderabad 500033',
    cardCode: 'FLC-GLD-0099',
    nfcUid: '04:44:55:66:77:88:80',
    cardStatus: 'activated',
    profileSlug: 'deeparao',
    source: 'whatsapp',
    items: [
      {
        id: 'item_8870_1',
        productId: 'prod_gold',
        productName: 'Gold Edition NFC Card',
        sku: 'FLC-CRD-GLD-01',
        edition: 'gold',
        variant: '24K Metallic Champagne Gold',
        templateType: 'standard',
        quantity: 1,
        unitPrice: 2499,
        discount: 0,
        tax: 381.20,
        total: 2499,
        image: '/assets/cardbg-gold.png'
      }
    ],
    paymentTransactions: [
      {
        id: 'txn_8870_1',
        type: 'payment',
        amount: 2499,
        method: 'upi',
        reference: 'UPI/202609129031',
        date: _d(38, 4),
        note: 'Direct PhonePe Business UPI settlement',
        recordedBy: 'Administrator'
      }
    ]
  },
  {
    id: 'FLC-ORD-8855',
    orderReference: 'FLC-ORD-8855',
    invoiceId: 'INV-2026-8855',
    invoiceDate: _d(42, 6),
    orderDate: _d(42, 6),
    customerName: 'Arjun Varma',
    customerEmail: 'arjun@varmalogistics.com',
    customerPhone: '+91 98950 44321',
    company: 'Varma Global Logistics',
    role: 'Executive Vice President',
    tagline: 'Intermodal maritime freight solutions.',
    edition: 'metal',
    templateType: 'customer_logo',
    status: 'delivered',
    quantity: 1,
    unitPrice: 2799,
    discount: 0,
    tax: 426.97,
    shippingCharge: 0,
    totalAmount: 2799,
    amountPaid: 2799,
    amountOutstanding: 0,
    refundAmount: 0,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    transactionReference: 'CARD-MC-4491',
    shippingAddress: 'Marine Drive, Willington Island, Kochi, Kerala 682003',
    cardCode: 'FLC-MTL-0050',
    nfcUid: '04:11:22:33:44:55:80',
    cardStatus: 'activated',
    profileSlug: 'arjunvarma',
    source: 'website',
    items: [
      {
        id: 'item_8855_1',
        productId: 'prod_metal',
        productName: 'Metal Edition NFC Card',
        sku: 'FLC-CRD-MTL-04',
        edition: 'metal',
        variant: 'Brushed Gunmetal & Laser White',
        templateType: 'customer_logo',
        quantity: 1,
        unitPrice: 2799,
        discount: 0,
        tax: 426.97,
        total: 2799,
        image: '/assets/cardbg-metal.png'
      }
    ],
    paymentTransactions: [
      {
        id: 'txn_8855_1',
        type: 'payment',
        amount: 2799,
        method: 'card',
        reference: 'CARD-MC-4491',
        date: _d(42, 6),
        note: 'Mastercard Corporate verified',
        recordedBy: 'Payment Gateway'
      }
    ]
  }
];

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
    featuredBadge: 'Minimalist Tech',
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
    isFeatured: true,
    featuredBadge: 'Luxury Choice',
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
    isFeatured: true,
    featuredBadge: 'Stealth Metal',
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
    featuredBadge: 'Minimalist Porcelain',
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
      return initial;
    }
    const parsed = JSON.parse(raw);
    memoryCache.set(fullKey, raw);
    return parsed;
  } catch (err) {
    if (memoryCache.has(fullKey)) {
      try { return JSON.parse(memoryCache.get(fullKey)); } catch (_) {}
    }
    return initial;
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
    const list = getLocal('profiles', INITIAL_PROFILES);
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
      return matchPrimary;
    }
    return null;
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

  // Cards
  getCards: () => getLocal('cards', INITIAL_CARDS),
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_card_updated', { detail: { card: saved, list } }));
    }
    return saved;
  },
  deleteCard: (id) => {
    const list = getLocal('cards', INITIAL_CARDS).filter(c => c.id !== id && c.cardCode !== id);
    setLocal('cards', list);
    StorageEngine.addAuditLog('NFC Card', `Card deleted: ${id}`, 'You');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocard_card_updated', { detail: { deletedId: id, list } }));
    }
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
  deleteDesign: (id) => {
    const list = getLocal('designs', INITIAL_DESIGNS).filter(d => d.id !== id);
    setLocal('designs', list);
    StorageEngine.addAuditLog('Card Design', `Design deleted: ${id}`, 'You');
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
      saved = normalizeOrderFinancials({ ...list[index], ...order, updatedAt: new Date().toISOString() });
      list[index] = saved;
    } else {
      const orderRef = order.orderReference || `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      saved = normalizeOrderFinancials({
        ...order,
        id: order.id || orderRef,
        orderReference: orderRef,
        orderDate: order.orderDate || new Date().toISOString(),
        status: normalizeOrderStatus(order.status || 'design_submitted'),
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      list.unshift(saved);
    }
    setLocal('orders', list);
    safeDispatchEvent('flocard_order_updated', saved);
    return saved;
  },

  createOrderFromDesign: (design, notes = '', customerUser = null) => {
    const orders = getLocal('orders', INITIAL_ORDERS);
    const existing = orders.find(o => o.designId === design.id);
    if (existing) {
      const customerName = design.customerName || customerUser?.name || design.front?.name || existing.customerName || '';
      const email = design.customerEmail || customerUser?.email || existing.customerEmail || '';
      const phone = design.customerPhone || customerUser?.phone || existing.customerPhone || '';
      const company = design.company || customerUser?.company || design.front?.company || existing.company || '';
      const logoUrl = design.customerLogo?.url || (typeof design.customerLogo === 'string' ? design.customerLogo : null) || design.front?.customLogo || existing.customerLogo;

      existing.design = JSON.parse(JSON.stringify(design)); // Frozen snapshot of submitted design
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

    const customerName = design.customerName || customerUser?.name || design.front?.name || '';
    const email = design.customerEmail || customerUser?.email || (customerName ? `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com` : '');
    const phone = design.customerPhone || customerUser?.phone || '';
    const company = design.company || customerUser?.company || design.front?.company || '';
    const logoUrl = design.customerLogo?.url || (typeof design.customerLogo === 'string' ? design.customerLogo : null) || design.front?.customLogo || null;
    const orderRef = `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: orderRef,
      orderReference: orderRef,
      designId: design.id,
      design: JSON.parse(JSON.stringify(design)), // Frozen snapshot of submitted design
      designTitle: design.title || (customerName ? `${customerName}'s Card Design` : 'Custom Card Design'),
      templateType: design.templateType || 'standard',
      edition: design.edition || 'purple',
      customerId: design.customerId || customerUser?.id || `cust_${Date.now()}`,
      customerName: customerName || 'Valued Client',
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
      status: 'design_submitted',
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalAmount: 1999,
      quantity: 1,
      shippingAddress: design.shippingAddress || '',
      trackingNumber: null,
      carrierName: null,
      trackingUrl: null,
      estimatedDeliveryAt: null,
      approvalNotes: notes || design.reviewNotes || 'Design artwork submitted for pre-production verification',
      cardCode: null,
      profileSlug: null
    };

    orders.unshift(newOrder);
    setLocal('orders', orders);

    // Initial immutable status history entry
    StorageEngine.addOrderStatusHistoryEntry({
      orderId: newOrder.id,
      previousStatus: null,
      newStatus: 'design_submitted',
      publicMessage: 'Order received and digital design submitted for pre-press verification.',
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

  deleteOrder: (orderId, actorUser = null) => {
    const isElevated = !actorUser || isElevatedUser(actorUser);
    if (!isElevated) {
      throw new Error('Unauthorized: Only administrators can delete orders.');
    }
    const orders = getLocal('orders', INITIAL_ORDERS).filter(o => o.id !== orderId && o.orderReference !== orderId);
    setLocal('orders', orders);
    StorageEngine.addAuditLog('Order Fulfillment', `Order deleted: ${orderId}`, actorUser?.name || 'Administrator');
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
      name: order.customerName,
      slug: finalSlug,
      role: order.role || order.frontConfig?.role || 'Executive',
      company: order.company || 'FLOCARD Network',
      tagline: order.tagline || order.frontConfig?.tagline || 'One Tap Every Connection',
      bio: `${order.customerName} is a ${order.role || 'Professional'} at ${order.company || 'FLOCARD Network'}. Connect directly via my NFC digital business card.`,
      avatar: order.customerLogo || null,
      logo: order.customerLogo || null,
      phone: order.customerPhone || '+91 97782 78552',
      email: order.customerEmail || `${finalSlug}@flocard.in`,
      whatsapp: (order.customerPhone || '919778278552').replace(/[^0-9]/g, ''),
      location: 'Kochi, Kerala, India',
      website: `https://${finalSlug}.flocard.in`,
      theme: order.edition || 'purple',
      status: 'active',
      viewsCount: 0,
      socialLinks: {
        website: `https://${finalSlug}.flocard.in`,
        linkedin: `https://linkedin.com/in/${finalSlug}`,
        instagram: `https://instagram.com/${finalSlug}`,
        whatsapp: order.customerPhone || '+91 97782 78552'
      },
      services: [
        { id: 's1', name: 'Strategic Consultation', desc: 'Direct corporate collaboration and identity integration.' },
        { id: 's2', name: 'Executive Relations', desc: 'Organizational growth, technology solutions and partnerships.' }
      ],
      portfolio: [
        {
          id: `p_${Date.now()}_1`,
          title: `${order.company || order.customerName} Official Brand Identity`,
          category: 'Identity Showcase',
          desc: 'Verified NFC smart business card and connected FLOCARD digital profile.',
          image: order.customerLogo || '/assets/true_front_card.png',
          link: `https://${finalSlug}.flocard.in`
        }
      ],
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
  saveCustomer: (cust) => {
    const list = getLocal('customers', INITIAL_CUSTOMERS);
    const index = list.findIndex(c => c.id === cust.id || c.email === cust.email);
    if (index >= 0) {
      list[index] = { ...list[index], ...cust, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...cust, id: cust.id || `cust_${Date.now()}`, joinedDate: new Date().toISOString().split('T')[0] });
    }
    setLocal('customers', list);
    StorageEngine.addAuditLog('Customer', `Customer record saved: ${cust.name}`, 'You');
    return cust;
  },
  deleteCustomer: (id) => {
    const list = getLocal('customers', INITIAL_CUSTOMERS).filter(c => c.id !== id && c.email !== id);
    setLocal('customers', list);
    StorageEngine.addAuditLog('Customer', `Customer record deleted: ${id}`, 'You');
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
    return true;
  }
};
