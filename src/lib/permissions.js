/* ==========================================================================
   FLOCARDS ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION ENGINE
   Supports: Owner, Sales, Designer, Production, Accounts.
   Enforces deny-by-default access with custom permission overrides.
   ========================================================================== */

export const ROLES = {
  OWNER: 'owner',
  SALES: 'sales',
  DESIGNER: 'designer',
  PRODUCTION: 'production',
  ACCOUNTS: 'accounts'
};

export const ROLE_LABELS = {
  owner: 'Platform Owner',
  sales: 'Sales Representative',
  designer: 'Creative Designer',
  production: 'Production & Fulfillment',
  accounts: 'Finance & Accounts',
  admin: 'Administrator'
};

export const ROLE_DESCRIPTIONS = {
  owner: 'Full unrestricted platform access, staff administration, audit inspection, and system settings.',
  sales: 'Create and manage orders, view client contacts, track sales metrics and permitted order statuses.',
  designer: 'Create, review, and approve card artwork designs, templates, and production-ready mockups.',
  production: 'Track manufacturing queue, manage NFC chip encoding, quality assurance, and dispatch tracking.',
  accounts: 'Manage GST tax invoices, payments, revenue reconciliation, and financial audit reports.'
};

export const PERMISSION_CATALOG = [
  // Orders
  { id: 'orders.read', label: 'View Orders', category: 'Orders', description: 'View customer purchase orders and fulfillment status.' },
  { id: 'orders.create', label: 'Create Orders', category: 'Orders', description: 'Create new manual or WhatsApp-assisted purchase orders.' },
  { id: 'orders.update', label: 'Update Orders', category: 'Orders', description: 'Modify order status, shipping milestones, and notes.' },
  { id: 'orders.cancel', label: 'Cancel Orders', category: 'Orders', description: 'Cancel existing customer orders.' },

  // Customers
  { id: 'customers.read', label: 'View Customers', category: 'Customers', description: 'Inspect registered customer profiles, emails, and phone numbers.' },
  { id: 'customers.update', label: 'Edit Customers', category: 'Customers', description: 'Update customer contact info, company details, or status.' },

  // Designs
  { id: 'designs.read', label: 'View Designs', category: 'Designs', description: 'Access customer and studio card artwork designs.' },
  { id: 'designs.create', label: 'Create Artwork', category: 'Designs', description: 'Design cards in studio and create reusable templates.' },
  { id: 'designs.approve', label: 'Approve Designs', category: 'Designs', description: 'Approve or reject customer design submissions for print.' },

  // Production & NFC
  { id: 'production.update', label: 'Update Production Queue', category: 'Production', description: 'Update manufacturing stages, batch progress, and QA steps.' },
  { id: 'nfc.read', label: 'View NFC Cards', category: 'Production', description: 'Inspect registered card codes, chips, and assigned URLs.' },
  { id: 'nfc.activate', label: 'Activate & Program NFC', category: 'Production', description: 'Link card chips to digital profile slugs and manage status.' },
  { id: 'nfc.status_manage', label: 'Enable / Disable NFC Cards', category: 'Security & Access', description: 'Authoritative permission to enable, disable, and change NFC card activation status.' },

  // Smart QR
  { id: 'qr.read', label: 'View Smart QRs', category: 'Smart QR', description: 'Search, preview, and test companion QR codes.' },
  { id: 'qr.download', label: 'Download QR Assets', category: 'Smart QR', description: 'Export print-ready PNG and vector SVG QR files.' },
  { id: 'qr.manage', label: 'Global QR Config', category: 'Smart QR', description: 'Configure system-wide QR URL routing and quiet zones.' },

  // Finance & Accounts
  { id: 'finance.read', label: 'View Invoices & Ledger', category: 'Finance', description: 'Inspect tax invoices, payments, and revenue summaries.' },
  { id: 'finance.update', label: 'Record Transactions', category: 'Finance', description: 'Mark invoices as paid, record refunds, and adjust tax rates.' },
  { id: 'finance.export', label: 'Export Financials', category: 'Finance', description: 'Download CSV and PDF reports of sales and tax ledgers.' },

  // Staff Administration
  { id: 'staff.manage', label: 'Manage Staff & Roles', category: 'Administration', description: 'Invite staff members, assign roles, and modify permissions.' },

  // Audit Logs
  { id: 'audit.read', label: 'View Owner Activity Feed', category: 'Security & Audit', description: 'Access live chronological audit feed of all platform operations.' },
  { id: 'audit.export', label: 'Export Audit Logs', category: 'Security & Audit', description: 'Download CSV or JSON export of full immutable event history.' },

  // System Settings
  { id: 'settings.manage', label: 'System Settings', category: 'Administration', description: 'Modify WhatsApp integration, database telemetry, and global config.' }
];

export const DEFAULT_ROLE_PERMISSIONS = {
  owner: PERMISSION_CATALOG.map(p => p.id),

  sales: [
    'orders.read',
    'orders.create',
    'orders.update',
    'customers.read',
    'customers.update',
    'finance.read',
    'qr.read',
    'qr.download'
  ],

  designer: [
    'designs.read',
    'designs.create',
    'designs.approve',
    'customers.read',
    'qr.read',
    'qr.download'
  ],

  production: [
    'orders.read',
    'orders.update',
    'production.update',
    'nfc.read',
    'nfc.activate',
    'qr.read',
    'qr.download'
  ],

  accounts: [
    'finance.read',
    'finance.update',
    'finance.export',
    'orders.read',
    'customers.read'
  ],

  admin: [
    'orders.read',
    'orders.create',
    'orders.update',
    'customers.read',
    'customers.update',
    'designs.read',
    'designs.create',
    'designs.approve',
    'production.update',
    'nfc.read',
    'nfc.activate',
    'nfc.status_manage',
    'qr.read',
    'qr.download',
    'finance.read'
  ]
};

// Check if user has a specific permission
export function hasPermission(user, permissionId) {
  if (!user) return false;

  const role = (user.role || 'customer').toLowerCase();
  const email = (user.email || '').toLowerCase().trim();

  // Root Owner bypasses all checks (Owner has full authority)
  const isSuperOwner = role === 'owner' ||
    email === 'flocard' ||
    email === 'flocard@flocard.in' ||
    email === 'hello.flocard@gmail.com' ||
    email === 'admin@flocard.in';

  if (isSuperOwner) return true;

  // Audit and staff management strictly forbidden for non-owners regardless of overrides
  if ((permissionId === 'audit.read' || permissionId === 'audit.export' || permissionId === 'staff.manage') && !isSuperOwner) {
    return false;
  }

  // Check custom permission overrides if present on user object
  if (user.customPermissions && Array.isArray(user.customPermissions)) {
    if (user.customPermissions.includes(permissionId)) return true;
  }

  // Fallback to role defaults
  const roleDefaults = DEFAULT_ROLE_PERMISSIONS[role] || [];
  return roleDefaults.includes(permissionId);
}

// Check which tabs a staff user is permitted to access
export function canAccessTab(user, tabId) {
  if (!user) return false;

  const role = (user.role || 'customer').toLowerCase();
  const isOwner = role === 'owner' ||
    ['flocard', 'flocard@flocard.in', 'hello.flocard@gmail.com', 'admin@flocard.in'].includes(user?.email?.toLowerCase()?.trim());

  if (isOwner) return true;

  // Strict owner-only tabs
  if (tabId === 'audit-logs' || tabId === 'admin-access') {
    return false;
  }

  switch (tabId) {
    case 'overview':
      return true; // All staff roles can see dashboard overview
    case 'orders':
      return hasPermission(user, 'orders.read');
    case 'studio':
      return hasPermission(user, 'designs.create');
    case 'designs':
      return hasPermission(user, 'designs.read');
    case 'sales':
      return hasPermission(user, 'finance.read');
    case 'product-sales':
      return hasPermission(user, 'finance.read');
    case 'customers':
      return hasPermission(user, 'customers.read');
    case 'profiles':
      return isOwner || role === 'admin' || role === 'designer';
    case 'cards':
      return hasPermission(user, 'nfc.read');
    case 'pricing':
      return isOwner || role === 'admin' || role === 'sales';
    case 'templates':
      return hasPermission(user, 'designs.read');
    case 'analytics':
      return isOwner || role === 'admin' || role === 'sales' || role === 'accounts';
    case 'qr':
      return hasPermission(user, 'qr.read');
    case 'settings':
      return hasPermission(user, 'settings.manage');
    default:
      return false;
  }
}
