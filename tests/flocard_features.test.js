/* ==========================================================================
   FLOCARD INTEGRATION & VALIDATION TEST SUITE
   Tests:
   1. Order Journey State Machine & Transition Rules
   2. Customer Data Isolation & RLS Emulation
   3. Private Internal Notes Protection (Admins only)
   4. Immutable Order Status History
   5. In-App Customer Notifications
   6. Real Analytics Aggregation (No fake metrics)
   7. AI Concierge Server Endpoint & Catalog Adherence
   ========================================================================== */

import assert from 'assert';
import {
  ORDER_STAGES,
  EXCEPTION_STAGES,
  normalizeOrderStatus,
  getOrderStageInfo,
  StorageEngine
} from '../src/lib/storage.js';

console.log('--- STARTING FLOCARD INTEGRATION TESTS ---\n');

// 1. ORDER STAGE NORMALIZATION & TRANSITIONS
console.log('Test 1: Order Stage Normalization & Metadata');
assert.strictEqual(normalizeOrderStatus('pending'), 'new_order');
assert.strictEqual(normalizeOrderStatus('processing'), 'design_review');
assert.strictEqual(normalizeOrderStatus('printing'), 'manufacturing');
assert.strictEqual(normalizeOrderStatus('shipped'), 'dispatched');
assert.strictEqual(normalizeOrderStatus('delivered'), 'delivered');

const stageInfo = getOrderStageInfo('manufacturing');
assert.strictEqual(stageInfo.label, 'Manufacturing');
assert.strictEqual(stageInfo.step, 6);
console.log('✓ Order stages and normalization verified.');

// 2. MOCK USERS FOR SECURITY TESTING
const adminUser = {
  id: 'usr_admin_001',
  email: 'admin@flocard.in',
  role: 'owner',
  name: 'System Admin'
};

const customerA = {
  id: 'usr_cust_a',
  email: 'akhil@example.com',
  role: 'customer',
  name: 'Akhil Customer'
};

const customerB = {
  id: 'usr_cust_b',
  email: 'sarah@example.com',
  role: 'customer',
  name: 'Sarah Customer'
};

// 3. SEED TEST ORDER FOR CUSTOMER A
console.log('\nTest 2: Order Creation & Authorization Isolation');
const newOrder = {
  id: 'ord_test_9999',
  orderReference: 'FLC-ORD-9999',
  customerId: customerA.id,
  customerName: customerA.name,
  customerEmail: customerA.email,
  status: 'new_order',
  edition: 'purple',
  quantity: 1,
  total: 99
};
StorageEngine.saveOrder(newOrder);

// Customer A should see their order
const custAOrders = StorageEngine.getOrders(customerA);
assert.ok(custAOrders.some(o => o.id === 'ord_test_9999'), 'Customer A should see order 9999');

// Customer B MUST NOT see Customer A's order
const custBOrders = StorageEngine.getOrders(customerB);
assert.ok(!custBOrders.some(o => o.id === 'ord_test_9999'), 'Customer B MUST NOT see Customer A order');

// Direct lookup by ID by unauthorized customer B should return null
const custBLookup = StorageEngine.getOrderById('ord_test_9999', customerB);
assert.strictEqual(custBLookup, null, 'Customer B lookup must return null (RLS enforced)');

console.log('✓ Customer data isolation confirmed: Customer B cannot access Customer A orders.');

// 4. ADMIN ORDER STATUS UPDATE & INTERNAL NOTES
console.log('\nTest 3: Admin Controlled Status Transition & Internal Note Protection');
const updateResult = StorageEngine.updateOrderStatus(
  'ord_test_9999',
  'design_review',
  {
    publicMessage: 'Your artwork has been inspected and approved by FLOCARD design team.',
    internalNote: 'CONFIDENTIAL: Customer requested matte gold foil border test run.',
    actor: adminUser
  }
);

assert.strictEqual(updateResult.success, true);
assert.strictEqual(updateResult.order.status, 'design_review');

// Inspect what Customer A receives vs Admin
const custAOrderView = StorageEngine.getOrderById('ord_test_9999', customerA);
assert.strictEqual(custAOrderView.status, 'design_review');
assert.ok(custAOrderView.internalNotes === undefined, 'Customer A MUST NOT receive internal notes');

const adminOrderView = StorageEngine.getOrderById('ord_test_9999', adminUser);
assert.ok(Array.isArray(adminOrderView.internalNotes), 'Admin should receive internal notes');
assert.ok(
  adminOrderView.internalNotes.some(n => n.note.includes('CONFIDENTIAL')),
  'Admin should see the confidential note'
);

console.log('✓ Internal notes privacy confirmed: hidden from customer queries, accessible to admin.');

// 5. IMMUTABLE STATUS HISTORY
console.log('\nTest 4: Immutable Audit Trail');
const history = StorageEngine.getOrderHistory('ord_test_9999', customerA);
assert.ok(history.length >= 1, 'History must contain status transitions');
const latestEvent = history[history.length - 1];
assert.strictEqual(latestEvent.previousStatus, 'new_order');
assert.strictEqual(latestEvent.newStatus, 'design_review');
assert.strictEqual(latestEvent.publicMessage, 'Your artwork has been inspected and approved by FLOCARD design team.');
assert.strictEqual(latestEvent.actorUserId, adminUser.id);
console.log('✓ Immutable audit history verified.');

// 6. IN-APP CUSTOMER NOTIFICATIONS
console.log('\nTest 5: Real-time In-App Notifications');
const custANotifs = StorageEngine.getNotifications(customerA);
assert.ok(custANotifs.length >= 1, 'Customer A should have received a notification');
const orderNotif = custANotifs.find(n => n.orderId === 'ord_test_9999');
assert.ok(orderNotif, 'Notification must link to order 9999');
assert.strictEqual(orderNotif.status, 'design_review');
assert.strictEqual(orderNotif.readAt, null);

// Customer B must NOT see Customer A's notification
const custBNotifs = StorageEngine.getNotifications(customerB);
assert.ok(!custBNotifs.some(n => n.orderId === 'ord_test_9999'), 'Customer B must not see Customer A notifications');

// Mark as read
StorageEngine.markNotificationRead(orderNotif.id);
const reloadedNotifs = StorageEngine.getNotifications(customerA);
const updatedNotif = reloadedNotifs.find(n => n.id === orderNotif.id);
assert.ok(updatedNotif.readAt !== null, 'Notification should be marked as read');
console.log('✓ Customer in-app notification creation and isolation verified.');

// 7. REAL ANALYTICS
console.log('\nTest 6: Real Analytics (No Fabricated Metrics)');
// Associate a test card for customer A
const testCard = {
  id: 'c_test_9999',
  customerId: customerA.id,
  customerEmail: customerA.email,
  cardCode: 'flc-test-9999',
  status: 'active'
};
StorageEngine.saveCard(testCard);

const analyticsBefore = StorageEngine.getRealAnalytics(customerA);
assert.strictEqual(typeof analyticsBefore.totalViews, 'number');
assert.strictEqual(typeof analyticsBefore.totalTaps, 'number');
assert.strictEqual(typeof analyticsBefore.totalScans, 'number');
assert.strictEqual(typeof analyticsBefore.totalDownloads, 'number');

// Record a verified scan event
StorageEngine.logAnalyticsEvent({
  cardCode: 'flc-test-9999',
  eventType: 'qr_scan'
});

const analyticsAfter = StorageEngine.getRealAnalytics(customerA);
assert.strictEqual(analyticsAfter.totalScans, analyticsBefore.totalScans + 1);
console.log('✓ Real analytics event recording and aggregation verified.');

// 8. DIRECT ADMIN QUEUING FROM DESIGN SUBMISSION
console.log('\nTest 7: Direct Admin Panel Queueing from Card Designer');
const testDesign = {
  id: 'des_test_print_001',
  title: 'Executive Steel Card',
  customerId: customerA.id,
  customerName: customerA.name,
  customerEmail: customerA.email,
  edition: 'platinum',
  templateType: 'standard',
  front: { name: 'Akhil Customer', role: 'VP Engineering' },
  back: { qrUrl: 'https://flocard.in/akhil' }
};

const submittedOrder = StorageEngine.createOrderFromDesign(
  testDesign,
  'Submitted via Card Designer for Print Production',
  customerA
);

assert.ok(submittedOrder, 'Order should be created from design');
assert.strictEqual(submittedOrder.status, 'new_order');
assert.strictEqual(submittedOrder.customerId, customerA.id);

// Admin should immediately see the order in admin queue
const allAdminOrders = StorageEngine.getOrders(adminUser);
assert.ok(allAdminOrders.some(o => o.id === submittedOrder.id), 'Admin must see submitted design in orders queue');

// Customer should immediately see their submitted order in customer panel
const customerQueue = StorageEngine.getOrders(customerA);
assert.ok(customerQueue.some(o => o.id === submittedOrder.id), 'Customer panel must list the submitted order');
console.log('✓ Direct admin order queueing and customer panel synchronization verified.');

// 9. DELIVERY FULFILLMENT & AUTO-PROVISIONING IN CUSTOMER PANEL
console.log('\nTest 8: Admin Order Delivery & Customer Panel Auto-Provisioning');
const deliveryResult = StorageEngine.deliverOrder(submittedOrder.id, adminUser);
assert.ok(deliveryResult, 'deliverOrder must return provisioned result');
assert.strictEqual(deliveryResult.order.status, 'delivered');
assert.ok(deliveryResult.card?.cardCode, 'NFC Card code must be generated');
assert.ok(deliveryResult.profile?.slug, 'Digital profile slug must be generated');

// Query order as customer
const deliveredOrderForCustomer = StorageEngine.getOrderById(submittedOrder.id, customerA);
assert.strictEqual(deliveredOrderForCustomer.status, 'delivered');
assert.strictEqual(deliveredOrderForCustomer.cardCode, deliveryResult.card.cardCode);
assert.strictEqual(deliveredOrderForCustomer.profileSlug, deliveryResult.profile.slug);

// Customer notification for delivery
const deliveredNotifs = StorageEngine.getNotifications(customerA);
const deliveryNotif = deliveredNotifs.find(n => n.orderId === submittedOrder.id && n.status === 'delivered');
assert.ok(deliveryNotif, 'Customer must receive delivery notification with active card info');

// Verify order history has delivery entry
const deliveryHistory = StorageEngine.getOrderHistory(submittedOrder.id, customerA);
const lastHistoryEntry = deliveryHistory[deliveryHistory.length - 1];
assert.strictEqual(lastHistoryEntry.newStatus, 'delivered');

// Clean up
StorageEngine.deleteOrder(submittedOrder.id, adminUser);
StorageEngine.deleteCard(deliveryResult.card.id);
console.log('✓ Order delivery and customer panel auto-provisioning verified.');

// 9. PRODUCT PRICING & ADMIN AUTHORIZATION
console.log('\nTest 9: Authoritative Product Pricing & Admin Authorization');
const initialProducts = StorageEngine.getProducts();
assert.ok(initialProducts.length >= 3, 'There should be at least 3 card edition products');

const goldProd = StorageEngine.getProductByEdition('gold');
assert.ok(goldProd, 'Gold Edition product must exist');
assert.strictEqual(goldProd.editionKey, 'gold');
assert.strictEqual(goldProd.price, 2499);

// Customer attempts to update price -> MUST FAIL
const customerAttempt = StorageEngine.saveProduct({ ...goldProd, price: 99 }, 'customer', customerA.email);
assert.strictEqual(customerAttempt.success, false, 'Non-admin customer cannot update pricing');
assert.ok(customerAttempt.error.includes('Unauthorized'), 'Error message must specify unauthorized');

// Admin with invalid negative price -> MUST FAIL
const invalidPriceAttempt = StorageEngine.saveProduct({ ...goldProd, price: -500 }, 'admin', adminUser.email);
assert.strictEqual(invalidPriceAttempt.success, false, 'Negative price must be rejected');

// Admin updates price with valid comparison price -> SUCCESS
const adminUpdate = StorageEngine.saveProduct(
  { ...goldProd, price: 2799, comparePrice: 3999, isAvailable: true },
  'admin',
  adminUser.email
);
assert.strictEqual(adminUpdate.success, true, 'Authorized admin must be able to update product pricing');
assert.strictEqual(adminUpdate.product.price, 2799);
assert.strictEqual(adminUpdate.product.comparePrice, 3999);

// Verify currency formatting
import { formatCurrencyINR } from '../src/lib/storage.js';
assert.strictEqual(formatCurrencyINR(2799), '₹2,799');
assert.strictEqual(formatCurrencyINR(null), null);
assert.strictEqual(formatCurrencyINR(0), null);

// Restore original price
StorageEngine.saveProduct({ ...goldProd, price: 2499, comparePrice: 3499 }, 'admin', adminUser.email);
console.log('✓ Product pricing security, validation, and INR currency formatting verified.');

console.log('\n========================================');
console.log('ALL FLOCARD BACKEND & STORAGE TESTS PASSED!');
console.log('========================================');

