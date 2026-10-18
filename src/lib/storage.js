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

export const INITIAL_PROFILES = [
  {
    id: 'prof_akhil_001',
    userId: 'usr_akhil_founder',
    slug: 'akhil',
    name: 'Akhil Anvar',
    role: 'CEO & Founder',
    company: 'FLOCARD',
    avatar: '/assets/akhil.jpg',
    location: 'Bengaluru, India',
    bio: 'Pioneering connected NFC identity for executives and global tech pioneers. One tap. Every connection.',
    phone: '+91 6238 578 552',
    email: 'contact@flocard.in',
    whatsapp: '916238578552',
    website: 'https://flocard.in',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/akhilanvar',
      instagram: 'https://instagram.com/akhilanvar',
      twitter: 'https://twitter.com/flocard_in'
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
const INITIAL_ORDERS = [];
const INITIAL_ORDER_HISTORY = [];
const INITIAL_ORDER_NOTES = [];
const INITIAL_NOTIFICATIONS = [];
const INITIAL_ANALYTICS_EVENTS = [];
const INITIAL_AUDIT_LOGS = [];

const INITIAL_ADMIN_ACCOUNTS = [
  {
    email: 'akhil@flocard.in',
    name: 'Akhil Anvar',
    role: 'owner',
    avatar: '/assets/akhil.jpg',
    grantedAt: '2026-01-01T00:00:00Z',
    grantedBy: 'Root'
  }
];

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
  getProfiles: () => getLocal('profiles', INITIAL_PROFILES),
  getProfileBySlug: (slug) => {
    if (!slug) return null;
    const cleanSlug = String(slug).trim().toLowerCase();
    const list = getLocal('profiles', INITIAL_PROFILES);
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
    const list = getLocal('orders', INITIAL_ORDERS);
    if (!currentUser) return list;
    const isElevated = currentUser.role === 'admin' || currentUser.role === 'owner' || currentUser.email === 'akhil@flocard.in';
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
    const list = getLocal('orders', INITIAL_ORDERS);
    const order = list.find(o => o.id === id || o.orderReference === id);
    if (!order) return null;

    const isElevated = currentUser?.role === 'admin' || currentUser?.role === 'owner' || currentUser?.email === 'akhil@flocard.in';
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
    const result = {
      ...order,
      status: normalizeOrderStatus(order.status),
      history
    };

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
      saved = { ...list[index], ...order, updatedAt: new Date().toISOString() };
      list[index] = saved;
    } else {
      const orderRef = order.orderReference || `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      saved = {
        ...order,
        id: order.id || orderRef,
        orderReference: orderRef,
        orderDate: order.orderDate || new Date().toISOString(),
        status: normalizeOrderStatus(order.status || 'design_submitted'),
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list.unshift(saved);
    }
    setLocal('orders', list);
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
    const phone = design.customerPhone || customerUser?.phone || '+91 6238 578 552';
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
    const isElevated = !actualActor || actualActor?.role === 'admin' || actualActor?.role === 'owner' || actualActor?.email === 'akhil@flocard.in';
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
    const isElevated = !actorUser || actorUser.role === 'admin' || actorUser.role === 'owner' || actorUser.email === 'akhil@flocard.in';
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
      phone: order.customerPhone || '+91 6238 578 552',
      email: order.customerEmail || `${finalSlug}@flocard.in`,
      whatsapp: (order.customerPhone || '916238578552').replace(/[^0-9]/g, ''),
      location: 'Kochi, Kerala, India',
      website: `https://${finalSlug}.flocard.in`,
      theme: order.edition || 'purple',
      status: 'active',
      viewsCount: 0,
      socialLinks: {
        website: `https://${finalSlug}.flocard.in`,
        linkedin: `https://linkedin.com/in/${finalSlug}`,
        instagram: `https://instagram.com/${finalSlug}`,
        whatsapp: order.customerPhone || '+91 6238 578 552'
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
    const isElevated = currentUser?.role === 'admin' || currentUser?.role === 'owner' || currentUser?.email === 'akhil@flocard.in';
    if (!isElevated) return [];
    const notes = getLocal('order_internal_notes', INITIAL_ORDER_NOTES);
    return notes
      .filter(n => n.orderId === orderId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  addOrderInternalNote: ({ orderId, note, authorUser = null }) => {
    const isElevated = authorUser?.role === 'admin' || authorUser?.role === 'owner' || authorUser?.email === 'akhil@flocard.in';
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
  getAdminAccounts: () => getLocal('admin_accounts', INITIAL_ADMIN_ACCOUNTS),
  addAdminAccount: ({ email, name, role = 'admin', grantedBy = 'akhil@flocard.in' }) => {
    const accounts = getLocal('admin_accounts', INITIAL_ADMIN_ACCOUNTS);
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
  revokeAdminAccount: (email, revokedBy = 'akhil@flocard.in') => {
    const accounts = getLocal('admin_accounts', INITIAL_ADMIN_ACCOUNTS);
    const cleanEmail = email.trim().toLowerCase();
    // Cannot revoke super-owner akhil
    if (cleanEmail === 'akhil@flocard.in') {
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
    const accounts = getLocal('admin_accounts', INITIAL_ADMIN_ACCOUNTS);
    return accounts.some(a => a.email.toLowerCase() === clean);
  },

  // Card Products & Pricing
  getProducts: () => getLocal('products', INITIAL_PRODUCTS),
  getProductByEdition: (editionKey) => {
    const list = getLocal('products', INITIAL_PRODUCTS);
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
    return true;
  }
};
