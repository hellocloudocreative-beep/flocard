/* ==========================================================================
   FLOCARDS OFFICIAL WHATSAPP BUSINESS PLATFORM INTEGRATION (MODULE 6)
   Implements a reliable server-side style Transactional Outbox pattern:
   - Saves order state independently from message delivery
   - Queues automated notifications for each fulfillment milestone
   - Deduplicates messages to prevent duplicate delivery
   - Supports official Meta WhatsApp Cloud API credentials
   - Provides administrator messaging history, status checks, and safe retries
   - If credentials are not yet configured, provides helpful setup diagnostics
     without breaking order fulfillment workflows.
   ========================================================================== */

const OUTBOX_STORAGE_KEY = 'flocard_whatsapp_outbox';
const CONFIG_STORAGE_KEY = 'flocard_whatsapp_config';

/**
 * Standard FLOCARDS WhatsApp Message Templates
 */
export const WHATSAPP_TEMPLATES = {
  order_confirmed: {
    name: 'flocards_order_confirmed',
    category: 'UTILITY',
    format: (data) =>
      `Hello ${data.customerName}! ✨\n\nYour FLOCARDS order *${data.orderReference}* for the *${data.editionName || 'NFC Business Card'}* has been confirmed.\n\nWe will keep you updated as your card advances through our precision manufacturing pipeline.\n\nTrack order live: ${data.trackingUrl}\n\n— Team FLOCARDS\nhttps://flocard.in`
  },
  design_approval_requested: {
    name: 'flocards_design_approval',
    category: 'UTILITY',
    format: (data) =>
      `Hello ${data.customerName}! 🎨\n\nYour custom FLOCARDS card design is ready for your review!\n\nPlease review your high-resolution digital proof here:\n👉 ${data.previewUrl || data.trackingUrl}\n\nOnce you approve the artwork, our team will proceed with laser engraving and chip encoding.\n\n— Team FLOCARDS`
  },
  design_approved: {
    name: 'flocards_design_approved',
    category: 'UTILITY',
    format: (data) =>
      `Hello ${data.customerName}! ✅\n\nYour FLOCARDS card artwork has been approved and locked for production. Production queues have been scheduled.\n\nOrder: *${data.orderReference}*\n\n— Team FLOCARDS`
  },
  payment_confirmed: {
    name: 'flocards_payment_confirmed',
    category: 'UTILITY',
    format: (data) =>
      `Hello ${data.customerName}! 💳\n\nPayment confirmation for your FLOCARDS order *${data.orderReference}* has been received.\n\nAmount Paid: *₹${data.amountPaid || data.totalAmount}*\nInvoice: *${data.invoiceId || 'Available on Dashboard'}*\n\nThank you for choosing FLOCARDS!\nhttps://flocard.in`
  },
  manufacturing_started: {
    name: 'flocards_manufacturing_started',
    category: 'UTILITY',
    format: (data) =>
      `Hello ${data.customerName}! ⚙️\n\nPrecision manufacturing has started for your FLOCARDS order *${data.orderReference}*.\n\nYour card is undergoing substrate bonding, high-frequency NTAG216 chip integration, and matte finishing.\n\nTrack progress: ${data.trackingUrl}`
  },
  quality_inspection: {
    name: 'flocards_quality_inspection',
    category: 'UTILITY',
    format: (data) =>
      `Hello ${data.customerName}! 🔍\n\nYour FLOCARDS NFC card is now undergoing rigorous Quality Inspection.\n\nWe are testing NFC antenna resonance, contactless read distance across iOS & Android, and surface scratch resistance.\n\nOrder: *${data.orderReference}*`
  },
  dispatched: {
    name: 'flocards_dispatched',
    category: 'UTILITY',
    format: (data) =>
      `Hello ${data.customerName}! 🚀\n\nExciting news! Your FLOCARDS order *${data.orderReference}* has been dispatched via ${data.carrierName || 'Express Courier'}.\n\nTracking Number: *${data.trackingNumber || 'Available shortly'}*\nTrack shipment: ${data.trackingUrl || 'https://flocard.in'}\n\nYour digital identity is on its way!`
  },
  delivered: {
    name: 'flocards_delivered',
    category: 'UTILITY',
    format: (data) =>
      `Hello ${data.customerName}! 🎉\n\nYour FLOCARDS order *${data.orderReference}* has been delivered!\n\nTo activate or update your public profile anytime, visit:\n👉 https://flocard.in/${data.profileSlug || 'account'}\n\nTap your card against any modern smartphone to start networking effortlessly.\n\nWelcome to connected identity,\nTeam FLOCARDS`
  }
};

/**
 * Retrieve WhatsApp Platform Configuration
 */
export function getWhatsAppConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};

    // Environment variables take precedence if provided
    return {
      provider: stored.provider || 'meta_cloud_api', // 'meta_cloud_api' | 'twilio' | 'aisensy'
      phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || stored.phoneNumberId || '',
      businessAccountId: import.meta.env.VITE_WHATSAPP_BUSINESS_ACCOUNT_ID || stored.businessAccountId || '',
      accessToken: stored.accessToken || '', // Never stored permanently if env available
      webhookSecret: stored.webhookSecret || '',
      senderPhoneNumber: stored.senderPhoneNumber || '+91 97782 78552',
      isConfigured: Boolean(
        (import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || stored.phoneNumberId) &&
        (import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || stored.accessToken)
      )
    };
  } catch (err) {
    console.error('Error reading WhatsApp config:', err);
    return { isConfigured: false, provider: 'meta_cloud_api' };
  }
}

/**
 * Save WhatsApp Platform Configuration
 */
export function saveWhatsAppConfig(newConfig) {
  try {
    const existing = getWhatsAppConfig();
    const merged = { ...existing, ...newConfig };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(merged));
    return { success: true, config: merged };
  } catch (err) {
    console.error('Error saving WhatsApp config:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Retrieve Outbox Messages
 */
export function getWhatsAppOutbox(orderId = null) {
  try {
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (orderId) {
      return list.filter(m => m.orderId === orderId || m.orderReference === orderId);
    }
    return list;
  } catch (err) {
    console.error('Error reading WhatsApp outbox:', err);
    return [];
  }
}

/**
 * Save Outbox Messages
 */
function setWhatsAppOutbox(list) {
  try {
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving WhatsApp outbox:', err);
  }
}

/**
 * Queue a WhatsApp Notification for an Order (Transactional Outbox)
 * Automatically deduplicates so the same event is not spammed.
 */
export async function queueWhatsAppNotification(order, eventType, extraData = {}) {
  if (!order) return null;

  const phone = (order.customerPhone || '').replace(/[^0-9]/g, '');
  if (!phone || phone.length < 8) {
    console.warn(`[WhatsApp] Order ${order.orderReference || order.id} has no valid phone number. Skipping notification.`);
    return null;
  }

  const template = WHATSAPP_TEMPLATES[eventType];
  if (!template) {
    console.warn(`[WhatsApp] Unknown event type "${eventType}". Skipping.`);
    return null;
  }

  const outbox = getWhatsAppOutbox();

  // Deduplication check: check if we already queued this event for this order within the last 10 minutes
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const duplicate = outbox.find(m =>
    m.orderId === order.id &&
    m.eventType === eventType &&
    new Date(m.createdAt).getTime() > tenMinutesAgo
  );

  if (duplicate) {
    console.info(`[WhatsApp] Notification for ${eventType} on ${order.orderReference} already queued. Skipping duplicate.`);
    return duplicate;
  }

  const trackingUrl = order.trackingToken
    ? `https://flocard.in/track?ref=${encodeURIComponent(order.orderReference || order.id)}&token=${encodeURIComponent(order.trackingToken)}`
    : `https://flocard.in/${order.profileSlug || 'alex'}`;

  const templateData = {
    customerName: order.customerName || 'Valued Customer',
    orderReference: order.orderReference || order.id,
    editionName: order.edition ? `${order.edition.toUpperCase()} Edition` : 'NFC Card',
    amountPaid: order.amountPaid || order.totalAmount,
    totalAmount: order.totalAmount,
    invoiceId: order.invoiceId,
    trackingUrl,
    previewUrl: order.previewUrl || trackingUrl,
    carrierName: order.carrierName || 'Blue Dart Express',
    trackingNumber: order.trackingNumber || '',
    profileSlug: order.profileSlug || 'alex',
    ...extraData
  };

  const messageBody = template.format(templateData);

  const messageRecord = {
    id: `wa_msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    orderId: order.id,
    orderReference: order.orderReference || order.id,
    recipientPhone: phone,
    recipientName: order.customerName,
    eventType,
    templateName: template.name,
    messageBody,
    status: 'queued', // 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'not_configured'
    providerMessageId: null,
    errorDetails: null,
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date().toISOString(),
    sentAt: null,
    updatedAt: new Date().toISOString()
  };

  // Add to outbox
  outbox.unshift(messageRecord);
  setWhatsAppOutbox(outbox.slice(0, 500));

  // Asynchronously attempt delivery
  processWhatsAppMessage(messageRecord.id);

  return messageRecord;
}

/**
 * Process a message delivery through the configured provider
 */
export async function processWhatsAppMessage(messageId) {
  const outbox = getWhatsAppOutbox();
  const record = outbox.find(m => m.id === messageId);
  if (!record) return;

  const config = getWhatsAppConfig();

  if (!config.isConfigured) {
    record.status = 'not_configured';
    record.errorDetails = 'WhatsApp Business API credentials not configured in Admin Settings -> Integrations.';
    record.updatedAt = new Date().toISOString();
    setWhatsAppOutbox(outbox);
    return;
  }

  // If configured with Meta WhatsApp Cloud API
  try {
    const formattedPhone = record.recipientPhone.startsWith('91') || record.recipientPhone.length > 10
      ? record.recipientPhone
      : `91${record.recipientPhone}`;

    const endpoint = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`;

    // Attempt delivery via Meta Cloud API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { preview_url: true, body: record.messageBody }
      })
    });

    const data = await response.json();

    if (response.ok && data.messages?.[0]?.id) {
      record.status = 'sent';
      record.providerMessageId = data.messages[0].id;
      record.sentAt = new Date().toISOString();
      record.errorDetails = null;
    } else {
      record.status = 'failed';
      record.errorDetails = data?.error?.message || 'Meta API returned non-200 response.';
      record.retryCount += 1;
    }
  } catch (err) {
    console.error('[WhatsApp] Delivery network error:', err);
    record.status = 'failed';
    record.errorDetails = err.message || 'Network error delivering message.';
    record.retryCount += 1;
  }

  record.updatedAt = new Date().toISOString();
  setWhatsAppOutbox(outbox);
}

/**
 * Retry an eligible failed or queued message
 */
export async function retryWhatsAppMessage(messageId) {
  const outbox = getWhatsAppOutbox();
  const record = outbox.find(m => m.id === messageId);
  if (!record) return { success: false, error: 'Message not found.' };

  record.status = 'queued';
  record.errorDetails = null;
  record.updatedAt = new Date().toISOString();
  setWhatsAppOutbox(outbox);

  await processWhatsAppMessage(messageId);
  return { success: true };
}

/**
 * Test WhatsApp Connection with Meta Cloud API or validate credentials
 */
export async function testWhatsAppConnection(recipientPhone = '919778278552') {
  const config = getWhatsAppConfig();
  if (!config.phoneNumberId) {
    return { success: false, error: 'Phone Number ID is missing.' };
  }
  if (!config.accessToken) {
    return { success: false, error: 'Access Token is missing.' };
  }

  const formattedPhone = (recipientPhone || '919778278552').replace(/[^0-9]/g, '');
  const endpoint = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: 'Hello from FLOCARDS! 🚀 This is an automated test notification confirming that your Meta WhatsApp Business Cloud API connector is active.'
        }
      })
    });

    const data = await res.json();
    if (res.ok && data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    }
    return {
      success: false,
      error: data?.error?.message || `Meta Cloud API responded with status ${res.status}`
    };
  } catch (err) {
    return { success: false, error: err.message || 'Network request failed' };
  }
}

/**
 * Format official WhatsApp Click-to-Chat message for print order submission
 */
export function createPrintOrderWhatsAppMessage(order) {
  if (!order) return '';
  const ref = order.orderReference || order.id || 'FLC-ORD';
  const customerName = order.customerName || order.customerDetails?.name || 'Valued Client';
  const username = order.username || order.customerUser?.username || order.customerDetails?.username || order.profileSlug || (order.customerEmail ? order.customerEmail.split('@')[0] : '');
  const phone = order.customerPhone || order.customerDetails?.phone || 'Not provided';
  const email = order.customerEmail || order.customerDetails?.email || '';
  const edition = order.edition || order.design?.edition || 'purple';
  const editionTitle = `${edition.charAt(0).toUpperCase() + edition.slice(1)} Edition NFC Card`;
  const quantity = order.quantity || order.pricing?.quantity || 1;
  const designName = order.designTitle || order.design?.title || `${customerName}'s Card`;
  const role = order.role || order.design?.front?.role || order.frontConfig?.role || '';
  const company = order.company || order.design?.company || order.frontConfig?.company || '';
  const tagline = order.tagline || order.design?.front?.tagline || order.frontConfig?.tagline || '';
  const templateName = order.templateType === 'customer_logo' ? 'Custom Logo Design (With Logo)' : 'Standard FLOCARDS Design';
  const total = order.totalAmount || order.pricing?.totalAmount || 1899;
  const hasInvoice = order.hasInvoiceAddon ? 'Included (Tax Invoice)' : 'Not requested';
  const shipping = order.shippingAddress || order.customerDetails?.shippingAddress || 'To be confirmed on WhatsApp';
  const profileSlug = order.profileSlug || order.design?.profileSlug || (username || '');
  const previewUrl = profileSlug ? `https://flocard.in/p/${profileSlug}` : 'https://flocard.in/designer';

  return `*NEW FLOCARDS ORDER SUBMISSION* 🚀
━━━━━━━━━━━━━━━━━━━━
📦 *Order ID:* ${ref}
👤 *Customer Name:* ${customerName}
${username ? `🆔 *Username / Handle:* @${username}\n` : ''}📞 *Contact Phone:* ${phone}
✉️ *Email Address:* ${email}
📍 *Shipping Address:* ${shipping}

🏷️ *Product:* ${editionTitle}
🎨 *Template:* ${templateName}
🔢 *Quantity:* ${quantity} Unit(s)
📝 *Name on Card:* ${order.design?.front?.name || order.frontConfig?.name || customerName}
🏢 *Company / Role:* ${role ? `${role} • ` : ''}${company || 'Independent'}
${tagline ? `💬 *Tagline:* ${tagline}\n` : ''}
💰 *Total Amount:* ₹${Number(total).toLocaleString('en-IN')}
📋 *Tax Invoice:* ${hasInvoice}
💳 *Payment Mode:* Direct WhatsApp (Manual Admin Verification)

🔗 *Design & Profile Proof:*
${previewUrl}
━━━━━━━━━━━━━━━━━━━━
_Submitted directly via FLOCARDS Studio. Please review and confirm order details._`;
}

/**
 * Generate click-to-chat WhatsApp URL directed to configured business number
 */
export function getPrintOrderWhatsAppUrl(order, targetWhatsApp = '919778278552') {
  const cleanPhone = String(targetWhatsApp || '919778278552').replace(/[^0-9]/g, '');
  const message = createPrintOrderWhatsAppMessage(order);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Validate whether a string has a usable phone/WhatsApp number
 */
export function isValidWhatsAppNumber(rawNumber) {
  if (!rawNumber) return false;
  const clean = String(rawNumber).replace(/[^0-9]/g, '');
  return clean.length >= 8 && clean.length <= 15;
}

/**
 * Clean and format a phone/WhatsApp number with default '91' prepend for 10-digit numbers
 */
export function formatWhatsAppNumber(rawNumber) {
  if (!rawNumber) return '';
  const clean = String(rawNumber).replace(/[^0-9]/g, '');
  if (!clean) return '';
  return clean.length === 10 ? `91${clean}` : clean;
}

/**
 * Generate official manual WhatsApp click-to-chat URL for contacting a customer directly.
 * Formats:
 * 1. "Hello [Customer Name], we received your FLOCARDS card request. We will contact you regarding the next steps."
 * 2. Or custom text provided by the admin.
 * Returns null if no valid number is available (so UI can disable button).
 */
export function getManualCustomerWhatsAppUrl(customerOrOrder, customText = '') {
  if (!customerOrOrder) return null;
  const rawNumber =
    customerOrOrder.whatsapp ||
    customerOrOrder.whatsappNumber ||
    customerOrOrder.phone ||
    customerOrOrder.customerPhone ||
    customerOrOrder.customerDetails?.phone ||
    customerOrOrder.customerDetails?.whatsapp ||
    '';

  const clean = String(rawNumber).replace(/[^0-9]/g, '');
  if (!clean || clean.length < 8) return null;

  // Prepend default Indian country code (91) if 10-digit number without country code
  const fullNumber = clean.length === 10 ? `91${clean}` : clean;

  const customerName =
    customerOrOrder.name ||
    customerOrOrder.customerName ||
    customerOrOrder.customerDetails?.name ||
    'there';

  const orderRef =
    customerOrOrder.orderReference ||
    customerOrOrder.id ||
    '';

  let message = customText;
  if (!message) {
    message = `Hello ${customerName}, we received your FLOCARDS card request. We will contact you regarding the next steps.`;
  }

  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate standard UPI deep-link URL (RFC-compliant upi://pay URI) for an order
 * Prefills the exact order amount so scanning or clicking pre-fills ₹2000 (or exact amount)
 */
export function getOrderUpiPaymentUrl(order, customUpiId = null) {
  if (!order) return '';
  let upiId = customUpiId || order.upiId || order.paymentConfig?.upiId;
  if (!upiId) {
    try {
      const stored = localStorage.getItem('flocard_invoice_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.upiId) upiId = parsed.upiId;
      }
    } catch (_) {}
  }
  if (!upiId) upiId = 'flocard@hdfcbank';

  const rawAmount = Number(order.totalAmount || order.total_amount || order.pricing?.totalPayable || order.pricing?.total || order.unitPrice || 2000);
  const amount = isNaN(rawAmount) || rawAmount <= 0 ? 2000 : rawAmount;
  const orderRef = order.orderReference || order.id || 'FLOCARD-ORDER';
  const merchantName = 'FLOCARDS';

  const params = new URLSearchParams();
  params.set('pa', upiId.trim());
  params.set('pn', merchantName);
  params.set('cu', 'INR');
  params.set('am', amount.toFixed(2));
  params.set('tn', `Payment for FLOCARD Order ${orderRef}`);

  return `upi://pay?${params.toString()}`;
}

/**
 * Generate formatted WhatsApp message containing order details and Google Pay payment link.
 * STRICT REQUIREMENT: Does NOT send card link, does NOT send QR code image.
 * Sends direct Google Pay / UPI payment deep link with exact amount prefilled!
 */
export function getOrderWhatsAppPaymentMessage(order, customUpiId = null) {
  if (!order) return '';

  const customerName =
    order.customerName ||
    order.name ||
    order.customerDetails?.name ||
    'there';

  const orderRef = order.orderReference || order.id || 'FLOCARD-ORDER';
  const rawAmount = Number(order.totalAmount || order.total_amount || order.pricing?.totalPayable || order.pricing?.total || order.unitPrice || 2000);
  const amount = isNaN(rawAmount) || rawAmount <= 0 ? 2000 : rawAmount;
  const formattedAmount = amount.toLocaleString('en-IN');

  const edition = order.edition
    ? `${String(order.edition).toUpperCase()} Edition`
    : (order.productName || 'FLOCARD NFC Smart Card');

  let upiId = customUpiId || order.upiId || order.paymentConfig?.upiId;
  if (!upiId) {
    try {
      const stored = localStorage.getItem('flocard_invoice_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.upiId) upiId = parsed.upiId;
      }
    } catch (_) {}
  }
  if (!upiId) upiId = 'flocard@hdfcbank';

  const upiPayUrl = getOrderUpiPaymentUrl(order, upiId);

  return (
    `Hello ${customerName}! ✨\n\n` +
    `Here are your FLOCARDS order details and instant payment link:\n\n` +
    `📦 *Order Reference:* ${orderRef}\n` +
    `🎴 *Product:* ${edition}\n` +
    `💰 *Total Amount Due:* ₹${formattedAmount}\n\n` +
    `👉 *Google Pay / UPI Payment Link:*\n${upiPayUrl}\n\n` +
    `*Payee UPI ID:* ${upiId}\n\n` +
    `_Tap the Google Pay link above on your phone to open Google Pay, PhonePe, or Paytm with the ₹${formattedAmount} amount already filled, or transfer directly to our UPI ID *${upiId}*._\n\n` +
    `— Team FLOCARDS\nhttps://flocard.in`
  );
}

/**
 * Generate click-to-chat WhatsApp URL with prefilled Order Details & Google Pay payment link
 */
export function getOrderWhatsAppPaymentDetailsUrl(order, customUpiId = null) {
  if (!order) return null;
  const rawNumber =
    order.whatsapp ||
    order.whatsappNumber ||
    order.phone ||
    order.customerPhone ||
    order.customerDetails?.phone ||
    order.customerDetails?.whatsapp ||
    '';

  const clean = String(rawNumber).replace(/[^0-9]/g, '');
  if (!clean || clean.length < 8) return null;

  const fullNumber = clean.length === 10 ? `91${clean}` : clean;
  const message = getOrderWhatsAppPaymentMessage(order, customUpiId);

  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
}



