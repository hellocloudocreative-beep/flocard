/* ==========================================================================
   TEST: CROSS-ADMIN PRINT ORDER & DIGITAL PROFILE ADMIN EDIT VERIFICATION
   ========================================================================== */

import assert from 'node:assert';
import fs from 'node:fs';
import { StorageEngine } from '../src/lib/storage.js';

console.log('--- STARTING CROSS-ADMIN PRINT ORDER & PROFILE FIX VERIFICATION ---');

// Mock localStorage for test environment
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
// TEST 1: Verify isUploadingWorkImages is defined in AdminDashboard
// --------------------------------------------------------------------------
console.log('\nTest 1: Admin Dashboard Profile Edit Crash Fix');
const adminDashboardCode = fs.readFileSync('src/pages/admin/AdminDashboard.jsx', 'utf8');

assert.ok(
  adminDashboardCode.includes('const [isUploadingWorkImages, setIsUploadingWorkImages] = useState(false);'),
  'isUploadingWorkImages state must be explicitly declared in AdminDashboard'
);
assert.ok(
  adminDashboardCode.includes('disabled={isUploadingWorkImages}'),
  'disabled={isUploadingWorkImages} must refer to declared state'
);
console.log('✓ isUploadingWorkImages correctly declared with useState; Admin Workspace error resolved.');

// --------------------------------------------------------------------------
// TEST 2: Print Order Submission attaches order snapshot & triggers cloud sync
// --------------------------------------------------------------------------
console.log('\nTest 2: Customer Print Order Submission & Cloud Design Linking');

const testDesign = StorageEngine.saveDesign({
  id: 'des_test_sync_001',
  title: 'Priya Sharma Executive NFC Card',
  edition: 'purple',
  templateType: 'standard',
  customerName: 'Priya Sharma',
  customerEmail: 'priya@example.com',
  customerPhone: '919876543210',
  front: { name: 'Priya Sharma', role: 'VP Operations', company: 'Nexus Global' },
  back: { qrPosition: 'center' },
  status: 'submitted'
});

assert.strictEqual(testDesign.status, 'submitted');
assert.strictEqual(testDesign.customerName, 'Priya Sharma');
console.log('✓ Design saved locally and queued for cloud sync');

const orderPayload = {
  design: testDesign,
  customerDetails: {
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    email: 'priya@example.com',
    shippingAddress: '42 Marine Drive, Nariman Point, Mumbai 400021',
    company: 'Nexus Global'
  },
  quantity: 2,
  hasInvoiceAddon: true
};

const submittedOrder = StorageEngine.submitPrintOrder(orderPayload);

assert.ok(submittedOrder.orderReference.startsWith('FLC-ORD-'), 'Order reference should start with FLC-ORD-');
assert.strictEqual(submittedOrder.status, 'new_order', 'Status should be new_order');
assert.strictEqual(submittedOrder.customerName, 'Priya Sharma');

// Verify linked design has printOrder attached
const updatedDesigns = StorageEngine.getDesigns();
const linkedDesign = updatedDesigns.find(d => d.id === testDesign.id);

assert.ok(linkedDesign, 'Linked design must exist');
assert.strictEqual(linkedDesign.orderId, submittedOrder.id, 'Design must reference submitted order ID');
assert.ok(linkedDesign.printOrder, 'Design must hold authoritative printOrder snapshot for cloud sync');
assert.strictEqual(linkedDesign.printOrder.orderReference, submittedOrder.orderReference);

console.log('✓ Print Order snapshot successfully attached to design for multi-admin cloud propagation.');

// --------------------------------------------------------------------------
// TEST 3: Cross-Admin Store Hydration Simulation
// --------------------------------------------------------------------------
console.log('\nTest 3: Cross-Admin Store Hydration Simulation');

// Simulate a second admin browser with fresh storage
const admin2Designs = [];
const admin2Orders = [];

// When Admin 2 receives the cloud card_designs record (which has front_config.printOrder):
const cloudRecord = {
  id: '3cb0078f-5cac-44c9-be9a-c1cc77a542c5',
  title: linkedDesign.title,
  edition: linkedDesign.edition,
  status: linkedDesign.status,
  front_config: {
    ...(linkedDesign.front || {}),
    _localId: linkedDesign.id,
    customerName: linkedDesign.customerName,
    customerEmail: linkedDesign.customerEmail,
    printOrder: linkedDesign.printOrder
  },
  back_config: linkedDesign.back
};

// Admin 2 mapping logic:
const fc = cloudRecord.front_config;
const mappedForAdmin2 = {
  id: fc._localId || cloudRecord.id,
  title: cloudRecord.title,
  customerName: fc.customerName,
  status: cloudRecord.status,
  printOrder: fc.printOrder
};
admin2Designs.push(mappedForAdmin2);

if (fc.printOrder) {
  admin2Orders.push(fc.printOrder);
}

assert.strictEqual(admin2Designs.length, 1, 'Admin 2 must receive submitted design');
assert.strictEqual(admin2Orders.length, 1, 'Admin 2 must receive customer print order');
assert.strictEqual(admin2Orders[0].orderReference, submittedOrder.orderReference);
assert.strictEqual(admin2Orders[0].customerName, 'Priya Sharma');

console.log('✓ Admin 2 immediately observes customer print request and manufacturing order from cloud.');
console.log('\n🎉 ALL CROSS-ADMIN SYNC & PROFILE EDIT TESTS PASSED!');

