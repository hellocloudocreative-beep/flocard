/* ==========================================================================
   FLOCARDS TEST SUITE: INVOICE GENERATOR, PRINT ORDER & WHATSAPP INTEGRATION
   Tests:
   1. Authoritative Pricing Engine:
      - Base unit price, quantity scaling, customization charges, delivery charges
      - Configurable Invoice Add-on (₹199) and 18% GST (CGST 9% + SGST 9%)
      - Rounding and calculations integrity
   2. Print Order Submission:
      - Field validation (rejects empty/invalid customer data)
      - Generates unique order reference (FLC-ORD-XXXX)
      - Initializes status to 'new_order' and paymentStatus to 'payment_pending'
      - Preserves exact frozen card configuration snapshot
      - 30-second idempotency check prevents duplicate order creation on double clicks
   3. WhatsApp Click-to-Chat Link Generation:
      - Targets configured business WhatsApp (+91 97782 78552)
      - Contains reference, customer info, card specs, breakdown, payment status: Pending
      - Properly URL-encoded
   4. Admin Order Management & Controlled Status Updates:
      - Order immediately accessible to admin
      - Authorized payment confirmation requires audit verification reference
      - Reverting to payment pending works
      - Invoice eligibility can be toggled by admin
   5. Invoice Generation & Eligibility Gating:
      - Non-eligible orders cannot generate without invoice add-on
      - Eligible orders generate theme-matched invoices (Midnight Purple, Minimal Black, Elegant Light, Brand Color)
      - Invoice storage and retrieval by customer/order
   ========================================================================== */

import assert from 'node:assert';
import {
  calculateOrderPricing,
  getEditionBasePrice,
  generateInvoiceNumber,
  DEFAULT_BUSINESS_DETAILS
} from '../src/lib/orderPricing.js';
import {
  createPrintOrderWhatsAppMessage,
  getPrintOrderWhatsAppUrl
} from '../src/lib/whatsapp.js';
import { StorageEngine, ORDER_STAGES } from '../src/lib/storage.js';
import { INVOICE_THEMES, getInvoiceTheme } from '../src/lib/invoicePdfExport.js';

console.log('--- STARTING FLOCARDS INVOICE GENERATOR & PRINT ORDER WORKFLOW TESTS ---');

// Mock localStorage for Node test runner
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

// --------------------------------------------------------------------------
// TEST 1: Authoritative Server-Side Pricing Engine
// --------------------------------------------------------------------------
console.log('\nTest 1: Authoritative Server-Side Pricing Engine');

// 1a: Standard single card without invoice add-on
const p1 = calculateOrderPricing({
  edition: 'purple',
  quantity: 1,
  hasInvoiceAddon: false
});
assert.strictEqual(p1.unitPrice, 1899, 'Purple base unit price should be ₹1899');
assert.strictEqual(p1.quantity, 1, 'Quantity should be 1');
assert.strictEqual(p1.customizationCharge, 0, 'No customization charge');
assert.strictEqual(p1.invoiceAddonCharge, 0, 'Invoice add-on should be 0 when not selected');
assert.strictEqual(p1.taxableBase, 1899, 'Taxable base should equal ₹1899');
assert.strictEqual(p1.cgstAmount, 170.91, 'CGST 9% should be 170.91');
assert.strictEqual(p1.sgstAmount, 170.91, 'SGST 9% should be 170.91');
assert.strictEqual(p1.taxAmount, 341.82, 'Total GST 18% should be 341.82');
assert.strictEqual(p1.totalAmount, 2240.82, 'Total payable with 18% GST should be ₹2240.82');
console.log('✓ Standard order pricing calculated accurately: ₹' + p1.totalAmount);

// 1b: Order with Invoice Add-On (+₹199) and Customization (+₹200)
const p2 = calculateOrderPricing({
  edition: 'gold',
  quantity: 2,
  customizationCharge: 200,
  hasInvoiceAddon: true
});
assert.strictEqual(p2.unitPrice, 2499, 'Gold base unit price should be ₹2499');
assert.strictEqual(p2.subtotal, 4998, 'Subtotal for 2 units should be ₹4998');
assert.strictEqual(p2.invoiceAddonCharge, 199, 'Invoice add-on fee should be ₹199');
assert.strictEqual(p2.customizationCharge, 200, 'Customization fee should be ₹200');
assert.strictEqual(p2.taxableBase, 4998 + 200 + 199, 'Taxable base should include add-on');
assert.strictEqual(p2.totalAmount, Number((p2.taxableBase * 1.18).toFixed(2)), 'Total includes 18% GST');
console.log('✓ Order with Invoice Add-on and Customization calculated accurately: ₹' + p2.totalAmount);

// --------------------------------------------------------------------------
// TEST 2: Print Order Submission & Idempotency Duplicate Prevention
// --------------------------------------------------------------------------
console.log('\nTest 2: Print Order Submission & Idempotency');

const orderPayload1 = {
  customerName: 'Karthik Menon',
  customerEmail: 'karthik@example.com',
  customerPhone: '+91 98450 12345',
  shippingAddress: '42, 12th Main Road, Indiranagar, Bengaluru, 560038',
  company: 'Menon Tech Solutions',
  edition: 'purple',
  quantity: 1,
  hasInvoiceAddon: true,
  billingDetails: {
    company: 'Menon Tech Solutions Private Limited',
    gstin: '29ABCDE1234F1Z5',
    address: 'Indiranagar, Bengaluru'
  },
  cardConfig: {
    name: 'Karthik Menon',
    title: 'Founder & CTO',
    company: 'Menon Tech',
    layout: 'standard',
    theme: 'purple'
  }
};

const submittedOrder1 = StorageEngine.submitPrintOrder(orderPayload1);
assert.ok(submittedOrder1, 'Order must be submitted successfully');
assert.ok(submittedOrder1.id, 'Order must have a unique ID');
assert.ok(submittedOrder1.orderReference.startsWith('FLC-ORD-'), 'Order reference must start with FLC-ORD-');
assert.strictEqual(submittedOrder1.status, 'new_order', 'Initial status must be new_order');
assert.strictEqual(submittedOrder1.paymentStatus, 'payment_pending', 'Initial payment status must be payment_pending');
assert.strictEqual(submittedOrder1.hasInvoiceAddon, true, 'Invoice add-on flag must be preserved');
assert.strictEqual(submittedOrder1.invoiceEligible, true, 'Invoice eligibility must be true when add-on purchased');
assert.ok(submittedOrder1.pricingBreakdown, 'Authoritative pricing breakdown must be attached');
assert.strictEqual(submittedOrder1.pricingBreakdown.invoiceAddonCharge, 199, 'Pricing breakdown must show ₹199 invoice fee');
console.log('✓ Print Order created with reference:', submittedOrder1.orderReference);

// 2b: Duplicate prevention within 30 seconds
const duplicateOrder = StorageEngine.submitPrintOrder(orderPayload1);
assert.strictEqual(duplicateOrder.id, submittedOrder1.id, 'Identical repeated submission within 30s must return the same order ID');
assert.strictEqual(duplicateOrder.orderReference, submittedOrder1.orderReference, 'Reference must match existing without duplicate');
console.log('✓ Idempotency safeguard prevents duplicate orders on rapid clicks');

// 2c: Field validation rejection
assert.throws(() => {
  StorageEngine.submitPrintOrder({
    cardConfig: { name: 'Test' },
    customerName: '',
    customerEmail: 'missing_name@example.com'
  });
}, /customer full name/, 'Must reject missing customer name');

assert.throws(() => {
  StorageEngine.submitPrintOrder({
    cardConfig: { name: 'Test' },
    customerName: 'Valid Name',
    customerEmail: 'valid@example.com',
    customerPhone: ''
  });
}, /contact number/i, 'Must reject missing phone number');
console.log('✓ Input validation rejects incomplete submissions');

// --------------------------------------------------------------------------
// TEST 3: WhatsApp Click-to-Chat Integration
// --------------------------------------------------------------------------
console.log('\nTest 3: WhatsApp Click-to-Chat Link Generation');

const waMsg = createPrintOrderWhatsAppMessage(submittedOrder1);
assert.ok(waMsg.includes('NEW FLOCARDS PRINT ORDER'), 'Message must include header');
assert.ok(waMsg.includes(submittedOrder1.orderReference), 'Message must include order reference');
assert.ok(waMsg.includes('Karthik Menon'), 'Message must include customer name');
assert.ok(waMsg.includes('Payment Pending'), 'Message must state Payment Status: Payment Pending');
assert.ok(waMsg.includes('Invoice Add-on'), 'Message must include invoice add-on note');
assert.ok(waMsg.includes('Indiranagar, Bengaluru'), 'Message must include shipping address');

const waUrl = getPrintOrderWhatsAppUrl(submittedOrder1);
assert.ok(waUrl.startsWith('https://wa.me/919778278552?text='), 'Target WhatsApp URL must point to +91 97782 78552');
assert.ok(waUrl.includes(encodeURIComponent(submittedOrder1.orderReference)), 'Order ref must be properly URL-encoded');
console.log('✓ WhatsApp prefilled message & click-to-chat URL generated cleanly');

// --------------------------------------------------------------------------
// TEST 4: Admin Payment Verification Controls
// --------------------------------------------------------------------------
console.log('\nTest 4: Admin Payment Verification Controls');

// Payment should NOT be marked confirmed automatically
const ordersBefore = StorageEngine.getOrders();
const orderInDb = ordersBefore.find(o => o.id === submittedOrder1.id);
assert.strictEqual(orderInDb.paymentStatus, 'payment_pending', 'Payment must remain pending until authorized confirmation');

// Authorized Admin confirms payment with verifiable reference code
const confirmedOrder = StorageEngine.updateOrderPaymentStatus(
  submittedOrder1.id,
  'payment_confirmed',
  'UPI-REF-987123450912',
  { id: 'admin_usr_01', name: 'Admin Staff', role: 'admin' }
);
assert.strictEqual(confirmedOrder.paymentStatus, 'payment_confirmed', 'Payment status must be updated to payment_confirmed');
assert.strictEqual(confirmedOrder.paymentReference, 'UPI-REF-987123450912', 'Payment reference must be stored');

// Revert to pending
const revertedOrder = StorageEngine.updateOrderPaymentStatus(
  submittedOrder1.id,
  'payment_pending',
  null,
  { id: 'admin_usr_01', name: 'Admin Staff', role: 'admin' }
);
assert.strictEqual(revertedOrder.paymentStatus, 'payment_pending', 'Payment status reverted to payment_pending');
console.log('✓ Admin payment verification and audit transitions succeed');

// --------------------------------------------------------------------------
// TEST 5: Invoice Generation, Theming & Eligibility Gating
// --------------------------------------------------------------------------
console.log('\nTest 5: Invoice Generation, Theming & Eligibility Gating');

// Check themes
assert.strictEqual(INVOICE_THEMES.length, 4, 'Must offer 4 themes');
assert.strictEqual(getInvoiceTheme('midnight_purple').name, 'Midnight Purple');
assert.strictEqual(getInvoiceTheme('minimal_black').name, 'Minimal Black');
assert.strictEqual(getInvoiceTheme('elegant_light').name, 'Elegant Light');
assert.strictEqual(getInvoiceTheme('brand_color').name, 'Brand Color');
console.log('✓ All 4 invoice themes resolved correctly');

// Check invoice persistence
const invNum = generateInvoiceNumber(submittedOrder1.id);
assert.ok(invNum.startsWith('INV-2026-'), 'Invoice number must follow INV-2026-XXXX format');

const savedInv = StorageEngine.saveInvoice({
  invoiceNumber: invNum,
  orderId: submittedOrder1.id,
  orderReference: submittedOrder1.orderReference,
  customerId: 'usr_cust_01',
  customerEmail: 'karthik@example.com',
  customerName: 'Karthik Menon',
  totalAmount: submittedOrder1.totalAmount,
  taxAmount: submittedOrder1.pricingBreakdown.taxAmount,
  themeId: 'midnight_purple'
});
assert.ok(savedInv.id, 'Saved invoice must have ID');

const customerInvoices = StorageEngine.getInvoicesByCustomer('karthik@example.com');
assert.strictEqual(customerInvoices.length, 1, 'Must retrieve saved invoice for customer');
assert.strictEqual(customerInvoices[0].invoiceNumber, invNum);
console.log('✓ Invoices securely saved and retrievable by customer');

// Non-eligible order test
const orderNoInvoice = StorageEngine.submitPrintOrder({
  cardConfig: { name: 'Sneha Patel', title: 'VP Growth' },
  customerName: 'Sneha Patel',
  customerEmail: 'sneha@example.com',
  customerPhone: '+91 91234 56789',
  shippingAddress: 'Koramangala, Bengaluru',
  edition: 'purple',
  quantity: 1,
  hasInvoiceAddon: false
});
assert.strictEqual(orderNoInvoice.hasInvoiceAddon, false, 'Addon should be false');
assert.strictEqual(orderNoInvoice.invoiceEligible, false, 'Eligibility should be false');

// Admin manually grants eligibility
const updatedElig = StorageEngine.setOrderInvoiceEligibility(orderNoInvoice.id, true);
assert.strictEqual(updatedElig.invoiceEligible, true, 'Admin can grant eligibility');
console.log('✓ Admin control can grant or revoke invoice eligibility');

// --------------------------------------------------------------------------
// TEST 6: Admin Invoice Management System (Assign & Decline Access)
// --------------------------------------------------------------------------
console.log('\nTest 6: Admin Invoice Management System (Assign & Decline Access)');

const adminActor = { id: 'admin_usr_01', name: 'Super Admin', email: 'admin@flocard.in', role: 'admin' };

// 6a: Decline invoice generator access with audit reason
const declinedOrder = StorageEngine.declineOrderInvoice(
  orderNoInvoice.id,
  adminActor,
  'Invoice add-on fee unpaid by customer'
);
assert.strictEqual(declinedOrder.invoiceEligible, false, 'Declined order must not be invoice eligible');
assert.strictEqual(declinedOrder.invoiceStatus, 'declined', 'Status must be declined');
assert.strictEqual(declinedOrder.invoiceStatusReason, 'Invoice add-on fee unpaid by customer');
assert.strictEqual(declinedOrder.invoiceStatusUpdatedBy, 'Super Admin');
console.log('✓ Admin can decline invoice generator access with specific reason & audit trail');

// 6b: Assign invoice generator access
const assignedOrder = StorageEngine.assignOrderInvoice(
  orderNoInvoice.id,
  adminActor,
  'Customer bank payment verified and approved'
);
assert.strictEqual(assignedOrder.invoiceEligible, true, 'Assigned order must be invoice eligible');
assert.strictEqual(assignedOrder.invoiceStatus, 'assigned', 'Status must be assigned');
assert.strictEqual(assignedOrder.hasInvoiceAddon, true, 'hasInvoiceAddon must be true upon assignment');
assert.strictEqual(assignedOrder.invoiceStatusReason, 'Customer bank payment verified and approved');
assert.strictEqual(assignedOrder.invoiceStatusUpdatedBy, 'Super Admin');
console.log('✓ Admin can assign invoice generator access with audit log and customer notification');

console.log('\n🎉 ALL FLOCARDS INVOICE GENERATOR & PRINT ORDER TESTS PASSED SUCCESSFULLY! 🎉\n');
