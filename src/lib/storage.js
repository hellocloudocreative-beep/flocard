/* ==========================================================================
   FLOCARD PERSISTENT DATA LAYER & SEED ENGINE
   Automatically persists state to localStorage and synchronizes with Supabase.
   ========================================================================== */

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
  name: 'Akhil Anvar',
  role: 'Founder & CEO',
  tagline: 'Connected Identity Systems',
  company: 'FLOCARD',
  avatar: '/assets/akhil.jpg',
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
    id: 'prof_akhil_001',
    userId: 'usr_akhil_founder',
    slug: 'akhil',
    name: 'Akhil Anvar',
    role: 'Founder & CEO',
    company: 'FLOCARD',
    avatar: '/assets/akhil.jpg',
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

const INITIAL_CARDS = [];
const INITIAL_DESIGNS = [];
const INITIAL_CUSTOMERS = [];
const INITIAL_ORDER_HISTORY = [];
const INITIAL_ORDER_NOTES = [];
const INITIAL_NOTIFICATIONS = [];
const INITIAL_ANALYTICS_EVENTS = [];
const INITIAL_AUDIT_LOGS = [];

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
    customerName: 'Akhil Anvar',
    customerEmail: 'akhil@flocard.in',
    customerPhone: '+91 97782 78552',
    company: 'FLOCARD Technologies',
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
    profileSlug: 'akhil',
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
    email: 'hello.flocard@gmail.com',
    name: 'Flocard Admin',
    role: 'owner',
    avatar: '/assets/akhil.jpg',
    grantedAt: '2026-01-01T00:00:00Z',
    grantedBy: 'Root'
  },
  {
    email: 'akhil@flocard.in',
    name: 'Akhil Anvar',
    role: 'owner',
    avatar: '/assets/akhil.jpg',
    grantedAt: '2026-01-01T00:00:00Z',
    grantedBy: 'Root'
  }
];

const isElevatedUser = (user) => {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  return user.role === 'admin' || user.role === 'owner' || email === 'akhil@flocard.in' || email === 'hello.flocard@gmail.com';
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
    isActive: true,
    isAvailable: true,
    isFeatured: false,
    featuredBadge: 'Minimalist Tech',
    theme: 'platinum',
    accentColor: '#E2E8F0',
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
    const primary = list.find(p => p.id === 'prof_akhil_001' || p.slug === 'akhil');
    if (primary && (primary.name === 'Your Name' || !primary.avatar)) {
      primary.name = 'Akhil Anvar';
      primary.role = primary.role === 'Your Role' ? 'Founder & CEO' : primary.role;
      primary.company = primary.company === 'Your Company' ? 'FLOCARD' : primary.company;
      primary.avatar = primary.avatar || '/assets/akhil.jpg';
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

    // Fallbacks for primary admin/demo profile
    if (cleanSlug === 'akhil' || cleanSlug === 'default') {
      const matchPrimary = list.find(p => p.id === 'prof_akhil_001') || list[0] || INITIAL_PROFILES[0];
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
    if (index >= 0) {
      list[index] = { ...list[index], ...card, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...card, id: card.id || `card_${Date.now()}` });
    }
    setLocal('cards', list);
    StorageEngine.addAuditLog('NFC Card', `Card updated: ${card.cardCode} (${card.status})`, 'You');
    return card;
  },
  deleteCard: (id) => {
    const list = getLocal('cards', INITIAL_CARDS).filter(c => c.id !== id && c.cardCode !== id);
    setLocal('cards', list);
    StorageEngine.addAuditLog('NFC Card', `Card deleted: ${id}`, 'You');
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
        'Akhil Anvar'
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
    window.dispatchEvent(new CustomEvent('flocard_order_updated', { detail: saved }));
    return saved;
  },

  createOrderFromDesign: (design, notes = '', customerUser = null) => {
    const orders = getLocal('orders', INITIAL_ORDERS);
    let existing = orders.find(o => o.designId === design.id);
    if (existing) {
      return existing;
    }

    const customerName = design.customerName || customerUser?.name || design.front?.name || 'Valued Client';
    const email = design.customerEmail || customerUser?.email || `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@example.com`;
    const phone = design.customerPhone || customerUser?.phone || '+91 97782 78552';
    const company = design.company || customerUser?.company || design.front?.company || 'FLOCARD Enterprise';
    const logoUrl = design.customerLogo?.url || (typeof design.customerLogo === 'string' ? design.customerLogo : null) || design.front?.customLogo || null;
    const orderRef = `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: orderRef,
      orderReference: orderRef,
      designId: design.id,
      designTitle: design.title || `${customerName}'s Card Design`,
      templateType: design.templateType || 'standard',
      edition: design.edition || 'purple',
      customerId: design.customerId || customerUser?.id || `cust_${Date.now()}`,
      customerName,
      customerEmail: email,
      customerPhone: phone,
      company,
      customerLogo: logoUrl,
      role: design.front?.role || 'Executive',
      tagline: design.front?.tagline || 'One Tap Every Connection',
      frontConfig: design.front || {},
      backConfig: design.back || {},
      customColors: design.customColors || {},
      status: 'design_submitted',
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalAmount: 1999,
      quantity: 1,
      shippingAddress: design.shippingAddress || 'Plot 42, Infopark Kochi, Kerala 682042',
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
      actorUser: adminUser || { id: 'admin', name: 'Akhil Anvar', role: 'admin' }
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
  getAuditLogs: () => getLocal('audit_logs', INITIAL_AUDIT_LOGS),
  addAuditLog: (type, details, userName = 'You', userAvatar = null) => {
    const logs = getLocal('audit_logs', INITIAL_AUDIT_LOGS);
    logs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type,
      details,
      userName,
      userAvatar: userAvatar || (userName === 'Akhil Anvar' ? '/assets/akhil.jpg' : null),
      timeAgo: 'Just now',
      timestamp: new Date().toISOString()
    });
    setLocal('audit_logs', logs.slice(0, 100));
  },

  // Admin Access Management (Owner Controlled)
  getAdminAccounts: () => {
    const accounts = getLocal('admin_accounts', INITIAL_ADMIN_ACCOUNTS);
    if (!accounts.some(a => a.email.toLowerCase() === 'hello.flocard@gmail.com')) {
      accounts.unshift({
        email: 'hello.flocard@gmail.com',
        name: 'Flocard Admin',
        role: 'owner',
        avatar: '/assets/akhil.jpg',
        grantedAt: '2026-01-01T00:00:00Z',
        grantedBy: 'Root'
      });
      setLocal('admin_accounts', accounts);
    }
    return accounts;
  },
  addAdminAccount: ({ email, name, role = 'admin', grantedBy = 'hello.flocard@gmail.com' }) => {
    const accounts = StorageEngine.getAdminAccounts();
    const cleanEmail = email.trim().toLowerCase();
    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      existing.role = role;
    } else {
      accounts.push({
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        role,
        avatar: null,
        grantedAt: new Date().toISOString(),
        grantedBy
      });
    }
    setLocal('admin_accounts', accounts);
    StorageEngine.addAuditLog('Admin Access', `Granted ${role} access to ${cleanEmail}`, grantedBy);
    return accounts;
  },
  revokeAdminAccount: (email, revokedBy = 'hello.flocard@gmail.com') => {
    const accounts = StorageEngine.getAdminAccounts();
    const cleanEmail = email.trim().toLowerCase();
    // Cannot revoke super-owners
    if (cleanEmail === 'akhil@flocard.in' || cleanEmail === 'hello.flocard@gmail.com') {
      return { success: false, error: 'Cannot revoke root platform owner.' };
    }
    const filtered = accounts.filter(a => a.email.toLowerCase() !== cleanEmail);
    setLocal('admin_accounts', filtered);
    StorageEngine.addAuditLog('Admin Access', `Revoked access for ${cleanEmail}`, revokedBy);
    return { success: true };
  },
  isEmailAuthorizedAdmin: (email) => {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    if (clean === 'flocard' || clean === 'flocard@flocard.in' || clean === 'hello.flocard@gmail.com' || clean === 'akhil@flocard.in') return true;
    const accounts = StorageEngine.getAdminAccounts();
    return accounts.some(a => a.email.toLowerCase() === clean);
  },

  // Card Products & Pricing
  getProducts: () => {
    const list = getLocal('products', INITIAL_PRODUCTS);
    let changed = false;
    INITIAL_PRODUCTS.forEach(initP => {
      if (!list.some(p => p.editionKey === initP.editionKey || p.id === initP.id)) {
        list.push(initP);
        changed = true;
      }
    });
    if (changed) {
      setLocal('products', list);
    }
    return list;
  },
  getProductByEdition: (editionKey) => {
    const list = StorageEngine.getProducts();
    return list.find(p => p.editionKey === editionKey) || null;
  },
  saveProduct: (product, adminRole, adminEmail = 'akhil@flocard.in') => {
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

    const list = getLocal('products', INITIAL_PRODUCTS);
    const index = list.findIndex(p => p.id === product.id || p.editionKey === product.editionKey);
    let updated;
    if (index >= 0) {
      updated = {
        ...list[index],
        ...product,
        price: validPrice,
        comparePrice: validCompare,
        updatedAt: new Date().toISOString()
      };
      list[index] = updated;
    } else {
      updated = {
        ...product,
        id: product.id || `prod_${product.editionKey || Date.now()}`,
        price: validPrice,
        comparePrice: validCompare,
        updatedAt: new Date().toISOString()
      };
      list.push(updated);
    }

    setLocal('products', list);
    const priceFormatted = validPrice !== null ? `₹${validPrice}` : 'Unset (Coming Soon)';
    StorageEngine.addAuditLog('Card Products & Pricing', `Updated pricing/specs for ${updated.name}: ${priceFormatted}`, adminEmail);
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
    window.dispatchEvent(new CustomEvent('flocard_demo_updated', { detail: updated }));
    StorageEngine.addAuditLog('Demo Showcase', `Updated global demo showcase settings (Name: ${updated.name || 'Your Name'})`, adminEmail);
    return { success: true, demoConfig: updated };
  },
  resetDemoConfig: () => {
    setLocal('demo_config', DEFAULT_DEMO_CONFIG);
    window.dispatchEvent(new CustomEvent('flocard_demo_updated', { detail: DEFAULT_DEMO_CONFIG }));
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
