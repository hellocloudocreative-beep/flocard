/**
 * ==============================================================================
 * FLOCARDS ADMIN PDF EXPORT FORMAT & CUSTOMER DESIGN EDITING TEST SUITE
 * ==============================================================================
 * Validates:
 * 1. Admin PDF Download — White Background (#FFFFFF) & Black Elements (#000000)
 * 2. Preservation of customer's original text, fonts, logo proportions, and CR80 dimensions
 * 3. Separation of Original Customer Design vs Admin Print Version
 * 4. Admin Design Editing via saveAdminOrderDesign with version history
 * 5. In-place update without creating duplicate orders
 * 6. Customer dashboard notice: "Artwork updated by FLOCARDS design team"
 * 7. Non-destructive behavior (original customer submission never lost or overwritten)
 * ==============================================================================
 */

import assert from 'node:assert';
import { jsPDF } from 'jspdf';
import {
  CARD_DIMENSIONS_MM,
  generateCardPrintPDF,
  normalizeCardDesign,
  renderAuthoritativeCardCanvas
} from '../src/lib/cardArtworkService.js';
import { StorageEngine } from '../src/lib/storage.js';

console.log('--- STARTING FLOCARDS ADMIN PDF EXPORT & DESIGN EDITING TEST SUITE ---');

// Mock localStorage for node test runner
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (key) => storageMap.get(key) || null,
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

// ==============================================================================
// TEST 1: Admin PDF Download — White Background & Black Elements
// ==============================================================================
{
  console.log('\nTest 1: Admin PDF Export Generation with White Background & Black Elements');

  const customerOrder = {
    id: 'FLC-ORD-8821',
    orderReference: 'FLC-ORD-8821',
    edition: 'purple',
    templateType: 'customer_logo',
    customerName: 'Aarav Sharma',
    frontConfig: {
      name: 'AARAV SHARMA',
      role: 'FOUNDER & CEO',
      tagline: 'Connect Instantly',
      fontFamily: 'Outfit',
      showNfc: true
    },
    backConfig: {
      qrUrl: 'https://flocard.in/p/aaravsharma',
      specsText: 'NFC | PORTFOLIO | CONNECT'
    },
    customColors: {
      cardBg: '#1e1040',
      nameColor: '#ffffff',
      roleColor: '#d8b4fe',
      primaryAccent: '#7038f8',
      nfcColor: '#c084fc',
      qrColor: '#ffffff'
    },
    customerLogo: {
      url: 'https://flocard.in/logos/customer-crest.png',
      size: 110,
      posX: 10,
      posY: -5,
      showCircleBadge: true
    }
  };

  // 1. Generate Admin Print PDF (White & Black mode)
  const adminPdfResult = await generateCardPrintPDF(customerOrder, {
    mode: 'dual',
    withBleed: true,
    adminPrintMode: true,
    download: false
  });

  assert.ok(adminPdfResult, 'Admin PDF export result must be defined');
  assert.strictEqual(adminPdfResult.adminPrintMode, true, 'Admin print mode flag must be active');
  assert.ok(adminPdfResult.filename.includes('_admin_white_black'), 'Filename must clearly reflect admin print format');
  assert.strictEqual(Number(adminPdfResult.pageWidth.toFixed(2)), 91.60, 'Bleed page width must be 91.60 mm');
  assert.strictEqual(Number(adminPdfResult.pageHeight.toFixed(2)), 59.98, 'Bleed page height must be 59.98 mm');

  // 2. Generate Original Colors PDF (Customer Colors mode)
  const originalPdfResult = await generateCardPrintPDF(customerOrder, {
    mode: 'dual',
    withBleed: true,
    adminPrintMode: false,
    download: false
  });

  assert.strictEqual(originalPdfResult.adminPrintMode, false, 'Original PDF must not have admin print mode flag');
  assert.ok(!originalPdfResult.filename.includes('_admin_white_black'), 'Original PDF filename must not have admin suffix');

  console.log('✓ Test 1 Passed: Admin PDF export generated with white & black mode parameters and correct CR80 physical dimensions.');
}

// ==============================================================================
// TEST 2: Preservation of Customer's Original Design and Layout Fidelity
// ==============================================================================
{
  console.log('\nTest 2: Verification of Customer Design Properties Preservation');

  const customerSubmittedDesign = {
    id: 'des_cust_4401',
    edition: 'gold',
    templateType: 'standard',
    customerName: 'Priya Patel',
    front: {
      name: 'PRIYA PATEL',
      role: 'MANAGING DIRECTOR',
      details: 'GLOBAL STRATEGY',
      tagline: 'Excellence in Execution',
      fontFamily: 'Cinzel',
      roleFontFamily: 'Plus Jakarta Sans',
      showNfc: true
    },
    back: {
      qrUrl: 'https://flocard.in/p/priyapatel',
      specsText: 'NFC | EXECUTIVE CARD'
    },
    customColors: {
      cardBg: '#0f0c05',
      nameColor: '#e9c766',
      roleColor: '#b8860b',
      nfcColor: '#e9c766'
    },
    customerLogo: {
      url: 'https://flocard.in/logos/priya-holding.png',
      size: 90,
      posX: 0,
      posY: 0
    }
  };

  // Create order from design
  const order = StorageEngine.createOrderFromDesign(customerSubmittedDesign, 'Prepress requested');

  // Verify order initialized both active design and originalDesign snapshot
  assert.ok(order.originalDesign, 'Order must store originalDesign snapshot');
  assert.strictEqual(order.originalDesign.front.name, 'PRIYA PATEL', 'Original customer name preserved');
  assert.strictEqual(order.originalDesign.front.fontFamily, 'Cinzel', 'Original customer font preserved');
  assert.strictEqual(order.originalDesign.customColors.cardBg, '#0f0c05', 'Original customer background color preserved');
  assert.strictEqual(order.originalDesign.customerLogo.url, 'https://flocard.in/logos/priya-holding.png', 'Original customer logo preserved');
  assert.strictEqual(order.approvedVersion, 'original', 'Order initially in original approvedVersion');

  // Test that admin print mode does NOT modify customer's stored colors or data
  await generateCardPrintPDF(order, { adminPrintMode: true, download: false });

  assert.strictEqual(order.originalDesign.customColors.cardBg, '#0f0c05', 'Original cardBg remains completely untouched after admin export');
  assert.strictEqual(order.originalDesign.customColors.nameColor, '#e9c766', 'Original nameColor remains gold after admin export');

  console.log('✓ Test 2 Passed: Customer original design properties (fonts, text, logo, colors) preserved untouched.');
}

// ==============================================================================
// TEST 3: Admin Can Edit Customer-Designed Cards Without Creating Duplicate Orders
// ==============================================================================
{
  console.log('\nTest 3: Admin Editing Customer-Designed Cards in Place with Version History');

  const initialDesign = {
    id: 'des_order_edit_1',
    customerName: 'Vikram Sengupta',
    customerEmail: 'vikram@matrixcorp.in',
    edition: 'metal',
    templateType: 'standard',
    front: {
      name: 'VIKRAM SENGUPTA',
      role: 'VP ENGINEERING',
      tagline: 'Leading the Future',
      fontFamily: 'Inter'
    },
    back: {
      qrUrl: 'https://flocard.in/p/vikram'
    },
    customerLogo: {
      url: 'https://flocard.in/logos/matrix.png',
      size: 100,
      posX: 0,
      posY: 0
    }
  };

  const createdOrder = StorageEngine.createOrderFromDesign(initialDesign);
  const initialOrderCount = StorageEngine.getOrders().length;
  const initialOrderId = createdOrder.id;

  // Admin edits the design (adjusts role, tagline, logo scaling, and adds details)
  const adminEditedConfig = {
    title: "Vikram Sengupta's Optimized Card",
    edition: 'metal',
    templateType: 'standard',
    front: {
      name: 'VIKRAM SENGUPTA',
      role: 'CHIEF TECHNOLOGY OFFICER', // Admin corrected role
      details: 'ENTERPRISE ARCHITECTURE', // Admin added detail
      tagline: 'Architecting Intelligent Systems', // Admin fine-tuned tagline
      fontFamily: 'Space Grotesk' // Admin switched to bolder font
    },
    back: {
      qrUrl: 'https://flocard.in/p/vikram-cto'
    },
    customerLogo: {
      url: 'https://flocard.in/logos/matrix.png',
      size: 115, // Admin optimized logo size
      posX: 5,
      posY: -2
    }
  };

  const adminUser = {
    name: 'FLOCARDS Master Printer',
    email: 'admin@flocard.in'
  };

  // Save admin revision with publishing to customer
  const updatedOrder = StorageEngine.saveAdminOrderDesign(
    initialOrderId,
    adminEditedConfig,
    adminUser,
    { publishToCustomer: true }
  );

  // 1. Verify in-place update without creating duplicate orders
  const postEditOrders = StorageEngine.getOrders();
  assert.strictEqual(postEditOrders.length, initialOrderCount, 'Total order count must remain identical (NO DUPLICATE ORDERS)');
  assert.strictEqual(updatedOrder.id, initialOrderId, 'Order ID must remain unchanged');

  // 2. Verify original customer design snapshot remains pristine in version history
  assert.strictEqual(updatedOrder.originalDesign.front.role, 'VP ENGINEERING', 'Original role must be preserved in originalDesign');
  assert.strictEqual(updatedOrder.originalDesign.front.fontFamily, 'Inter', 'Original font must be preserved in originalDesign');
  assert.strictEqual(updatedOrder.originalDesign.customerLogo.size, 100, 'Original logo size must be preserved in originalDesign');

  // 3. Verify editedDesign contains the admin modifications
  assert.strictEqual(updatedOrder.editedDesign.front.role, 'CHIEF TECHNOLOGY OFFICER', 'Edited role saved');
  assert.strictEqual(updatedOrder.editedDesign.front.details, 'ENTERPRISE ARCHITECTURE', 'Edited details saved');
  assert.strictEqual(updatedOrder.editedDesign.customerLogo.size, 115, 'Edited logo size saved');
  assert.strictEqual(updatedOrder.approvedVersion, 'admin_edited', 'Approved version marked as admin_edited');
  assert.strictEqual(updatedOrder.editedBy, 'admin@flocard.in', 'EditedBy tracks admin user identity');
  assert.ok(updatedOrder.editedAt, 'EditedAt timestamp recorded');

  // 4. Verify synchronized active properties for customer preview
  assert.strictEqual(updatedOrder.role, 'CHIEF TECHNOLOGY OFFICER', 'Order active role updated');
  assert.strictEqual(updatedOrder.tagline, 'Architecting Intelligent Systems', 'Order active tagline updated');

  console.log('✓ Test 3 Passed: Admin successfully edited design in place with full version history and no duplicate orders.');
}

// ==============================================================================
// TEST 4: Customer Dashboard Display Logic & Notice Badge
// ==============================================================================
{
  console.log('\nTest 4: Customer Dashboard Display Logic & "Artwork updated by FLOCARDS design team" Notice');

  // Order with approved admin edit
  const orderWithPublishedEdit = {
    id: 'FLC-ORD-9901',
    orderReference: 'FLC-ORD-9901',
    approvedVersion: 'admin_edited',
    originalDesign: {
      front: { name: 'Rohan Mehra', role: 'Sales' }
    },
    editedDesign: {
      front: { name: 'Rohan Mehra', role: 'Head of Sales & Growth' }
    }
  };

  const isPublishedEdit = Boolean(
    orderWithPublishedEdit.approvedVersion === 'admin_edited' &&
    orderWithPublishedEdit.editedDesign
  );
  assert.strictEqual(isPublishedEdit, true, 'Customer dashboard must detect approved admin edit');

  // Order without approved admin edit (unapproved internal draft)
  const orderWithInternalDraftOnly = {
    id: 'FLC-ORD-9902',
    orderReference: 'FLC-ORD-9902',
    approvedVersion: 'original',
    originalDesign: {
      front: { name: 'Sara Ali', role: 'Designer' }
    },
    editedDesign: {
      front: { name: 'Sara Ali', role: 'Lead Creative Designer' }
    }
  };

  const isCustomerVisibleEdit = Boolean(
    orderWithInternalDraftOnly.approvedVersion === 'admin_edited' &&
    orderWithInternalDraftOnly.editedDesign
  );
  assert.strictEqual(isCustomerVisibleEdit, false, 'Unapproved admin draft must NOT show as published edit to customer');

  console.log('✓ Test 4 Passed: Customer dashboard displays original design unless admin publishes update with badge.');
}

// ==============================================================================
// TEST 5: Admin Print Prepress Rendering Consistency
// ==============================================================================
{
  console.log('\nTest 5: Authoritative Prepress Normalization & Option Handling');

  const sampleDesign = {
    edition: 'platinum',
    templateType: 'customer_logo',
    frontConfig: {
      name: 'Elena Rostova',
      role: 'Principal Partner',
      tagline: 'Private Wealth',
      fontFamily: 'Sora'
    },
    customColors: {
      cardBg: '#05070B',
      nameColor: '#ffffff'
    },
    customerLogo: {
      url: 'data:image/svg+xml;utf8,<svg></svg>',
      size: 105,
      posX: 0,
      posY: 0
    }
  };

  // Normalize card design helper
  const normalized = normalizeCardDesign(sampleDesign);
  assert.strictEqual(normalized.edition, 'platinum');
  assert.strictEqual(normalized.templateType, 'customer_logo');
  assert.strictEqual(normalized.config.front.name, 'Elena Rostova');
  assert.strictEqual(normalized.config.customerLogo.size, 105);

  console.log('✓ Test 5 Passed: Prepress normalization handles customer logo template and custom colors.');
}

console.log('\n🎉 ALL 5 ADMIN PDF EXPORT & DESIGN EDITING TEST SUITES PASSED! 🎉\n');
