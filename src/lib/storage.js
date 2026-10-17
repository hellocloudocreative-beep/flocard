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

const INITIAL_PROFILES = [];
const INITIAL_CARDS = [];
const INITIAL_DESIGNS = [];
const INITIAL_CUSTOMERS = [];
const INITIAL_ORDERS = [];
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

// Helper to read and write from localStorage with initial fallback
function getLocal(key, initial) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Storage get error for', key, err);
    return initial;
  }
}

function setLocal(key, value) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage set error for', key, err);
  }
}

export const StorageEngine = {
  // Profiles
  getProfiles: () => getLocal('profiles', INITIAL_PROFILES),
  getProfileBySlug: (slug) => {
    const list = getLocal('profiles', INITIAL_PROFILES);
    return list.find(p => p.slug.toLowerCase() === slug.toLowerCase()) || null;
  },
  saveProfile: (profile) => {
    const list = getLocal('profiles', INITIAL_PROFILES);
    const index = list.findIndex(p => p.id === profile.id || p.slug === profile.slug);
    if (index >= 0) {
      list[index] = { ...list[index], ...profile, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...profile, id: profile.id || `prof_${Date.now()}`, createdAt: new Date().toISOString() });
    }
    setLocal('profiles', list);
    StorageEngine.addAuditLog('Profile', `Profile updated for ${profile.name}`, 'You');
    return profile;
  },
  deleteProfile: (id) => {
    const list = getLocal('profiles', INITIAL_PROFILES).filter(p => p.id !== id);
    setLocal('profiles', list);
    StorageEngine.addAuditLog('Profile', `Profile deleted: ${id}`, 'You');
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
  getOrders: () => getLocal('orders', INITIAL_ORDERS),
  getOrderById: (id) => {
    const list = getLocal('orders', INITIAL_ORDERS);
    return list.find(o => o.id === id) || null;
  },
  saveOrder: (order) => {
    const list = getLocal('orders', INITIAL_ORDERS);
    const index = list.findIndex(o => o.id === order.id);
    let saved;
    if (index >= 0) {
      saved = { ...list[index], ...order, updatedAt: new Date().toISOString() };
      list[index] = saved;
    } else {
      saved = {
        ...order,
        id: order.id || `#ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        orderDate: order.orderDate || new Date().toISOString(),
        status: order.status || 'processing'
      };
      list.unshift(saved);
    }
    setLocal('orders', list);
    return saved;
  },
  createOrderFromDesign: (design, notes = '') => {
    const orders = getLocal('orders', INITIAL_ORDERS);
    let existing = orders.find(o => o.designId === design.id);
    if (existing) {
      return existing;
    }

    const customerName = design.customerName || design.front?.name || 'Valued Client';
    const email = design.customerEmail || `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@example.com`;
    const phone = design.customerPhone || '+91 6238 578 552';
    const company = design.company || design.front?.company || 'FLOCARD Enterprise';
    const logoUrl = design.customerLogo?.url || (typeof design.customerLogo === 'string' ? design.customerLogo : null) || design.front?.customLogo || null;

    const newOrder = {
      id: `#ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      designId: design.id,
      designTitle: design.title || `${customerName}'s Card Design`,
      templateType: design.templateType || 'standard',
      edition: design.edition || 'purple',
      customerId: design.customerId || `cust_${Date.now()}`,
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
      status: 'processing', // 'processing' | 'printing' | 'shipped' | 'delivered'
      orderDate: new Date().toISOString(),
      totalAmount: 1999,
      quantity: 1,
      shippingAddress: design.shippingAddress || 'Plot 42, Infopark Kochi, Kerala 682042',
      approvalNotes: notes || design.reviewNotes || 'Design artwork verified for manufacturing',
      cardCode: null,
      profileSlug: null
    };

    orders.unshift(newOrder);
    setLocal('orders', orders);

    // Also ensure customer exists in customers
    const customers = getLocal('customers', INITIAL_CUSTOMERS);
    let cust = customers.find(c => c.id === newOrder.customerId || c.email === newOrder.customerEmail || c.name.toLowerCase() === customerName.toLowerCase());
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

    // Also link order back to design record
    const designs = getLocal('designs', INITIAL_DESIGNS);
    const dItem = designs.find(d => d.id === design.id);
    if (dItem) {
      dItem.orderId = newOrder.id;
      dItem.status = 'approved';
      setLocal('designs', designs);
    }

    StorageEngine.addAuditLog(
      'Order Placement',
      `Production order ${newOrder.id} created automatically for approved design ${design.id} (${customerName})`,
      'System Automation'
    );

    return newOrder;
  },
  assignDesignToOrder: (designId, notes = '') => {
    const list = getLocal('designs', INITIAL_DESIGNS);
    const item = list.find(d => d.id === designId);
    if (!item) return null;

    item.status = 'approved';
    item.reviewNotes = notes || item.reviewNotes || 'Design approved and assigned to manufacturing order.';
    item.reviewedAt = new Date().toISOString();

    const order = StorageEngine.createOrderFromDesign(item, item.reviewNotes);
    item.orderId = order.id;
    setLocal('designs', list);

    StorageEngine.addAuditLog(
      'Order Placement',
      `Design ${item.id} assigned to manufacturing order ${order.id} for ${item.customerName}`,
      'Akhil Anvar'
    );

    return { design: item, order };
  },
  updateOrderStatus: (orderId, status) => {
    if (status === 'delivered') {
      return StorageEngine.deliverOrder(orderId);
    }
    const orders = getLocal('orders', INITIAL_ORDERS);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      setLocal('orders', orders);
      StorageEngine.addAuditLog(
        'Order Fulfillment',
        `Order ${order.id} status updated to ${status} for ${order.customerName}`,
        'Akhil Anvar'
      );
    }
    return order;
  },
  deleteOrder: (orderId) => {
    const orders = getLocal('orders', INITIAL_ORDERS).filter(o => o.id !== orderId);
    setLocal('orders', orders);
    StorageEngine.addAuditLog('Order Fulfillment', `Order deleted: ${orderId}`, 'You');
  },
  deliverOrder: (orderId) => {
    const orders = getLocal('orders', INITIAL_ORDERS);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex < 0) return null;

    const order = orders[orderIndex];

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
    const cardCode = `flc-${rawSlug.slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`;
    const newCard = {
      id: `card_${Date.now()}`,
      cardCode,
      edition: order.edition || 'purple',
      chipType: 'NXP NTAG216 (888 Bytes)',
      status: 'active',
      customerId: order.customerId,
      customerName: order.customerName,
      profileSlug: finalSlug,
      tapCount: 0,
      registeredAt: new Date().toISOString(),
      orderId: order.id,
      notes: `Auto-provisioned upon delivery of order ${order.id}`
    };

    // Generate new Digital Profile with customer name, logo, role, and details
    const newProfile = {
      id: `prof_${Date.now()}`,
      name: order.customerName,
      slug: finalSlug,
      role: order.role || order.frontConfig?.role || 'Executive',
      company: order.company || 'FLOCARD Network',
      tagline: order.tagline || order.frontConfig?.tagline || 'One Tap Every Connection',
      bio: `${order.customerName} is a ${order.role || 'Professional'} at ${order.company || 'FLOCARD Network'}. Connect directly via my NFC digital business card.`,
      avatar: order.customerLogo || null,
      logo: order.customerLogo || null,
      phone: order.customerPhone || '+91 6238 578 552',
      email: order.customerEmail || `${finalSlug}@example.com`,
      whatsapp: (order.customerPhone || '916238578552').replace(/[^0-9]/g, ''),
      location: 'Kochi, Kerala, India',
      website: `https://${finalSlug}.flocard.in`,
      theme: order.edition || 'purple',
      status: 'published',
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
      stats: { views: 1, saves: 0, shares: 0 },
      createdAt: new Date().toISOString()
    };

    // Save Card and Profile to storage
    const cards = getLocal('cards', INITIAL_CARDS);
    cards.unshift(newCard);
    setLocal('cards', cards);

    profiles.unshift(newProfile);
    setLocal('profiles', profiles);

    // Update Customer in customers list (increment totalCards)
    const customers = getLocal('customers', INITIAL_CUSTOMERS);
    let cust = customers.find(c => c.id === order.customerId || c.email === order.customerEmail || c.name.toLowerCase() === order.customerName.toLowerCase());
    if (cust) {
      cust.totalCards = (cust.totalCards || 0) + 1;
      cust.status = 'active';
      if (!cust.avatar && order.customerLogo) {
        cust.avatar = order.customerLogo;
      }
    } else {
      cust = {
        id: order.customerId || `cust_${Date.now()}`,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone || '+91 6238 578 552',
        company: order.company || 'FLOCARD Partner',
        avatar: order.customerLogo || null,
        totalCards: 1,
        totalDesigns: 1,
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0]
      };
      customers.unshift(cust);
    }
    setLocal('customers', customers);

    // Update order status
    order.status = 'delivered';
    order.deliveredAt = new Date().toISOString();
    order.cardCode = newCard.cardCode;
    order.profileSlug = finalSlug;
    orders[orderIndex] = order;
    setLocal('orders', orders);

    // Log audit entry
    StorageEngine.addAuditLog(
      'Order Fulfillment',
      `Order ${order.id} delivered to ${order.customerName}. NFC card ${newCard.cardCode} and profile @${finalSlug} are now live!`,
      'Akhil Anvar'
    );

    return { order, card: newCard, profile: newProfile };
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
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'admin_accounts');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'studio_bg');
    return true;
  }
};
