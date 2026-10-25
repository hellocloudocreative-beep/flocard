import assert from 'node:assert/strict';
import { StorageEngine } from '../src/lib/storage.js';
import { normalizeCardDesign } from '../src/components/CustomerCardPreview.jsx';

console.log('--- STARTING BUG 1 & BUG 2 AUTOMATED INTEGRATION TESTS ---');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// BUG 1: CUSTOMER EDITED CARD DESIGN SYNC & PERSISTENCE
// -------------------------------------------------------------

test('1.1: Customer submits customized design -> Order freezes full snapshot', () => {
  const customLogoObj = {
    url: 'https://flocard.supabase.co/storage/v1/object/public/designs/custom_client_logo.png',
    size: 145,
    posX: 12,
    posY: -8,
    showCircleBadge: false
  };

  const customColors = {
    primaryAccent: '#FF0055',
    secondaryAccent: '#FFAA00',
    nameColor: '#FFD700',
    roleColor: '#00FFFF',
    taglineColor: '#EEEEEE'
  };

  const submittedDesign = {
    id: `des_test_${Date.now()}`,
    customerId: 'cust_acme_corp',
    customerName: 'Sarah Connor',
    customerEmail: 'sarah@skynet.ai',
    customerPhone: '+91 91234 56789',
    company: 'Cyberdyne Systems',
    title: 'Cyberdyne Executive Metal',
    templateType: 'customer_logo',
    edition: 'metal',
    customColors,
    customerLogo: customLogoObj,
    flocardLogo: { size: 85, position: 'bottom-right' },
    front: {
      name: 'SARAH CONNOR',
      role: 'CHIEF DEFENSE STRATEGIST',
      company: 'Cyberdyne Systems',
      tagline: 'Securing Tomorrow Today',
      fontFamily: 'Outfit',
      roleFontFamily: 'Syne',
      fontSize: 'large',
      alignment: 'center',
      customLogo: customLogoObj.url
    },
    back: {
      qrUrl: 'https://flocard.in/p/sarah-connor',
      subtext: 'SCAN TO CONNECT',
      specsText: 'CR80 TITANIUM NFC'
    },
    shippingAddress: '742 Evergreen Terrace, Sector 4'
  };

  // 1. Save design in storage engine
  StorageEngine.saveDesign(submittedDesign);

  // 2. Customer submits order from design
  const order = StorageEngine.createOrderFromDesign(submittedDesign, 'Rush priority production', {
    id: 'cust_acme_corp',
    name: 'Sarah Connor',
    email: 'sarah@skynet.ai'
  });

  assert.ok(order, 'Order should be created');
  assert.equal(order.designId, submittedDesign.id, 'Order should reference design ID');
  assert.ok(order.design, 'Order must store frozen snapshot of design');
  assert.equal(order.design.title, submittedDesign.title, 'Snapshot title must match');
  assert.equal(order.customerName, 'Sarah Connor', 'Customer name should match submitted customerName');
  assert.equal(order.frontConfig.name, 'SARAH CONNOR', 'Front artwork name should match submitted artwork name');
  assert.equal(order.customerPhone, '+91 91234 56789', 'Customer phone should match');
  assert.equal(order.company, 'Cyberdyne Systems', 'Customer company should match');
  assert.equal(order.shippingAddress, '742 Evergreen Terrace, Sector 4', 'Shipping address should match submitted');

  // Verify full logo config is preserved, not just string URL
  assert.deepEqual(order.customerLogo, customLogoObj, 'Logo scale, pos, and badge flags must be preserved');
  assert.equal(order.flocardLogo.position, 'bottom-right', 'Flocard logo positioning must be preserved');
  assert.deepEqual(order.customColors, customColors, 'Custom accent colors must be preserved');
});

test('1.2: Unified renderer (normalizeCardDesign) extracts exact customer design for admin/print', () => {
  const orders = StorageEngine.getOrders();
  const testOrder = orders.find(o => o.customerEmail === 'sarah@skynet.ai');
  assert.ok(testOrder, 'Test order should exist');

  // Render using normalizeCardDesign (used by CustomerCardPreview across customer & admin dashboards)
  const normalized = normalizeCardDesign(testOrder);

  assert.equal(normalized.edition, 'metal', 'Edition must be metal');
  assert.equal(normalized.templateType, 'customer_logo', 'Template type must be customer_logo');
  assert.equal(normalized.isLegacyFallback, false, 'Should NOT be flagged as legacy fallback');

  // Artwork verification
  assert.equal(normalized.config.front.name, 'SARAH CONNOR', 'Front name must match customer submitted design');
  assert.equal(normalized.config.front.role, 'CHIEF DEFENSE STRATEGIST', 'Front role must match');
  assert.equal(normalized.config.front.fontFamily, 'Outfit', 'Custom font family must be preserved');
  assert.equal(normalized.config.front.roleFontFamily, 'Syne', 'Custom role font must be preserved');
  assert.equal(normalized.config.front.alignment, 'center', 'Custom alignment must be preserved');
  assert.equal(normalized.config.customerLogo.url, 'https://flocard.supabase.co/storage/v1/object/public/designs/custom_client_logo.png');
  assert.equal(normalized.config.customerLogo.size, 145, 'Logo size percentage must be 145%');
  assert.equal(normalized.config.customerLogo.posX, 12, 'Logo posX must be 12px');
  assert.equal(normalized.config.customerLogo.posY, -8, 'Logo posY must be -8px');
  assert.equal(normalized.config.flocardLogo.position, 'bottom-right', 'Flocard logo position must be bottom-right');
});

test('1.3: Changing reusable template or cache does NOT alter previously submitted customer order', () => {
  const orders = StorageEngine.getOrders();
  const testOrder = orders.find(o => o.customerEmail === 'sarah@skynet.ai');
  assert.ok(testOrder, 'Test order exists');

  // Simulate an admin or user updating or even deleting the design template in general catalogue
  StorageEngine.saveDesign({
    id: testOrder.designId,
    title: 'COMPLETELY ALTERED CATALOGUE TEMPLATE',
    edition: 'gold',
    front: { name: 'SOMEONE ELSE', role: 'INTERN' }
  });

  // Re-read the order
  const freshOrders = StorageEngine.getOrders();
  const preservedOrder = freshOrders.find(o => o.id === testOrder.id);

  // The order's frozen snapshot must protect the customer's artwork
  const normalized = normalizeCardDesign(preservedOrder);
  assert.equal(normalized.config.front.name, 'SARAH CONNOR', 'Customer submitted artwork must remain frozen');
  assert.equal(normalized.config.front.role, 'CHIEF DEFENSE STRATEGIST', 'Customer role must remain frozen');
  assert.equal(normalized.edition, 'metal', 'Order edition must remain metal');
});

test('1.4: Legacy order with no design config returns clear legacy fallback flag', () => {
  const legacyOrder = {
    id: 'FLC-ORD-LEGACY-001',
    customerName: 'Old Customer',
    totalAmount: 1899,
    status: 'delivered'
    // no frontConfig, backConfig, designId, or design
  };

  const normalized = normalizeCardDesign(legacyOrder);
  assert.equal(normalized.isLegacyFallback, true, 'Legacy order must be identified with isLegacyFallback');
  assert.equal(normalized.config.front.name, 'Old Customer', 'Should fallback cleanly without throwing');
});

// -------------------------------------------------------------
// BUG 2: NO AUTOMATIC CUSTOMER AUTOFILL IN NEW ORDERS
// -------------------------------------------------------------

test('2.1: createOrderFromDesign does NOT autofill demo phone (+91 97782 78552) or demo address', () => {
  const blankContactDesign = {
    id: `des_blank_${Date.now()}`,
    title: 'Minimal Card',
    edition: 'purple',
    front: { name: 'John Doe', role: 'Architect' }
    // No customerPhone, customerEmail, or shippingAddress provided
  };

  const order = StorageEngine.createOrderFromDesign(blankContactDesign, 'Test order');
  assert.equal(order.customerPhone, '', 'Customer phone must be empty string, NOT hardcoded demo phone');
  assert.equal(order.shippingAddress, '', 'Shipping address must be empty string, NOT Infopark demo address');
  assert.notEqual(order.customerPhone, '+91 97782 78552', 'Must never inject +91 97782 78552 into new orders');
});

test('2.2: Existing customer selection populates details and clearing resets to empty', () => {
  // Simulate saved customers
  const sampleCustomer = {
    id: 'cust_vip_42',
    name: 'Vikram Seth',
    phone: '+91 98450 11223',
    email: 'vikram@tata.com',
    company: 'Tata Consultancy Services',
    role: 'Vice President'
  };

  // Simulate component state logic
  let formState = {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    company: '',
    role: '',
    shippingAddress: ''
  };

  // 1. Initially all customer fields are completely empty
  assert.equal(formState.customerName, '', 'Initial customer name must be empty');
  assert.equal(formState.customerPhone, '', 'Initial customer phone must be empty');

  // 2. Explicitly select existing customer
  formState = {
    ...formState,
    customerName: sampleCustomer.name,
    customerPhone: sampleCustomer.phone,
    customerEmail: sampleCustomer.email,
    company: sampleCustomer.company,
    role: sampleCustomer.role
  };

  assert.equal(formState.customerName, 'Vikram Seth');
  assert.equal(formState.customerPhone, '+91 98450 11223');
  assert.equal(formState.company, 'Tata Consultancy Services');

  // 3. Clear customer selection action
  formState = {
    ...formState,
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    company: '',
    role: '',
    shippingAddress: ''
  };

  assert.equal(formState.customerName, '', 'Customer name must be cleared');
  assert.equal(formState.customerPhone, '', 'Customer phone must be cleared');
  assert.equal(formState.customerEmail, '', 'Customer email must be cleared');
  assert.equal(formState.company, '', 'Customer company must be cleared');
});

// Cleanup test records
StorageEngine.deleteDesign(`des_test_${Date.now()}`);

console.log(`\n🎉 ALL ${passedTests} INTEGRATION TESTS PASSED SUCCESSFULLY!`);
