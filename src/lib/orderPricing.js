/* ==========================================================================
   FLOCARDS AUTHORITATIVE ORDER PRICING & INVOICE SETTINGS ENGINE
   Provides trusted server-side-style price calculation, tax itemization,
   invoice add-on fee configuration, and business entity metadata.
   ========================================================================== */

import { EDITIONS, BRAND } from './constants.js';

const INVOICE_SETTINGS_KEY = 'flocard_invoice_config';

export const DEFAULT_BUSINESS_DETAILS = {
  companyName: 'FLOCARDS SMART SYSTEMS',
  legalEntity: 'FLOCARDS TECHNOLOGIES PRIVATE LIMITED',
  brandName: 'FLOCARDS',
  tagline: 'One Tap. Every Connection.',
  domain: 'flocard.in',
  email: 'contact@flocard.in',
  phone: '+91 97782 78552',
  whatsapp: '919778278552',
  addressLine1: 'Indiranagar 100 Feet Road',
  addressLine2: 'Tech Corridor, Indiranagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560038',
  country: 'India',
  gstin: '29AAACF9876Q1Z3',
  sacCode: '998439',
  supportHours: 'Mon - Sat, 9:00 AM - 7:00 PM IST',
  bankName: 'HDFC Bank Ltd',
  accountNumber: '50200084920194',
  ifscCode: 'HDFC0000128',
  upiId: 'flocards@hdfcbank'
};

export const DEFAULT_INVOICE_CONFIG = {
  enabled: true,
  addonFee: 199,
  currency: 'INR',
  taxRate: 0.18, // 18% GST (9% CGST + 9% SGST)
  business: DEFAULT_BUSINESS_DETAILS,
  allowCustomerThemes: true,
  supportedThemes: [
    { id: 'purple', name: 'Midnight Purple', accent: '#8B5CF6', secondary: '#6D28D9', bg: '#0F091A', text: '#FFFFFF', isDark: true },
    { id: 'black', name: 'Minimal Black', accent: '#374151', secondary: '#1F2937', bg: '#0B0F19', text: '#FFFFFF', isDark: true },
    { id: 'light', name: 'Elegant Light', accent: '#4F46E5', secondary: '#4338CA', bg: '#F9FAFB', text: '#111827', isDark: false },
    { id: 'brand', name: 'Brand Color', accent: '#A855F7', secondary: '#6B00FF', bg: '#120D22', text: '#FFFFFF', isDark: true }
  ]
};

/**
 * Retrieve active invoice configuration from storage
 */
export function getInvoiceConfig() {
  if (typeof window === 'undefined') return DEFAULT_INVOICE_CONFIG;
  try {
    const raw = localStorage.getItem(INVOICE_SETTINGS_KEY);
    if (!raw) return DEFAULT_INVOICE_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_INVOICE_CONFIG,
      ...parsed,
      business: { ...DEFAULT_BUSINESS_DETAILS, ...(parsed.business || {}) }
    };
  } catch (_) {
    return DEFAULT_INVOICE_CONFIG;
  }
}

/**
 * Save invoice configuration (Owner / Admin control)
 */
export function saveInvoiceConfig(updated) {
  if (typeof window === 'undefined') return updated;
  try {
    const merged = { ...getInvoiceConfig(), ...updated };
    localStorage.setItem(INVOICE_SETTINGS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('flocard_invoice_config_updated', { detail: merged }));
    return merged;
  } catch (e) {
    console.error('Failed to save invoice config:', e);
    return getInvoiceConfig();
  }
}

/**
 * Get product base price for a given edition key
 */
export function getEditionBasePrice(editionKey = 'purple') {
  const norm = String(editionKey || 'purple').toLowerCase().trim();
  switch (norm) {
    case 'platinum': return 2199;
    case 'gold': return 2499;
    case 'metal': return 2999;
    case 'white': return 1999;
    case 'purple':
    default:
      return 1899;
  }
}

/**
 * Calculate trusted server-side order pricing breakdown
 */
export function calculateOrderPricing(options = {}) {
  const {
    edition = 'purple',
    quantity = 1,
    hasInvoiceAddon = false,
    customizationFee = options.customizationCharge ?? 0,
    deliveryFee = options.deliveryCharge ?? 0,
    discountAmount = 0
  } = options;

  const config = getInvoiceConfig();
  const safeQty = Math.max(1, parseInt(quantity, 10) || 1);
  const unitPrice = getEditionBasePrice(edition);
  const subtotal = unitPrice * safeQty;
  const safeCustomization = Math.max(0, parseFloat(customizationFee) || 0);
  const safeDelivery = Math.max(0, parseFloat(deliveryFee) || 0);
  const invoiceAddonFee = (hasInvoiceAddon && config.enabled) ? config.addonFee : 0;
  const safeDiscount = Math.max(0, parseFloat(discountAmount) || 0);

  // Net taxable subtotal
  const taxableBase = Math.round((subtotal + safeCustomization + safeDelivery + invoiceAddonFee - safeDiscount) * 100) / 100;

  // 18% GST (CGST 9% + SGST 9%)
  const taxRate = config.taxRate || 0.18;
  const totalTax = Math.round((taxableBase * taxRate) * 100) / 100;
  const cgstAmount = Math.round((totalTax / 2) * 100) / 100;
  const sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100;

  const totalAmount = Math.round((taxableBase + totalTax) * 100) / 100;

  return {
    edition: String(edition).toLowerCase(),
    productName: `FLOCARD ${edition.charAt(0).toUpperCase() + edition.slice(1)} Edition NFC Card`,
    unitPrice,
    quantity: safeQty,
    subtotal,
    customizationFee: safeCustomization,
    customizationCharge: safeCustomization,
    deliveryFee: safeDelivery,
    deliveryCharge: safeDelivery,
    invoiceAddonFee,
    invoiceAddonCharge: invoiceAddonFee,
    hasInvoiceAddon: Boolean(hasInvoiceAddon && config.enabled),
    discountAmount: safeDiscount,
    taxRate,
    taxableBase,
    totalTax,
    taxAmount: totalTax,
    cgstAmount,
    sgstAmount,
    totalAmount,
    currency: config.currency || 'INR',
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Generate unique official invoice number (e.g. INV-2026-8492)
 */
export function generateInvoiceNumber(orderReference = '') {
  const year = new Date().getFullYear();
  let randSuffix = '';
  if (orderReference && orderReference.includes('-')) {
    const parts = orderReference.split('-');
    randSuffix = parts[parts.length - 1];
  }
  if (!randSuffix || randSuffix.length < 3) {
    randSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  }
  return `INV-${year}-${randSuffix.toUpperCase()}`;
}
